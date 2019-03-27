import * as Sentry from '@sentry/node';
import PluginSentry from './index';

jest.mock('@sentry/node');

const config = {
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

describe('PluginSentry', () => {
    it('should have the correct properties', () => {
        const plugin = new PluginSentry(config);

        expect(plugin).toHaveProperty('log', expect.any(Function));
        expect(plugin).toHaveProperty('isException', expect.any(Function));
        expect(plugin).toHaveProperty('isException', expect.any(Function));
    });

    it('should call Sentry.caputreException', () => {
        const plugin = new PluginSentry(config);
        const error = new Error('error message');

        plugin.log({
            message: new Error('error message'),
            context: 'context',
            level: 'error',
        });

        expect(Sentry.captureException).toHaveBeenCalledWith(error);
        expect(Sentry.withScope).not.toHaveBeenCalled();
    });

    it('should call Sentry.caputreException with tags', () => {
        const plugin = new PluginSentry(config);
        const error = new Error('error message');

        plugin.log({
            message: new Error('error message'),
            context: 'context',
            level: 'error',
            tagsMap: new Map([['tag', 'my tag value']]),
        });

        expect(Sentry.captureException).toHaveBeenCalledWith(error);
        expect(Sentry.withScope).toHaveBeenCalled();
    });

    it('should add breadcrumbs', () => {
        const plugin = new PluginSentry(config);

        plugin.log({
            message: 'some message',
            context: 'context',
            level: 'info',
            tagsMap: new Map([
                ['tag', 'my tag value'],
            ]),
        });

        expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
            category: 'context',
            level: 'info',
            message: 'some message',
        });
    });
});
