import Config from './config';

/**
 * @description Logger class
 * @class Logger
 */
class Logger {
    timeMap = new Map();
    /**
     *Creates an instance of Logger.
     * @memberof Logger
     */
    constructor(config, context) {
        const configurator = new Config(config);
        this.context = context;

        // Generate configuration object
        this.config = configurator.generate();

        // Creates for all level methods
        this.config.levels.forEach((level) => {
            this[level] = (message, meta) => {
                if (this.isLevelSilent(level)) {
                    return;
                }

                const formattedString = this.config.formatter(
                    this.config.channel,
                    level,
                    message,
                    meta,
                );

                this.feedPlugins({
                    channel: this.config.channel,
                    context: this.context,
                    level,
                    message,
                    meta,
                });

                this.write(formattedString, level);
            };
        });
    }

    isLevelSilent(level) {
        const { levels, maxLevel } = this.config;

        return levels.indexOf(level) > levels.indexOf(maxLevel);
    }

    start(message) {
        this.timeMap.set(message, process.hrtime());
    }

    stop(message, meta) {
        let timeMs = null;
        if (this.timeMap.has(message)) {
            const [s, ns] = process.hrtime(this.timeMap.get(message));
            timeMs = Math.round(((s * 1e9) + ns) * 1e-6);
        }
        this[this.config.timerLevel](message, { ...meta, timeMs });
    }

    /**
     * @description Feeds the plugins with the feed object
     * @memberof Logger
     */
    feedPlugins(event) {
        const { plugins } = this.config;

        plugins.forEach((plugin) => {
            if ('log' in plugin) {
                plugin.log(event);
            }
        });
    }

    /**
     * @description Returns the output for a corresponding level
     * @param {*} level
     * @returns {string} outputLevel
     * @memberof Logger
     */
    outputLevel(level) {
        return this.config.levels
            .slice(0, this.config.levels.indexOf(level) + 1)
            .reverse()
            .find(levelName => levelName in this.config.outputs);
    }

    /**
     * @description Writes the content of an event to the output
     * @param {string} string
     * @param {string} level
     * @memberof Logger
     */
    write(string, level) {
        const message = `${string}\n`;
        const outputLevel = this.outputLevel(level);
        const output = this.config.outputs[outputLevel];

        if (!['stderr', 'stdout'].includes(output)) {
            throw new Error(`Output ${output} not supported`);
        }

        const target = process[output];

        if (target.writable) {
            target.write(message);
        }
    }
}

export default Logger;
