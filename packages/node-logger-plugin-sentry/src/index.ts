import type { LogEvent, LogLevel, MergedConfig, Plugin } from '@brainbits/node-logger';
import * as Sentry from '@sentry/node';

type BreadcrumbLevel = 'error' | 'warning' | 'info' | 'debug';

export interface SentryConfig {
    debug: boolean;
    dsn: string;
    environment: string;
    release: string | null;
    maxBreadcrumbs: number;
    exceptionLevel: LogLevel;
    breadcrumbLevelMap: Partial<Record<LogLevel, BreadcrumbLevel>>;
    tags: Record<string, string>;
}

declare module '@brainbits/node-logger' {
    interface Config {
        sentry?: Partial<SentryConfig>;
    }
}

type PluginSentryConfig = Omit<MergedConfig, 'sentry'> & { sentry: SentryConfig };

export default class PluginSentry implements Plugin {
    defaults: SentryConfig = {
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

    private readonly config: PluginSentryConfig;

    private readonly breadCrumbs: LogEvent[] = [];

    constructor(config: MergedConfig) {
        const { sentry, ...rest } = config;

        this.config = {
            sentry: {
                ...this.defaults,
                ...sentry,
            },
            ...rest,
        };

        if (!Sentry.isInitialized()) {
            Sentry.init({
                debug: this.config.sentry.debug,
                dsn: this.config.sentry.dsn,
                environment: this.config.sentry.environment,
                // null instead of undefined keeps Sentry from detecting a release on its own
                release: this.config.sentry.release as string | undefined,
                maxBreadcrumbs: this.config.sentry.maxBreadcrumbs,
                integrations(integrations) {
                    return integrations
                        .filter(integration => integration.name !== 'Console');
                },
            });
        }
    }

    log(event: LogEvent): void {
        if (this.isException(event)) {
            this.logException(event);
            return;
        }

        this.addBreadcrumb(event);
    }

    private isException({ level }: LogEvent): boolean {
        const { levels, sentry } = this.config;

        return levels.indexOf(sentry.exceptionLevel) >= levels.indexOf(level);
    }

    private logException({ level, message, meta = {} }: LogEvent): void {
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

            Object.entries(tags as Record<string, string>).forEach(([key, value]) => {
                scope.setTag(key, value);
            });

            this.breadCrumbs.forEach((breadCrumb) => {
                Sentry.addBreadcrumb({
                    category: breadCrumb.level,
                    message: breadCrumb.message as string,
                    level: sentry.breadcrumbLevelMap[breadCrumb.level],
                    data: breadCrumb.meta,
                });
            });

            scope.setLevel(level as Sentry.SeverityLevel);
            Sentry.captureException(message);
        });
    }

    private addBreadcrumb(event: LogEvent): void {
        const { sentry } = this.config;

        if (!Object.keys(sentry.breadcrumbLevelMap).includes(event.level)) {
            return;
        }

        this.breadCrumbs.push(event);

        if (this.breadCrumbs.length > sentry.maxBreadcrumbs) {
            this.breadCrumbs.shift();
        }
    }

    private ensureUser(user: unknown): Sentry.User | null {
        if (!user) {
            return null;
        }

        if (typeof user !== 'object') {
            return { id: user as string | number };
        }

        const keys = ['id', 'username', 'email', 'ip_address'];

        if (!Object.keys(user).some(key => keys.includes(key))) {
            return { ...user, id: 'unknown' };
        }

        return user as Sentry.User;
    }
}
