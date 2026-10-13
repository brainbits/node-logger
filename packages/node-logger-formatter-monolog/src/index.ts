import type { LogEvent, Meta } from '@brainbits/node-logger';
import { format } from 'date-fns';

interface LogData {
    message: string;
    context?: Record<string, unknown>;
    extras?: Record<string, unknown>;
}

/**
 * Errors may carry a context, which is logged with them
 */
type ErrorWithContext = Error & { context?: Record<string, unknown> };

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

function formatError({ name, message }: Error): string {
    return `${name} - ${message || '-'}`;
}

/**
 * @description Returns the stack trace lines without the error message itself
 */
function getStackTrace(stack = ''): string[] {
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
 * @description Returns the chain of errors that caused the error
 */
function getCauses(error: Error): string[] {
    const causes: string[] = [];
    let { cause } = error;

    while (cause instanceof Error && causes.length < maxCauses) {
        causes.push(formatError(cause));
        ({ cause } = cause);
    }

    return causes;
}

/**
 * @description parse an error into message, context and extras
 * @returns {object} An object with message, context and extras
 */
function parseError(error: ErrorWithContext): LogData {
    // Own enumerable properties of the error are logged as extras
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { message, name, stack, cause, context, ...extras } = error;
    const stackTrace = getStackTrace(stack);
    const causes = getCauses(error);

    return {
        message: formatError(error),
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
 * @description Formatter function
 * @returns {string} The event formatted as monolog line
 */
export default function monolog({
    channel,
    level,
    message,
    meta,
}: LogEvent): string {
    const logData = message instanceof Error ? parseError(message) : { message };

    return formatMonologMessage(channel, level, logData, meta);
}
