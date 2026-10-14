import type { LogEvent, Meta } from '@brainbits/node-logger';
import { format } from 'date-fns';

interface LogData {
    message: string;
    context?: Record<string, unknown>;
    extras?: Record<string, unknown>;
}

/**
 * An error or an object logged as message. Errors may carry a context, which is logged with them.
 */
interface MessageObject {
    message?: unknown;
    name?: unknown;
    stack?: unknown;
    cause?: unknown;
    context?: Record<string, unknown>;
    [key: string]: unknown;
}

const maxStackTraceLines = 10;
const maxCauses = 10;

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
function isNonEmptyObject(object: object | undefined): boolean {
    return object !== undefined && Object
        .values(object)
        .filter(entry => entry !== undefined)
        .length > 0;
}

/**
 * @description Make a string of an non empty object or return ‘[]' as a string
 * @returns {string} The result as a string
 */
function stringifyExtras(object: object | undefined): string {
    return isNonEmptyObject(object) ? JSON.stringify(object) : '[]';
}

/**
 * @description Returns a readable text for values of objects logged as message
 */
function toText(value: unknown): string {
    if (value == null) {
        return '';
    }

    return typeof value === 'string' ? value : JSON.stringify(value);
}

function formatError({ name, message }: Error): string {
    return `${name} - ${message || '-'}`;
}

/**
 * @description Checks if the value is an error or an object (but no array, regexp, map, set or date)
 */
function isMessageObject(value: unknown): value is MessageObject {
    return typeof value === 'object'
        && value !== null
        && !Array.isArray(value)
        && ![RegExp, Map, Set, Date].some(type => value.constructor === type);
}

/**
 * @description Returns the stack trace lines without the error message itself
 */
function getStackTrace(stack: unknown): string[] {
    if (typeof stack !== 'string') {
        return [];
    }

    const lines = stack
        .split('\n')
        .map(line => line.trim())
        .filter(line => !!line)
        .slice(1);
    const truncatedLines = lines.length - maxStackTraceLines;
    const stackTrace = lines.slice(0, maxStackTraceLines);

    if (truncatedLines > 0) {
        stackTrace.push(`${truncatedLines} more line${truncatedLines <= 1 ? '' : 's'} ...`);
    }

    return stackTrace;
}

/**
 * @description Returns the chain of causes, which ends with the first cause that is no error
 */
function getCauses(cause: unknown): string[] {
    const causes: string[] = [];

    while (cause != null && causes.length < maxCauses) {
        if (!(cause instanceof Error)) {
            causes.push(toText(cause));
            break;
        }

        causes.push(formatError(cause));
        ({ cause } = cause);
    }

    return causes;
}

/**
 * @description parse an error or an object into message, context and extras
 * @returns {object} An object with message, context and extras
 */
function parseObject(object: MessageObject): LogData {
    // Own enumerable properties are logged as extras
    const { message, name, stack, cause, context, ...extras } = object;
    const text = toText(message);
    const stackTrace = getStackTrace(stack);
    const causes = getCauses(cause);

    return {
        message: name ? `${toText(name)} - ${text || '-'}` : text,
        context: {
            ...context,
            ...(stackTrace.length ? { stackTrace } : {}),
            ...(causes.length ? { causes } : {}),
        },
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

    // Monolog formatString: "[%datetime%] %channel%.%level_name%: %message% %context% %extra%\n"
    return `[${timestamp(formatString)}] ${channel}.${level.toUpperCase()}: ${logData.message || '-'} ${context} ${extras}`;
}

/**
 * @description Messages are strings or errors. Arrays and objects are no part of the API anymore,
 * but are still logged like before for callers without type checks.
 */
function parseMessage(message: unknown): LogData {
    if (isMessageObject(message)) {
        return parseObject(message);
    }

    if (Array.isArray(message)) {
        return { message: message.join(' ') };
    }

    // Missing messages are logged as '-', other values are primitives, regexps, maps, sets or dates
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return { message: message == null ? '' : String(message) };
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
    return formatMonologMessage(channel, level, parseMessage(message), meta);
}
