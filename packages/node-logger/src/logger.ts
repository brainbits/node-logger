import loadConfiguration from './config.js';
import type { Config, LogEvent, LogLevel, LogMethod, Meta, ResolvedConfig } from './types.js';

/**
 * @description Logger class
 * @class Logger
 */
export default class Logger {
    // Created in the constructor for every configured level
    declare emergency: LogMethod;
    declare alert: LogMethod;
    declare critical: LogMethod;
    declare error: LogMethod;
    declare warning: LogMethod;
    declare notice: LogMethod;
    declare info: LogMethod;
    declare debug: LogMethod;

    private readonly config: ResolvedConfig;

    /**
     * @description Map for the timer
     */
    private readonly timeMap = new Map<unknown, [number, number]>();

    /**
     * @description Creates an instance of Logger.
     */
    constructor(config: Config = {}) {
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
     */
    start(message: unknown): void {
        this.timeMap.set(message, process.hrtime());
    }

    /**
     * @description Stops the timer with an existing message
     */
    stop(message: unknown, meta: Meta = {}): void {
        let timeMs = null;
        const startTime = this.timeMap.get(message);
        if (startTime) {
            const [s, ns] = process.hrtime(startTime);
            timeMs = Math.round(((s * 1e9) + ns) * 1e-6);
        }
        this[this.config.timerLevel](message, { ...meta, timeMs });
    }

    /**
     * @description logs the plugins with the feed object
     */
    private logToPlugins(event: LogEvent): void {
        this.config.plugins.forEach((plugin) => {
            if ('log' in plugin) {
                plugin.log(event);
            }
        });
    }

    /**
     * @description Returns the output for a corresponding level
     */
    private getOutputForLevel(level: LogLevel): NodeJS.WriteStream | null {
        const { levels, outputs } = this.config;
        const outputLevel = levels
            .slice(0, levels.indexOf(level) + 1)
            .reverse()
            .find(levelName => levelName in outputs);

        const output = outputLevel && outputs[outputLevel];

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
     */
    private isLevelSilent(level: LogLevel): boolean {
        const { levels, maxLevel } = this.config;

        return levels.indexOf(level) > levels.indexOf(maxLevel);
    }

    /**
     * @description Writes the content of an event to the output
     */
    private write(event: LogEvent): void {
        if (this.isLevelSilent(event.level)) {
            return;
        }

        const message = this.config.formatter(event);
        const target = this.getOutputForLevel(event.level);

        if (target?.writable) {
            target.write(`${message}\n`);
        }
    }
}
