import loadConfiguration from './config.js';
import { logLevels } from './schema.js';
import type { Config, LogEvent, LogLevel, LogMessage, Meta, ResolvedConfig } from './types.js';

/**
 * @description Logger class
 * @class Logger
 */
export default class Logger {
    private readonly config: ResolvedConfig;

    /**
     * @description Map for the timer
     */
    private readonly timeMap = new Map<string, [number, number]>();

    /**
     * @description Creates an instance of Logger.
     */
    constructor(config: Config = {}) {
        this.config = loadConfiguration(config);
    }

    /**
     * @description Logs a message with the given level
     */
    log(level: LogLevel, message: LogMessage, meta?: Meta): void {
        if (!logLevels.includes(level)) {
            throw new TypeError(`Unknown log level "${String(level)}", expected one of ${logLevels.join(', ')}`);
        }

        const event = {
            channel: this.config.channel,
            level,
            message,
            meta,
        };

        this.logToPlugins(event);
        this.write(event);
    }

    emergency(message: LogMessage, meta?: Meta): void {
        this.log('emergency', message, meta);
    }

    alert(message: LogMessage, meta?: Meta): void {
        this.log('alert', message, meta);
    }

    critical(message: LogMessage, meta?: Meta): void {
        this.log('critical', message, meta);
    }

    error(message: LogMessage, meta?: Meta): void {
        this.log('error', message, meta);
    }

    warning(message: LogMessage, meta?: Meta): void {
        this.log('warning', message, meta);
    }

    notice(message: LogMessage, meta?: Meta): void {
        this.log('notice', message, meta);
    }

    info(message: LogMessage, meta?: Meta): void {
        this.log('info', message, meta);
    }

    debug(message: LogMessage, meta?: Meta): void {
        this.log('debug', message, meta);
    }

    /**
     * @description Starts the timer with a label as identifier
     */
    start(label: string): void {
        this.timeMap.set(label, process.hrtime());
    }

    /**
     * @description Stops the timer with an existing label and logs the elapsed time with the timer level
     */
    stop(label: string, meta: Meta = {}): void {
        let timeMs = null;
        const startTime = this.timeMap.get(label);
        if (startTime) {
            const [s, ns] = process.hrtime(startTime);
            timeMs = Math.round(((s * 1e9) + ns) * 1e-6);
            this.timeMap.delete(label);
        }
        this.log(this.config.timerLevel, label, { ...meta, timeMs });
    }

    /**
     * @description logs the plugins with the feed object
     */
    private logToPlugins(event: LogEvent): void {
        this.config.plugins.forEach((plugin) => {
            plugin.log?.(event);
        });
    }

    /**
     * @description Returns the output for a corresponding level: the output of the level itself
     * or of the next more severe level that has one
     */
    private getOutputForLevel(level: LogLevel): NodeJS.WriteStream | null {
        const { outputs } = this.config;
        const outputLevel = logLevels
            .slice(0, logLevels.indexOf(level) + 1)
            .reverse()
            .find(levelName => levelName in outputs);

        const output = outputLevel && outputs[outputLevel];

        return output ? process[output] : null;
    }

    /**
     * @description Checks if the level is allowed to write to our targets
     */
    private isLevelSilent(level: LogLevel): boolean {
        return logLevels.indexOf(level) > logLevels.indexOf(this.config.maxLevel);
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
