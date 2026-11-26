import type { DashboardParams, TaskCategory, TaskScope } from '@/lib/api/bff-api';

/** Query key factory: one place for cache keys so invalidation stays consistent. */
export const queryKeys = {
    currentUser: ['me'] as const,
    sapUser: ['me', 'sap-user'] as const,
    /** People comments can tag (whole directory, searched on the device). */
    mentionUsers: ['mention-users'] as const,
    statusCounts: ['tasks', 'status-counts'] as const,
    categoryCounts: (scope: TaskScope) => ['tasks', 'category-counts', scope] as const,
    /** Home preview (a single page). */
    newestTasks: (top: number) => ['tasks', 'newest', top] as const,
    /** Paged worklist per scope, category and search. */
    taskList: (scope: TaskScope, category: TaskCategory | 'ALL', search: string) => ['tasks', 'list', scope, category, search] as const,
    taskDetail: (instanceId: string) => ['tasks', 'detail', instanceId] as const,
    referencePr: (prNumber: string) => ['tasks', 'reference-pr', prNumber] as const,
    dashboard: (params: DashboardParams) => ['tasks', 'dashboard', params] as const,
};
