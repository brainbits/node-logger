import Config from './config';

// Export all error classes
export * from './errors';

/**
 * @description Logger class
 * @class Logger
 */
export default class Logger {
    /**
     * @description Map for the timer
     * @memberof Logger
     */
    timeMap = new Map();

    /**
     * @description Map for tags
     * @memberof Logger
     */
    tagsMap = new Map();

    /**
     *Creates an instance of Logger.
     * @memberof Logger
     */
    constructor(context, config) {
        // Generate configuration object
        const cfg = new Config(config);

        this.config = cfg.generate();

        const { levels, channel } = this.config;

        // Creates for all level methods
        levels.forEach((level) => {
            this[level] = (message, meta) => {
                const event = {
                    channel, //  1
                    level, //    2
                    message, //  3
                    meta, //     4
                };

                this.logToPlugins({
                    ...event,
                    context,
                    tags: this.tagsMap,
                });

                this.write(event, level);
            };
        });
    }

    /**
     * @description Adds a new tag to the tag map
     * @param {*} key
     * @param {*} value
     * @memberof Logger
     */
    setTag(key, value) {
        this.tagsMap.set(key, value);
    }

    /**
     * @description Removes a tag by its key
     * @param {*} key
     * @memberof Logger
     */
    deleteTag(key) {
        this.tagsMap.delete(key);
    }

    /**
     * @description Reset the entire tag map
     * @memberof Logger
     */
    clearTags() {
        this.tagsMap.clear();
    }

    /**
     * @description Start the timer with a message as identifier
     * @param {*} message
     * @memberof Logger
     */
    start(message) {
        this.timeMap.set(message, process.hrtime());
    }

    /**
     * @description Stops the timer with an existing message
     * @param {*} message
     * @param {*} meta
     * @memberof Logger
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
     */
    logToPlugins(event) {
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
     * @description Checks if the level is allowed to write to our targets
     * @param {*} level
     * @returns {boolean}
     * @memberof Logger
     */
    isLevelSilent(level) {
        const { levels, maxLevel } = this.config;

        return levels.indexOf(level) > levels.indexOf(maxLevel);
    }

    /**
     * @description Writes the content of an event to the output
     * @param {object} event
     * @param {string} level
     * @memberof Logger
     */
    write(event, level) {
        if (this.isLevelSilent(level)) {
            return;
        }

        const message = this.config.formatter(...Object.values(event));
        const outputLevel = this.outputLevel(level);
        const output = this.config.outputs[outputLevel];

        if (!['stderr', 'stdout'].includes(output)) {
            throw new Error(`Output ${output} not supported`);
        }

        const target = process[output];

        if (target.writable) {
            target.write(`${message}\n`);
        }
    }
}
