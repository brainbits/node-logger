import { format } from 'date-fns';
import { HttpError, ConnectorError, CustomError } from './errors';
import monolog from './monolog';

jest.mock('winston');
jest.mock('date-fns');

format.mockReturnValue('2010-01-31 23:59:59');

describe('monolog function', () => {
    let monologger;
    beforeEach(() => {
        monologger = monolog('channel');
    });

    it('should get the correct channel name', () => {
        expect(monologger({
            message: 'message',
            level: 'level',
        })).toEqual('[2010-01-31 23:59:59] channel.LEVEL: message [] []');
    });

    it('should return a monologger formatted message', () => {
        const info = {
            message: 'my message',
            level: 'debug',
        };
        expect(monologger(info))
            .toEqual('[2010-01-31 23:59:59] channel.DEBUG: my message [] []');
    });

    it('should handle a string in property message', () => {
        const info = {
            message: 'this should be a string',
            level: 'info',
        };
        expect(monologger(info))
            .toEqual('[2010-01-31 23:59:59] channel.INFO: this should be a string [] []');
    });

    it('should handle an object in property message ', () => {
        const info = {
            message: {
                type: 'message',
                content: 'this is my content',
                foo: '!!!!',
            },
            level: 'info',
        };
        expect(monologger(info))
            .toEqual('[2010-01-31 23:59:59] channel.INFO: - [] {"type":"message","content":"this is my content","foo":"!!!!"}');
    });

    it('should handle an object in property message', () => {
        const info = {
            message: {
                type: 'message',
                content: 'this is my content',
                foo: '!!!!',
                message: 'foo bar lib message',
            },
            level: 'info',
        };
        expect(monologger(info))
            .toEqual('[2010-01-31 23:59:59] channel.INFO: foo bar lib message [] {"type":"message","content":"this is my content","foo":"!!!!"}');
    });

    it('should handle an error instance in property message', () => {
        const error = new Error('Expected more brain than this');
        const info = {
            message: error,
            level: 'info',
        };
        const received = monologger(info);
        expect(received)
            .toEqual('[2010-01-31 23:59:59] channel.ERROR: Error - Expected more brain than this [] []');
    });

    it('should handle the custom error HttpError properly', () => {
        const error = new HttpError('Not authorized', null, 'GET http://rest/api/resource', '401', '1234-1234-1234');
        const info = {
            message: error,
            level: 'info',
        };
        const received = monologger(info);
        expect(received)
            .toEqual('[2010-01-31 23:59:59] channel.ERROR: HttpError - Not authorized [] {"statusCode":"401","requestUrl":"GET http://rest/api/resource","requestId":"1234-1234-1234"}');
    });

    it('should handle the custom error ConnectorError properly', () => {
        const error = new ConnectorError('Fetch failed', null, 'GET http://rest/api/resource', '1234-1234-1234');
        const info = {
            message: error,
            level: 'info',
        };
        const received = monologger(info);
        expect(received)
            .toEqual('[2010-01-31 23:59:59] channel.ERROR: ConnectorError - Fetch failed [] {"requestUrl":"GET http://rest/api/resource","requestId":"1234-1234-1234"}');
    });

    it('should handle any unknown error (extends custom error) properly', () => {
        const error = new CustomError('Mapping failed', { foo: 'bar' });
        error.name = 'MappingError';

        const info = {
            message: error,
            level: 'info',
        };
        const received = monologger(info);
        expect(received)
            .toEqual('[2010-01-31 23:59:59] channel.ERROR: MappingError - Mapping failed {"foo":"bar"} []');
    });

    it('should handle unknown error types', () => {
        const message = 'This is a message';
        const locations = [{ line: 16, column: 5 }];
        const error = new Error(`${message}`);
        error.locations = locations;
        const info = {
            message: error,
            level: 'error',
        };
        const received = monologger(info);
        expect(received)
            .toEqual('[2010-01-31 23:59:59] channel.ERROR: Error - This is a message [] {"locations":[{"line":16,"column":5}]}');
    });

    it('should handle unknown error types with metadata', () => {
        const message = 'Here are some metadata';
        const error = new Error(`${message}`);
        const info = {
            message: error,
            level: 'error',
            metadata: {
                file: 'src/monolog.js:16:5',
            },
        };
        const received = monologger(info);
        expect(received)
            .toEqual('[2010-01-31 23:59:59] channel.ERROR: Error - Here are some metadata {"metadata.context":{"file":"src/monolog.js:16:5"}} []');
    });

    it('should handle other variable types', () => {
        const info = {
            message: ['my message'],
            level: 'debug',
        };
        expect(monologger(info))
            .toEqual('[2010-01-31 23:59:59] channel.DEBUG: my message [] []');
    });
});
