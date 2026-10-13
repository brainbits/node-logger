import type { LogEvent, Meta } from '@brainbits/node-logger';
import { format } from 'date-fns';

interface LogData {
    message: unknown;
    context?: Record<string, unknown>;
    extras?: Record<string, unknown>;
}

interface ParsableObject {
    message?: unknown;
    context?: Record<string, unknown>;
    name?: unknown;
    stack?: string | string[];
    [key: string]: unknown;
}

/**
 * @description Checks if the value is an object (e. g. an error), but no array, regexp, map, set or date
 */
function isParsableObject(value: unknown): value is ParsableObject {
    return typeof value === 'object'
        && value !== null
        && !Array.isArray(value)
        && ![RegExp, Map, Set, Date].some(type => value.constructor === type);
}

/**
 * @description Get current timestamp
 * @returns {string} Current timestamp in given format
 */
function timestamp(timestampFormat: string): string {
    return format(new Date(), timestampFormat);
}

/**
 * @description Checks if the object is non empty or has undefined properties
 * @returns {boolean} Returns true if the object is not empty
 */
function isNonEmptyObject(object: unknown): boolean {
    return typeof object === 'object' && object !== null && Object
        .values(object)
        .filter(entry => entry !== undefined)
        .length > 0;
}

/**
 * @description Make a string of an non empty object or return ‘[]' as a string
 * @returns {string} The result as a string
 */
function stringifyExtras(object: unknown): string {
    return isNonEmptyObject(object) ? JSON.stringify(object) : '[]';
}

/**
 * @description parse message of an error or object
 * @returns {object} An object with message, context and extras
 */
function parseObject({
    message,
    context,
    name,
    stack = [],
    ...extras
}: ParsableObject): LogData {
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
        message: name ? `${String(name)} - ${String(message || '-')}` : message,
        context: contextObject,
        extras,
    };
}

/**
 * @description Generate the monolog string
 * @param channel Channel of the node-logger
 * @param level Level of the node-logger
 * @param logData Data from our object with message, context and extras
 * @param meta Some meta information for context
 * @returns {string} Monolog string
 */
function formatMonologMessage(channel: string, level: string, logData: LogData, meta: Meta = {}): string {
    const formatString = 'yyyy-MM-dd HH:mm:ss';
    const context = stringifyExtras({
        ...logData.context,
        ...meta,
    });
    const extras = stringifyExtras(logData.extras);
    const message = String(logData.message || '-');

    // Monolog formatString: "[%datetime%] %channel%.%level_name%: %message% %context% %extra%\n"
    return `[${timestamp(formatString)}] ${channel}.${level.toUpperCase()}: ${message} ${context} ${extras}`;
}

/**
 * @description Formatter function
 * @returns {string} The event formatted as monolog line
 */
export default function monolog({
    channel,
    level,
    message,
    meta,
}: LogEvent): string {
    let logData: LogData;

    if (isParsableObject(message)) {
        logData = parseObject(message);
    } else if (Array.isArray(message)) {
        logData = { message: message.join(' ') };
    } else {
        logData = { message };
    }

    return formatMonologMessage(channel, level, logData, meta);
}
