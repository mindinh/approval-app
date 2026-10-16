/**
 * Centralized query invalidation policies for the Inbox feature.
 *
 * Each mutation in useInbox.ts should call the appropriate policy function
 * instead of manually listing queryClient.invalidateQueries() calls.
 * This ensures consistency and makes it trivial to adjust invalidation
 * scope when the data model changes.
 */
import type { QueryClient } from '@tanstack/react-query';
import { inboxKeys } from './inboxKeys';

const normId = (id?: string | null): string => (id ? String(id).replace(/^0+/, '') : '');
const invalidateScopedLists = (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: inboxKeys.statusCounts() });
    queryClient.invalidateQueries({ queryKey: [...inboxKeys.all, 'scopedTasks'] });
    queryClient.invalidateQueries({ queryKey: [...inboxKeys.all, 'categoryCounts'] });
};

// ─── Policy: After a decision (approve / reject) ──────────
// Broadest scope — both task lists shift, detail & workflow are stale.
export function invalidateAfterDecision(
    queryClient: QueryClient,
    instanceId: string,
) {
    const cleanId = normId(instanceId);
    queryClient.invalidateQueries({ queryKey: inboxKeys.tasksPrefix() });
    queryClient.invalidateQueries({ queryKey: inboxKeys.approvedTasksPrefix() });
    invalidateScopedLists(queryClient);
    queryClient.invalidateQueries({ queryKey: inboxKeys.taskDetail(cleanId) });
    queryClient.invalidateQueries({ queryKey: inboxKeys.taskWorkflowPrefix(cleanId) });
    if (instanceId !== cleanId) {
        queryClient.invalidateQueries({ queryKey: ['inbox', 'task', instanceId] });
        queryClient.invalidateQueries({ queryKey: ['inbox', 'workflow', instanceId] });
    }
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
        const cleanId = normId(id);
        queryClient.invalidateQueries({ queryKey: inboxKeys.taskDetail(cleanId) });
        queryClient.invalidateQueries({ queryKey: inboxKeys.taskWorkflowPrefix(cleanId) });
        if (id !== cleanId) {
            queryClient.invalidateQueries({ queryKey: ['inbox', 'task', id] });
            queryClient.invalidateQueries({ queryKey: ['inbox', 'workflow', id] });
        }
    }
}

// ─── Policy: After forwarding a task ───────────────────────
// Pending list changes; approved list is not affected.
export function invalidateAfterForward(
    queryClient: QueryClient,
    instanceId: string,
) {
    const cleanId = normId(instanceId);
    queryClient.invalidateQueries({ queryKey: inboxKeys.tasksPrefix() });
    invalidateScopedLists(queryClient);
    queryClient.invalidateQueries({ queryKey: inboxKeys.taskDetail(cleanId) });
    queryClient.invalidateQueries({ queryKey: inboxKeys.taskWorkflowPrefix(cleanId) });
    if (instanceId !== cleanId) {
        queryClient.invalidateQueries({ queryKey: ['inbox', 'task', instanceId] });
        queryClient.invalidateQueries({ queryKey: ['inbox', 'workflow', instanceId] });
    }
}

// ─── Policy: After adding a comment ───────────────────────
// Only the detail/information views are affected, lists don't change.
export function invalidateAfterComment(
    queryClient: QueryClient,
    instanceId: string,
) {
    const cleanId = normId(instanceId);
    queryClient.invalidateQueries({ queryKey: inboxKeys.taskDetail(cleanId) });
    queryClient.invalidateQueries({ queryKey: inboxKeys.taskWorkflowPrefix(cleanId) });
    if (instanceId !== cleanId) {
        queryClient.invalidateQueries({ queryKey: ['inbox', 'task', instanceId] });
        queryClient.invalidateQueries({ queryKey: ['inbox', 'workflow', instanceId] });
    }

    // Force immediate refetch so new comment displays instantly in UI!
    queryClient.refetchQueries({ queryKey: inboxKeys.taskDetail(cleanId) });
    if (instanceId !== cleanId) {
        queryClient.refetchQueries({ queryKey: ['inbox', 'task', instanceId] });
    }
}


// ─── Policy: Manual refresh of task lists & detail panel ─────
export function invalidateTaskList(queryClient: QueryClient, selectedTaskId?: string | null) {
    queryClient.invalidateQueries({ queryKey: inboxKeys.tasksPrefix() });
    queryClient.invalidateQueries({ queryKey: inboxKeys.approvedTasksPrefix() });
    invalidateScopedLists(queryClient);
    void queryClient.refetchQueries({ queryKey: [...inboxKeys.all, 'scopedTasks'] });
    void queryClient.refetchQueries({ queryKey: [...inboxKeys.all, 'categoryCounts'] });
    void queryClient.refetchQueries({ queryKey: inboxKeys.tasksPrefix() });
    void queryClient.refetchQueries({ queryKey: inboxKeys.approvedTasksPrefix() });

    if (selectedTaskId) {
        const cleanId = normId(selectedTaskId);
        queryClient.invalidateQueries({ queryKey: inboxKeys.taskDetail(cleanId) });
        void queryClient.refetchQueries({ queryKey: inboxKeys.taskDetail(cleanId) });
        if (selectedTaskId !== cleanId) {
            queryClient.invalidateQueries({ queryKey: ['inbox', 'task', selectedTaskId] });
            void queryClient.refetchQueries({ queryKey: ['inbox', 'task', selectedTaskId] });
        }
    }
}
