import { format } from 'winston';
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
function formatMonologMessage(channel, level, logData, metaData) {
    const context = stringifyExtras({
        ...logData.context,
        'metadata.context': metaData,
    });
    const extras = stringifyExtras(logData.extras);

    // Monolog format: "[%datetime%] %channel%.%level_name%: %message% %context% %extra%\n"
    return `[${timestamp()}] ${channel}.${level}: ${logData.message || '-'} ${context} ${extras}`;
}

/**
 * @description Formatter function
 * @export
 * @param {string} channel Channel of the logger
 * @returns {function} formatter function for winston logger
 */
export default function monolog(channel) {
    return format.printf((info) => {
        let level = info.level.toUpperCase();
        const metaData = info.metadata;
        let logData = {
            message: null,
            context: [],
            extra: [],
        };

        if (info.message instanceof Error) {
            level = 'ERROR';
        }

        switch (getType(info.message)) {
            case 'object':
                logData = parseObject(info.message);
                break;
            case 'array':
                logData = { ...logData, message: info.message.join(' ') };
                break;
            default:
                logData = { ...logData, message: info.message };
                break;
        }

        return formatMonologMessage(channel, level, logData, metaData);
    });
}
