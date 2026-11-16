import { keepPreviousData, useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useBffApi } from '@/hooks/use-bff-api';
import type { DashboardParams, TaskCategory, TaskListResponse, TaskScope } from '@/lib/api/bff-api';
import { toTaskDetailView } from '@/utils/task-detail';
import { queryKeys } from './query-keys';

/** Freshness per data kind (guide §7.2). */
const STALE_MS = {
    counts: 30_000,
    list: 30_000,
    newest: 60_000,
    /**
     * Detail: short, so the press-in prefetch is reused instead of fetched a second time on mount. Decision
     * options stay fresh because every decision or comment invalidates the task, and focus/reconnect refetch.
     */
    detail: 10_000,
    /** While a thread is on screen it reloads this often, so others' comments arrive without pulling. */
    liveThread: 15_000,
    /** Same as the web dashboard. */
    dashboard: 5 * 60_000,
} as const;
const PAGE_SIZE = 20;

/** Pending / completed / total counters (Home summary, Inbox badge). */
export function useStatusCounts() {
    const api = useBffApi();
    return useQuery({ queryKey: queryKeys.statusCounts, queryFn: ({ signal }) => api.getStatusCounts(signal), staleTime: STALE_MS.counts });
}

/** Per-category counts for the worklist filter chips. */
export function useCategoryCounts(scope: TaskScope) {
    const api = useBffApi();
    return useQuery({ queryKey: queryKeys.categoryCounts(scope), queryFn: ({ signal }) => api.getCategoryCounts(scope, signal), staleTime: STALE_MS.counts });
}

/** Newest open tasks for the Home preview, already ordered by SAP. */
export function useOpenTasks(top: number) {
    const api = useBffApi();
    return useQuery({ queryKey: queryKeys.newestTasks(top), queryFn: ({ signal }) => api.getTasks('open', { top }, signal), staleTime: STALE_MS.newest });
}

function nextSkip(lastPage: TaskListResponse, pages: TaskListResponse[]): number | undefined {
    const fetched = pages.reduce((sum, page) => sum + page.items.length, 0);
    return lastPage.items.length === 0 || fetched >= lastPage.total ? undefined : fetched;
}

/**
 * Paged worklist (20 per page) for a scope, category and search. While filters change, the previous
 * list stays visible until the new result arrives (no skeleton flash).
 *
 * @param enabled false for a collapsed worklist group: nothing is fetched until it opens
 */
export function useTaskList(scope: TaskScope, category: TaskCategory | 'ALL', search: string, enabled = true) {
    const api = useBffApi();
    return useInfiniteQuery({
        queryKey: queryKeys.taskList(scope, category, search),
        queryFn: ({ pageParam, signal }) => api.getTasks(scope, { top: PAGE_SIZE, skip: pageParam, category: category === 'ALL' ? undefined : category, search: search || undefined }, signal),
        initialPageParam: 0,
        getNextPageParam: nextSkip,
        staleTime: STALE_MS.list,
        placeholderData: keepPreviousData,
        enabled,
    });
}

/**
 * Task detail as the screen's view model (header, tabs, attachments, comments, decisions, write context).
 * The raw response is cached once; select maps it and TanStack reuses the result until the data changes,
 * so the detail screen and the decision sheet share one transform.
 *
 * @param live reload every 15 s while the screen shows the comment thread (paused in the background and
 *   offline by TanStack's focus and online managers)
 */
export function useTaskDetailView(instanceId: string, { live = false }: { live?: boolean } = {}) {
    const api = useBffApi();
    return useQuery({
        queryKey: queryKeys.taskDetail(instanceId),
        queryFn: ({ signal }) => api.getTaskDetail(instanceId, signal),
        select: toTaskDetailView,
        staleTime: STALE_MS.detail,
        refetchInterval: live ? STALE_MS.liveThread : false,
        enabled: Boolean(instanceId),
    });
}

/** Starts loading a detail ~150ms before navigation (call on press-in). */
export function usePrefetchTaskDetail() {
    const api = useBffApi();
    const queryClient = useQueryClient();
    return useCallback(
        (instanceId: string) => void queryClient.prefetchQuery({ queryKey: queryKeys.taskDetail(instanceId), queryFn: ({ signal }) => api.getTaskDetail(instanceId, signal), staleTime: STALE_MS.detail }),
        [api, queryClient]
    );
}

/**
 * Dashboard aggregates (status + document-type counts) and one page of tasks for the current
 * drill-down. The previous result stays on screen while a new filter loads.
 */
export function useDashboard(params: DashboardParams) {
    const api = useBffApi();
    return useQuery({ queryKey: queryKeys.dashboard(params), queryFn: ({ signal }) => api.getDashboard(params, signal), staleTime: STALE_MS.dashboard, placeholderData: keepPreviousData });
}
