import type { z } from 'zod';
import type { CoreConfigInput, CoreConfigOutput, logLevelSchema, userSchema } from './schema.js';

export type LogLevel = z.infer<typeof logLevelSchema>;

export type LogMessage = string | Error;

/**
 * Additional data of a log event.
 *
 * This is an interface, so plugins can add the keys they handle:
 * `declare module '@brainbits/node-logger' { interface Meta { myKey?: string } }`
 */
export interface Meta {
    [key: string]: unknown;
}

export type User = z.infer<typeof userSchema>;

export type Output = 'stdout' | 'stderr';

export interface LogEvent {
    channel: string;
    level: LogLevel;
    message: LogMessage;
    meta?: Meta;
}

export type Formatter = (event: LogEvent) => string;

export interface Plugin {
    /** Gets every log event, optional for plugins that only hook into the configuration */
    log?(event: LogEvent): void;
}

/**
 * The configuration as given in the package.json or to the Logger.
 *
 * This is an interface, so plugins can add their options:
 * `declare module '@brainbits/node-logger' { interface Config { myPlugin?: MyPluginConfig } }`
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Config extends Partial<CoreConfigInput> {}

/** The validated configuration with defaults applied, as passed to plugins */
export type ValidatedConfig = Config & CoreConfigOutput;

export interface PluginConstructor {
    new (config: ValidatedConfig): Plugin;
    /**
     * Schema of the options the plugin adds to the configuration, e.g. `z.object({ myPlugin: myPluginSchema })`.
     * The logger validates them together with its own options and rejects unknown options.
     */
    readonly configSchema?: z.ZodObject;
}

export interface ResolvedConfig extends Omit<ValidatedConfig, 'formatter' | 'plugins'> {
    formatter: Formatter;
    plugins: Plugin[];
}
