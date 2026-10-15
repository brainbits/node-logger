import fs from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import merge from 'deepmerge';
import { z } from 'zod';
import { configShape, createConfigSchema } from './schema.js';
import type { Config, Formatter, PluginConstructor, ResolvedConfig, ValidatedConfig } from './types.js';

type ModuleRequire = ReturnType<typeof createRequire>;

interface PackageConfigDefinition {
    path: string | null;
    require: ModuleRequire | null;
    config: Config;
}

function getConfigFromPackage(packageJsonPath: string): Config {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as { name?: string; nodeLogger?: Config };

    return { ...(pkg.name ? { channel: pkg.name } : {}), ...pkg.nodeLogger };
}

function findPackageJson(): string | null {
    let dir = resolve(process.cwd());

    for (;;) {
        const pkgFile = join(dir, 'package.json');

        if (fs.existsSync(pkgFile) && fs.statSync(pkgFile).isFile()) {
            return pkgFile;
        }

        const parent = dirname(dir);

        if (parent === dir) {
            return null;
        }

        dir = parent;
    }
}

/**
 * The package.json is read once per working directory, as loggers may be created frequently
 */
const packageConfigCache = new Map<string, PackageConfigDefinition>();

function readConfigFromPackage(): PackageConfigDefinition {
    const pkgFile = findPackageJson();

    if (!pkgFile) {
        return { path: null, require: null, config: {} };
    }

    return {
        path: join(dirname(pkgFile), 'node_modules'),
        // Formatters and plugins are resolved from the project the package.json belongs to
        require: createRequire(pkgFile),
        config: getConfigFromPackage(pkgFile),
    };
}

function loadConfigFromPackage(): PackageConfigDefinition {
    const cwd = process.cwd();
    let definition = packageConfigCache.get(cwd);

    if (!definition) {
        definition = readConfigFromPackage();
        packageConfigCache.set(cwd, definition);
    }

    return definition;
}

function loadModule<T>(kind: 'Formatter' | 'Plugin', moduleName: string, { path, require }: PackageConfigDefinition): T {
    let exports: unknown;

    try {
        if (!require) {
            throw new Error('No package.json available to resolve the module from');
        }

        // Synchronous require() of ES modules keeps the Logger constructor synchronous
        exports = require(moduleName);
    } catch (error) {
        throw new Error(`${kind} ${moduleName} not found in ${path}: ${(error as Error).message}`, { cause: error });
    }

    // CommonJS modules may export the formatter or plugin directly instead of as default export
    const value = (exports as { default?: unknown } | null)?.default ?? exports;

    if (typeof value !== 'function') {
        throw new Error(`${kind} ${moduleName} has to export a ${kind === 'Formatter' ? 'function' : 'class'} as default export`);
    }

    return value as T;
}

function loadFormatter(config: ValidatedConfig, packageConfigDefinition: PackageConfigDefinition): Formatter {
    const { formatter } = config;

    if (typeof formatter === 'function') {
        return formatter;
    }

    if (!packageConfigDefinition.require) {
        throw new Error('Formatter must be configured as function unless a package.json is available');
    }

    return loadModule<Formatter>('Formatter', formatter, packageConfigDefinition);
}

function loadPlugin(pluginName: string, packageConfigDefinition: PackageConfigDefinition): PluginConstructor {
    return loadModule<PluginConstructor>('Plugin', pluginName, packageConfigDefinition);
}

function deepParseEnv<T>(config: T): T {
    if (!config || Array.isArray(config) || typeof config === 'boolean' || typeof config === 'function') {
        return config;
    }

    if (typeof config === 'string') {
        const match = /env\(([^,)]*)(, *(.*))?\)/.exec(config);

        if (match) {
            const [, name, , fallback] = match;

            if (process.env[name] !== undefined) {
                return process.env[name] as T;
            }

            if (fallback !== undefined) {
                return fallback as T;
            }

            throw new Error(`Env ${name} is not set nor has a fallback!`);
        }

        return config;
    }

    if (typeof config !== 'object') {
        return config;
    }

    return Object.fromEntries(
        Object.entries(config).map(([key, value]) => [key, deepParseEnv(value)]),
    ) as T;
}

/**
 * Collects the options the plugins add to the configuration
 */
function getPluginShape(pluginNames: string[], pluginClasses: PluginConstructor[]): z.ZodRawShape {
    const owners = new Map<string, string>(Object.keys(configShape).map(key => [key, 'node-logger']));
    const shape: Record<string, z.ZodType> = {};

    pluginClasses.forEach((PluginClass, index) => {
        Object.entries<z.ZodType>(PluginClass.configSchema?.shape ?? {}).forEach(([key, schema]) => {
            const owner = owners.get(key);

            if (owner) {
                throw new Error(`Plugin ${pluginNames[index]} must not redefine the option "${key}" of ${owner}`);
            }

            owners.set(key, pluginNames[index]);
            shape[key] = schema;
        });
    });

    return shape;
}

function validate<T extends z.ZodType>(schema: T, config: unknown): z.output<T> {
    const result = schema.safeParse(config);

    if (!result.success) {
        throw new Error(`Invalid node-logger configuration:\n${z.prettifyError(result.error)}`, {
            cause: result.error,
        });
    }

    return result.data;
}

export default function loadConfiguration(config: Config = {}): ResolvedConfig {
    const packageJsonConfigDefinition = loadConfigFromPackage();
    const merged = deepParseEnv(merge.all<Config>([
        packageJsonConfigDefinition.config,
        config,
    ], {
        arrayMerge: (target: unknown[], source: unknown[]) => source,
        customMerge: (key) => {
            if (key === 'outputs') return (a: unknown, b: unknown) => b; // Override outputs instead of merging them
            return undefined;
        },
    }));

    // The plugins have to be loaded first, as they add their options to the schema
    const { plugins: pluginNames } = validate(z.looseObject({ plugins: configShape.plugins }), merged);
    const pluginClasses = pluginNames.map(pluginName => loadPlugin(pluginName, packageJsonConfigDefinition));
    const schema = createConfigSchema(getPluginShape(pluginNames, pluginClasses));
    const validated = validate(schema, merged) as ValidatedConfig;

    return {
        ...validated,
        formatter: loadFormatter(validated, packageJsonConfigDefinition),
        plugins: pluginClasses.map(PluginClass => new PluginClass(validated)),
    };
}
