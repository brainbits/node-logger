import { createLogger } from 'winston';
import logger from './logger';

jest.mock('winston');


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
    });
});
