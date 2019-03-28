import Logger from './index';

jest.mock('./config', () => jest.fn().mockImplementation(() => ({
    generate() {
        return {
            channel: 'test',
            maxLevel: 'debug',
            levels: [
                'error',
                'info',
                'debug',
            ],
            formatter(...args) {
                return JSON.stringify(args);
            },
            plugins: [],
            outputs: {
                error: 'stderr',
                info: 'stdout',
            },
        };
    },
})));


describe('Logger', () => {
    const stdout = jest.spyOn(process.stdout, 'write');
    const stderr = jest.spyOn(process.stderr, 'write');
    const levels = ['error', 'info', 'debug'];
    const methods = [
        'start',
        'stop',
    ];

    beforeEach(() => {
        stdout.mockClear();
        stderr.mockClear();
    });

    it('should have the correct public properties', () => {
        const logger = new Logger();

        expect(logger).toHaveProperty('config.channel', 'test');
        expect(logger).toHaveProperty('config.levels', levels);
        expect(logger).toHaveProperty('config.formatter', expect.any(Function));
        expect(logger).toHaveProperty('config.plugins', expect.any(Array));
        expect(logger).toHaveProperty('timeMap', expect.any(Map));
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
        const logger = new Logger();

        logger.info('message', { meta: 'values' });

        expect(stdout).toHaveBeenCalledWith('["test","info","message",{"meta":"values"}]\n');
    });
});
