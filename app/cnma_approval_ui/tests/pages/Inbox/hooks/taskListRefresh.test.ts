import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { invalidateTaskList } from '@/pages/Inbox/hooks/inboxInvalidation';

describe('manual inbox refresh', () => {
    it('awaits one fetch per active query and only marks inactive lists stale', async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        const keys = [
            ['inbox', 'scopedTasks', 'my', 'PR', ''],
            ['inbox', 'categoryCounts', 'approved'],
            ['inbox', 'task', '123'],
            ['inbox', 'task', '00123'],
        ];
        const finishes: Array<() => void> = [];
        const reads = keys.map(() => vi.fn(() => new Promise<object>(resolve => {
            finishes.push(() => resolve({ refreshed: true }));
        })));
        const unsubscribes = keys.map((queryKey, index) => new QueryObserver(client, {
            queryKey, queryFn: reads[index], initialData: {}, staleTime: Infinity,
        }).subscribe(() => {}));
        const inactiveRead = vi.fn(async () => ({}));
        const inactiveKey = ['inbox', 'scopedTasks', 'approved', 'PO', 'old search'];
        await client.fetchQuery({ queryKey: inactiveKey, queryFn: inactiveRead, staleTime: Infinity });
        inactiveRead.mockClear();
        client.setQueryData(['inbox', 'task', '456'], {});
        try {
            const refresh = invalidateTaskList(client, '000123');
            expect(refresh).toBeInstanceOf(Promise);
            for (const read of reads) expect(read).toHaveBeenCalledTimes(1);
            expect(inactiveRead).not.toHaveBeenCalled();
            expect(client.getQueryState(inactiveKey)?.isInvalidated).toBe(true);
            expect(client.getQueryState(['inbox', 'task', '456'])?.isInvalidated).toBe(false);
            let completed = false;
            void refresh.then(() => { completed = true; });
            await Promise.resolve();
            expect(completed).toBe(false);
            finishes.forEach(finish => finish());
            await refresh;
            expect(completed).toBe(true);
            for (const read of reads) expect(read).toHaveBeenCalledTimes(1);
        } finally {
            finishes.forEach(finish => finish());
            unsubscribes.forEach(unsubscribe => unsubscribe());
            client.clear();
        }
    });
});
