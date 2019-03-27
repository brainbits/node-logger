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

    constructor(config = {}) {
        const { sentry, ...rest } = config;

        // Merge configuration
        this.config = {
            ...this.defaults,
            ...sentry,
            ...rest,
        };

        this.sentry = Sentry;

        this.sentry.init({
            debug: this.config.debug,
            dsn: this.config.dsn,
            environment: this.config.environment,
            maxBreadcrumbs: this.config.maxBreadcrumbs,
        });
    }

    isException(level) {
        const { levels, exceptionLevel } = this.config;

        return levels.indexOf(exceptionLevel) >= levels.indexOf(level);
    }

    log(event) {
        const {
            message,
            context,
            level,
            tagsMap,
        } = event;

        const { breadcrumbLevels } = this.config;

        if (breadcrumbLevels.includes(level)) {
            const breadcrumb = {
                category: context,
                message,
                level,
            };

            this.sentry.addBreadcrumb(breadcrumb);
        }

        if (this.isException(level)) {
            if (tagsMap instanceof Map && tagsMap.size >= 1) {
                // See: https://docs.sentry.io/enriching-error-data/scopes/?platform=javascript
                this.sentry.withScope((scope) => {
                    tagsMap.forEach((value, key) => {
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
