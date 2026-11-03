import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import unusedImports from 'eslint-plugin-unused-imports'
import tseslint from 'typescript-eslint'

export default tseslint.config(
    { ignores: ['dist'] },
    {
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
        },
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
            'unused-imports': unusedImports,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            '@typescript-eslint/no-unused-vars': 'off',
            'unused-imports/no-unused-imports': 'warn',
            'unused-imports/no-unused-vars': ['warn', {
                vars: 'all',
                varsIgnorePattern: '^_',
                args: 'after-used',
                argsIgnorePattern: '^_',
            }],
            'react-refresh/only-export-components': [
                'warn',
                { allowConstantExport: true },
            ],
        },
    },
    {
        // Document renderers stay UI-agnostic so they can be shared with the mobile app.
        files: ['src/renderers/**/*.ts'],
        rules: {
            'no-restricted-imports': ['error', {
                patterns: [
                    { group: ['react', 'react-dom', 'react-*', '@cnma/react-ui', 'lucide-react', 'framer-motion'], message: 'Renderers must not depend on UI libraries.' },
                    { group: ['@/pages/*', '@/components/*', '@/hooks/*', '@/lib/*'], message: 'Renderers must not depend on the web app layers.' },
                ],
            }],
            'no-restricted-globals': ['error', 'window', 'document', 'localStorage', 'sessionStorage'],
        },
    },
)
