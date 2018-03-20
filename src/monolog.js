import getType from 'jest-get-type';
import { timestamp, isNonEmptyObject } from './utils';

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
 * @param {string} channel Channel of the logger
 * @param {string} level Level of the logger
 * @param {object} logData Data from our object with message, context and extras
 * @param {object} meta Some meta information for context
 * @returns {string} Monolog string
 */
function formatMonologMessage(channel, level, logData, meta = {}) {
    const format = 'YYYY-MM-DD HH:mm:ss';
    const context = stringifyExtras({
        ...logData.context,
        ...meta,
    });
    const extras = stringifyExtras(logData.extras);

    // Monolog format: "[%datetime%] %channel%.%level_name%: %message% %context% %extra%\n"
    return `[${timestamp(format)}] ${channel}.${level.toUpperCase()}: ${logData.message || '-'} ${context} ${extras}`;
}

/**
 * @description Formatter function
 * @export
 * @param {string} channel Channel of the logger
 * @param {string} level Level of the logger
 * @param {*} message Message
 * @param {object} meta Some meta information for context
 * @returns {function} formatter function for winston logger
 */
export default function monolog(channel, level, message, meta) {
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
