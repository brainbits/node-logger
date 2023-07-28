import { CustomError, ConnectorError, HttpError } from './index';

describe('Error types:', () => {
    describe('CustomError', () => {
        const error = new CustomError('This is a custom error', { context: 'foo' }, new Error('original error'));

        it('should extending class Error', () => {
            expect(error).toBeInstanceOf(Error);
        });

        it('should take a message', () => {
            expect(error.message).toEqual('This is a custom error');
        });

        it('should take a context', () => {
            expect(error.context).toEqual({ context: 'foo' });
        });

        it('should take a original error', () => {
            expect(error.origin).toEqual(new Error('original error'));
        });

        it('should have a property stack with a stack trace in it', () => {
            expect(error.stack).toContain('describe');
        });

        it('should execute captureStackTrace() from class Error', () => {
            expect(CustomError.captureStackTrace).toBeInstanceOf(Function);
        });
    });

    describe('HttpError', () => {
        const error = new HttpError('Not found', { context: 'foo' }, 'GET https://rest/api/resource', 404, '1234-1234-1234', new Error('origin'));

        it('should extending class CustomError', () => {
            expect(error).toBeInstanceOf(CustomError);
        });

        it('should have a statusCode', () => {
            expect(error.statusCode).toBe(404);
        });

        it('should have a requestUrl', () => {
            expect(error.requestUrl).toBe('GET https://rest/api/resource');
        });

        it('should have a requestId', () => {
            expect(error.requestId).toBe('1234-1234-1234');
        });

        it('should have origin', () => {
            expect(error.origin).toEqual(new Error('origin'));
        });

        it('should have a context', () => {
            expect(error.context).toEqual({ context: 'foo' });
        });
    });

    describe('ConnectorError', () => {
        const error = new ConnectorError('Fetch failed', { context: 'foo' }, 'GET https://rest/api/resource', '1234-1234-1234', new Error('origin'));

        it('should extending class CustomError', () => {
            expect(error).toBeInstanceOf(CustomError);
        });

        it('should have a requestUrl', () => {
            expect(error.requestUrl).toBe('GET https://rest/api/resource');
        });

        it('should have a requestId', () => {
            expect(error.requestId).toBe('1234-1234-1234');
        });

        it('should have origin', () => {
            expect(error.origin).toEqual(new Error('origin'));
        });

        it('should have a context', () => {
            expect(error.context).toEqual({ context: 'foo' });
        });
    });
});
