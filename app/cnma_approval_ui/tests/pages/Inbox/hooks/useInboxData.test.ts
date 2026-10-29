import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { useInboxData } from '@/pages/Inbox/hooks/useInboxData';
import { inboxKeys } from '@/pages/Inbox/hooks/inboxKeys';

vi.mock('@/contexts/useErrorModal', () => ({ useErrorModal: () => ({ showError: vi.fn() }) }));

const categories = ['PR', 'PO', 'RESERVATION', 'CLAIM'] as const;
function readHook(client: QueryClient, scope: 'my' | 'approved' = 'my', search = '', requestedCategories?: typeof categories[number][]) {
    let result!: ReturnType<typeof useInboxData>;
    function Probe() {
        result = useInboxData({ scope, serverSearch: search, requestedCategories });
        return null;
    }
    renderToString(createElement(QueryClientProvider, { client }, createElement(Probe)));
    return result;
}
function seedCategory(client: QueryClient, category: typeof categories[number], total: number, scope: 'my' | 'approved' = 'my', search = '', withItem = true) {
    client.setQueryData(inboxKeys.scopedTasks(scope, category, search), {
        pages: [{ items: withItem ? [{ instanceId: `${scope}-${category}`, createdOn: '2026-10-20', objectType: category }] : [], total }], pageParams: [0],
    });
}

describe('inbox progressive data and global counts', () => {
    it('waits for the initial summary instead of briefly reporting an empty inbox', () => {
        const client = new QueryClient();
        try {
            const result = readHook(client, 'my', '', []);
            expect(result.isLoadingList).toBe(true);
            expect(result.categoryCountsQuery.data).toBeUndefined();
        } finally { client.clear(); }
    });
    it.each(['my', 'approved'] as const)('shows all %s totals without eagerly fetching unopened lists', scope => {
        const client = new QueryClient();
        try {
            client.setQueryData(inboxKeys.categoryCounts(scope), { PR: 1001, PO: 4, CLAIM: 0, RESERVATION: 0, ALL: 1005, complete: true });
            const result = readHook(client, scope, '', []);
            expect(result.totalTasks).toBe(1005);
            expect(result.categoryTotals.PO[scope === 'my' ? 'pending' : 'completed']).toBe(4);
            expect(result.isLoadingList).toBe(false);
            expect(result.categoryStates.PR.isLoading).toBe(false);
            expect(result.hasNextPage).toBe(true);
            const oppositeScope = scope === 'my' ? 'approved' : 'my';
            expect((client.getQueryCache().find({ queryKey: inboxKeys.categoryCounts(oppositeScope) })?.options as { enabled?: boolean }).enabled).toBe(false);
            for (const cat of categories) expect(client.getQueryCache().find({ queryKey: inboxKeys.scopedTasks(scope, cat, '') })?.options.enabled).toBe(false);
        } finally { client.clear(); }
    });

    it('enables only an opened category and preserves empty global totals', () => {
        const client = new QueryClient();
        try {
            client.setQueryData(inboxKeys.categoryCounts('my'), { PR: 0, PO: 0, CLAIM: 0, RESERVATION: 0, ALL: 0, complete: true });
            const result = readHook(client, 'my', '', ['PO']);
            expect(result.hasNextPage).toBe(false);
            expect(client.getQueryCache().find({ queryKey: inboxKeys.scopedTasks('my', 'PR', '') })?.options.enabled).toBe(false);
        } finally { client.clear(); }
    });

    it('uses a newer unfiltered list total when the summary cache predates a new task', () => {
        const client = new QueryClient();
        try {
            client.setQueryData(inboxKeys.categoryCounts('my'), { PR: 25, PO: 4, CLAIM: 0, RESERVATION: 0, ALL: 29, complete: true }, { updatedAt: 1 });
            seedCategory(client, 'PR', 26);
            const result = readHook(client, 'my', '', ['PR']);
            expect(result.categoryTotals.PR.pending).toBe(26);
            expect(result.totalTasks).toBe(30);
            expect(result.categoryTotals.PO.pending).toBe(4);
        } finally { client.clear(); }
    });
    it('displays the first successful category before the other three finish', () => {
        const client = new QueryClient();
        try {
            seedCategory(client, 'PR', 80);
            const result = readHook(client);
            expect(result.tasks).toHaveLength(1);
            expect(result.isLoadingList).toBe(false);
            expect(result.categoryStates.PO.isLoading).toBe(true);
            expect(result.myCategoryCountsQuery.data?.PR).toBe(80);
            expect(result.categoryCountsQuery.data?.complete).toBe(false);
        } finally { client.clear(); }
    });

    it('shows group loading rather than a global empty state when the first group is empty', () => {
        const client = new QueryClient();
        try {
            seedCategory(client, 'PR', 0, 'my', '', false);
            const result = readHook(client);
            expect(result.isLoadingList).toBe(false);
            expect(result.categoryStates.PO.isLoading).toBe(true);
        } finally { client.clear(); }
    });

    it.each(['my', 'approved'] as const)('uses server totals for %s and disables redundant current-scope count reads', (scope) => {
        const client = new QueryClient();
        try {
            categories.forEach((category, i) => seedCategory(client, category, 30 + i, scope));
            const result = readHook(client, scope);
            expect(result.totalTasks).toBe(126);
            expect(result.categoryCountsQuery.data?.complete).toBe(true);
            expect(result.categoryTotals.PR[scope === 'my' ? 'pending' : 'completed']).toBe(30);
            expect((client.getQueryCache().find({ queryKey: inboxKeys.categoryCounts(scope) })?.options as { enabled?: boolean }).enabled).toBe(false);
        } finally { client.clear(); }
    });

    it('keeps global counts while displaying filtered search results', () => {
        const client = new QueryClient();
        const globalCounts = { PR: 80, PO: 10, RESERVATION: 0, CLAIM: 2, ALL: 92, complete: true };
        try {
            client.setQueryData(inboxKeys.categoryCounts('my'), globalCounts);
            categories.forEach(category => seedCategory(client, category, 1, 'my', 'equipment'));
            const result = readHook(client, 'my', 'equipment');
            expect(result.myCategoryCountsQuery.data).toEqual(globalCounts);
            expect(result.totalTasks).toBe(92);
            expect((client.getQueryCache().find({ queryKey: inboxKeys.categoryCounts('my') })?.options as { enabled?: boolean }).enabled).toBe(true);
        } finally { client.clear(); }
    });

    it('retains loaded cards when another category errors and enables count fallback', () => {
        // Observe an already failed request, rather than an automatic retry on mount.
        const client = new QueryClient({ defaultOptions: { queries: { retryOnMount: false } } });
        try {
            seedCategory(client, 'PR', 20);
            client.getQueryCache().build(client, { queryKey: inboxKeys.scopedTasks('my', 'PO', '') }).setState({ status: 'error', error: new Error('SAP unavailable') });
            const result = readHook(client);
            expect(result.isLoadingList).toBe(false);
            expect(result.isListError).toBe(false);
            expect(result.tasks).toHaveLength(1);
            expect(result.categoryStates.PO.error).toBeInstanceOf(Error);
            expect((client.getQueryCache().find({ queryKey: inboxKeys.categoryCounts('my') })?.options as { enabled?: boolean }).enabled).toBe(true);
        } finally { client.clear(); }
    });
});
