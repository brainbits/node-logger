export type LogLevel = 'emergency' | 'alert' | 'critical' | 'error' | 'warning' | 'notice' | 'info' | 'debug';

export type Meta = Record<string, unknown>;

export type LogMethod = (message: unknown, meta?: Meta) => void;

export type Output = 'stdout' | 'stderr';

export interface LogEvent {
    channel: string;
    level: LogLevel;
    message: unknown;
    meta?: Meta;
}

export type Formatter = (event: LogEvent) => string;

export interface Plugin {
    log(event: LogEvent): void;
}

/**
 * Plugins can add their own options by augmenting this interface:
 * `declare module '@brainbits/node-logger' { interface Config { myPlugin?: MyPluginConfig } }`
 */
export interface Config {
    channel?: string;
    levels?: LogLevel[];
    maxLevel?: LogLevel;
    outputs?: Partial<Record<LogLevel, Output>>;
    timerLevel?: LogLevel;
    /** A formatter function or the module name of a formatter */
    formatter?: string | Formatter;
    /** Module names of plugins */
    plugins?: string[];
    context?: {
        user?: string | Record<string, unknown>;
        [key: string]: unknown;
    };
}

/** The configuration merged with the defaults, as passed to plugins */
export type MergedConfig = Config & Required<Pick<Config, 'channel' | 'levels' | 'maxLevel' | 'outputs' | 'timerLevel'>>;

export type PluginConstructor = new (config: MergedConfig) => Plugin;

export interface ResolvedConfig extends Omit<MergedConfig, 'formatter' | 'plugins'> {
    formatter: Formatter;
    plugins: Plugin[];
}
