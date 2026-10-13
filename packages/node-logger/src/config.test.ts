import fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import loadConfiguration from './config.js';
import type { Config, LogLevel, Output } from './types.js';

let root: string;

/**
 * Creates a project with a package.json and installed formatter and plugin packages (ES modules)
 */
function createProject(name: string, packageJson: Record<string, unknown>): string {
    const projectDir = join(root, name);
    const writeModule = (moduleName: string, source: string) => {
        const moduleDir = join(projectDir, 'node_modules', moduleName);
        fs.mkdirSync(moduleDir, { recursive: true });
        fs.writeFileSync(join(moduleDir, 'package.json'), JSON.stringify({ type: 'module', exports: './index.js' }));
        fs.writeFileSync(join(moduleDir, 'index.js'), source);
    };

    fs.mkdirSync(projectDir, { recursive: true });
    fs.writeFileSync(join(projectDir, 'package.json'), JSON.stringify(packageJson));
    writeModule('test-formatter', 'export default function testFormatter() { return \'formatted\'; }');
    writeModule('test-plugin', 'export default class TestPlugin { constructor(config) { this.config = config; } }');

    return projectDir;
}

describe('loadConfiguration', () => {
    const formatter = vi.fn(() => '');

    beforeAll(() => {
        root = fs.mkdtempSync(join(tmpdir(), 'node-logger-'));
        fs.mkdirSync(join(root, 'no-package'));
    });

    afterAll(() => {
        fs.rmSync(root, { recursive: true, force: true });
    });

    beforeEach(() => {
        vi.spyOn(process, 'cwd').mockReturnValue(join(root, 'no-package'));
    });

    describe('validation', () => {
        it('throws an error if formatter is missing', () => {
            const expectedError = new Error('Invalid formatter: No formatter found in configuration');

            expect(() => loadConfiguration()).toThrow(expectedError);
        });

        it('throws an error if levels are null', () => {
            const expectedError = new Error('Invalid levels: No levels were configured');

            expect(() => loadConfiguration({ formatter, levels: null as unknown as LogLevel[] }))
                .toThrow(expectedError);
        });

        it('throws an error if levels are an empty array', () => {
            const expectedError = new Error('Invalid levels: No levels were configured');

            expect(() => loadConfiguration({ formatter, levels: [] }))
                .toThrow(expectedError);
        });

        it('throws an error if no maxLevel is configured', () => {
            const expectedError = new Error('Invalid maxLevel: null');

            expect(() => loadConfiguration({ formatter, maxLevel: null as unknown as LogLevel }))
                .toThrow(expectedError);
        });

        it('throws an error if maxLevel is no valid level', () => {
            const expectedError = new Error('Invalid maxLevel: foobar');

            expect(() => loadConfiguration({ formatter, maxLevel: 'foobar' as LogLevel }))
                .toThrow(expectedError);
        });

        it('throws an error if no timerLevel is configured', () => {
            const expectedError = new Error('Invalid timerLevel: null');

            expect(() => loadConfiguration({ formatter, timerLevel: null as unknown as LogLevel }))
                .toThrow(expectedError);
        });

        it('throws an error if timerLevel is no valid level', () => {
            const expectedError = new Error('Invalid timerLevel: foobar');

            expect(() => loadConfiguration({ formatter, timerLevel: 'foobar' as LogLevel }))
                .toThrow(expectedError);
        });

        it('throws an error if no outputs were configured', () => {
            const expectedError = new Error('Invalid outputs: Outputs can only be configured for existing log levels');

            expect(() => loadConfiguration({ formatter, outputs: null as unknown as Config['outputs'] }))
                .toThrow(expectedError);
        });

        it('throws an error if output was configured for invalid level', () => {
            const expectedError = new Error('Invalid outputs: Outputs can only be configured for existing log levels');

            expect(() => loadConfiguration({ formatter, outputs: { foobar: 'stdout' } as Config['outputs'] }))
                .toThrow(expectedError);
        });

        it('throws an error if output is anything but stdout or stderr', () => {
            const expectedError = new Error('Invalid outputs: Output must be stdout or stderr');

            expect(() => loadConfiguration({ formatter, outputs: { error: 'stdin' as Output } }))
                .toThrow(expectedError);
        });
    });

    it('resolves to default configuration', () => {
        const config = loadConfiguration({ formatter });

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
            formatter,
        });
    });

    it('throws an error if a formatter module is configured without package.json', () => {
        expect(() => loadConfiguration({ formatter: 'test-formatter' }))
            .toThrow('Formatter must be configured as function unless a package.json is available');
    });

    describe('with package.json', () => {
        const nodeLogger = {
            channel: 'test-channel',
            levels: [
                'error',
                'info',
                'debug',
            ],
            outputs: {
                error: 'stdout',
            },
            formatter: 'test-formatter',
        };

        beforeAll(() => {
            createProject('with-channel', { name: 'testpackage', nodeLogger });
            createProject('without-channel', { name: 'testpackage', nodeLogger: { ...nodeLogger, channel: undefined } });
            fs.mkdirSync(join(root, 'with-channel', 'src', 'nested'), { recursive: true });
        });

        beforeEach(() => {
            vi.spyOn(process, 'cwd').mockReturnValue(join(root, 'with-channel'));
        });

        it('merges configuration with defaults', () => {
            const config = loadConfiguration();

            expect(config).toMatchObject({
                channel: nodeLogger.channel,
                levels: nodeLogger.levels,
                maxLevel: 'info',
                outputs: {
                    error: 'stdout',
                },
                timerLevel: 'debug',
                plugins: [],
            });
            expect(config.formatter).toEqual(expect.any(Function));
            expect(config.formatter({ channel: 'test', level: 'info', message: 'message' })).toBe('formatted');
        });

        it('finds the package.json in a parent directory', () => {
            vi.spyOn(process, 'cwd').mockReturnValue(join(root, 'with-channel', 'src', 'nested'));

            const config = loadConfiguration();

            expect(config.channel).toBe(nodeLogger.channel);
        });

        it('uses package name as channel if none was set explicitly', () => {
            vi.spyOn(process, 'cwd').mockReturnValue(join(root, 'without-channel'));

            const config = loadConfiguration();

            expect(config).toMatchObject({
                channel: 'testpackage',
            });
        });

        it('prioritizes manual configuration over package.json', () => {
            const config = loadConfiguration({ channel: 'foobar' });

            expect(config).toMatchObject({
                channel: 'foobar',
            });
        });

        it('throws an error if the formatter module cannot be found', () => {
            expect(() => loadConfiguration({ formatter: 'unknown-formatter' }))
                .toThrow(/^Formatter unknown-formatter not found in .*node_modules: /);
        });
    });

    describe('with plugins', () => {
        beforeAll(() => {
            createProject('with-plugins', { name: 'testpackage' });
        });

        beforeEach(() => {
            vi.spyOn(process, 'cwd').mockReturnValue(join(root, 'with-plugins'));
        });

        it('instantiates plugins with the merged configuration', () => {
            const config = loadConfiguration({
                formatter,
                plugins: ['test-plugin'],
            });

            expect(config.plugins).toHaveLength(1);
            expect(config.plugins[0].constructor.name).toBe('TestPlugin');
            expect(config.plugins[0]).toHaveProperty('config.channel', 'testpackage');
        });

        it('throws an error if a plugin cannot be found', () => {
            expect(() => loadConfiguration({ formatter, plugins: ['unknown-plugin'] }))
                .toThrow(/^Plugin unknown-plugin not found in .*node_modules: /);
        });
    });

    describe('environment variables', () => {
        it('are parsed correctly', () => {
            process.env.MY_TEST = 'foobar';

            const config = loadConfiguration({
                formatter,
                channel: 'env(MY_TEST)',
            });

            delete process.env.MY_TEST;

            expect(config.channel).toEqual('foobar');
        });

        it('use default value if given', () => {
            const config = loadConfiguration({
                formatter,
                channel: 'env(MY_TEST, baz)',
            });

            expect(config.channel).toEqual('baz');
        });

        it('throws error on missing variable', () => {
            delete process.env.MY_TEST;

            expect(() => loadConfiguration({
                formatter,
                channel: 'env(MY_TEST)',
            })).toThrow(/MY_TEST/);
        });

        it('allow empty strings as valid values', () => {
            process.env.MY_TEST = '';

            const config = loadConfiguration({
                formatter,
                channel: 'env(MY_TEST)',
            });

            delete process.env.MY_TEST;

            expect(config.channel).toEqual('');
        });

        it('keeps values that are no strings', () => {
            const config = loadConfiguration({
                formatter,
                context: { count: 3, enabled: true },
            });

            expect(config.context).toEqual({ count: 3, enabled: true });
        });
    });
});
