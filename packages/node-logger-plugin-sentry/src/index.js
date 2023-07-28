/* eslint-disable class-methods-use-this */
import * as Sentry from '@sentry/node';

export default class PluginSentry {
    defaults = {
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
            release: this.config.sentry.release,
            maxBreadcrumbs: this.config.sentry.maxBreadcrumbs,
            integrations(integrations) {
                return integrations
                    .filter(integration => !(integration instanceof Sentry.Integrations.Console));
            },
        });
    }

    log(event) {
        if (this.isException(event)) {
            this.logException(event);
            return;
        }

        this.addBreadcrumb(event);
    }

    isException({ level }) {
        const { levels, sentry } = this.config;

        return levels.indexOf(sentry.exceptionLevel) >= levels.indexOf(level);
    }

    logException({ level, message, meta = {} }) {
        const { sentry, context = {} } = this.config;

        Sentry.withScope((scope) => {
            const { user: configUser, ...configExtras } = context;
            const { tags = {}, user: metaUser, ...extras } = meta;
            const user = metaUser ?? configUser;

            if (user) {
                scope.setUser(this.ensureUser(user));
            }

            Object.entries(configExtras).forEach(([key, value]) => {
                scope.setExtra(key, value);
            });

            Object.entries(extras).forEach(([key, value]) => {
                scope.setExtra(key, value);
            });

            Object.entries(sentry.tags).forEach(([key, value]) => {
                scope.setTag(key, value);
            });

            Object.entries(tags).forEach(([key, value]) => {
                scope.setTag(key, value);
            });

            this.breadCrumbs.forEach((breadCrumb) => {
                Sentry.addBreadcrumb({
                    category: breadCrumb.level,
                    message: breadCrumb.message,
                    level: sentry.breadcrumbLevelMap[breadCrumb.level],
                    data: breadCrumb.meta,
                });
            });

            scope.setLevel(level);
            Sentry.captureException(message);
        });
    }

    addBreadcrumb(event) {
        const { sentry } = this.config;

        if (!Object.keys(sentry.breadcrumbLevelMap).includes(event.level)) {
            return;
        }

        this.breadCrumbs.push(event);

        if (this.breadCrumbs.length > sentry.maxBreadcrumbs) {
            this.breadCrumbs.shift();
        }
    }

    intersect(aParam, bParam) {
        let a = aParam;
        let b = bParam;

        if (b.length > a.length) {
            [b, a] = [a, b];
        }

        return a.filter(e => b.includes(e));
    }

    ensureUser(user) {
        if (!user) {
            return null;
        }

        if (typeof user !== 'object') {
            return { id: user };
        }

        const keys = ['id', 'username', 'email', 'ip_address'];
        const keyIntersect = this.intersect(keys, Object.keys(user));

        if (keyIntersect.length === 0) {
            return { ...user, id: 'unknown' };
        }

        return user;
    }
}
