import getType from 'jest-get-type';
import { timestamp, isNonEmptyObject } from './utils';

/**
 * @description Make a string of an non empty object or return ‘[]' as a string
 * @param {object} object
 * @returns {string} The result as a string
 */
function stringifyExtras(object) {
    const json = isNonEmptyObject(object) ? JSON.stringify(object) : '{}';
    if (json !== '{}') {
        return json;
    }
    return '[]';
}

/**
 * @description parse message of an error or object
 * @param {object} object Object to parse
 * @returns {object} An object with message, context and extras
 */
function parseObject(object) {
    const {
        message, context, name, ...extras
    } = object;

    return {
        message: name ? `${name} - ${message || '-'}` : message,
        context,
        extras,
    };
}

/**
 * @description Generate the monolog string
 * @param {string} channel Channel of the logger
 * @param {string} level Level of the logger
 * @param {object} logData Data from our object with message, context and extras
 * @returns {string} Monolog string
 */
function formatMonologMessage(channel, level, logData, meta) {
    const context = stringifyExtras({
        ...logData.context,
        'meta.context': meta,
    });
    const extras = stringifyExtras(logData.extras);

    // Monolog format: "[%datetime%] %channel%.%level_name%: %message% %context% %extra%\n"
    return `[${timestamp()}] ${channel}.${level.toUpperCase()}: ${logData.message || '-'} ${context} ${extras}`;
}

/**
 * @description Formatter function
 * @export
 * @param {string} channel Channel of the logger
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
