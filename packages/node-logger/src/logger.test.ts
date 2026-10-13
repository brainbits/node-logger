import { beforeEach, describe, expect, it, vi } from 'vitest';
import loadConfiguration from './config.js';
import Logger from './logger.js';
import { logLevels } from './schema.js';
import type { LogLevel, ResolvedConfig } from './types.js';

vi.mock('./config.js', () => ({
    default: vi.fn(),
}));

describe('Logger', () => {
    const defaultConfig: ResolvedConfig = {
        channel: 'test',
        maxLevel: 'info',
        timerLevel: 'debug',
        formatter(event) {
            return JSON.stringify(event);
        },
        plugins: [],
        outputs: {
            emergency: 'stderr',
            warning: 'stdout',
        },
    };

    beforeEach(() => {
        vi.mocked(loadConfiguration).mockReturnValue(defaultConfig);
    });

    it.each(logLevels)('should log with level `%s`', (level) => {
        const logger = new Logger();
        const log = vi.spyOn(logger, 'log');

        logger[level]('message', { foo: 'bar' });

        expect(log).toHaveBeenCalledWith(level, 'message', { foo: 'bar' });
    });

    it('should pass the event to the output', () => {
        const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
        const logger = new Logger();

        logger.log('info', 'message', { meta: 'values' });

        expect(stdout).toHaveBeenCalledWith(
            `${JSON.stringify({ channel: 'test', level: 'info', message: 'message', meta: { meta: 'values' } })}\n`,
        );
    });

    it('should throw an error for unknown levels', () => {
        const plugin = { log: vi.fn() };
        vi.mocked(loadConfiguration).mockReturnValue({ ...defaultConfig, plugins: [plugin] });
        const logger = new Logger();

        expect(() => logger.log('warn' as LogLevel, 'message')).toThrow('Unknown log level "warn"');
        expect(plugin.log).not.toHaveBeenCalled();
    });

    it('should use the output of the next more severe level that has one', () => {
        const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
        const stderr = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
        const logger = new Logger();

        logger.critical('critical');
        logger.notice('notice');

        expect(stderr).toHaveBeenCalledWith(expect.stringContaining('"level":"critical"'));
        expect(stdout).toHaveBeenCalledWith(expect.stringContaining('"level":"notice"'));
    });

    it('should not write events of levels above the maxLevel', () => {
        const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
        const logger = new Logger();

        logger.debug('message');

        expect(stdout).not.toHaveBeenCalled();
    });

    it('should log the elapsed time with the timer level', () => {
        const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
        vi.mocked(loadConfiguration).mockReturnValue({ ...defaultConfig, maxLevel: 'debug' });
        const logger = new Logger();

        logger.start('timer');
        logger.stop('timer', { foo: 'bar' });
        logger.stop('timer');

        expect(stdout).toHaveBeenNthCalledWith(1, expect.stringMatching(
            /^\{"channel":"test","level":"debug","message":"timer","meta":\{"foo":"bar","timeMs":\d+\}\}\n$/,
        ));
        expect(stdout).toHaveBeenNthCalledWith(2, expect.stringContaining('"timeMs":null'));
    });

    it('should pass events to plugins, even if they are not written', () => {
        const plugin = { log: vi.fn() };
        vi.mocked(loadConfiguration).mockReturnValue({ ...defaultConfig, plugins: [plugin, {}] });
        const logger = new Logger();

        logger.debug('message', { meta: 'values' });

        expect(plugin.log).toHaveBeenCalledWith({
            channel: 'test',
            level: 'debug',
            message: 'message',
            meta: { meta: 'values' },
        });
    });
});
