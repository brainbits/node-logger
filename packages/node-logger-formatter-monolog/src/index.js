import { getType } from 'jest-get-type';
import { format } from 'date-fns';

/**
 * @description Get current timestamp
 * @param {any} [timestampFormat=TIMESTAMP_FORMAT]
 * @returns {string} Current timestamp in given format
 */
function timestamp(timestampFormat) {
    return format(new Date(), timestampFormat);
}

/**
 * @description Checks if the object is non empty or has undefined properties
 * @export
 * @param {any} object
 * @returns {boolean} Returns true if the object is not empty
 */
function isNonEmptyObject(object) {
    return typeof object === 'object' && Object
        .values(object)
        .filter(entry => entry !== undefined)
        .length > 0;
}

/**
 * @description Make a string of an non empty object or return ‘[]' as a string
 * @param {object} object
 * @returns {string} The result as a string
 */
function stringifyExtras(object) {
    return isNonEmptyObject(object) ? JSON.stringify(object) : '[]';
}

/**
 * @description parse message of an error or object
 * @param {object} object Object to parse
 * @returns {object} An object with message, context and extras
 */
function parseObject({
    message,
    context,
    name,
    stack = [],
    ...extras
}) {
    let stackTrace = stack;
    let contextObject = context;

    if (!Array.isArray(stackTrace)) {
        stackTrace = stackTrace
            .split('\n')
            .map(line => line.trim())
            .filter(line => !!line);
    }

    if (stackTrace.length) {
        const linesToCut = 11;
        const truncatedLines = stackTrace.length - linesToCut;

        stackTrace = stackTrace
            .slice(1, linesToCut);

        if (truncatedLines > 0) {
            stackTrace.push(`${truncatedLines} more line${truncatedLines <= 1 ? '' : 's'} ...`);
        }

        contextObject = { ...contextObject, stackTrace };
    }

    return {
        message: name ? `${name} - ${message || '-'}` : message,
        context: contextObject,
        extras,
    };
}

/**
 * @description Generate the monolog string
 * @param {string} channel Channel of the node-logger
 * @param {string} level Level of the node-logger
 * @param {object} logData Data from our object with message, context and extras
 * @param {object} meta Some meta information for context
 * @returns {string} Monolog string
 */
function formatMonologMessage(channel, level, logData, meta = {}) {
    const formatString = 'yyyy-MM-dd HH:mm:ss';
    const context = stringifyExtras({
        ...logData.context,
        ...meta,
    });
    const extras = stringifyExtras(logData.extras);

    // Monolog formatString: "[%datetime%] %channel%.%level_name%: %message% %context% %extra%\n"
    return `[${timestamp(formatString)}] ${channel}.${level.toUpperCase()}: ${logData.message || '-'} ${context} ${extras}`;
}

/**
 * @description Formatter function
 * @export
 * @param {object} event
 * @returns {function} formatter function for node-logger
 */
export default function monolog({
    channel,
    level,
    message,
    meta,
}) {
    let logData = {
        message: null,
        context: [],
        extra: [],
    };

    switch (getType(message)) {
        case 'object':
            logData = parseObject(message);
            break;
        case 'array':
            logData = { ...logData, message: message.join(' ') };
            break;
        default:
            logData = { ...logData, message };
            break;
    }

    return formatMonologMessage(channel, level, logData, meta);
}
