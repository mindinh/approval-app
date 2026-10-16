import { useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
    useInfiniteCategoryTasks,
    useCategoryCounts,
    invalidateTaskList,
} from './useInbox';
import type { InboxTask } from '@/services/inbox/inbox.types';
import {
    computeCategoryCounts,
    type ObjectCategory,
} from '../utils/categoryUtils';

export interface UseInboxDataOptions {
    scope: 'my' | 'approved';
    serverSearch: string;
    selectedTaskId?: string | null;
}

export function useInboxData({
    scope,
    serverSearch,
    selectedTaskId,
}: UseInboxDataOptions) {
    const isMyScope = scope === 'my';
    const queryClient = useQueryClient();

    // 4 infinite category queries
    const prTasksQuery = useInfiniteCategoryTasks(scope, 'PR', serverSearch);
    const poTasksQuery = useInfiniteCategoryTasks(scope, 'PO', serverSearch);
    const reservationTasksQuery = useInfiniteCategoryTasks(scope, 'RESERVATION', serverSearch);
    const claimTasksQuery = useInfiniteCategoryTasks(scope, 'CLAIM', serverSearch);

    // Global category counts
    const myCategoryCountsQuery = useCategoryCounts('my');
    const approvedCategoryCountsQuery = useCategoryCounts('approved');
    const categoryCountsQuery = isMyScope ? myCategoryCountsQuery : approvedCategoryCountsQuery;

    const categoryQueries = useMemo(() => ({
        PR: prTasksQuery,
        PO: poTasksQuery,
        RESERVATION: reservationTasksQuery,
        CLAIM: claimTasksQuery,
    }), [claimTasksQuery, poTasksQuery, prTasksQuery, reservationTasksQuery]);

    // Flatten, deduplicate, and sort tasks across all category queries
    const tasks = useMemo(() => {
        const seen = new Set<string>();
        return Object.values(categoryQueries)
            .flatMap((query) => query.data?.pages.flatMap((page) => page.items) ?? [])
            .filter((task) => {
                if (seen.has(task.instanceId)) return false;
                seen.add(task.instanceId);
                return true;
            })
            .sort((a, b) => String(b.createdOn || '').localeCompare(String(a.createdOn || '')));
    }, [categoryQueries]);

    const totalTasks = categoryCountsQuery.data?.ALL ?? tasks.length;
    const overallTotalTasks =
        (myCategoryCountsQuery.data?.ALL ?? 0) +
        (approvedCategoryCountsQuery.data?.ALL ?? 0);

    const queryList = Object.values(categoryQueries);
    const isLoadingList = queryList.some((query) => query.isLoading);
    const isFetchingNextPage = queryList.some((query) => query.isFetchingNextPage);
    const hasNextPage = queryList.some((query) => query.hasNextPage);
    const listError = queryList.find((query) => query.isError)?.error;
    const isListError = tasks.length === 0 && !!listError;
    const isRefreshingList = queryList.some((query) => query.isRefetching) && !isFetchingNextPage;

    const handleLoadMore = useCallback((categories: ObjectCategory[]) => {
        for (const category of categories) {
            if (category === 'ALL') continue;
            const query = categoryQueries[category];
            if (query?.hasNextPage && !query.isFetchingNextPage) {
                void query.fetchNextPage();
            }
        }
    }, [categoryQueries]);

    const refreshList = useCallback(() => {
        invalidateTaskList(queryClient, selectedTaskId);
    }, [queryClient, selectedTaskId]);

    // Aggregate category pending / completed / total counts
    const categoryTotals = useMemo(() => {
        const counts: Record<ObjectCategory, { pending: number; completed: number; total: number }> = {
            ALL: { pending: 0, completed: 0, total: 0 },
            PR: { pending: 0, completed: 0, total: 0 },
            PO: { pending: 0, completed: 0, total: 0 },
            CLAIM: { pending: 0, completed: 0, total: 0 },
            RESERVATION: { pending: 0, completed: 0, total: 0 },
        };

        const loadedCounts = computeCategoryCounts(tasks);
        const myCounts = myCategoryCountsQuery.data;
        const approvedCounts = approvedCategoryCountsQuery.data;
        const categories: Exclude<ObjectCategory, 'ALL'>[] = ['PR', 'PO', 'CLAIM', 'RESERVATION'];

        for (const category of categories) {
            const pending = myCounts?.[category] ?? (isMyScope ? loadedCounts[category] ?? 0 : 0);
            const completed = approvedCounts?.[category] ?? (!isMyScope ? loadedCounts[category] ?? 0 : 0);
            counts[category] = {
                pending,
                completed,
                total: pending + completed,
            };
        }

        const pendingTotal = myCounts?.ALL ?? (isMyScope ? totalTasks : 0);
        const completedTotal = approvedCounts?.ALL ?? (!isMyScope ? totalTasks : 0);
        counts.ALL = {
            pending: pendingTotal,
            completed: completedTotal,
            total: pendingTotal + completedTotal,
        };

        return counts;
    }, [approvedCategoryCountsQuery.data, isMyScope, myCategoryCountsQuery.data, tasks, totalTasks]);

    return {
        tasks,
        totalTasks,
        overallTotalTasks,
        categoryTotals,
        categoryCountsQuery,
        myCategoryCountsQuery,
        approvedCategoryCountsQuery,
        isLoadingList,
        isFetchingNextPage,
        hasNextPage,
        listError,
        isListError,
        isRefreshingList,
        handleLoadMore,
        refreshList,
    };
}
