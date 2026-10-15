import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import vitest from '@vitest/eslint-plugin';
import { defineConfig } from 'eslint/config';
import importX from 'eslint-plugin-import-x';
import tseslint from 'typescript-eslint';

const testFiles = ['**/*.test.ts'];

export default defineConfig([
    {
        ignores: ['**/dist/', '**/coverage/', 'examples/'],
    },
    js.configs.recommended,
    tseslint.configs.recommendedTypeChecked,
    importX.flatConfigs.recommended,
    importX.flatConfigs.typescript,
    stylistic.configs.customize({
        indent: 4,
        semi: true,
        braceStyle: '1tbs',
        quoteProps: 'as-needed',
    }),
    {
        settings: {
            'import-x/resolver': {
                // Resolve workspace packages to their sources, so no build is needed for linting
                typescript: { conditionNames: ['@brainbits/source', 'types', 'import', 'node', 'default'] },
            },
        },
        languageOptions: {
            parserOptions: {
                projectService: {
                    allowDefaultProject: ['eslint.config.js'],
                },
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            eqeqeq: ['error', 'always', { null: 'ignore' }],
            '@stylistic/max-len': ['error', 120, 2, {
                ignoreUrls: true,
                ignoreRegExpLiterals: true,
                ignoreStrings: true,
                ignoreTemplateLiterals: true,
            }],
            'import-x/no-extraneous-dependencies': ['error', { devDependencies: ['*.config.{js,ts}'] }],
            // Flags the documented default imports of typescript-eslint and import-x; TypeScript checks imports anyway
            'import-x/no-named-as-default': 'off',
            'import-x/no-named-as-default-member': 'off',
        },
    },
    {
        files: testFiles,
        ...vitest.configs.recommended,
        rules: {
            ...vitest.configs.recommended.rules,
            // expect(obj.method) and vi.mocked(obj.method) only pass the method around,
            // which the vitest variant of the rule knows.
            '@typescript-eslint/unbound-method': 'off',
            'vitest/unbound-method': 'error',
            // The tooling is installed in the workspace root, which the rule does not consider for package files
            'import-x/no-extraneous-dependencies': 'off',
        },
    },
]);
