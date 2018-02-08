import { format as dateFormat } from 'date-fns';
import { createLogger, format, transports } from 'winston';
import { isError, isObject, isString } from './getType';

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

function monolog({ channel }) {
    return printf((info) => {
        let logMessage;
        let context = '[]'; // Default for conext if it is empty
        let extra = '[]'; // Default for conext if it is empty

        let level = info.level.toUpperCase();

        if (isError(info.message)) {
            const { message: error } = info;
            const {
                name, message, stack, ...rest
            } = error;
            // Set level to error if it is WRONG!
            level = 'ERROR';
            // Put error message to our log message
            logMessage = info.message.toString();
            // Put stack into context
            context = JSON.stringify({ name, message, stack });
            // Put the rest into extra
            if (isObject(rest) && Object.keys(rest).length >= 1) {
                extra = JSON.stringify({ ...rest });
            }
        } else if (isObject(info.message)) {
            logMessage = Object.values(info.message).join(' ');
        } else if (isString(info.message)) {
            logMessage = info.message;
        } else {
            logMessage = '';
        }
        // Monolog format: "[%datetime%] %channel%.%level_name%: %message% %context% %extra%\n"
        const logFormat = `[${timestamp()}] ${channel}.${level}: ${logMessage} ${context} ${extra}`;

        return logFormat;
    });
}

const logger = createLogger({
    format: monolog({ channel: CHANNEL.toLowerCase() }),
    transports: [
        new transports.Console({ handleExceptions: true }),
    ],
    exitOnError: false,
});

export default logger;
