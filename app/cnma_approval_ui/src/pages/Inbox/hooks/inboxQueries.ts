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
function useErrorModalOnQueryError(error: unknown, fallback: string) {
    const lastRef = useRef<unknown>(null);
    const { showError } = useErrorModal();
    useEffect(() => {
        if (!error || lastRef.current === error) return;
        lastRef.current = error;
        showError(error);
    }, [error, showError]);
}

// ─── useObjectConfigs ──────────────────────────────────────
export function useObjectConfigs() {
    return useQuery({
        queryKey: inboxKeys.objectConfigs(),
        queryFn: () => inboxApi.getObjectConfigs(),
        staleTime: Infinity,
        gcTime: Infinity,
        retry: 2,
    });
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

// ─── useTasks ──────────────────────────────────────────────
export function useTasks(options?: { enabled?: boolean; top?: number; skip?: number }) {
    const pagination = options?.top != null || options?.skip != null
        ? { top: options?.top, skip: options?.skip }
        : undefined;

    const query = useQuery({
        queryKey: inboxKeys.tasks(pagination),
        queryFn: () => inboxApi.getTasks(pagination),
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
const INFINITE_PAGE_SIZE = 10;

export function useInfiniteTasks(options?: { enabled?: boolean }) {
    const query = useInfiniteQuery({
        queryKey: inboxKeys.tasksPrefix(),
        queryFn: ({ pageParam = 0 }) =>
            inboxApi.getTasks({ top: INFINITE_PAGE_SIZE, skip: pageParam }),
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            const totalFetched = allPages.reduce((sum, p) => sum + p.items.length, 0);
            if (totalFetched >= lastPage.total) return undefined;
            return totalFetched;
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
            if (totalFetched >= lastPage.total) return undefined;
            return totalFetched;
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
    hints?: { sapOrigin?: string; documentId?: string; businessObjectType?: string; status?: string },
    options?: { enabled?: boolean },
    placeholderTask?: InboxTask
) {
    const queryClient = useQueryClient();

    const query = useQuery<TaskDetailResponse, Error>({
        queryKey: inboxKeys.taskDetail(instanceId || ''),
        queryFn: () => inboxApi.getTaskDetail(instanceId!, hints),
        enabled: !!instanceId && options?.enabled !== false,
        staleTime: STALE.DETAIL,
        placeholderData: (previousData) => {
            if (previousData && (previousData.instanceId === instanceId || previousData.taskId === instanceId || previousData.task?.instanceId === instanceId)) {
                return previousData;
            }
            if (placeholderTask && placeholderTask.instanceId === instanceId) {
                const docType = hints?.businessObjectType || placeholderTask.objectType || 'PR';
                const docId = hints?.documentId || placeholderTask.documentId || '';

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
