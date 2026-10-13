import { describe, expect, it, vi } from 'vitest';
import loadConfiguration from './config.js';
import Logger from './logger.js';
import type { ResolvedConfig } from './types.js';

vi.mock('./config.js', () => ({
    default: vi.fn((): ResolvedConfig => ({
        channel: 'test',
        maxLevel: 'debug',
        timerLevel: 'debug',
        levels: [
            'error',
            'info',
            'debug',
        ],
        formatter(event) {
            return JSON.stringify(event);
        },
        plugins: [],
        outputs: {
            error: 'stderr',
            info: 'stdout',
        },
    })),
}));

const defaultConfig = loadConfiguration();

describe('Logger', () => {
    const levels = ['error', 'info', 'debug'];
    const methods = [
        'start',
        'stop',
    ];

    it.each(levels)('should have generate level `%s` as public method', (level) => {
        const logger = new Logger();
        expect(logger).toHaveProperty(level, expect.any(Function));
    });

    it.each(methods)('should have public method `%s`', (method) => {
        const logger = new Logger();
        expect(logger).toHaveProperty(method, expect.any(Function));
    });

    it('should pass the correct objects to the output', () => {
        const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
        const givenMessage = 'message';
        const givenMeta = { meta: 'values' };
        const expectedEvent = {
            channel: defaultConfig.channel,
            level: 'info',
            message: givenMessage,
            meta: givenMeta,
        };
        const logger = new Logger();

        logger.info(givenMessage, givenMeta);

        expect(stdout).toHaveBeenCalledWith(`${JSON.stringify(expectedEvent)}\n`);
    });

    it('should log the elapsed time with the timer level', () => {
        const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
        const logger = new Logger();

        logger.start('timer');
        logger.stop('timer', { foo: 'bar' });

        expect(stdout).toHaveBeenCalledWith(expect.stringMatching(
            /^\{"channel":"test","level":"debug","message":"timer","meta":\{"foo":"bar","timeMs":\d+\}\}\n$/,
        ));
    });

    it('should pass event to all plugins', () => {
        vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
        const givenPlugin = { log: vi.fn() };
        const givenMessage = 'message';
        const givenMeta = { meta: 'values' };
        const expectedEvent = {
            channel: defaultConfig.channel,
            level: 'info',
            message: givenMessage,
            meta: givenMeta,
        };

        vi.mocked(loadConfiguration).mockReturnValue({ ...defaultConfig, plugins: [givenPlugin] });
        const logger = new Logger();

        logger.info(givenMessage, givenMeta);

        expect(givenPlugin.log).toHaveBeenCalledWith(expectedEvent);
    });
});
