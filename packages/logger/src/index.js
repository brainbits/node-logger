import loadConfiguration from './config';

// Export all error classes
export * from './errors';

/**
 * @description Logger class
 * @class Logger
 */
export default class Logger {
    /**
     * @description Map for the timer
     */
    timeMap = new Map();

    /**
     * @description Creates an instance of Logger.
     */
    constructor(config = {}) {
        this.config = loadConfiguration(config);
        const { levels, channel } = this.config;

        // Creates for all level methods
        levels.forEach((level) => {
            this[level] = (message, meta) => {
                const event = {
                    channel,
                    level,
                    message,
                    meta,
                };

                this.logToPlugins(event);
                this.write(event);
            };
        });
    }

    /**
     * @description Start the timer with a message as identifier
     * @param {*} message
     */
    start(message) {
        this.timeMap.set(message, process.hrtime());
    }

    /**
     * @description Stops the timer with an existing message
     * @param {*} message
     * @param {*} meta
     */
    stop(message, meta = {}) {
        let timeMs = null;
        if (this.timeMap.has(message)) {
            const [s, ns] = process.hrtime(this.timeMap.get(message));
            timeMs = Math.round(((s * 1e9) + ns) * 1e-6);
        }
        this[this.config.timerLevel](message, { ...meta, timeMs });
    }

    /**
     * @description logs the plugins with the feed object
     * @memberof Logger
     * @private
     */
    logToPlugins(event) {
        const { plugins } = this.config;

        if (!plugins && !Array.isArray(plugins)) {
            return;
        }

        plugins.forEach((plugin) => {
            if ('log' in plugin) {
                plugin.log(event);
            }
        });
    }

    /**
     * @description Returns the output for a corresponding level
     * @param {string} level
     * @returns {Stream|null} output
     * @memberof Logger
     * @private
     */
    getOutputForLevel(level) {
        const outputLevel = this.config.levels
            .slice(0, this.config.levels.indexOf(level) + 1)
            .reverse()
            .find(levelName => levelName in this.config.outputs);

        const output = this.config.outputs[outputLevel];

        if (!output) {
            return null;
        }

        if (!['stderr', 'stdout'].includes(output)) {
            throw new Error(`Output ${output} not supported`);
        }

        return process[output];
    }

    /**
     * @description Checks if the level is allowed to write to our targets
     * @param {*} level
     * @returns {boolean}
     * @memberof Logger
     * @private
     */
    isLevelSilent(level) {
        const { levels, maxLevel } = this.config;

        return levels.indexOf(level) > levels.indexOf(maxLevel);
    }

    /**
     * @description Writes the content of an event to the output
     * @param {object} event
     * @memberof Logger
     * @private
     */
    write(event) {
        if (this.isLevelSilent(event.level)) {
            return;
        }

        const message = this.config.formatter(event);
        const target = this.getOutputForLevel(event.level);

        if (target && target.writable) {
            target.write(`${message}\n`);
        }
    }
}
