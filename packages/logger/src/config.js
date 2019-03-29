/* eslint-disable import/no-dynamic-require, global-require, no-param-reassign */
import fs from 'fs';
import { join } from 'path';

const defaultConfig = {
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
};

function getPackageConfigInPath(path) {
    const packageJsonPath = join(path, '..', 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
        return null;
    }

    const pkg = require(packageJsonPath);

    return pkg.nodeLogger;
}

function loadConfigFromPackage() {
    const { paths } = process.mainModule;
    const pkgConfig = paths
        .map(path => ({ path, config: getPackageConfigInPath(path) }))
        .find(config => !!config.config);

    if (!pkgConfig) {
        return {};
    }

    return pkgConfig || {};
}

function loadModule(module, path) {
    return require(join(path, module)).default;
}

function loadFormatter(config, path) {
    const { formatter } = config;

    if (typeof formatter === 'function') {
        return;
    }

    try {
        config.formatter = loadModule(formatter, path);
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
    config.plugins = config
        .plugins
        .map((plugin) => {
            const Plugin = loadPlugin(plugin, path)
            return new Plugin(config);
        });
}

function deepParseEnv(config) {
    const parsedConfig = {};

    if (Array.isArray(config) || typeof config === 'boolean') {
        return config;
    }

    if (typeof config !== 'object' && typeof config === 'string') {
        const match = config.match(/env\(([^,)]*)(, *(.*))?\)/);

        if (match) {
            if (!process.env[match[1]] && !match[3]) {
                throw new Error(`Env ${match[1]} is not set nor has a fallback!`);
            }

            return process.env[match[1]] || match[3];
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
        throw new Error('No formatter found in configuration');
    }
}

export default function loadConfiguration(config = {}) {
    const packageJsonConfigDefinition = loadConfigFromPackage();

    const merged = deepParseEnv({
        ...defaultConfig,
        ...packageJsonConfigDefinition.config,
        ...config,
    });

    assertConfig(merged);
    loadFormatter(merged, packageJsonConfigDefinition.path);
    loadPlugins(merged, packageJsonConfigDefinition.path);

    return merged;
}
