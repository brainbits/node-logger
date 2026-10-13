import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['packages/*/src/**/*.test.ts'],
        clearMocks: true,
        restoreMocks: true,
        coverage: {
            include: ['packages/*/src/**/*.ts'],
        },
    },
});
