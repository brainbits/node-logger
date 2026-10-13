import fs from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import merge from 'deepmerge';
import type { Config, Formatter, MergedConfig, Plugin, PluginConstructor, ResolvedConfig } from './types.js';

type ModuleRequire = ReturnType<typeof createRequire>;

interface PackageConfigDefinition {
    path: string | null;
    require: ModuleRequire | null;
    config: Config;
}

const defaultConfig: MergedConfig = {
    channel: 'unknown',
    levels: [
        'emergency',
        'alert',
        'critical',
        'error',
        'warning',
        'notice',
        'info',
        'debug',
    ],
    maxLevel: 'info',
    outputs: {
        emergency: 'stderr',
        warning: 'stdout',
    },
    timerLevel: 'debug',
    formatter: undefined,
    plugins: [],
};

function getConfigFromPackage(packageJsonPath: string): Config {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as { name?: string; nodeLogger?: Config };

    return { channel: pkg.name || defaultConfig.channel, ...pkg.nodeLogger };
}

function findPackageJson(): string | null {
    let dir = resolve(process.cwd());

    do {
        const pkgFile = join(dir, 'package.json');

        if (fs.existsSync(pkgFile) && fs.statSync(pkgFile).isFile()) {
            return pkgFile;
        }

        dir = join(dir, '..');
    } while (dir !== resolve(dir, '..'));

    return null;
}

function loadConfigFromPackage(): PackageConfigDefinition {
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

function loadModule<T>(moduleName: string, require: ModuleRequire | null): T {
    if (!require) {
        throw new Error('No package.json available to resolve the module from');
    }

    // Synchronous require() of ES modules keeps the Logger constructor synchronous
    return (require(moduleName) as { default: T }).default;
}

function loadFormatter(config: MergedConfig, { path, require }: PackageConfigDefinition): Formatter {
    const { formatter } = config;

    if (typeof formatter === 'function') {
        return formatter;
    }

    if (!require) {
        throw new Error('Formatter must be configured as function unless a package.json is available');
    }

    try {
        return loadModule<Formatter>(formatter!, require);
    } catch (error) {
        throw new Error(`Formatter ${formatter} not found in ${path}: ${(error as Error).message}`, { cause: error });
    }
}

function loadPlugin(pluginName: string, { path, require }: PackageConfigDefinition): PluginConstructor {
    try {
        return loadModule<PluginConstructor>(pluginName, require);
    } catch (error) {
        throw new Error(`Plugin ${pluginName} not found in ${path}: ${(error as Error).message}`, { cause: error });
    }
}

function loadPlugins(config: MergedConfig, definition: PackageConfigDefinition): Plugin[] {
    return (config.plugins ?? []).map((pluginName) => {
        const PluginClass = loadPlugin(pluginName, definition);
        return new PluginClass(config);
    });
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

function assertConfig(config: MergedConfig): void {
    if (!config.formatter) {
        throw new Error('Invalid formatter: No formatter found in configuration');
    }

    if (!Array.isArray(config.levels) || config.levels.length === 0) {
        throw new Error('Invalid levels: No levels were configured');
    }

    if (!config.maxLevel || !config.levels.includes(config.maxLevel)) {
        throw new Error(`Invalid maxLevel: ${config.maxLevel}`);
    }

    if (!config.timerLevel || !config.levels.includes(config.timerLevel)) {
        throw new Error(`Invalid timerLevel: ${config.timerLevel}`);
    }

    if (!config.outputs || Object.keys(config.outputs).some(level => !(config.levels as string[]).includes(level))) {
        throw new Error('Invalid outputs: Outputs can only be configured for existing log levels');
    }

    if (Object.values(config.outputs).some(output => !['stdout', 'stderr'].includes(output))) {
        throw new Error('Invalid outputs: Output must be stdout or stderr');
    }
}

export default function loadConfiguration(config: Config = {}): ResolvedConfig {
    const packageJsonConfigDefinition = loadConfigFromPackage();
    const merged = deepParseEnv(merge.all<MergedConfig>([
        defaultConfig,
        packageJsonConfigDefinition.config,
        config,
    ], {
        arrayMerge: (target: unknown[], source: unknown[]) => source,
        customMerge: (key) => {
            if (key === 'outputs') return (a: unknown, b: unknown) => b; // Override outputs instead of merging them
            return undefined;
        },
    }));

    assertConfig(merged);

    return {
        ...merged,
        formatter: loadFormatter(merged, packageJsonConfigDefinition),
        plugins: loadPlugins(merged, packageJsonConfigDefinition),
    };
}
