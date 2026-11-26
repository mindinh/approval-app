import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/queries/query-keys';
import type { BffApi } from '@/lib/api/bff-api';
import { toTaskDetailView, type TaskDetailView } from '@/utils/task-detail';

/**
 * Re-reads a task from the BFF, bypassing the cache, and stores the result so every screen showing the task
 * updates too. Null when the read fails (offline, server error): callers treat that as "unknown".
 */
export async function readFreshTask(queryClient: QueryClient, api: BffApi, instanceId: string): Promise<TaskDetailView | null> {
    try {
        const raw = await queryClient.fetchQuery({ queryKey: queryKeys.taskDetail(instanceId), queryFn: ({ signal }) => api.getTaskDetail(instanceId, signal), staleTime: 0 });
        return toTaskDetailView(raw);
    } catch {
        return null;
    }
}
