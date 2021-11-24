declare module '@tspm/node-logger' {
    interface Config {
        sentry?: {
            debug?: boolean;
            dsn?: string;
            environment?: string;
            release?: string;
            maxBreadcrumbs?: number;
            exceptionLevel?: LogLevel;
            breadcrumbLevelMap?: {
                [key in LogLevel]?: 'error' | 'warning' | 'info' | 'debug';
            };
            tags?: Record<string, string>;
        }
    }
}
