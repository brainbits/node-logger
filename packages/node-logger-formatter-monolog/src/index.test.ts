import type { LogLevel, LogMessage, Meta } from '@brainbits/node-logger';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import monolog from './index.js';

function createEvent(channel: string, level: LogLevel, message: LogMessage, meta?: Meta) {
    return {
        channel,
        level,
        message,
        meta,
    };
}

function createStack(message: string, lines: number): string {
    return [
        message,
        ...Array.from({ length: lines }, (_, index) => `    at Object.line${index + 1} (/src/line${index + 1}.js:18:28)`),
    ].join('\n');
}

describe('monolog function', () => {
    let error: Error & { locations?: unknown; context?: Record<string, unknown> };

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2010-01-31T23:59:59'));

        error = new Error('This is a fake error');
        error.stack = `Error - This is a fake error
            at Object.blah (/src/blah.js:18:28)
            at Object.foo (/src/foo.js:18:28)
        `;
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should format a message with channel and level', () => {
        expect(monolog(createEvent('tests', 'debug', 'my message')))
            .toEqual('[2010-01-31 23:59:59] tests.DEBUG: my message [] []');
    });

    it('should add the meta to the context', () => {
        expect(monolog(createEvent('tests', 'info', 'my message', { foo: 'bar' })))
            .toEqual('[2010-01-31 23:59:59] tests.INFO: my message {"foo":"bar"} []');
    });

    it('should use a dash for an empty message', () => {
        expect(monolog(createEvent('tests', 'info', '')))
            .toEqual('[2010-01-31 23:59:59] tests.INFO: - [] []');
    });

    it('should handle an error', () => {
        expect(monolog(createEvent('tests', 'error', error)))
            .toEqual('[2010-01-31 23:59:59] tests.ERROR: Error - This is a fake error {"stackTrace":["at Object.blah (/src/blah.js:18:28)","at Object.foo (/src/foo.js:18:28)"]} []');
    });

    it('should add own properties of an error as extras', () => {
        error.locations = [{ line: 16, column: 5 }];
        expect(monolog(createEvent('tests', 'error', error)))
            .toEqual('[2010-01-31 23:59:59] tests.ERROR: Error - This is a fake error {"stackTrace":["at Object.blah (/src/blah.js:18:28)","at Object.foo (/src/foo.js:18:28)"]} {"locations":[{"line":16,"column":5}]}');
    });

    it('should add the context of an error and the meta to the context', () => {
        error.context = { orderId: 42 };
        const meta = { file: 'src/monolog.js:16:5' };
        expect(monolog(createEvent('tests', 'error', error, meta)))
            .toEqual('[2010-01-31 23:59:59] tests.ERROR: Error - This is a fake error {"orderId":42,"stackTrace":["at Object.blah (/src/blah.js:18:28)","at Object.foo (/src/foo.js:18:28)"],"file":"src/monolog.js:16:5"} []');
    });

    it('should add the causes of an error to the context', () => {
        const rootCause = new TypeError('fetch failed');
        const cause = new Error('Request failed', { cause: rootCause });
        error = new Error('Loading the order failed', { cause });
        error.stack = undefined;

        expect(monolog(createEvent('tests', 'error', error)))
            .toEqual('[2010-01-31 23:59:59] tests.ERROR: Error - Loading the order failed {"causes":["Error - Request failed","TypeError - fetch failed"]} []');
    });

    it('should use the name of custom errors', () => {
        class HttpError extends Error {
            name = 'HttpError';
        }
        const httpError = new HttpError('Not found');
        httpError.stack = undefined;

        expect(monolog(createEvent('tests', 'error', httpError)))
            .toEqual('[2010-01-31 23:59:59] tests.ERROR: HttpError - Not found [] []');
    });

    describe('Stacktrace handling', () => {
        it('should not add a stacktrace if it is undefined', () => {
            error.stack = undefined;
            expect(monolog(createEvent('tests', 'error', error)))
                .toEqual('[2010-01-31 23:59:59] tests.ERROR: Error - This is a fake error [] []');
        });

        it('should not add the error itself to the stacktrace', () => {
            expect(monolog(createEvent('tests', 'error', error)))
                .not.toContain('"Error - This is a fake error"');
        });

        it('should take a maximum of 10 lines in a stacktrace and add info about truncated lines', () => {
            error.stack = createStack('Error - This is a huuuuuuuuuuuuuuge stacktrace', 15);

            const formatted = monolog(createEvent('tests', 'error', error));

            expect(formatted).toContain('line10');
            expect(formatted).not.toContain('line11');
            expect(formatted).toContain('5 more lines ...');
        });

        it('should use singular for one truncated line', () => {
            error.stack = createStack('Error - This is a huuuuuuuuuuuuuuge stacktrace', 11);

            expect(monolog(createEvent('tests', 'error', error))).toContain('1 more line ...');
        });

        it('should not use truncated line feature if it is not longer than 10 lines', () => {
            error.stack = createStack('Error - This is a huuuuuuuuuuuuuuge stacktrace', 10);

            expect(monolog(createEvent('tests', 'error', error))).not.toContain('...');
        });
    });
});
