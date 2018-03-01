import config from './config';
import monolog from './monolog';

const { env } = process;
const CHANNEL = env.LOGGER_CHANNEL;
const MAX_LEVEL = env.LOGGER_MAX_LEVEL;

/**
 * @description Write to a output stream or not
 * @param {string} string The string for the stream
 * @param {string} level The logging level to be used
 */
function write(string, level) {
    const sortedLevels = Object
        .entries(config.levels)
        .sort((a, b) => a[1] - b[1])
        .map(([levelName]) => levelName);

    const outputLevel = sortedLevels
        .slice(0, sortedLevels.indexOf(level) + 1)
        .reverse()
        .find(levelName => levelName in config.outputs);

    const output = config.outputs[outputLevel];

    if (output.writable) {
        output.write(`${string}\n`);
    }
}

/**
 * @description Create logger instance
 * @export
 * @param {object} options Options to set maximum log level (maxLevel) and channel name
 * @returns  {object} The ready to use logger instance
 */
export function createLogger(options = {}) {
    const maxLevel = options.maxLevel || 'info';
    const channel = options.channel || env.npm_package_name;
    const timeMap = new Map();
    const loggerInstance = {
        start(message) {
            timeMap.set(message, process.hrtime());
        },
        stop(message, meta) {
            let timeMs = null;
            if (timeMap.has(message)) {
                const [s, ns] = process.hrtime(timeMap.get(message));
                timeMs = Math.round(((s * 1e9) + ns) * 1e-6);
            }
            this[config.timerLevel](message, { ...meta, timeMs });
        },
    };

    Object.keys(config.levels).forEach((level) => {
        loggerInstance[level] = (message, meta) => {
            if (config.levels[maxLevel] < config.levels[level]) {
                return;
            }
            write(monolog(channel, level, message, meta), level);
        };
    });

    return loggerInstance;
}

export default createLogger({
    maxLevel: MAX_LEVEL,
    channel: CHANNEL,
});
