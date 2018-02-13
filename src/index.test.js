import { format as dateFormat } from 'date-fns';
import { createLogger, format } from 'winston';
import { HttpError, ConnectorError, CustomError } from './errors';
import logger from './index';

jest.mock('winston');
jest.mock('date-fns');

dateFormat.mockReturnValue('2010-01-31 23:59:59');

describe('Logger', () => {
    beforeEach(() => {
        jest.restoreAllMocks();
    });

    describe('itself', () => {
        beforeEach(() => {
            logger.log('info', 'Hello, Logger');
        });

        it('should invoke createLogger from winston correctly', () => {
            expect(createLogger).toHaveBeenCalledWith({
                exitOnError: false,
                format: expect.any(Function),
                transports: expect.any(Array),
            });
        });

        it('should invoke transports.Console with the correct arguments', () => {
            expect(createLogger.mock.calls[0][0].transports).toEqual([
                {
                    args: {
                        handleExceptions: true,
                    },
                },
            ]);
        });
        describe('monolog function', () => {
            let monolog;
            beforeEach(() => {
                [[monolog]] = format.printf.mock.calls;
            });

            it('should get the correct channel name', () => {
                expect(monolog({
                    message: 'message',
                    level: 'level',
                })).toMatch('channel.LEVEL: message');
            });

            it('should return a monolog formatted message', () => {
                const info = {
                    message: 'my message',
                    level: 'debug',
                };
                expect(monolog(info)).toEqual('[2010-01-31 23:59:59] channel.DEBUG: my message [] []');
            });

            it('should handle a string in property message', () => {
                const info = {
                    message: 'this should be a string',
                    level: 'info',
                };
                expect(monolog(info)).toMatch('this should be a string');
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
                expect(monolog(info))
                    .toMatch('- [] {"type":"message","content":"this is my content","foo":"!!!!"}');
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
                expect(monolog(info))
                    .toMatch('foo bar lib message [] {"type":"message","content":"this is my content","foo":"!!!!"}');
            });

            it('should handle an error instance in property message', () => {
                const error = new Error('Expected more brain than this');
                const info = {
                    message: error,
                    level: 'info',
                };
                const received = monolog(info);
                expect(received).toMatch('[2010-01-31 23:59:59] channel.ERROR: Error - Expected more brain than this');
            });

            it('should handle the custom error HttpError properly', () => {
                const error = new HttpError('401', 'Not authorized', 'GET http://rest/api/resource', '1234-1234-1234');
                const info = {
                    message: error,
                    level: 'info',
                };
                const received = monolog(info);
                expect(received).toMatch('{"response":"401","request":"GET http://rest/api/resource","uuid":"1234-1234-1234"}');
                expect(received).toMatch('HttpError - Not authorized');
            });

            it('should handle the custom error ConnectorError properly', () => {
                const error = new ConnectorError('Fetch failed', 'GET http://rest/api/resource', '1234-1234-1234');
                const info = {
                    message: error,
                    level: 'info',
                };
                const received = monolog(info);
                expect(received).toMatch('{"request":"GET http://rest/api/resource","uuid":"1234-1234-1234"}');
                expect(received).toMatch('ConnectorError - Fetch failed');
            });

            it('should handle any unknown error (extends custom error) properly', () => {
                const error = new CustomError('Mapping failed', { foo: 'bar' });
                error.name = 'MappingError';

                const info = {
                    message: error,
                    level: 'info',
                };
                const received = monolog(info);
                expect(received).toMatch('channel.ERROR: MappingError - Mapping failed {"foo":"bar"} []');
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
                const received = monolog(info);
                expect(received).toMatch('.ERROR: Error - This is a message [] {"locations":[{"line":16,"column":5}]}');
            });

            it('should handle other variable types', () => {
                const info = {
                    message: ['my message'],
                    level: 'debug',
                };
                expect(monolog(info)).toEqual('[2010-01-31 23:59:59] channel.DEBUG: my message [] []');
            });
        });
    });
});
