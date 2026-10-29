import { describe, expect, it, vi, afterEach } from 'vitest';
import { InfiniteQueryObserver, QueryClient } from '@tanstack/react-query';
import { categoryTasksQueryOptions } from '@/pages/Inbox/hooks/inboxQueries';
import { inboxApi } from '@/services/inbox/inbox.api';

vi.mock('@/contexts/useErrorModal', () => ({ useErrorModal: () => ({ showError: vi.fn() }) }));
afterEach(() => vi.restoreAllMocks());

describe('category task query lifecycle', () => {
    it('requests a bounded page and reuses the fresh cache on remount', async () => {
        const read = vi.spyOn(inboxApi, 'getTasks').mockResolvedValue({ items: [], total: 0 });
        const client = new QueryClient();
        const options = categoryTasksQueryOptions('my', 'PR', '');
        try {
            await client.fetchInfiniteQuery(options);
            expect(read).toHaveBeenCalledWith({ top: 25, skip: 0, category: 'PR', search: undefined }, expect.any(AbortSignal));
            const observer = new InfiniteQueryObserver(client, options);
            const unsubscribe = observer.subscribe(() => {});
            expect(observer.getCurrentResult().isStale).toBe(false);
            expect(read).toHaveBeenCalledTimes(1);
            unsubscribe();
        } finally { client.clear(); }
    });

    it('cancels an abandoned search request', async () => {
        let requestSignal: AbortSignal | undefined;
        vi.spyOn(inboxApi, 'getTasks').mockImplementation((_params, signal) => {
            requestSignal = signal;
            return new Promise(() => {});
        });
        const client = new QueryClient();
        try {
            const observer = new InfiniteQueryObserver(client, categoryTasksQueryOptions('my', 'PO', 'old'));
            const unsubscribe = observer.subscribe(() => {});
            expect(requestSignal?.aborted).toBe(false);
            unsubscribe();
            expect(requestSignal?.aborted).toBe(true);
        } finally { client.clear(); }
    });

    it('keeps results visible during search but never carries My Tasks into Approved', async () => {
        vi.spyOn(inboxApi, 'getTasks').mockResolvedValue({ items: [], total: 4 });
        vi.spyOn(inboxApi, 'getApprovedTasks').mockImplementation(() => new Promise(() => {}));
        const client = new QueryClient();
        try {
            const options = categoryTasksQueryOptions('my', 'PR', '');
            await client.fetchInfiniteQuery(options);
            const observer = new InfiniteQueryObserver(client, options);
            const unsubscribe = observer.subscribe(() => {});
            observer.setOptions(categoryTasksQueryOptions('my', 'PR', 'new'));
            expect(observer.getCurrentResult().data?.pages[0].total).toBe(4);
            observer.setOptions(categoryTasksQueryOptions('approved', 'PR', ''));
            expect(observer.getCurrentResult().data).toBeUndefined();
            unsubscribe();
        } finally { client.clear(); }
    });

    it('advances pagination by the actual returned rows', async () => {
        const read = vi.spyOn(inboxApi, 'getTasks')
            .mockResolvedValueOnce({ items: Array.from({ length: 7 }, (_, i) => ({ instanceId: String(i) })) as any, total: 30 })
            .mockResolvedValueOnce({ items: [], total: 30 });
        const client = new QueryClient();
        try {
            const options = categoryTasksQueryOptions('my', 'PR', '');
            await client.fetchInfiniteQuery(options);
            const observer = new InfiniteQueryObserver(client, options);
            await observer.fetchNextPage();
            expect(read.mock.calls[1][0]?.skip).toBe(7);
            expect(observer.getCurrentResult().hasNextPage).toBe(false);
        } finally { client.clear(); }
    });
});
