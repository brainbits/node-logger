import fs from 'fs';
import path from 'path';
import { createRequireFromPath } from 'module';

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
        packageJson: 'package.json',
        levels: [
            'emergency', // 0
            'alert', //     1
            'critical', //  2
            'error', //     3
            'warning', //   4
            'notice', //    5
            'info', //      6
            'debug', //     7
        ],
        maxLevel: 'error',
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
        const nodeModulePath = paths.find(current => fs.existsSync(current));

        return {
            nodeModules: nodeModulePath,
            root: path.join(nodeModulePath, '..'),
        };
    }

    /**
     * @description Receives the content of the package.json
     * @readonly
     * @memberof Config
     */
    get packageJson() {
        try {
            const { packageJson } = this.defaults;
            const { root } = this.modulePaths;
            const pkgFile = path.join(root, packageJson);

            if (!fs.existsSync(pkgFile)) {
                throw new Error(`File ${pkgFile} does not exist`);
            }
            return JSON.parse(fs.readFileSync(`${root}/${packageJson}`, 'utf8'));
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
        const { packageJson, ...defaults } = this.defaults;
        const { name, nodeLogger } = this.packageJsonContent;

        return {
            channel: name || 'unknown',
            ...defaults,
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
        return this.deepParseEnv(this.config);
    }

    /**
     * @description Gets the formatter and returns its function
     * @readonly
     * @memberof Config
     */
    get formatter() {
        const { parsedConfig } = this;

        if ((!('formatter' in parsedConfig) && typeof parsedConfig !== 'string') || parsedConfig.formatter.length <= 1) {
            throw new Error(`You must specify a formatter in your ${this.defaults.packageJson} (as a string)`);
        }

        try {
            const formatterFunction = this.importModule(parsedConfig.formatter);

            return formatterFunction;
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
        const { parsedConfig } = this;

        if ((!('plugins' in parsedConfig) && Array.isArray(parsedConfig.plugins)) || parsedConfig.plugins.length < 1) {
            throw new Error(`You must specify plugins in your ${this.defaults.packageJson} (as array)`);
        }

        try {
            const plugins = parsedConfig.plugins.map((plugin) => {
                const Plugin = this.importModule(plugin);

                return new Plugin(parsedConfig);
            });

            return plugins;
        } catch (error) {
            throw error;
        }
    }

    /**
     * @description Imports a module dynamically from the root module
     * @param {*} moduleName
     * @returns module
     * @memberof Config
     * @private
     */
    importModule(moduleName) {
        try {
            const { nodeModules } = this.modulePaths;
            const requireFromRoot = createRequireFromPath(nodeModules);
            const loadedModule = requireFromRoot(moduleName).default;

            return loadedModule;
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
