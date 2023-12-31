/* eslint-disable import/no-dynamic-require, global-require, no-param-reassign */
import fs from 'fs';
import { dirname, join, resolve } from 'path';
import merge from 'deepmerge';

const defaultConfig = {
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
    formatter: null,
    plugins: [],
};

function getConfigFromPackage(packageJsonPath) {
    if (!fs.existsSync(packageJsonPath)) {
        return null;
    }

    const pkg = require(packageJsonPath);

    return { channel: pkg.name || defaultConfig.channel, ...pkg.nodeLogger };
}

function findPackageJson() {
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

function loadConfigFromPackage() {
    const pkgFile = findPackageJson();

    if (!pkgFile) {
        return { path: null, config: {} };
    }

    const config = getConfigFromPackage(pkgFile);

    if (!config) {
        return { path: null, config: {} };
    }

    const modulePath = join(dirname(pkgFile), 'node_modules');
    return { path: modulePath, config };
}

function loadModule(moduleName, path) {
    return require(join(path, moduleName)).default;
}

function loadFormatter(config, path) {
    const { formatter } = config;

    if (typeof formatter === 'function') {
        return formatter;
    }

    if (!path) {
        throw new Error('Formatter must be configured as function unless a package.json is available');
    }

    try {
        return loadModule(formatter, path);
    } catch (error) {
        throw new Error(`Formatter ${formatter} not found in ${path}: ${error.message}`);
    }
}

function loadPlugin(pluginConfig, path) {
    try {
        return loadModule(pluginConfig, path);
    } catch (error) {
        throw new Error(`Plugin ${pluginConfig} not found in ${path}: ${error.message}`);
    }
}

function loadPlugins(config, path) {
    return config
        .plugins
        .map((plugin) => {
            const Plugin = loadPlugin(plugin, path);
            return new Plugin(config);
        });
}

function deepParseEnv(config) {
    const parsedConfig = {};

    if (!config || Array.isArray(config) || typeof config === 'boolean' || typeof config === 'function') {
        return config;
    }

    if (typeof config !== 'object' && typeof config === 'string') {
        const match = config.match(/env\(([^,)]*)(, *(.*))?\)/);

        if (match) {
            if (process.env[match[1]] !== undefined) {
                return process.env[match[1]];
            }

            if (match[3] !== undefined) {
                return match[3];
            }

            throw new Error(`Env ${match[1]} is not set nor has a fallback!`);
        }

        return config;
    }

    Object.entries(config).forEach(([key, value]) => {
        parsedConfig[key] = deepParseEnv(value);
    });

    return parsedConfig;
}

function assertConfig(config) {
    if (!config.formatter) {
        throw new Error('Invalid formatter: No formatter found in configuration');
    }

    if (!Array.isArray(config.levels) || config.levels.length === 0) {
        throw new Error('Invalid levels: No levels were configured');
    }

    if (!config.maxLevel || config.levels.indexOf(config.maxLevel) < 0) {
        throw new Error(`Invalid maxLevel: ${config.maxLevel}`);
    }

    if (!config.timerLevel || config.levels.indexOf(config.timerLevel) < 0) {
        throw new Error(`Invalid timerLevel: ${config.timerLevel}`);
    }

    if (!config.outputs || Object.keys(config.outputs).find(k => !config.levels.includes(k))) {
        throw new Error('Invalid outputs: Outputs can only be configured for existing log levels');
    }

    if (Object.values(config.outputs).find(k => !['stdout', 'stderr'].includes(k))) {
        throw new Error('Invalid outputs: Output must be stdout or stderr');
    }
}

export default function loadConfiguration(config = {}) {
    const packageJsonConfigDefinition = loadConfigFromPackage();
    const merged = deepParseEnv(merge.all([
        defaultConfig,
        packageJsonConfigDefinition.config,
        config,
    ], {
        arrayMerge: (target, source) => source,
        customMerge: (key) => {
            if (key === 'outputs') return (a, b) => b; // Override outputs instead of merging them
            return undefined;
        },
    }));

    assertConfig(merged);

    return {
        ...merged,
        formatter: loadFormatter(merged, packageJsonConfigDefinition.path),
        plugins: loadPlugins(merged, packageJsonConfigDefinition.path),
    };
}
