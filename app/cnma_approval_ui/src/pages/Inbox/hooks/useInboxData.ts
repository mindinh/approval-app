import { useMemo, useCallback, useEffect } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
    useInfiniteCategoryTasks,
    useCategoryCounts,
    invalidateTaskList,
} from './useInbox';
import type { CategoryCountsResponse } from '@/services/inbox/inbox.types';
import { inboxKeys } from './inboxKeys';
import { cancelCategoryPagination } from './cancelPagination';
import {
    computeCategoryCounts,
    type ObjectCategory,
} from '../utils/categoryUtils';

export interface UseInboxDataOptions {
    scope: 'my' | 'approved';
    serverSearch: string;
    selectedTaskId?: string | null;
    requestedCategories?: Exclude<ObjectCategory, 'ALL'>[];
}

export type CategoryStates = Partial<Record<ObjectCategory, { isLoading: boolean; error: unknown }>>;

export function cacheListCategoryCounts(
    client: QueryClient,
    scope: 'my' | 'approved',
    counts: CategoryCountsResponse | undefined,
    sourceUpdatedAt: number
) {
    if (!counts?.complete || sourceUpdatedAt <= 0) return;
    const key = inboxKeys.categoryCounts(scope);
    const existing = client.getQueryState(key);
    // Never make an old list appear freshly counted, overwrite a newer global
    // response, or notify observers repeatedly for the same list snapshot.
    if (existing?.data !== undefined && existing.dataUpdatedAt >= sourceUpdatedAt) return;
    client.setQueryData(key, counts, { updatedAt: sourceUpdatedAt });
}

export function useInboxData({
    scope,
    serverSearch,
    selectedTaskId,
    requestedCategories,
}: UseInboxDataOptions) {
    const isMyScope = scope === 'my';
    const queryClient = useQueryClient();

    const demandLoading = requestedCategories !== undefined;
    const isRequested = (category: Exclude<ObjectCategory, 'ALL'>) =>
        !demandLoading || !!serverSearch || requestedCategories.includes(category);
    const prTasksQuery = useInfiniteCategoryTasks(scope, 'PR', serverSearch, isRequested('PR'));
    const poTasksQuery = useInfiniteCategoryTasks(scope, 'PO', serverSearch, isRequested('PO'));
    const reservationTasksQuery = useInfiniteCategoryTasks(scope, 'RESERVATION', serverSearch, isRequested('RESERVATION'));
    const claimTasksQuery = useInfiniteCategoryTasks(scope, 'CLAIM', serverSearch, isRequested('CLAIM'));

    // Unfiltered list responses already contain current-scope category totals.
    // Search and list failures still need the global counts endpoint for the active scope only.
    const needsGlobalCounts = demandLoading || !!serverSearch || [prTasksQuery, poTasksQuery, reservationTasksQuery, claimTasksQuery].some(query => query.isError);
    const myCountsQuery = useCategoryCounts('my', { enabled: isMyScope && needsGlobalCounts });
    const approvedCountsQuery = useCategoryCounts('approved', { enabled: !isMyScope && needsGlobalCounts });
    const prTotal = !prTasksQuery.isPlaceholderData && !prTasksQuery.isError ? prTasksQuery.data?.pages[0]?.total : undefined;
    const poTotal = !poTasksQuery.isPlaceholderData && !poTasksQuery.isError ? poTasksQuery.data?.pages[0]?.total : undefined;
    const reservationTotal = !reservationTasksQuery.isPlaceholderData && !reservationTasksQuery.isError ? reservationTasksQuery.data?.pages[0]?.total : undefined;
    const claimTotal = !claimTasksQuery.isPlaceholderData && !claimTasksQuery.isError ? claimTasksQuery.data?.pages[0]?.total : undefined;
    const pageCounts = useMemo<CategoryCountsResponse | undefined>(() => {
        if (serverSearch || demandLoading) return undefined;
        const totals = [prTotal, poTotal, reservationTotal, claimTotal];
        return {
            PR: prTotal ?? null,
            PO: poTotal ?? null,
            RESERVATION: reservationTotal ?? null,
            CLAIM: claimTotal ?? null,
            ALL: totals.reduce<number>((sum, total) => sum + (total ?? 0), 0),
            complete: totals.every(total => total !== undefined),
        };
    }, [serverSearch, demandLoading, prTotal, poTotal, reservationTotal, claimTotal]);

    const sourceUpdatedAt = Math.min(prTasksQuery.dataUpdatedAt, poTasksQuery.dataUpdatedAt, reservationTasksQuery.dataUpdatedAt, claimTasksQuery.dataUpdatedAt);
    // Preserve complete unfiltered totals with their original freshness. A refresh
    // with unchanged totals still advances the source timestamp and clears staleness.
    useEffect(() => {
        cacheListCategoryCounts(queryClient, scope, pageCounts, sourceUpdatedAt);
    }, [pageCounts, queryClient, scope, sourceUpdatedAt]);

    const cachedCounts = isMyScope ? myCountsQuery.data : approvedCountsQuery.data;
    let currentCounts = pageCounts ? {
        PR: pageCounts.PR ?? cachedCounts?.PR ?? null,
        PO: pageCounts.PO ?? cachedCounts?.PO ?? null,
        RESERVATION: pageCounts.RESERVATION ?? cachedCounts?.RESERVATION ?? null,
        CLAIM: pageCounts.CLAIM ?? cachedCounts?.CLAIM ?? null,
        ALL: pageCounts.complete ? pageCounts.ALL : cachedCounts?.ALL ?? pageCounts.ALL,
        complete: pageCounts.complete || cachedCounts?.complete === true,
    } : cachedCounts;
    if (demandLoading && !serverSearch) {
        const summaryUpdatedAt = (isMyScope ? myCountsQuery : approvedCountsQuery).dataUpdatedAt;
        const sources = { PR: prTasksQuery, PO: poTasksQuery, RESERVATION: reservationTasksQuery, CLAIM: claimTasksQuery };
        const merged: CategoryCountsResponse = { PR: null, PO: null, RESERVATION: null, CLAIM: null, ALL: 0, complete: false, ...cachedCounts };
        for (const category of Object.keys(sources) as (keyof typeof sources)[]) {
            const query = sources[category];
            if (!query.isPlaceholderData && !query.isError && query.data && query.dataUpdatedAt >= summaryUpdatedAt) {
                merged[category] = query.data.pages[0]?.total ?? merged[category];
            }
        }
        const values = [merged.PR, merged.PO, merged.RESERVATION, merged.CLAIM];
        merged.complete = values.every(value => value !== null);
        merged.ALL = values.reduce<number>((sum, value) => sum + (value ?? 0), 0);
        currentCounts = cachedCounts || values.some(value => value !== null) ? merged : undefined;
    }
    const myCategoryCountsQuery = { ...myCountsQuery, data: isMyScope ? currentCounts : myCountsQuery.data };
    const approvedCategoryCountsQuery = { ...approvedCountsQuery, data: isMyScope ? approvedCountsQuery.data : currentCounts };
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
    const isLoadingList = demandLoading
        ? categoryCountsQuery.isLoading && !categoryCountsQuery.data && tasks.length === 0
        : queryList.every((query) => query.isLoading);
    const categoryStates = Object.fromEntries(Object.entries(categoryQueries).map(([category, query]) => [
        category, { isLoading: demandLoading ? query.isPending && isRequested(category as Exclude<ObjectCategory, 'ALL'>) : query.isLoading, error: query.error },
    ])) as CategoryStates;
    const isFetchingNextPage = queryList.some((query) => query.isFetchingNextPage || (demandLoading && query.isFetching && !query.data));
    const hasNextPage = Object.entries(categoryQueries).some(([category, query]) => query.hasNextPage ||
        (demandLoading && !query.data && (categoryCountsQuery.data?.[category as Exclude<ObjectCategory, 'ALL'>] ?? 1) > 0));
    const listError = queryList.find((query) => query.isError)?.error ?? categoryCountsQuery.error;
    const isListError = tasks.length === 0 && (queryList.every(query => query.isError) || (demandLoading && categoryCountsQuery.isError && !categoryCountsQuery.data));
    const isRefreshingList = (queryList.some((query) => query.isRefetching) ||
        (demandLoading && (myCountsQuery.isRefetching || approvedCountsQuery.isRefetching))) && !isFetchingNextPage;

    const handleLoadMore = useCallback((categories: ObjectCategory[]) => {
        for (const category of categories) {
            if (category === 'ALL') continue;
            const query = categoryQueries[category];
            if (query && !query.data && !query.isFetching) {
                if (serverSearch || (categoryCountsQuery.data?.[category] ?? 1) > 0) void query.fetchNextPage();
            } else if (query?.hasNextPage && !query.isFetching) {
                void query.fetchNextPage();
            }
        }
    }, [categoryQueries, categoryCountsQuery.data, serverSearch]);

    const refreshList = useCallback(() => {
        return invalidateTaskList(queryClient, selectedTaskId);
    }, [queryClient, selectedTaskId]);

    const cancelLoadMore = useCallback(() => {
        void cancelCategoryPagination(queryClient, scope, serverSearch);
    }, [queryClient, scope, serverSearch]);

    const requestedKey = requestedCategories?.join(',');
    useEffect(() => {
        if (!demandLoading || serverSearch) return;
        const requested = new Set(requestedKey?.split(',') ?? []);
        void queryClient.cancelQueries({
            queryKey: ['inbox', 'scopedTasks', scope],
            predicate: query => query.queryKey[4] === serverSearch && !requested.has(String(query.queryKey[3])) &&
                query.state.fetchMeta?.fetchMore?.direction !== 'forward',
        });
    }, [queryClient, scope, serverSearch, demandLoading, requestedKey]);

    const retryCategory = useCallback((category: ObjectCategory) => {
        if (category !== 'ALL') void categoryQueries[category].refetch();
    }, [categoryQueries]);

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
        categoryStates,
        retryCategory,
        myCategoryCountsQuery,
        approvedCategoryCountsQuery,
        isLoadingList,
        isFetchingNextPage,
        hasNextPage,
        listError,
        isListError,
        isRefreshingList,
        handleLoadMore,
        cancelLoadMore,
        refreshList,
    };
}
