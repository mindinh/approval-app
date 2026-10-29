import { afterEach, describe, expect, it, vi } from 'vitest';
import { InfiniteQueryObserver, QueryClient } from '@tanstack/react-query';
import { categoryTasksQueryOptions } from '@/pages/Inbox/hooks/inboxQueries';
import { cancelCategoryPagination } from '@/pages/Inbox/hooks/cancelPagination';
import { inboxApi } from '@/services/inbox/inbox.api';
import type { InboxTask } from '@/services/inbox/inbox.types';

vi.mock('@/contexts/useErrorModal', () => ({ useErrorModal: () => ({ showError: vi.fn() }) }));
afterEach(() => vi.restoreAllMocks());

describe('cancel Select All pagination', () => {
    it.each(['my', 'approved'] as const)('cancels an explicit Select All first page in an unopened %s category', async scope => {
        let signal: AbortSignal | undefined;
        vi.spyOn(inboxApi, scope === 'my' ? 'getTasks' : 'getApprovedTasks').mockImplementation((_params, requestSignal) => {
            signal = requestSignal;
            return new Promise(() => {});
        });
        const client = new QueryClient();
        try {
            const observer = new InfiniteQueryObserver(client, { ...categoryTasksQueryOptions(scope, 'PO'), enabled: false });
            const request = observer.fetchNextPage();
            expect(signal?.aborted).toBe(false);
            await cancelCategoryPagination(client, scope, '');
            await request;
            expect(signal?.aborted).toBe(true);
            expect(observer.getCurrentResult().data).toBeUndefined();
        } finally { client.clear(); }
    });
    it.each(['my', 'approved'] as const)('aborts only next-page requests for %s and preserves loaded pages', async scope => {
        const signals: AbortSignal[] = [];
        const pending = (_params: unknown, signal?: AbortSignal) => {
            signals.push(signal!);
            return new Promise<never>(() => {});
        };
        vi.spyOn(inboxApi, 'getTasks').mockImplementation(pending);
        vi.spyOn(inboxApi, 'getApprovedTasks').mockImplementation(pending);
        const client = new QueryClient();
        const options = categoryTasksQueryOptions(scope, 'PR', '');
        const firstPage = { items: [{ instanceId: '1' }] as InboxTask[], total: 1001 };
        client.setQueryData(options.queryKey, { pages: [firstPage], pageParams: [0] });
        const observer = new InfiniteQueryObserver(client, options);
        const otherOptions = categoryTasksQueryOptions(scope === 'my' ? 'approved' : 'my', 'PR', '');
        client.setQueryData(otherOptions.queryKey, { pages: [firstPage], pageParams: [0] });
        const other = new InfiniteQueryObserver(client, otherOptions);
        try {
            const request = observer.fetchNextPage();
            const otherRequest = other.fetchNextPage();
            const initialRequest = client.fetchInfiniteQuery(categoryTasksQueryOptions(scope, 'PO', ''));
            void initialRequest.catch(() => {});
            await cancelCategoryPagination(client, scope, '');
            expect(signals[0].aborted).toBe(true);
            await request;
            expect(signals[1].aborted).toBe(false);
            expect(signals[2].aborted).toBe(false);
            expect(observer.getCurrentResult().data?.pages).toEqual([firstPage]);
            expect(observer.getCurrentResult().hasNextPage).toBe(true);
            expect(observer.getCurrentResult().isFetchingNextPage).toBe(false);
            client.clear();
            await otherRequest;
        } finally { client.clear(); }
    });
});
