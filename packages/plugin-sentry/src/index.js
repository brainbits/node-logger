import * as Sentry from '@sentry/node';

const SENTRY_DSN = 'https://59a45aecaec3433e9412482ecfa60b90:c9294447311243ebac923d791448c3e5@sentry.brainbits.net/50';

Sentry.init({
    environment: 'dev',
    dsn: SENTRY_DSN,
    maxBreadcrumbs: 50,
    debug: true,
});

class PluginSentry {
    static addBreadcrumb(breadcrumb) {
        Sentry.addBreadcrumb(breadcrumb);
    }

    static captureMessage(message) {
        Sentry.captureMessage(message);
    }

    static captureException(error) {
        Sentry.captureException(error);
    }

    static withScope(scope) {
        Sentry.withScope(scope);
    }

    log(event) {
        const {
            isException, message, context, level,
        } = event;

        const {
            addBreadcrumb,
            captureException,
            withScope,
        } = this.constructor;

        withScope((scope) => {
            scope.setTag('my-tag', 'my value');
            scope.setLevel('warning');
            // will be tagged with my-tag="my value"
            captureException(new Error('my error'));
        });

        if (level === 'info') {
            addBreadcrumb({
                category: context,
                message,
                level,
            });
        }

        if (isException) {
            captureException(message);
        }
        console.log(event);
    }
}

export default PluginSentry;
