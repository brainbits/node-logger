import { format } from 'date-fns';
import logger, { createLogger } from './logger';
import config from './config';

jest.mock('date-fns');
format.mockReturnValue('2010-01-31 23:59:59');

const spy = {
    stdout: jest.spyOn(process.stdout, 'write'),
    stderr: jest.spyOn(process.stderr, 'write'),
};

describe('Logger', () => {
    beforeEach(() => {
        process.hrtime = jest.fn();
    });

    afterEach(() => {
        process.hrtime.mockRestore();
        spy.stdout.mockClear();
        spy.stderr.mockClear();
    });

    it('should return default logger correct methods', () => {
        expect.assertions(16);
        Object.keys(config.levels).forEach((level) => {
            expect(logger).toHaveProperty(level);
            expect(logger[level]).toBeInstanceOf(Function);
        });
    });

    it('should have a timer function', () => {
        process.hrtime.mockReturnValue([0, 0]);
        logger.start('timer');

        process.hrtime.mockReturnValue([5, 600000]);
        logger.stop('timer', { foo: 'bar' });

        expect(spy.stdout)
            .toHaveBeenCalledWith('[2010-01-31 23:59:59] tests.DEBUG: timer {"meta.context":{"foo":"bar","timeMs":5001}} []\n');
    });

    it('should return timer result null if there was no message set', () => {
        logger.stop('timerShouldBeNull');
        expect(spy.stdout)
            .toHaveBeenCalledWith('[2010-01-31 23:59:59] tests.DEBUG: timerShouldBeNull {"meta.context":{"timeMs":null}} []\n');
    });

    it('should behave properly if max logging level set to another level', () => {
        const instance = createLogger({
            maxLevel: 'notice',
            channel: 'noticeChannel',
        });

        instance.debug('hide debug to me');
        instance.info('hide infos');
        instance.notice('show notice to me');
        instance.alert('show alert to me');

        expect(spy.stdout).toHaveBeenCalledTimes(1);
        expect(spy.stderr).toHaveBeenCalledTimes(1);
        expect(spy.stdout).toHaveBeenCalledWith('[2010-01-31 23:59:59] noticeChannel.NOTICE: show notice to me [] []\n');
        expect(spy.stderr).toHaveBeenCalledWith('[2010-01-31 23:59:59] noticeChannel.ALERT: show alert to me [] []\n');
        expect(spy.stdout).not.toHaveBeenCalledWith('[2010-01-31 23:59:59] noticeChannel.INFO: hide debug to me [] []\n');
        expect(spy.stdout).not.toHaveBeenCalledWith('[2010-01-31 23:59:59] noticeChannel.DEBUG: hide infos [][]\n');
    });

    it('should take default as fallback if createLogger was invoked without options', () => {
        const instance = createLogger();
        instance.info('Yes, yes');
        instance.debug('No, no');
        expect(spy.stdout).toHaveBeenCalledWith('[2010-01-31 23:59:59] @tspm/node-logger.INFO: Yes, yes [] []\n');
        expect(spy.stdout).not.toHaveBeenCalledWith('[2010-01-31 23:59:59] @tspm/node-logger.DEBUG: No, No [] []\n');
    });

    it('should check if output is a stream', () => {

    });
});
