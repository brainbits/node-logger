import { z } from 'zod';
import type { Formatter } from './types.js';

/**
 * The syslog severity levels (RFC 5424), from the most to the least severe
 */
export const logLevelSchema = z.enum([
    'emergency',
    'alert',
    'critical',
    'error',
    'warning',
    'notice',
    'info',
    'debug',
]);

export const logLevels = logLevelSchema.options;

const outputSchema = z.enum(['stdout', 'stderr']);

export const userSchema = z.looseObject({
    id: z.union([z.string(), z.number()]).optional(),
    username: z.string().optional(),
    email: z.string().optional(),
    ip_address: z.string().optional(),
});

export const configShape = {
    channel: z.string().default('unknown'),
    maxLevel: logLevelSchema.default('info'),
    outputs: z.partialRecord(logLevelSchema, outputSchema).default({
        emergency: 'stderr',
        warning: 'stdout',
    }),
    timerLevel: logLevelSchema.default('debug'),
    formatter: z.union([
        z.string().nonempty(),
        z.custom<Formatter>(value => typeof value === 'function'),
    ], { error: 'Expected the module name of a formatter or a formatter function' }),
    plugins: z.array(z.string().nonempty()).default([]),
    context: z.looseObject({
        // A string or number is used as id
        user: z.union([z.string(), z.number(), userSchema]).optional(),
    }).optional(),
};

export type CoreConfigInput = z.input<z.ZodObject<typeof configShape>>;
export type CoreConfigOutput = z.output<z.ZodObject<typeof configShape>>;

/**
 * Creates the schema for the whole configuration: the core options and the options of all plugins.
 * Unknown keys are rejected.
 */
export function createConfigSchema(pluginShape: z.ZodRawShape = {}) {
    return z.strictObject({ ...pluginShape, ...configShape });
}
