// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

/** Shared web code the app may import: plain TypeScript only, never the web's HTTP layer or UI. */
const WEB_ONLY = {
    patterns: [
        { group: ['**/cnma_approval_ui/**'], message: 'Import shared web code through an @approval-core/* alias (tsconfig.json).' },
        { group: ['@/services/inbox/inbox.api', '@/services/inbox', '@/services/core/*'], message: 'The web HTTP layer (axios, CSRF) is not used by the app: call the BFF through src/lib/api.' },
        { group: ['axios'], message: 'Use expo/fetch through src/lib/api/http-client.ts.' },
    ],
};

module.exports = defineConfig([
    expoConfig,
    {
        ignores: ['dist/*'],
    },
    {
        files: ['src/**/*.{ts,tsx}'],
        rules: { 'no-restricted-imports': ['error', WEB_ONLY] },
    },
    {
        // Route files stay thin: screens, components and logic live outside src/app.
        files: ['src/app/**/*.{ts,tsx}'],
        rules: {
            'no-restricted-imports': ['error', { ...WEB_ONLY, patterns: [...WEB_ONLY.patterns, { group: ['react-native-reanimated'], message: 'Keep route files thin: put UI and animation in src/screens.' }] }],
        },
    },
]);
