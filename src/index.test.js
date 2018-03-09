import * as index from './index';
import { ConnectorError, CustomError, HttpError } from './errors';

describe('Index', () => {
    it('should export correctly', () => {
        expect(index).toEqual({
            ConnectorError,
            CustomError,
            HttpError,
            logger: {
                alert: expect.any(Function),
                critical: expect.any(Function),
                debug: expect.any(Function),
                emergency: expect.any(Function),
                error: expect.any(Function),
                info: expect.any(Function),
                notice: expect.any(Function),
                start: expect.any(Function),
                stop: expect.any(Function),
                warning: expect.any(Function),
            },
        });
    });
});
