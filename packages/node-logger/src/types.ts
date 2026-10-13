import type { z } from 'zod';
import type { CoreConfigInput, CoreConfigOutput, logLevelSchema } from './schema.js';

export type LogLevel = z.infer<typeof logLevelSchema>;

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
