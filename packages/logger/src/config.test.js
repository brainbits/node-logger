import fs from 'fs';
import Config from './config';

jest.mock('fs');
jest.mock('path');
jest.mock('module', () => ({
    createRequireFromPath: () => () => ({
        default: () => { },
    }),
}));

process.mainModule = {
    paths: [
        '/some/root/testpackage/node_modules',
    ],
};

const packageJson = {
    name: 'testpackage',
    nodeLogger: {
        levels: [
            'error',
            'info',
            'debug',
        ],
        formatter: '@tspm/node-logger-formatter-test',
    },
};

describe('Config', () => {
    beforeEach(() => {
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue(JSON.stringify(packageJson));
    });
    it('should have the correct default properties', () => {
        const config = new Config();

        expect(config).toHaveProperty(
            'defaults.levels',
            [
                'emergency',
                'alert',
                'critical',
                'error',
                'warning',
                'notice',
                'info',
                'debug',
            ],
        );
        expect(config).toHaveProperty(
            'defaults.outputs',
            { emergency: 'stderr', warning: 'stdout' },
        );
        expect(config).toHaveProperty('defaults.maxLevel', 'info');
        expect(config).toHaveProperty('defaults.timerLevel', 'debug');
        expect(config).toHaveProperty('defaults.packageJson', 'package.json');
    });

    it('should generate a configuration', () => {
        const config = new Config();

        expect(config.generate()).toEqual({
            channel: 'testpackage',
            formatter: expect.any(Function),
            levels: ['error', 'info', 'debug'],
            maxLevel: 'info',
            outputs: { emergency: 'stderr', warning: 'stdout' },
            plugins: null,
            timerLevel: 'debug',
        });
    });
});
