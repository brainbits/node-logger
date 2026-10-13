import { z } from 'zod';
import type { Formatter } from './types.js';

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

const outputSchema = z.enum(['stdout', 'stderr']);

export const configShape = {
    channel: z.string().default('unknown'),
    levels: z.array(logLevelSchema).nonempty().default([...logLevelSchema.options]),
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
        user: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
    }).optional(),
};

export type CoreConfigInput = z.input<z.ZodObject<typeof configShape>>;
export type CoreConfigOutput = z.output<z.ZodObject<typeof configShape>>;

/**
 * Creates the schema for the whole configuration: the core options and the options of all plugins.
 * Unknown keys are rejected.
 */
export function createConfigSchema(pluginShape: z.ZodRawShape = {}) {
    return z.strictObject({ ...pluginShape, ...configShape }).check((ctx) => {
        const { levels, maxLevel, timerLevel, outputs } = ctx.value;
        const issue = (path: PropertyKey[], message: string) => {
            ctx.issues.push({ code: 'custom', input: ctx.value, path, message });
        };

        if (!levels.includes(maxLevel)) {
            issue(['maxLevel'], `"${maxLevel}" is not one of the configured levels`);
        }

        if (!levels.includes(timerLevel)) {
            issue(['timerLevel'], `"${timerLevel}" is not one of the configured levels`);
        }

        Object.keys(outputs)
            .filter(level => !(levels as string[]).includes(level))
            .forEach((level) => {
                issue(['outputs', level], `"${level}" is not one of the configured levels`);
            });
    });
}
