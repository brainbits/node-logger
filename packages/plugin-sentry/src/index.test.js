import * as Sentry from '@sentry/node';
import PluginSentry from './index';

jest.mock('@sentry/node');

describe('PluginSentry', () => {
    let scope;
    let config;

    beforeEach(() => {
        config = {
            maxLevel: 'error',
            levels: [
                'error',
                'info',
                'debug',
            ],
            sentry: {
                maxBreadcrumbs: 3,
            },
            plugins: [],
            blah: 'foo',
            formatter: () => {},
        };

        scope = {
            setLevel: jest.fn(),
            setUser: jest.fn(),
            setExtra: jest.fn(),
            setTag: jest.fn(),
            addBreadcrumb: jest.fn(),
        };

        Sentry.withScope.mockImplementation(fn => fn(scope));
    });

    it('should call Sentry.captureException', () => {
        const plugin = new PluginSentry(config);
        const error = new Error('error message');

        plugin.log({
            message: error,
            level: 'error',
        });

        expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it('should set correct level', () => {
        const plugin = new PluginSentry(config);

        plugin.log({
            message: new Error('error message'),
            level: 'error',
        });

        expect(scope.setLevel).toHaveBeenCalledWith('error');
    });

    it('should set correct user if given string', () => {
        config.context = { user: 'foobar' };

        const plugin = new PluginSentry(config);

        plugin.log({
            message: new Error('error message'),
            level: 'error',
        });

        expect(scope.setUser).toHaveBeenCalledWith({ id: config.context.user });
    });

    it('should set correct user if object with id given', () => {
        config.context = { user: { id: 'foobar' } };

        const plugin = new PluginSentry(config);

        plugin.log({
            message: new Error('error message'),
            level: 'error',
        });

        expect(scope.setUser).toHaveBeenCalledWith(config.context.user);
    });

    it('should set correct user if object with username given', () => {
        config.context = { user: { username: 'foobar' } };

        const plugin = new PluginSentry(config);

        plugin.log({
            message: new Error('error message'),
            level: 'error',
        });

        expect(scope.setUser).toHaveBeenCalledWith(config.context.user);
    });

    it('should set correct user if object with email given', () => {
        config.context = { user: { email: 'foobar' } };

        const plugin = new PluginSentry(config);

        plugin.log({
            message: new Error('error message'),
            level: 'error',
        });

        expect(scope.setUser).toHaveBeenCalledWith(config.context.user);
    });

    it('should set correct user if object with ip_address given', () => {
        config.context = { user: { ip_address: 'foobar' } };

        const plugin = new PluginSentry(config);

        plugin.log({
            message: new Error('error message'),
            level: 'error',
        });

        expect(scope.setUser).toHaveBeenCalledWith(config.context.user);
    });

    it('should set correct tags', () => {
        const plugin = new PluginSentry(config);

        plugin.log({
            message: new Error('error message'),
            level: 'error',
            meta: { tags: { foo: 'bar' } },
        });

        expect(scope.setTag).toHaveBeenCalledWith('foo', 'bar');
    });

    it('should set correct extras and omit user', () => {
        config.context = { user: 'baz', foo: 'bar' };

        const plugin = new PluginSentry(config);

        plugin.log({
            message: new Error('error message'),
            level: 'error',
        });

        expect(scope.setExtra).toHaveBeenCalledWith('foo', 'bar');
        expect(scope.setExtra).not.toHaveBeenCalledWith('user', 'baz');
    });

    it('should add breadcrumbs for next exception', () => {
        const plugin = new PluginSentry(config);

        plugin.log({
            message: 'some message',
            level: 'info',
            meta: { foo: 'bar' },
        });

        expect(Sentry.addBreadcrumb).not.toHaveBeenCalled();

        plugin.log({
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
