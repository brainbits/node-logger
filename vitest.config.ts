import { defaultServerConditions } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    ssr: {
        resolve: {
            // Resolve workspace packages to their sources, so no build is needed for the tests
            conditions: ['@brainbits/source', ...defaultServerConditions],
        },
    },
    test: {
        include: ['packages/*/src/**/*.test.ts'],
        clearMocks: true,
        restoreMocks: true,
        coverage: {
            include: ['packages/*/src/**/*.ts'],
        },
    },
});
