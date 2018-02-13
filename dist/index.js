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
/**
 * @description Make a string of an non empty object or return ‘[]' as a string
 * @param {object} object
 * @returns {string} The result as a string
 */
function stringifyExtras(object) {
    if ((0, _getType.isObject)(object) && Object.keys(object).length !== 0) {
        return JSON.stringify(object);
    }
    return '[]';
}
/**
 * @description Monolog formatter for winston
 * @param {object}
 * @returns
 */
function monolog(channel) {
    return printf(info => {
        let logMessage;
        let context = '[]'; // Default for context if it is empty
        let extra = '[]'; // Default for extra if it is empty
        let level = info.level.toUpperCase();

        if ((0, _getType.isError)(info.message)) {
            const { message: error } = info;
            const {
                name, message, data } = error,
                  rest = _objectWithoutProperties(error, ['name', 'message', 'data']);

            // Set level to error if it is WRONG!
            level = 'ERROR';
            // Put error message to our log message
            logMessage = `${name} - ${message}`;
            context = stringifyExtras(_extends({}, data));
            // Put the rest into extra
            extra = stringifyExtras(_extends({}, rest));
        } else if ((0, _getType.isObject)(info.message)) {
            const _info$message = info.message,
                  { message, data } = _info$message,
                  rest = _objectWithoutProperties(_info$message, ['message', 'data']);

            logMessage = message || '-';
            context = stringifyExtras(data);
            extra = stringifyExtras(rest);
        } else if ((0, _getType.isArray)(info.message)) {
            logMessage = info.message.join(' ');
        } else if ((0, _getType.isString)(info.message)) {
            logMessage = info.message;
        } else {
            logMessage = '-';
        }
        // Monolog format: "[%datetime%] %channel%.%level_name%: %message% %context% %extra%\n"
        const logFormat = `[${timestamp()}] ${channel}.${level}: ${logMessage} ${context} ${extra}`;

        return logFormat;
    });
}

const logger = (0, _winston.createLogger)({
    format: monolog(CHANNEL.toLowerCase()),
    transports: [new _winston.transports.Console({ handleExceptions: true })],
    exitOnError: false
});

exports.default = logger;