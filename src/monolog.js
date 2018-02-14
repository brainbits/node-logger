import { format } from 'winston';
import getType from 'jest-get-type';
import {
    timestamp,
    isNonEmptyObject,
} from './utils';

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

function formatMonologMessage(channel, level, logData) {
    const context = stringifyExtras(logData.context);
    const extras = stringifyExtras(logData.extras);

    // Monolog format: "[%datetime%] %channel%.%level_name%: %message% %context% %extra%\n"
    return `[${timestamp()}] ${channel}.${level}: ${logData.message || '-'} ${context} ${extras}`;
}

/**
 * @description Monolog formatter for winston
 * @param {object}
 * @returns
 */
export default function monolog(channel) {
    return format.printf((info) => {
        let level = info.level.toUpperCase();
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

        return formatMonologMessage(channel, level, logData);
    });
}
