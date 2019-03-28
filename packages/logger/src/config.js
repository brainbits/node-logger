/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
import fs from 'fs';
import path from 'path';

class Config {
    /**
     * @description Main module object
     * @memberof Config
     */
    mainModule = process.mainModule;

    /**
     * @description Defaults for the config object
     * @memberof Config
     */
    defaults = {
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

    /**
     *Creates an instance of Config.
     * @param {*} overrideConfig
     * @memberof Config
     */
    constructor(overrideConfig = {}) {
        this.overrideConfig = overrideConfig;
        this.packageJsonContent = this.packageJson;
    }

    /**
     * @description Returns the module paths of the root module
     * @readonly
     * @memberof Config
     */
    get modulePaths() {
        const { paths } = this.mainModule;
        const nodeModules = paths.find(current => fs.existsSync(current));

        return {
            nodeModules,
            root: path.join(nodeModules, '..'),
        };
    }

    /**
     * @description Receives the content of the package.json
     * @readonly
     * @memberof Config
     */
    get packageJson() {
        try {
            const { root } = this.modulePaths;
            const pkgFile = path.join(root, 'package.json');

            if (!fs.existsSync(pkgFile)) {
                throw new Error(`File ${pkgFile} does not exist`);
            }

            return require(`${root}/package.json`);
        } catch (error) {
            throw error;
        }
    }

    /**
     * @description Gets the raw configuration from all sources and respects their order
     * @readonly
     * @memberof Config
     */
    get config() {
        const { name, nodeLogger } = this.packageJsonContent;

        return {
            channel: name || 'unknown',
            ...this.defaults,
            ...nodeLogger,
            ...this.overrideConfig,
        };
    }

    /**
     * @description Returns the parsed configuration
     * @readonly
     * @memberof Config
     */
    get parsedConfig() {
        if (!this.parsedConfigCache) {
            this.parsedConfigCache = this.deepParseEnv(this.config);
        }

        return this.parsedConfigCache;
    }

    /**
     * @description Gets the formatter and returns its function
     * @readonly
     * @memberof Config
     */
    get formatter() {
        const { parsedConfig, modulePaths } = this;

        if (!parsedConfig.formatter) {
            throw new Error('No formatter found in configuration');
        }

        if (typeof parsedConfig.formatter === 'function') {
            return parsedConfig.formatter;
        }

        try {
            return require(path.join(modulePaths.nodeModules, parsedConfig.formatter)).default;
        } catch (error) {
            throw error;
        }
    }

    /**
     * @description Gets all plugins and returns its instance
     * @readonly
     * @memberof Config
     */
    get plugins() {
        const { parsedConfig, modulePaths } = this;

        if (!('plugins' in parsedConfig && Array.isArray(parsedConfig.plugins))) {
            return null;
        }

        try {
            const plugins = parsedConfig.plugins.map((plugin) => {
                const Plugin = require(path.join(modulePaths.nodeModules, plugin)).default;

                return new Plugin(parsedConfig);
            });

            return plugins;
        } catch (error) {
            throw error;
        }
    }

    /**
     * @description Deep search and replace the config for environment variables
     * @memberof Config
     * @private
     */
    deepParseEnv(config) {
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

        Object.keys(config).forEach((key) => {
            parsedConfig[key] = this.deepParseEnv(config[key]);
        });

        return parsedConfig;
    }

    /**
     * @description Generates the final configuration
     * @returns {object} parsedConfig Parsed configuration
     * @memberof Config
     */
    generate() {
        return {
            ...this.parsedConfig,
            plugins: this.plugins,
            formatter: this.formatter,
        };
    }
}

export default Config;
