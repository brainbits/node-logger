'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.createLogger = createLogger;

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _monolog = require('./monolog');

var _monolog2 = _interopRequireDefault(_monolog);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const { env } = process;
const CHANNEL = env.LOGGER_CHANNEL;
const MAX_LEVEL = env.LOGGER_MAX_LEVEL;

/**
 * @description Write to a output stream or not
 * @param {string} string The string for the stream
 * @param {string} level The logging level to be used
 */
function write(string, level) {
    const sortedLevels = Object.entries(_config2.default.levels).sort((a, b) => a[1] - b[1]).map(([levelName]) => levelName);

    const outputLevel = sortedLevels.slice(0, sortedLevels.indexOf(level) + 1).reverse().find(levelName => levelName in _config2.default.outputs);

    const output = _config2.default.outputs[outputLevel];

    if (output.isTTY) {
        output.write(`${string}\n`);
    }
}

/**
 * @description Create logger instance
 * @export
 * @param {object} options Options to set maximum log level (maxLevel) and channel name
 * @returns  {object} The ready to use logger instance
 */
function createLogger(options = {}) {
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
                timeMs = Math.round((s * 1e9 + ns) * 1e-6);
            }
            this[_config2.default.timerLevel](message, _extends({}, meta, { timeMs }));
        }
    };

    Object.keys(_config2.default.levels).forEach(level => {
        loggerInstance[level] = (message, meta) => {
            if (_config2.default.levels[maxLevel] < _config2.default.levels[level]) {
                return;
            }
            write((0, _monolog2.default)(channel, level, message, meta), level);
        };
    });

    return loggerInstance;
}

exports.default = createLogger({
    maxLevel: MAX_LEVEL,
    channel: CHANNEL
});