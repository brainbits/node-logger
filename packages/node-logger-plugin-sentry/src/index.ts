import { logLevels, logLevelSchema } from '@brainbits/node-logger';
import type { LogEvent, LogLevel, Plugin, User, ValidatedConfig } from '@brainbits/node-logger';
import * as Sentry from '@sentry/node';
import { z } from 'zod';

// Accepts strings as well, so the values can be set with env()
const booleanSchema = z.union([z.boolean(), z.stringbool()]);

export const sentryConfigSchema = z.strictObject({
    debug: booleanSchema.default(false),
    dsn: z.string().default(''),
    environment: z.string().default('dev'),
    // null instead of undefined keeps Sentry from detecting a release on its own
    release: z.string().nullable().default(null),
    maxBreadcrumbs: z.coerce.number<number | string>().int().nonnegative().default(50),
    exceptionLevel: logLevelSchema.default('error'),
    breadcrumbLevelMap: z.partialRecord(logLevelSchema, z.enum(['error', 'warning', 'info', 'debug'])).default({
        emergency: 'error',
        alert: 'error',
        critical: 'error',
        error: 'error',
        warning: 'warning',
        notice: 'info',
        info: 'info',
        debug: 'debug',
    }),
    tags: z.record(z.string(), z.string()).default({}),
});

export type SentryConfig = z.output<typeof sentryConfigSchema>;

declare module '@brainbits/node-logger' {
    interface Config {
        sentry?: z.input<typeof sentryConfigSchema>;
    }

    interface Meta {
        /** Tags of the Sentry event */
        tags?: Record<string, string>;
        /** User of the Sentry event, overrides the user of the context. A string or number is used as id. */
        user?: string | number | User;
    }
}

const severityLevels: Record<LogLevel, Sentry.SeverityLevel> = {
    emergency: 'fatal',
    alert: 'fatal',
    critical: 'fatal',
    error: 'error',
    warning: 'warning',
    notice: 'info',
    info: 'info',
    debug: 'debug',
};

export default class PluginSentry implements Plugin {
    static readonly configSchema = z.object({
        sentry: sentryConfigSchema.prefault({}),
    });

    private readonly config: ValidatedConfig;

    private readonly sentry: SentryConfig;

    private readonly breadCrumbs: LogEvent[] = [];

    constructor(config: ValidatedConfig) {
        this.config = config;
        // Already validated by the logger, parsed again to get the defaults when the plugin is used on its own
        this.sentry = sentryConfigSchema.parse(config.sentry ?? {});

        if (!Sentry.isInitialized()) {
            Sentry.init({
                debug: this.sentry.debug,
                dsn: this.sentry.dsn,
                environment: this.sentry.environment,
                release: this.sentry.release as string | undefined,
                maxBreadcrumbs: this.sentry.maxBreadcrumbs,
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
        return logLevels.indexOf(this.sentry.exceptionLevel) >= logLevels.indexOf(level);
    }

    private logException({ level, message, meta = {} }: LogEvent): void {
        const { sentry } = this;
        const { context = {} } = this.config;

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
                    message: String(breadCrumb.message),
                    level: sentry.breadcrumbLevelMap[breadCrumb.level],
                    data: breadCrumb.meta,
                });
            });

            // Sentry knows fewer levels, the original one is kept as tag
            scope.setLevel(severityLevels[level]);
            scope.setTag('logLevel', level);

            if (message instanceof Error) {
                Sentry.captureException(message);
            } else {
                Sentry.captureMessage(message);
            }
        });
    }

    private addBreadcrumb(event: LogEvent): void {
        const { sentry } = this;

        if (!Object.keys(sentry.breadcrumbLevelMap).includes(event.level)) {
            return;
        }

        this.breadCrumbs.push(event);

        if (this.breadCrumbs.length > sentry.maxBreadcrumbs) {
            this.breadCrumbs.shift();
        }
    }

    private ensureUser(user: string | number | User): Sentry.User {
        if (typeof user !== 'object') {
            return { id: user };
        }

        const { id, username, email, ip_address: ipAddress } = user;

        if (id === undefined && username === undefined && email === undefined && ipAddress === undefined) {
            return { ...user, id: 'unknown' };
        }

        return user;
    }
}
