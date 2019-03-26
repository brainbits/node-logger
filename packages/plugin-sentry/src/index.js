import * as Sentry from '@sentry/node';

class PluginSentry {
    defaults = {
        debug: false,
        dsn: '',
        environment: 'dev',
        maxBreadcrumbs: 50,
        exceptionLevel: 'error',
        breadcrumbLevels: [
            'info',
            'warning',
            'debug',
        ],
    };

    constructor(config) {
        const { sentry } = config;

        this.config = config;
        this.sentry = Sentry;

        this.sentry.init({
            debug: sentry.debug || this.defaults.debug,
            dsn: sentry.dsn || this.defaults.dsn,
            environment: sentry.environment || this.defaults.environment,
            maxBreadcrumbs: sentry.maxBreadcrumbs || this.defaults.maxBreadcrumbs,
        });
    }

    isException(level) {
        const { levels, sentry: { exceptionLevel } } = this.config;

        return levels.indexOf(exceptionLevel) >= levels.indexOf(level);
    }

    log(event) {
        const {
            message,
            context,
            level,
            tags,
        } = event;

        const breadcrumbLevels = this.config.sentry.breadcrumbLevels
            || this.defaults.breadcrumbLevels;

        if (breadcrumbLevels.includes(level)) {
            const breadcrumb = {
                category: context,
                message,
                level,
            };

            this.sentry.addBreadcrumb(breadcrumb);
        }

        if (this.isException(level)) {
            if (tags.size >= 1) {
                // See: https://docs.sentry.io/enriching-error-data/scopes/?platform=javascript
                this.sentry.withScope((scope) => {
                    tags.forEach((value, key) => {
                        scope.setTag(key, value);
                    });
                    scope.setLevel(level);

                    // Tagged version of caputureException
                    this.sentry.captureException(message);
                });
            }
            // Untagged version of caputureException
            this.sentry.captureException(message);
        }
    }
}

export default PluginSentry;
