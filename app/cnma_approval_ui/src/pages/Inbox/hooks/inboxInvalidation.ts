/**
 * Centralized query invalidation policies for the Inbox feature.
 *
 * Each mutation in inboxMutations.ts should call the appropriate policy function
 * instead of manually listing queryClient.invalidateQueries() calls.
 * This ensures consistency and makes it trivial to adjust invalidation
 * scope when the data model changes.
 */
import type { QueryClient } from '@tanstack/react-query';
import { normalizeInstanceId as normId } from '@/pages/Inbox/utils/instanceId';
import { inboxKeys } from './inboxKeys';

const LIST_QUERY_KINDS = new Set(['tasks', 'approvedTasks', 'scopedTasks', 'categoryCounts', 'statusCounts']);

const invalidateScopedLists = (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: inboxKeys.statusCounts() });
    queryClient.invalidateQueries({ queryKey: [...inboxKeys.all, 'scopedTasks'] });
    queryClient.invalidateQueries({ queryKey: [...inboxKeys.all, 'categoryCounts'] });
};

/** Detail & workflow caches of one task, under both its normalized and raw (zero-padded) id. */
const invalidateTaskInstance = (queryClient: QueryClient, instanceId: string) => {
    const cleanId = normId(instanceId);
    queryClient.invalidateQueries({ queryKey: inboxKeys.taskDetail(cleanId) });
    queryClient.invalidateQueries({ queryKey: inboxKeys.taskWorkflowPrefix(cleanId) });
    if (instanceId !== cleanId) {
        queryClient.invalidateQueries({ queryKey: ['inbox', 'task', instanceId] });
        queryClient.invalidateQueries({ queryKey: ['inbox', 'workflow', instanceId] });
    }
};

// ─── Policy: After a decision (approve / reject) ──────────
// Broadest scope — both task lists shift, detail & workflow are stale.
export function invalidateAfterDecision(
    queryClient: QueryClient,
    instanceId: string,
) {
    invalidateAfterMassDecision(queryClient, [instanceId]);
}

// ─── Policy: After mass decision (approve / reject) ──────
export function invalidateAfterMassDecision(
    queryClient: QueryClient,
    instanceIds: string[] = []
) {
    queryClient.invalidateQueries({ queryKey: inboxKeys.tasksPrefix() });
    queryClient.invalidateQueries({ queryKey: inboxKeys.approvedTasksPrefix() });
    invalidateScopedLists(queryClient);
    for (const id of instanceIds) {
        invalidateTaskInstance(queryClient, id);
    }
}

// ─── Policy: After adding a comment ───────────────────────
// Only the detail/information views are affected, lists don't change.
export function invalidateAfterComment(
    queryClient: QueryClient,
    instanceId: string,
) {
    const cleanId = normId(instanceId);
    const matchesTask = (key: readonly unknown[], kind: string) =>
        key[0] === 'inbox' && key[1] === kind && normId(String(key[2] ?? '')) === cleanId;

    // Workflow refresh can run independently; only the conversation gates send completion.
    void queryClient.invalidateQueries({ predicate: query => matchesTask(query.queryKey, 'workflow') });
    // Invalidation already refetches active queries. A second explicit refetch cancels that request.
    return queryClient.invalidateQueries({ predicate: query => matchesTask(query.queryKey, 'task') });
}

// ─── Policy: Manual refresh of task lists & detail panel ─────
export function invalidateTaskList(queryClient: QueryClient, selectedTaskId?: string | null) {
    // Invalidation already fetches active queries. Leave inactive caches stale for
    // their next mount rather than replaying every cached search and infinite page.
    return queryClient.invalidateQueries({
        refetchType: 'active',
        predicate: ({ queryKey }) => queryKey[0] === 'inbox' && (
            LIST_QUERY_KINDS.has(String(queryKey[1])) ||
            (!!selectedTaskId && queryKey[1] === 'task' && normId(String(queryKey[2])) === normId(selectedTaskId))
        ),
    });
}
