import type { PluginConstructor, ValidatedConfig } from '@brainbits/node-logger';
import * as Sentry from '@sentry/node';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PluginSentry, { sentryConfigSchema } from './index.js';

vi.mock('@sentry/node', () => ({
    init: vi.fn(),
    isInitialized: vi.fn(() => false),
    withScope: vi.fn(),
    addBreadcrumb: vi.fn(),
    captureException: vi.fn(),
}));

describe('PluginSentry', () => {
    let scope: Record<'setLevel' | 'setUser' | 'setExtra' | 'setTag', ReturnType<typeof vi.fn>>;
    let config: ValidatedConfig & { sentry: { tags: Record<string, string> } };

    beforeEach(() => {
        config = {
            channel: 'test',
            maxLevel: 'error',
            timerLevel: 'debug',
            outputs: {},
            levels: [
                'error',
                'info',
                'debug',
            ],
            sentry: {
                maxBreadcrumbs: 3,
                tags: {},
            },
            plugins: [],
            formatter: () => '',
        };

        scope = {
            setLevel: vi.fn(),
            setUser: vi.fn(),
            setExtra: vi.fn(),
            setTag: vi.fn(),
        };

        const withScope = (callback: (scope: Sentry.Scope) => unknown) => callback(scope as unknown as Sentry.Scope);
        vi.mocked(Sentry.withScope).mockImplementation(withScope as typeof Sentry.withScope);
    });

    it('should initialize Sentry without the console integration', () => {
        new PluginSentry(config);

        expect(Sentry.init).toHaveBeenCalledWith(expect.objectContaining({ maxBreadcrumbs: 3, release: null }));

        type Integrations = (integrations: { name: string }[]) => { name: string }[];
        const integrations = vi.mocked(Sentry.init).mock.calls[0][0]?.integrations as Integrations;

        expect(integrations([{ name: 'Console' }, { name: 'Http' }])).toEqual([{ name: 'Http' }]);
    });

    it('should provide its config schema to the logger', () => {
        const pluginClass: PluginConstructor = PluginSentry;

        expect(pluginClass.configSchema?.parse({})).toEqual({
            sentry: sentryConfigSchema.parse({}),
        });
    });

    it('should apply the defaults', () => {
        expect(sentryConfigSchema.parse({})).toEqual({
            debug: false,
            dsn: '',
            environment: 'dev',
            release: null,
            maxBreadcrumbs: 50,
            exceptionLevel: 'error',
            breadcrumbLevelMap: {
                emergency: 'error',
                alert: 'error',
                critical: 'error',
                error: 'error',
                warning: 'warning',
                notice: 'info',
                info: 'info',
                debug: 'debug',
            },
            tags: {},
        });
    });

    it('should accept strings from env() for booleans and numbers', () => {
        expect(sentryConfigSchema.parse({ debug: 'false', maxBreadcrumbs: '20' }))
            .toMatchObject({ debug: false, maxBreadcrumbs: 20 });
    });

    it.each([
        ['an unknown option', { dns: 'https://example.com' }],
        ['an unknown exceptionLevel', { exceptionLevel: 'fatal' }],
        ['an invalid boolean', { debug: 'maybe' }],
        ['an invalid number', { maxBreadcrumbs: 'many' }],
        ['an unknown breadcrumb level', { breadcrumbLevelMap: { info: 'notice' } }],
    ])('should reject %s', (_, sentry) => {
        expect(sentryConfigSchema.safeParse(sentry).success).toBe(false);
    });

    it('should throw an error if the exceptionLevel is not one of the configured levels', () => {
        config.sentry = { ...config.sentry, exceptionLevel: 'critical' };

        expect(() => new PluginSentry(config)).toThrow(
            'Invalid node-logger configuration: sentry.exceptionLevel "critical" is not one of the configured levels',
        );
    });

    it('should not initialize Sentry twice', () => {
        vi.mocked(Sentry.isInitialized).mockReturnValueOnce(true);

        new PluginSentry(config);

        expect(Sentry.init).not.toHaveBeenCalled();
    });

    it('should call Sentry.captureException', () => {
        const plugin = new PluginSentry(config);
        const error = new Error('error message');

        plugin.log({
            channel: 'test',
            message: error,
            level: 'error',
        });

        expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it('should set correct level', () => {
        const plugin = new PluginSentry(config);

        plugin.log({
            channel: 'test',
            message: new Error('error message'),
            level: 'error',
        });

        expect(scope.setLevel).toHaveBeenCalledWith('error');
    });

    it('should set correct user if given string', () => {
        config.context = { user: 'foobar' };

        const plugin = new PluginSentry(config);

        plugin.log({
            channel: 'test',
            message: new Error('error message'),
            level: 'error',
        });

        expect(scope.setUser).toHaveBeenCalledWith({ id: 'foobar' });
    });

    it('should set correct user if object with id given', () => {
        config.context = { user: { id: 'foobar' } };

        const plugin = new PluginSentry(config);

        plugin.log({
            channel: 'test',
            message: new Error('error message'),
            level: 'error',
        });

        expect(scope.setUser).toHaveBeenCalledWith(config.context?.user);
    });

    it('should set correct user if object with username given', () => {
        config.context = { user: { username: 'foobar' } };

        const plugin = new PluginSentry(config);

        plugin.log({
            channel: 'test',
            message: new Error('error message'),
            level: 'error',
        });

        expect(scope.setUser).toHaveBeenCalledWith(config.context?.user);
    });

    it('should set correct user if object with email given', () => {
        config.context = { user: { email: 'foobar' } };

        const plugin = new PluginSentry(config);

        plugin.log({
            channel: 'test',
            message: new Error('error message'),
            level: 'error',
        });

        expect(scope.setUser).toHaveBeenCalledWith(config.context?.user);
    });

    it('should set correct user if object with ip_address given', () => {
        config.context = { user: { ip_address: 'foobar' } };

        const plugin = new PluginSentry(config);

        plugin.log({
            channel: 'test',
            message: new Error('error message'),
            level: 'error',
        });

        expect(scope.setUser).toHaveBeenCalledWith(config.context?.user);
    });

    it('should set correct tags', () => {
        const plugin = new PluginSentry(config);

        plugin.log({
            channel: 'test',
            message: new Error('error message'),
            level: 'error',
            meta: { tags: { foo: 'bar' } },
        });

        expect(scope.setTag).toHaveBeenCalledWith('foo', 'bar');
    });

    it('should merge global tags with event specific tags', () => {
        config.sentry.tags.test = 'baz';

        const plugin = new PluginSentry(config);

        plugin.log({
            channel: 'test',
            message: new Error('error message'),
            level: 'error',
            meta: { tags: { foo: 'bar' } },
        });

        expect(scope.setTag).toHaveBeenCalledWith('foo', 'bar');
        expect(scope.setTag).toHaveBeenCalledWith('test', 'baz');
    });

    it('should set correct extras and omit user', () => {
        config.context = { user: 'baz', foo: 'bar' };

        const plugin = new PluginSentry(config);

        plugin.log({
            channel: 'test',
            message: new Error('error message'),
            level: 'error',
        });

        expect(scope.setExtra).toHaveBeenCalledWith('foo', 'bar');
        expect(scope.setExtra).not.toHaveBeenCalledWith('user', 'baz');
    });

    it('should add breadcrumbs for next exception', () => {
        const plugin = new PluginSentry(config);

        plugin.log({
            channel: 'test',
            message: 'some message',
            level: 'info',
            meta: { foo: 'bar' },
        });

        expect(Sentry.addBreadcrumb).not.toHaveBeenCalled();

        plugin.log({
            channel: 'test',
            message: new Error(),
            level: 'error',
        });

        expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
            category: 'info',
            level: 'info',
            message: 'some message',
            data: { foo: 'bar' },
        });
    });
});
