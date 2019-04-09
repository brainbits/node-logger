import { format } from 'date-fns';
import monolog from './index';

jest.mock('date-fns');
format.mockReturnValue('2010-01-31 23:59:59');

function createEvent(channel, level, message, meta) {
    return {
        channel,
        level,
        message,
        meta,
    };
}

describe('monolog function', () => {
    let error;
    beforeEach(() => {
        error = new Error('This is a fake error');
        error.stack = `Error - This is a fake error
            at Object.blah (/src/blah.js:18:28)
            at Object.foo (/src/foo.js:18:28)
        `;
    });

    it('should get the correct channel name', () => {
        expect(monolog(createEvent('tests', 'level', { message: 'message' })))
            .toEqual('[2010-01-31 23:59:59] tests.LEVEL: message [] []');
    });

    it('should return a log formatted message', () => {
        expect(monolog(createEvent('tests', 'debug', { message: 'my message' })))
            .toEqual('[2010-01-31 23:59:59] tests.DEBUG: my message [] []');
    });

    it('should handle a string in property message', () => {
        expect(monolog(createEvent('tests', 'info', { message: 'this should be a string' })))
            .toEqual('[2010-01-31 23:59:59] tests.INFO: this should be a string [] []');
    });

    it('should handle an object', () => {
        const message = {
            type: 'message',
            content: 'this is my content',
            foo: '!!!!',
            message: 'foo bar lib message',
        };
        expect(monolog(createEvent('tests', 'info', message)))
            .toEqual('[2010-01-31 23:59:59] tests.INFO: foo bar lib message [] {"type":"message","content":"this is my content","foo":"!!!!"}');
    });

    it('should handle an error', () => {
        expect(monolog(createEvent('tests', 'error', error)))
            .toEqual('[2010-01-31 23:59:59] tests.ERROR: Error - This is a fake error {"stackTrace":["at Object.blah (/src/blah.js:18:28)","at Object.foo (/src/foo.js:18:28)"]} []');
    });

    it('should handle unknown error types', () => {
        error.locations = [{ line: 16, column: 5 }];
        expect(monolog(createEvent('tests', 'error', error)))
            .toEqual('[2010-01-31 23:59:59] tests.ERROR: Error - This is a fake error {"stackTrace":["at Object.blah (/src/blah.js:18:28)","at Object.foo (/src/foo.js:18:28)"]} {"locations":[{"line":16,"column":5}]}');
    });

    it('should handle unknown error types with metadata', () => {
        const meta = { file: 'src/monolog.js:16:5' };
        expect(monolog(createEvent('tests', 'error', error, meta)))
            .toEqual('[2010-01-31 23:59:59] tests.ERROR: Error - This is a fake error {"stackTrace":["at Object.blah (/src/blah.js:18:28)","at Object.foo (/src/foo.js:18:28)"],"file":"src/monolog.js:16:5"} []');
    });

    it('should handle other variable types', () => {
        const info = ['my message'];

        expect(monolog(createEvent('tests', 'debug', info)))
            .toEqual('[2010-01-31 23:59:59] tests.DEBUG: my message [] []');
    });

    describe('Stacktrace handling', () => {
        it('should not add a stacktrace if it is undefined', () => {
            error.stack = undefined;
            expect(monolog(createEvent('tests', 'error', error)))
                .not.toContain('{"stackTrace":["at ');
        });

        it('should not add the error itself to the stacktrace', () => {
            expect(monolog(createEvent('tests', 'error', error)))
                .not.toContain('"Error - This is a fake error"');
        });

        it('should handle a stacktrace in error types', () => {
            expect(monolog(createEvent('tests', 'error', error)))
                .toEqual('[2010-01-31 23:59:59] tests.ERROR: Error - This is a fake error {"stackTrace":["at Object.blah (/src/blah.js:18:28)","at Object.foo (/src/foo.js:18:28)"]} []');
        });

        it('should take a maximum of 10 lines in a stacktrace and add info about truncated lines', () => {
            error = new Error('This is a huuuuuuuuuuuuuuge stacktrace');
            error.stack = `Error - This is a huuuuuuuuuuuuuuge stacktrace
                at Object.blah (/src/blah.js:18:28)
                at Object.foo (/src/foo.js:18:28)
                at Object.bar (/src/bar.js:18:28)
                at Object.lib (/src/lib.js:18:28)
                at Object.blubb (/src/blubb.js:18:28)
                at Object.fizz (/src/fizz.js:18:28)
                at Object.buzz (/src/buzz.js:18:28)
                at Object.frizzle (/src/frizzle.js:18:28)
                at Object.guzzle (/src/guzzle.js:18:28)
                at Object.gizzle (/src/gizzle.js:18:28)
                at Object.should.not.be.logged (/src/should.not.be.logged.js:18:28)
                at Object.should.not.be.logged (/src/should.not.be.logged.js:18:28)
                at Object.should.not.be.logged (/src/should.not.be.logged.js:18:28)
                at Object.should.not.be.logged (/src/should.not.be.logged.js:18:28)
                at Object.should.not.be.logged (/src/should.not.be.logged.js:18:28)`;
            expect(monolog(createEvent('tests', 'error', error))).not.toContain('at Object.should.not.be.logged');
            expect(monolog(createEvent('tests', 'error', error))).toContain('5 more lines ...');
        });

        it('should use singular for one truncated line', () => {
            error = new Error('This is a huuuuuuuuuuuuuuge stacktrace');
            error.stack = `Error - This is a huuuuuuuuuuuuuuge stacktrace
                at Object.blah (/src/blah.js:18:28)
                at Object.foo (/src/foo.js:18:28)
                at Object.bar (/src/bar.js:18:28)
                at Object.lib (/src/lib.js:18:28)
                at Object.blubb (/src/blubb.js:18:28)
                at Object.fizz (/src/fizz.js:18:28)
                at Object.buzz (/src/buzz.js:18:28)
                at Object.frizzle (/src/frizzle.js:18:28)
                at Object.guzzle (/src/guzzle.js:18:28)
                at Object.gizzle (/src/gizzle.js:18:28)
                at Object.should.not.be.logged (/src/should.not.be.logged.js:18:28)`;
            expect(monolog(createEvent('tests', 'error', error))).not.toContain('at Object.should.not.be.logged');
            expect(monolog(createEvent('tests', 'error', error))).toContain('1 more line ...');
        });

        it('should not use truncated line feature if it is shorter than 10 lines', () => {
            error = new Error('This is a huuuuuuuuuuuuuuge stacktrace');
            error.stack = `Error - This is a huuuuuuuuuuuuuuge stacktrace
                at Object.blah (/src/blah.js:18:28)
                at Object.foo (/src/foo.js:18:28)
                at Object.bar (/src/bar.js:18:28)
                at Object.lib (/src/lib.js:18:28)
                at Object.blubb (/src/blubb.js:18:28)
                at Object.fizz (/src/fizz.js:18:28)
                at Object.buzz (/src/buzz.js:18:28)
                at Object.frizzle (/src/frizzle.js:18:28)
                at Object.guzzle (/src/guzzle.js:18:28)
                at Object.gizzle (/src/gizzle.js:18:28)`;
            expect(monolog(createEvent('tests', 'error', error))).not.toContain('...');
        });
    });
});
