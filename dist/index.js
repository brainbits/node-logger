'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _dateFns = require('date-fns');

var _winston = require('winston');

var _getType = require('./getType');

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

// console.dir(createLogger);
// console.dir(format.printf);

const { env } = process;
const { printf } = _winston.format;

const TIMESTAMP_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const CHANNEL = env.LOGGER_CHANNEL || env.npm_package_name;

/**
 * @description Get current timestamp
 * @param {any} [timestampFormat=TIMESTAMP_FORMAT]
 * @returns {string} Current timestamp in given format
 */
function timestamp(timestampFormat = TIMESTAMP_FORMAT) {
    return (0, _dateFns.format)(new Date(), timestampFormat);
}

function monolog({ channel }) {
    return printf(info => {
        let logMessage;
        let context = '[]'; // Default for conext if it is empty
        let extra = '[]'; // Default for conext if it is empty

        let level = info.level.toUpperCase();

        if ((0, _getType.isError)(info.message)) {
            const { message: error } = info;
            const {
                name, message, stack } = error,
                  rest = _objectWithoutProperties(error, ['name', 'message', 'stack']);
            // Set level to error if it is WRONG!
            level = 'ERROR';
            // Put error message to our log message
            logMessage = info.message.toString();
            // Put stack into context
            context = JSON.stringify({ name, message, stack });
            // Put the rest into extra
            if ((0, _getType.isObject)(rest) && Object.keys(rest).length >= 1) {
                extra = JSON.stringify(_extends({}, rest));
            }
        } else if ((0, _getType.isObject)(info.message)) {
            logMessage = Object.values(info.message).join(' ');
        } else if ((0, _getType.isString)(info.message)) {
            logMessage = info.message;
        } else {
            logMessage = '';
        }
        // Monolog format: "[%datetime%] %channel%.%level_name%: %message% %context% %extra%\n"
        const logFormat = `[${timestamp()}] ${channel}.${level}: ${logMessage} ${context} ${extra}`;

        return logFormat;
    });
}

const logger = (0, _winston.createLogger)({
    format: monolog({ channel: CHANNEL.toLowerCase() }),
    transports: [new _winston.transports.Console({ handleExceptions: true })],
    exitOnError: false
});

exports.default = logger;