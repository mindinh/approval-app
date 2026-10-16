/**
 * TanStack Query hooks for reading Inbox server state.
 *
 * Responsibilities:
 * - Bind API calls to query keys
 * - Define staleTime / gcTime / retry / enabled
 * - Show toast on errors (one-shot, deduplicated)
 *
 * Must NOT:
 * - Contain mutation logic
 * - Own page-level UI state
 */
import { useEffect, useRef } from 'react';
import { keepPreviousData, useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { inboxApi } from '@/services/inbox/inbox.api';
import { STALE, REFRESH } from '@/pages/Inbox/utils/constants';
import { isSapUserMappingMissing } from '@/pages/Inbox/utils/predicates';
import { inboxKeys } from './inboxKeys';
import type { TaskDetailResponse, InboxTask } from '@/services/inbox/inbox.types';
import { useErrorModal } from '@/contexts/useErrorModal';
import { parseError } from '@/utils/parseError';

// ─── Helpers ───────────────────────────────────────────────

function shouldPausePolling(): boolean {
    return typeof document !== 'undefined' && document.visibilityState === 'hidden';
}

function listRefetchInterval(error: unknown): number | false {
    if (isSapUserMappingMissing(error)) return false;
    if (shouldPausePolling()) return false;
    return REFRESH.LIST_MS;
}

/**
 * Automatically triggers the global ErrorModal dialog on query failures.
 */
function useErrorModalOnQueryError(error: unknown, _fallback: string) {
    const lastRef = useRef<unknown>(null);
    const { showError } = useErrorModal();
    useEffect(() => {
        if (!error || lastRef.current === error) return;
        lastRef.current = error;
        // Do NOT trigger intrusive ErrorModal on 404 (not found) or 403 (access denied) errors;
        // let the inline Not Found / Access Denied view handle it cleanly.
        const parsed = parseError(error);
        if (parsed.category === 'notFound' || parsed.category === 'auth' || parsed.details?.statusCode === 403 || parsed.details?.statusCode === 404) return;
        showError(error);
    }, [error, showError]);
}

// ─── useCurrentUser ────────────────────────────────────────
export function useCurrentUser() {
    return useQuery({
        queryKey: inboxKeys.currentUser(),
        queryFn: () => inboxApi.getCurrentUser(),
        staleTime: Infinity, // User identity doesn't change mid-session
        gcTime: Infinity,
        retry: 1,
    });
}

// ─── useCategoryCounts ─────────────────────────────────────
export function useCategoryCounts(scope: 'my' | 'approved' = 'my', options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: inboxKeys.categoryCounts(scope),
        queryFn: () => inboxApi.getCategoryCounts(scope),
        staleTime: 60 * 1000, // 1 minute fresh
        enabled: options?.enabled !== false,
        refetchOnWindowFocus: false,
    });
}

export function useStatusCounts(options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: inboxKeys.statusCounts(),
        queryFn: () => inboxApi.getStatusCounts(),
        staleTime: 60_000,
        enabled: options?.enabled !== false,
        refetchOnWindowFocus: false,
        refetchInterval: (q) => listRefetchInterval(q.state.error),
    });
}

// ─── useTasks ──────────────────────────────────────────────
export function useTasks(options?: { enabled?: boolean; top?: number; skip?: number; staleTime?: number }) {
    const pagination = options?.top != null || options?.skip != null
        ? { top: options?.top, skip: options?.skip }
        : undefined;

    const query = useQuery({
        queryKey: inboxKeys.tasks(pagination),
        queryFn: () => inboxApi.getTasks(pagination),
        staleTime: options?.staleTime ?? STALE.LIST,
        enabled: options?.enabled !== false,
        placeholderData: keepPreviousData,
        refetchOnWindowFocus: false,
        refetchInterval: (q) => listRefetchInterval(q.state.error),
        retry: (failureCount, error: any) => {
            if (isSapUserMappingMissing(error)) return false;
            return failureCount < 1;
        },
    });

    useErrorModalOnQueryError(query.error, 'Failed to load tasks');
    return query;
}

// ─── useApprovedTasks ──────────────────────────────────────
export function useApprovedTasks(options?: { enabled?: boolean; top?: number; skip?: number }) {
    const pagination = options?.top != null || options?.skip != null
        ? { top: options?.top, skip: options?.skip }
        : undefined;

    const query = useQuery({
        queryKey: inboxKeys.approvedTasks(pagination),
        queryFn: () => inboxApi.getApprovedTasks(pagination),
        staleTime: STALE.LIST,
        enabled: options?.enabled !== false,
        placeholderData: keepPreviousData,
        refetchOnWindowFocus: false,
        refetchInterval: (q) => listRefetchInterval(q.state.error),
        retry: (failureCount, error: any) => {
            if (isSapUserMappingMissing(error)) return false;
            return failureCount < 1;
        },
    });

    useErrorModalOnQueryError(query.error, 'Failed to load approved tasks');
    return query;
}

// ─── useInfiniteTasks (infinite scroll) ────────────────────
const INFINITE_PAGE_SIZE = 50;

export function useInfiniteCategoryTasks(
    scope: 'my' | 'approved',
    category: 'PR' | 'PO' | 'RESERVATION' | 'CLAIM',
    search = ''
) {
    const query = useInfiniteQuery({
        queryKey: inboxKeys.scopedTasks(scope, category, search),
        queryFn: ({ pageParam = 0 }) => {
            const params = { top: INFINITE_PAGE_SIZE, skip: pageParam, category, search: search || undefined };
            return scope === 'approved'
                ? inboxApi.getApprovedTasks(params)
                : inboxApi.getTasks(params);
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            const totalFetched = allPages.reduce((sum, page) => sum + page.items.length, 0);
            if (lastPage.items.length === 0 || totalFetched >= lastPage.total) return undefined;
            return totalFetched;
        },
        staleTime: STALE.LIST,
        // Debounced search changes the query key. Keep the current list visible
        // until the matching server result arrives instead of flashing a full skeleton.
        placeholderData: keepPreviousData,
        refetchOnWindowFocus: false,
        retry: (failureCount, error: any) => {
            if (isSapUserMappingMissing(error)) return false;
            return failureCount < 1;
        },
    });

    useErrorModalOnQueryError(query.error, `Failed to load ${category} tasks`);
    return query;
}

export function useInfiniteTasks(options?: { enabled?: boolean }) {
    const query = useInfiniteQuery({
        queryKey: inboxKeys.tasksPrefix(),
        queryFn: ({ pageParam = 0 }) =>
            inboxApi.getTasks({ top: INFINITE_PAGE_SIZE, skip: pageParam }),
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            const totalFetched = allPages.reduce((sum, p) => sum + p.items.length, 0);
            if (lastPage.items.length === 0 || totalFetched >= lastPage.total) return undefined;
            return allPages.length * INFINITE_PAGE_SIZE;
        },
        staleTime: STALE.LIST,
        enabled: options?.enabled !== false,
        refetchOnWindowFocus: false,
        retry: (failureCount, error: any) => {
            if (isSapUserMappingMissing(error)) return false;
            return failureCount < 1;
        },
    });

    useErrorModalOnQueryError(query.error, 'Failed to load tasks');
    return query;
}

// ─── useInfiniteApprovedTasks (infinite scroll) ────────────
export function useInfiniteApprovedTasks(options?: { enabled?: boolean }) {
    const query = useInfiniteQuery({
        queryKey: inboxKeys.approvedTasksPrefix(),
        queryFn: ({ pageParam = 0 }) =>
            inboxApi.getApprovedTasks({ top: INFINITE_PAGE_SIZE, skip: pageParam }),
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            const totalFetched = allPages.reduce((sum, p) => sum + p.items.length, 0);
            if (lastPage.items.length === 0 || totalFetched >= lastPage.total) return undefined;
            return allPages.length * INFINITE_PAGE_SIZE;
        },
        staleTime: STALE.LIST,
        enabled: options?.enabled !== false,
        refetchOnWindowFocus: false,
        retry: (failureCount, error: any) => {
            if (isSapUserMappingMissing(error)) return false;
            return failureCount < 1;
        },
    });

    useErrorModalOnQueryError(query.error, 'Failed to load approved tasks');
    return query;
}

export function useTaskDetail(
    instanceId: string | null,
    options?: { enabled?: boolean },
    placeholderTask?: InboxTask
) {
    const queryClient = useQueryClient();

    const query = useQuery<TaskDetailResponse, Error>({
        queryKey: inboxKeys.taskDetail(instanceId || ''),
        queryFn: () => inboxApi.getTaskDetail(instanceId!),
        enabled: !!instanceId && options?.enabled !== false,
        staleTime: STALE.DETAIL,
        retry: (failureCount, error: any) => {
            const status = error?.response?.status || error?.statusCode || error?.status;
            if (status === 404 || status === 403 || status === 401) {
                return false;
            }
            return failureCount < 1;
        },
        placeholderData: (previousData) => {
            if (previousData) {
                const prevId = (previousData as any)?.taskprocessing?.task?.InstanceID ||
                               previousData.instanceId ||
                               previousData.taskId ||
                               previousData.task?.instanceId;
                const normPrevId = prevId ? String(prevId).replace(/^0+/, '') : '';
                const normInstId = instanceId ? String(instanceId).replace(/^0+/, '') : '';
                if (!prevId || prevId === instanceId || normPrevId === normInstId) {
                    return previousData;
                }
            }
            if (placeholderTask && placeholderTask.instanceId === instanceId) {
                const docType = placeholderTask.objectType || placeholderTask.businessContext?.type || 'PR';
                const docId = placeholderTask.documentId || placeholderTask.instid || placeholderTask.businessContext?.documentId || '';


                return {
                    taskId: placeholderTask.instanceId,
                    instanceId: placeholderTask.instanceId,
                    status: placeholderTask.status,
                    priority: placeholderTask.priority || 'MEDIUM',
                    createdOn: placeholderTask.createdOn,
                    requestorName: placeholderTask.requestorName,
                    objectType: docType,
                    documentId: docId,
                    documentType: placeholderTask.documentType,
                    documentTypeDisplay: placeholderTask.documentTypeDisplay,
                    companyCodeDisplay: placeholderTask.companyCodeDisplay,
                    companyCode: placeholderTask.companyCode,
                    total: placeholderTask.total,
                    currency: placeholderTask.currency,
                    normalTask: placeholderTask.normalTask,
                    decisions: [],
                    approvalSteps: [],
                    items: [],
                    attachments: [],
                    comments: [],
                    task: placeholderTask,
                } as TaskDetailResponse;
            }
            return undefined;
        },
    });

    useErrorModalOnQueryError(query.error, 'Failed to load task detail');
    return query;
}

// ─── useReferencePrDetail ──────────────────────────────────
export function useReferencePrDetail(
    prNumber: string | null,
    options?: { enabled?: boolean }
) {
    const query = useQuery<TaskDetailResponse, Error>({
        queryKey: inboxKeys.referencePr(prNumber || ''),
        queryFn: () => inboxApi.getPrDetail(prNumber!),
        enabled: !!prNumber && options?.enabled !== false,
        staleTime: STALE.DETAIL,
        retry: (failureCount, error: any) => {
            const status = error?.response?.status || error?.statusCode || error?.status;
            if (status === 404 || status === 403 || status === 401) {
                return false;
            }
            return failureCount < 1;
        },
    });

    useErrorModalOnQueryError(query.error, 'Failed to load reference PR detail');
    return query;
}

