import fs from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import loadConfiguration from './config.js';
import type { Config } from './types.js';

let root: string;
const zodDir = dirname(createRequire(import.meta.url).resolve('zod/package.json'));

/**
 * Accepts invalid configurations in the tests
 */
function invalid(config: unknown): Config {
    return config as Config;
}

/**
 * Creates a project with a package.json and installed formatter and plugin packages (ES modules)
 */
function createProject(name: string, packageJson: Record<string, unknown>): string {
    const projectDir = join(root, name);
    const writeModule = (moduleName: string, source: string, type = 'module') => {
        const moduleDir = join(projectDir, 'node_modules', moduleName);
        fs.mkdirSync(moduleDir, { recursive: true });
        fs.writeFileSync(join(moduleDir, 'package.json'), JSON.stringify({ type, exports: './index.js' }));
        fs.writeFileSync(join(moduleDir, 'index.js'), source);
    };

    fs.mkdirSync(projectDir, { recursive: true });
    fs.writeFileSync(join(projectDir, 'package.json'), JSON.stringify(packageJson));
    writeModule('test-formatter', 'export default function testFormatter() { return \'formatted\'; }');
    writeModule('test-plugin', 'export default class TestPlugin { constructor(config) { this.config = config; } }');
    writeModule('schema-plugin', `
        import { z } from 'zod';
        export default class SchemaPlugin {
            static configSchema = z.object({
                schemaPlugin: z.strictObject({ size: z.coerce.number().default(10) }).prefault({}),
            });
            constructor(config) { this.config = config; }
        }
    `);
    writeModule('conflicting-plugin', `
        import { z } from 'zod';
        export default class ConflictingPlugin {
            static configSchema = z.object({ channel: z.number() });
        }
    `);
    writeModule('cjs-formatter', 'module.exports = function cjsFormatter() { return \'cjs\'; };', 'commonjs');
    writeModule('cjs-plugin', 'module.exports = class CjsPlugin {};', 'commonjs');
    writeModule('named-plugin', 'export class NamedPlugin {}');
    fs.symlinkSync(zodDir, join(projectDir, 'node_modules', 'zod'));

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
        it.each([
            ['the formatter is missing', { formatter: undefined }, 'formatter'],
            ['the formatter has a wrong type', { formatter: 42 }, 'formatter'],
            ['the maxLevel is null', { maxLevel: null }, 'maxLevel'],
            ['the maxLevel is no valid level', { maxLevel: 'foobar' }, 'maxLevel'],
            ['the timerLevel is no valid level', { timerLevel: 'fatal' }, 'timerLevel'],
            ['the outputs are null', { outputs: null }, 'outputs'],
            ['an output is configured for an unknown level', { outputs: { foobar: 'stdout' } }, 'outputs'],
            ['an output is anything but stdout or stderr', { outputs: { error: 'stdin' } }, 'outputs.error'],
            ['the channel is no string', { channel: 42 }, 'channel'],
            ['the plugins are no array', { plugins: 'test-plugin' }, 'plugins'],
            ['the context is no object', { context: 'foo' }, 'context'],
            ['the user of the context has a wrong type', { context: { user: { id: true } } }, 'context.user'],
            ['the user of the context is a boolean', { context: { user: true } }, 'context.user'],
        ])('throws an error if %s', (_, config, path) => {
            expect(() => loadConfiguration(invalid({ formatter, ...config })))
                .toThrow(new RegExp(`^Invalid node-logger configuration:\\n[^]*→ at ${path.replace(/[.[\]]/g, '\\$&')}$`, 'm'));
        });

        it.each(['maxlevel', 'levels'])('throws an error for the unknown option %s', (option) => {
            expect(() => loadConfiguration(invalid({ formatter, [option]: 'debug' })))
                .toThrow(`✖ Unrecognized key: "${option}"`);
        });

        it('reports all problems at once', () => {
            let message = '';

            try {
                loadConfiguration(invalid({ formatter, channel: 42, maxLevel: 'foobar' }));
            } catch (error) {
                message = (error as Error).message;
            }

            expect(message).toContain('→ at channel');
            expect(message).toContain('→ at maxLevel');
        });
    });

    it.each(['foobar', 42, { id: 42 }])('accepts %j as user of the context', (user) => {
        expect(loadConfiguration({ formatter, context: { user } }).context).toEqual({ user });
    });

    it('resolves to default configuration', () => {
        const config = loadConfiguration({ formatter });

        expect(config).toMatchObject({
            channel: 'unknown',
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
            maxLevel: 'debug',
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
                maxLevel: 'debug',
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

        it('instantiates plugins with the validated configuration', () => {
            const config = loadConfiguration({
                formatter,
                plugins: ['test-plugin'],
            });

            expect(config.plugins).toHaveLength(1);
            expect(config.plugins[0].constructor.name).toBe('TestPlugin');
            expect(config.plugins[0]).toHaveProperty('config.channel', 'testpackage');
            expect(config.plugins[0]).toHaveProperty('config.maxLevel', 'info');
        });

        it('throws an error if a plugin cannot be found', () => {
            expect(() => loadConfiguration({ formatter, plugins: ['unknown-plugin'] }))
                .toThrow(/^Plugin unknown-plugin not found in .*node_modules: /);
        });

        it('loads CommonJS modules without default export', () => {
            const config = loadConfiguration({ formatter: 'cjs-formatter', plugins: ['cjs-plugin'] });

            expect(config.formatter({ channel: 'test', level: 'info', message: 'message' })).toBe('cjs');
            expect(config.plugins[0].constructor.name).toBe('CjsPlugin');
        });

        it.each([
            ['Plugin', { formatter, plugins: ['named-plugin'] }, 'Plugin named-plugin has to export a class as default export'],
            ['Formatter', { formatter: 'named-plugin' }, 'Formatter named-plugin has to export a function as default export'],
        ])('throws an error if a %s has no default export', (_, config, message) => {
            expect(() => loadConfiguration(config)).toThrow(message);
        });

        it('reads the package.json only once per working directory', () => {
            const projectDir = createProject('cached', { name: 'testpackage' });
            const readFileSync = vi.spyOn(fs, 'readFileSync');
            vi.spyOn(process, 'cwd').mockReturnValue(projectDir);

            loadConfiguration({ formatter });
            loadConfiguration({ formatter });

            expect(readFileSync).toHaveBeenCalledExactlyOnceWith(join(projectDir, 'package.json'), 'utf8');
        });

        it('validates the options of plugins and applies their defaults', () => {
            const config = loadConfiguration(invalid({
                formatter,
                plugins: ['schema-plugin'],
                schemaPlugin: { size: 'env(SIZE, 20)' },
            }));
            const defaults = loadConfiguration({ formatter, plugins: ['schema-plugin'] });

            expect(config.plugins[0]).toHaveProperty('config.schemaPlugin', { size: 20 });
            expect(defaults.plugins[0]).toHaveProperty('config.schemaPlugin', { size: 10 });
        });

        it('throws an error for invalid options of plugins', () => {
            expect(() => loadConfiguration(invalid({
                formatter,
                plugins: ['schema-plugin'],
                schemaPlugin: { size: 'big', color: 'red' },
            }))).toThrow(/Unrecognized key: "color"\n {2}→ at schemaPlugin[^]*→ at schemaPlugin\.size/);
        });

        it('throws an error for options of plugins that are not loaded', () => {
            expect(() => loadConfiguration(invalid({ formatter, plugins: ['test-plugin'], schemaPlugin: {} })))
                .toThrow('✖ Unrecognized key: "schemaPlugin"');
        });

        it('throws an error if a plugin redefines an option', () => {
            expect(() => loadConfiguration({ formatter, plugins: ['conflicting-plugin'] }))
                .toThrow('Plugin conflicting-plugin must not redefine the option "channel" of node-logger');
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

        it.each([
            ['missing', undefined],
            ['empty', ''],
        ])('use the default if the variable is %s and has no fallback', (_, value) => {
            if (value === undefined) {
                delete process.env.MY_TEST;
            } else {
                process.env.MY_TEST = value;
            }

            const config = loadConfiguration(invalid({
                formatter,
                channel: 'env(MY_TEST)',
                maxLevel: 'env(MY_TEST)',
                context: { user: 'env(MY_TEST)' },
            }));

            delete process.env.MY_TEST;

            expect(config).toMatchObject({ channel: 'unknown', maxLevel: 'info', context: {} });
            expect(config.context).not.toHaveProperty('user');
        });

        it('use the fallback if the variable is empty', () => {
            process.env.MY_TEST = '';

            const config = loadConfiguration({
                formatter,
                channel: 'env(MY_TEST, baz)',
            });

            delete process.env.MY_TEST;

            expect(config.channel).toEqual('baz');
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
