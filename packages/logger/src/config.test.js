/* eslint-disable import/no-absolute-path, import/no-unresolved */
import fs from 'fs';
import loadConfiguration from './config';
import formatter from '/some/root/testpackage/node_modules/@tspm/node-logger-formatter-test';
import Plugin from '/some/root/testpackage/node_modules/@tspm/node-logger-sentry-plugin';
import packageJson from '/some/root/testpackage/package.json';

jest.mock('fs');

jest.mock(
    '/some/root/testpackage/node_modules/@tspm/node-logger-formatter-test',
    () => ({ default: jest.fn() }),
    { virtual: true },
);

jest.mock(
    '/some/root/testpackage/node_modules/@tspm/node-logger-sentry-plugin',
    () => ({ default: jest.fn() }),
    { virtual: true },
);

jest.mock('/some/root/testpackage/package.json', () => ({
    name: 'testpackage',
    nodeLogger: {
        channel: 'test-channel',
        levels: [
            'error',
            'info',
            'debug',
        ],
        outputs: {
            error: 'stdout',
        },
        formatter: '@tspm/node-logger-formatter-test',
    },
}), { virtual: true });

process.mainModule = {
    paths: [
        '/some/root/testpackage/node_modules',
    ],
};

describe('loadConfiguration', () => {
    beforeEach(() => {
        fs.existsSync.mockReturnValue(false);
    });

    describe('validation', () => {
        it('throws an error if formatter is missing', () => {
            const expectedError = new Error('Invalid formatter: No formatter found in configuration');

            expect(() => loadConfiguration()).toThrow(expectedError);
        });

        it('throws an error if levels are null', () => {
            const expectedError = new Error('Invalid levels: No levels were configured');

            expect(() => loadConfiguration({ formatter: jest.fn(), levels: null }))
                .toThrow(expectedError);
        });

        it('throws an error if levels are an empty array', () => {
            const expectedError = new Error('Invalid levels: No levels were configured');

            expect(() => loadConfiguration({ formatter: jest.fn(), levels: [] }))
                .toThrow(expectedError);
        });

        it('throws an error if no maxLevel is configured', () => {
            const expectedError = new Error('Invalid maxLevel: null');

            expect(() => loadConfiguration({ formatter: jest.fn(), maxLevel: null }))
                .toThrow(expectedError);
        });

        it('throws an error if maxLevel is no valid level', () => {
            const expectedError = new Error('Invalid maxLevel: foobar');

            expect(() => loadConfiguration({ formatter: jest.fn(), maxLevel: 'foobar' }))
                .toThrow(expectedError);
        });

        it('throws an error if no timerLevel is configured', () => {
            const expectedError = new Error('Invalid timerLevel: null');

            expect(() => loadConfiguration({ formatter: jest.fn(), timerLevel: null }))
                .toThrow(expectedError);
        });

        it('throws an error if timerLevel is no valid level', () => {
            const expectedError = new Error('Invalid timerLevel: foobar');

            expect(() => loadConfiguration({ formatter: jest.fn(), timerLevel: 'foobar' }))
                .toThrow(expectedError);
        });

        it('throws an error if no outputs were configured', () => {
            const expectedError = new Error('Invalid outputs: Outputs can only be configured for existing log levels');

            expect(() => loadConfiguration({ formatter: jest.fn(), outputs: null }))
                .toThrow(expectedError);
        });

        it('throws an error if output was configured for invalid level', () => {
            const expectedError = new Error('Invalid outputs: Outputs can only be configured for existing log levels');

            expect(() => loadConfiguration({ formatter: jest.fn(), outputs: { foobar: 'stdout' } }))
                .toThrow(expectedError);
        });

        it('throws an error if output is anything but stdout or stderr', () => {
            const expectedError = new Error('Invalid outputs: Output must be stdout or stderr');

            expect(() => loadConfiguration({ formatter: jest.fn(), outputs: { error: 'stdin' } }))
                .toThrow(expectedError);
        });
    });

    it('resolves to default configuration', () => {
        const config = loadConfiguration({ formatter: jest.fn() });

        expect(config).toMatchObject({
            channel: 'unknown',
            levels: [
                'emergency',
                'alert',
                'critical',
                'error',
                'warning',
                'notice',
                'info',
                'debug',
            ],
            maxLevel: 'info',
            outputs: {
                emergency: 'stderr',
                warning: 'stdout',
            },
            timerLevel: 'debug',
            plugins: [],
        });
    });

    describe('with package.json', () => {
        beforeEach(() => {
            fs.existsSync.mockReturnValue(true);
        });

        it('merges configuration with defaults', () => {
            const config = loadConfiguration();

            expect(config).toMatchObject({
                channel: packageJson.nodeLogger.channel,
                levels: packageJson.nodeLogger.levels,
                maxLevel: 'info',
                outputs: {
                    error: 'stdout',
                },
                timerLevel: 'debug',
                plugins: [],
                formatter: formatter.default,
            });
        });

        it('uses package name as channel if none was set explicitly', () => {
            delete packageJson.nodeLogger.channel;

            const config = loadConfiguration();

            expect(config).toMatchObject({
                channel: packageJson.name,
            });
        });

        it('prioritizes manual configuration over package.json', () => {
            const config = loadConfiguration({ channel: 'foobar' });

            expect(config).toMatchObject({
                channel: 'foobar',
            });
        });
    });

    describe('with plugins', () => {
        beforeEach(() => {
            fs.existsSync.mockReturnValue(true);
        });

        it('instantiates plugins', () => {
            const config = loadConfiguration({
                formatter: jest.fn(),
                plugins: ['@tspm/node-logger-sentry-plugin'],
            });

            expect(config.plugins).toHaveLength(1);
            expect(config.plugins[0]).toBeInstanceOf(Plugin.default);
        });
    });

    describe('environment variables', () => {
        it('are parsed correctly', () => {
            process.env.MY_TEST = 'foobar';

            const config = loadConfiguration({
                formatter: jest.fn(),
                channel: 'env(MY_TEST)',
            });

            delete process.env.MY_TEST;

            expect(config.channel).toEqual('foobar');
        });

        it('use default value if given', () => {
            const config = loadConfiguration({
                formatter: jest.fn(),
                channel: 'env(MY_TEST, baz)',
            });

            expect(config.channel).toEqual('baz');
        });

        it('throws error on missing variable', () => {
            delete process.env.MY_TEST;

            expect(() => loadConfiguration({
                formatter: jest.fn(),
                channel: 'env(MY_TEST)',
            })).toThrow(/MY_TEST/);
        });

        it('allow empty strings as valid values', () => {
            process.env.MY_TEST = '';

            const config = loadConfiguration({
                formatter: jest.fn(),
                channel: 'env(MY_TEST)',
            });

            expect(config.channel).toEqual('');
        });
    });
});
