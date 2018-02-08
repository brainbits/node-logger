import { CustomError, ConnectorError, HttpError } from './errors';

describe('Error types:', () => {
    describe('CustomError', () => {
        const error = new CustomError('This is a custom error');

        it('should extending class Error', () => {
            expect(error).toBeInstanceOf(Error);
        });

        it('should take a message', () => {
            expect(error.message).toEqual('This is a custom error');
        });

        it('should have a property stack with a stack trace in it', () => {
            expect(error.stack).toContain('Suite.describe');
        });

        it('should execute captureStackTrace() from class Error', () => {
            expect(CustomError.captureStackTrace).toBeInstanceOf(Function);
        });
    });

    describe('HttpError', () => {
        const error = new HttpError(404, 'Not found', 'GET https://rest/api/resource', '1234-1234-1234');
        it('should extending class CustomError', () => {
            expect(error).toBeInstanceOf(CustomError);
        });
    });

    describe('ConnectorError', () => {
        const error = new ConnectorError('Fetch failed', 'GET https://rest/api/resource', '1234-1234-1234');
        it('should extending class CustomError', () => {
            expect(error).toBeInstanceOf(CustomError);
        });
    });
});
