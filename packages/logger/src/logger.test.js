import loadConfiguration from './config';
import Logger from './logger';

jest.mock('./config', () => jest.fn(() => ({
    channel: 'test',
    maxLevel: 'debug',
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
})));

const defaultConfig = loadConfiguration();

describe('Logger', () => {
    const stdout = jest.spyOn(process.stdout, 'write').mockImplementation(() => null);
    const stderr = jest.spyOn(process.stderr, 'write').mockImplementation(() => null);
    const levels = ['error', 'info', 'debug'];
    const methods = [
        'start',
        'stop',
    ];

    beforeEach(() => {
        stdout.mockClear();
        stderr.mockClear();
    });

    it.each(levels)('should have generate level `%s` as public method', (level) => {
        const logger = new Logger();
        expect(logger).toHaveProperty(level, expect.any(Function));
    });

    it.each(methods)('should have public method `%s`', (method) => {
        const logger = new Logger();
        expect(logger).toHaveProperty(method, expect.any(Function));
    });

    it('should pass the correct objects to the output', () => {
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

    it('should pass event to all plugins', () => {
        const givenPlugin = { log: jest.fn() };
        const givenMessage = 'message';
        const givenMeta = { meta: 'values' };
        const expectedEvent = {
            channel: defaultConfig.channel,
            level: 'info',
            message: givenMessage,
            meta: givenMeta,
        };

        loadConfiguration.mockReturnValue({ ...defaultConfig, plugins: [givenPlugin] });
        const logger = new Logger();

        logger.info(givenMessage, givenMeta);

        expect(givenPlugin.log).toHaveBeenCalledWith(expectedEvent);
    });
});
