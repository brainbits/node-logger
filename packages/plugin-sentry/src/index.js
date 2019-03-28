/* eslint-disable class-methods-use-this */
import * as Sentry from '@sentry/node';

class PluginSentry {
    defaults = {
        debug: false,
        dsn: '',
        environment: 'dev',
        maxBreadcrumbs: 50,
        exceptionLevel: 'error',
        breadcrumbLevels: [
            'error',
            'warning',
            'info',
            'debug',
        ],
    };

    breadCrumbs = [];

    constructor(config = {}) {
        const { sentry, ...rest } = config;

        this.config = {
            sentry: {
                ...this.defaults,
                ...sentry,
            },
            ...rest,
        };

        Sentry.init({
            debug: this.config.sentry.debug,
            dsn: this.config.sentry.dsn,
            environment: this.config.sentry.environment,
            maxBreadcrumbs: this.config.sentry.maxBreadcrumbs,
        });
    }

    isException(level) {
        const { levels, sentry } = this.config;

        return levels.indexOf(sentry.exceptionLevel) >= levels.indexOf(level);
    }

    intersect(aParam, bParam) {
        let a = aParam;
        let b = bParam;

        if (b.length > a.length) {
            [b, a] = [a, b];
        }

        return a.filter(e => b.includes(e));
    }

    log(event) {
        const {
            message,
            level,
            meta: { tags = {} },
        } = event;

        const { sentry, context = {} } = this.config;

        if (this.isException(level)) {
            // See: https://docs.sentry.io/enriching-error-data/scopes/?platform=javascript
            Sentry.withScope((scope) => {
                Object.entries(tags).forEach(([key, value]) => {
                    scope.setTag(key, value);
                });

                const { user, ...extras } = context;

                Object.entries(extras).forEach(([key, value]) => {
                    scope.setExtra(key, value);
                });

                if (user) {
                    if (typeof user === 'object') {
                        const keys = ['id', 'username', 'email', 'ip_adrress'];
                        const keyIntersect = this.intersect(keys, Object.keys(user));

                        if (keyIntersect.length === 0) {
                            user.id = 'unknown';
                        }

                        scope.setUser(user);
                    } else {
                        scope.setUser({ id: user });
                    }
                }

                if (sentry.breadcrumbLevels.includes(level)) {
                    this.breadCrumbs.forEach((breadCrumb) => {
                        Sentry.addBreadcrumb({
                            category: breadCrumb.level,
                            message: breadCrumb.message,
                            level: breadCrumb.level,
                            data: breadCrumb.meta,
                        });
                    });
                }

                scope.setLevel(level);

                // Tagged version of caputureException
                Sentry.captureException(message);
            });
        } else {
            this.breadCrumbs.push(event);
        }
    }
}

export default PluginSentry;
