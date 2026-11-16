/** Unit tests for the app's pure logic (view models, error mapping, auth helpers). Run: npm test */
module.exports = {
    preset: 'jest-expo',
    roots: ['<rootDir>/tests'],
    setupFiles: ['<rootDir>/tests/setup.ts'],
    // Same aliases as tsconfig.json: shared web code first, then the app's own `@/`.
    moduleNameMapper: {
        '^@approval-core/renderers$': '<rootDir>/../cnma_approval_ui/src/renderers/index.ts',
        '^@approval-core/inbox-types$': '<rootDir>/../cnma_approval_ui/src/services/inbox/inbox.types.ts',
        '^@approval-core/status-predicates$': '<rootDir>/../cnma_approval_ui/src/pages/Inbox/utils/predicates.ts',
        '^@approval-core/instance-id$': '<rootDir>/../cnma_approval_ui/src/pages/Inbox/utils/instanceId.ts',
        '^@approval-core/file-names$': '<rootDir>/../cnma_approval_ui/src/pages/Inbox/utils/fileNames.ts',
        '^@approval-core/task-filters$': '<rootDir>/../cnma_approval_ui/src/pages/Inbox/utils/taskFilterMatchers.ts',
        '^@/services/inbox/(inbox\\.types|inbox\\.contracts)$': '<rootDir>/../cnma_approval_ui/src/services/inbox/$1.ts',
        '^@/(.*)$': '<rootDir>/src/$1',
    },
};
