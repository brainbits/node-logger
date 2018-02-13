import { format as dateFormat } from 'date-fns';
import { createLogger, format, transports } from 'winston';
import { isError, isObject, isString, isArray } from './getType';

// console.dir(createLogger);
// console.dir(format.printf);

const { env } = process;
const { printf } = format;

const TIMESTAMP_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const CHANNEL = env.LOGGER_CHANNEL || env.npm_package_name;

/**
 * @description Get current timestamp
 * @param {any} [timestampFormat=TIMESTAMP_FORMAT]
 * @returns {string} Current timestamp in given format
 */
function timestamp(timestampFormat = TIMESTAMP_FORMAT) {
    return dateFormat(new Date(), timestampFormat);
}
/**
 * @description Make a string of an non empty object or return ‘[]' as a string
 * @param {object} object
 * @returns {string} The result as a string
 */
function stringifyExtras(object) {
    if (isObject(object) && Object.keys(object).length !== 0) {
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
    return printf((info) => {
        let logMessage;
        let context = '[]'; // Default for context if it is empty
        let extra = '[]'; // Default for extra if it is empty
        let level = info.level.toUpperCase();

        if (isError(info.message)) {
            const { message: error } = info;
            const {
                name, message, data, ...rest
            } = error;

            // Set level to error if it is WRONG!
            level = 'ERROR';
            // Put error message to our log message
            logMessage = `${name} - ${message}`;
            context = stringifyExtras({ ...data });
            // Put the rest into extra
            extra = stringifyExtras({ ...rest });
        } else if (isObject(info.message)) {
            const { message, data, ...rest } = info.message;

            logMessage = message || '-';
            context = stringifyExtras(data);
            extra = stringifyExtras(rest);
        } else if (isArray(info.message)) {
            logMessage = info.message.join(' ');
        } else if (isString(info.message)) {
            logMessage = info.message;
        } else {
            logMessage = '-';
        }
        // Monolog format: "[%datetime%] %channel%.%level_name%: %message% %context% %extra%\n"
        const logFormat = `[${timestamp()}] ${channel}.${level}: ${logMessage} ${context} ${extra}`;

        return logFormat;
    });
}

const logger = createLogger({
    format: monolog(CHANNEL.toLowerCase()),
    transports: [
        new transports.Console({ handleExceptions: true }),
    ],
    exitOnError: false,
});

export default logger;
