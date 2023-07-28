declare module '@tspm/node-logger' {
    type LogMethod = (message: unknown, meta?: Record<string, unknown>) => void;

    abstract class LogMethods {
        emergency: LogMethod;
        alert: LogMethod;
        critical: LogMethod;
        error: LogMethod;
        warning: LogMethod;
        notice: LogMethod;
        info: LogMethod;
        debug: LogMethod;
    }

    type LogLevel = keyof LogMethods;

    interface Config {
        channel?: string;
        levels?: LogLevel[];
        maxLevel?: LogLevel;
        outputs?: Record<string, string>;
        timerLevel?: string;
        formatter?: string;
        plugins?: string[];
        context?: {
            user?: string | Record<string, unknown>;
            [key: string]: unknown;
        };
    }

    export class Logger extends LogMethods {
        constructor(config?: Config);
        start(message: unknown): void;
        stop(message: unknown, meta?: Record<string, unknown>): void;
    }
}
