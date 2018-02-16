import { format } from 'date-fns';
import { HttpError, ConnectorError, CustomError } from './errors';
import monolog from './monolog';

jest.mock('date-fns');
format.mockReturnValue('2010-01-31 23:59:59');

describe('monolog function', () => {
    it('should get the correct channel name', () => {
        expect(monolog('tests', 'level', { message: 'message' }))
            .toEqual('[2010-01-31 23:59:59] tests.LEVEL: message [] []');
    });

    it('should return a log formatted message', () => {
        expect(monolog('tests', 'debug', { message: 'my message' }))
            .toEqual('[2010-01-31 23:59:59] tests.DEBUG: my message [] []');
    });

    it('should handle a string in property message', () => {
        expect(monolog('tests', 'info', { message: 'this should be a string' }))
            .toEqual('[2010-01-31 23:59:59] tests.INFO: this should be a string [] []');
    });

    it('should handle an object', () => {
        const message = {
            type: 'message',
            content: 'this is my content',
            foo: '!!!!',
            message: 'foo bar lib message',
        };
        expect(monolog('tests', 'info', message))
            .toEqual('[2010-01-31 23:59:59] tests.INFO: foo bar lib message [] {"type":"message","content":"this is my content","foo":"!!!!"}');
    });

    it('should handle an error', () => {
        const message = new Error('Expected more brain than this');

        expect(monolog('tests', 'error', message))
            .toEqual('[2010-01-31 23:59:59] tests.ERROR: Error - Expected more brain than this [] []');
    });

    it('should handle the custom error HttpError properly', () => {
        const message = new HttpError('Not authorized', null, 'GET http://rest/api/resource', '401', '1234-1234-1234');

        expect(monolog('tests', 'error', message))
            .toEqual('[2010-01-31 23:59:59] tests.ERROR: HttpError - Not authorized [] {"statusCode":"401","requestUrl":"GET http://rest/api/resource","requestId":"1234-1234-1234"}');
    });

    it('should handle the custom error ConnectorError properly', () => {
        const message = new ConnectorError('Fetch failed', null, 'GET http://rest/api/resource', '1234-1234-1234');

        expect(monolog('tests', 'error', message))
            .toEqual('[2010-01-31 23:59:59] tests.ERROR: ConnectorError - Fetch failed [] {"requestUrl":"GET http://rest/api/resource","requestId":"1234-1234-1234"}');
    });

    it('should handle any unknown error (extends custom error) properly', () => {
        const error = new CustomError('Mapping failed', { foo: 'bar' });
        error.name = 'MappingError';

        expect(monolog('tests', 'error', error))
            .toEqual('[2010-01-31 23:59:59] tests.ERROR: MappingError - Mapping failed {"foo":"bar"} []');
    });

    it('should handle unknown error types', () => {
        const message = 'This is a message';
        const locations = [{ line: 16, column: 5 }];
        const error = new Error(`${message}`);
        error.locations = locations;

        expect(monolog('tests', 'error', error))
            .toEqual('[2010-01-31 23:59:59] tests.ERROR: Error - This is a message [] {"locations":[{"line":16,"column":5}]}');
    });

    it('should handle unknown error types with metadata', () => {
        const error = new Error('Here are some metadata');
        const meta = {
            file: 'src/monolog.js:16:5',
        };
        expect(monolog('tests', 'error', error, meta))
            .toEqual('[2010-01-31 23:59:59] tests.ERROR: Error - Here are some metadata {"meta.context":{"file":"src/monolog.js:16:5"}} []');
    });

    it('should handle other variable types', () => {
        const info = ['my message'];

        expect(monolog('tests', 'debug', info))
            .toEqual('[2010-01-31 23:59:59] tests.DEBUG: my message [] []');
    });
});
