import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { cacheListCategoryCounts } from '@/pages/Inbox/hooks/useInboxData';
import { inboxKeys } from '@/pages/Inbox/hooks/inboxKeys';

const counts = { PR: 80, PO: 10, RESERVATION: 0, CLAIM: 2, ALL: 92, complete: true };

describe('list totals and global count cache synchronization', () => {
    it('seeds complete totals with the list timestamp and does not write again on repeated renders', () => {
        const client = new QueryClient();
        try {
            const write = vi.spyOn(client, 'setQueryData');
            cacheListCategoryCounts(client, 'my', counts, 100);
            expect(client.getQueryData(inboxKeys.categoryCounts('my'))).toEqual(counts);
            expect(client.getQueryState(inboxKeys.categoryCounts('my'))?.dataUpdatedAt).toBe(100);
            cacheListCategoryCounts(client, 'my', { ...counts }, 100);
            expect(write).toHaveBeenCalledTimes(1);
        } finally { client.clear(); }
    });

    it('keeps invalidated counts stale until a newer list snapshot arrives, even when totals are unchanged', async () => {
        const client = new QueryClient();
        try {
            cacheListCategoryCounts(client, 'my', counts, 100);
            await client.invalidateQueries({ queryKey: inboxKeys.categoryCounts('my') });
            cacheListCategoryCounts(client, 'my', counts, 100);
            expect(client.getQueryState(inboxKeys.categoryCounts('my'))?.isInvalidated).toBe(true);
            cacheListCategoryCounts(client, 'my', counts, 200);
            expect(client.getQueryState(inboxKeys.categoryCounts('my'))?.isInvalidated).toBe(false);
            expect(client.getQueryState(inboxKeys.categoryCounts('my'))?.dataUpdatedAt).toBe(200);
        } finally { client.clear(); }
    });

    it('does not seed partial/search/placeholder snapshots or overwrite newer API counts with old list data', () => {
        const client = new QueryClient();
        try {
            cacheListCategoryCounts(client, 'my', undefined, 100);
            cacheListCategoryCounts(client, 'my', { ...counts, complete: false }, 100);
            cacheListCategoryCounts(client, 'my', counts, 0);
            expect(client.getQueryData(inboxKeys.categoryCounts('my'))).toBeUndefined();
            client.setQueryData(inboxKeys.categoryCounts('my'), { ...counts, PR: 90, ALL: 102 }, { updatedAt: 200 });
            cacheListCategoryCounts(client, 'my', counts, 100);
            expect(client.getQueryData(inboxKeys.categoryCounts('my'))).toEqual({ ...counts, PR: 90, ALL: 102 });
        } finally { client.clear(); }
    });

    it('isolates rapid scope changes so completed totals cannot overwrite pending totals', () => {
        const client = new QueryClient();
        try {
            cacheListCategoryCounts(client, 'my', counts, 100);
            cacheListCategoryCounts(client, 'approved', { ...counts, PR: 1, ALL: 13 }, 200);
            cacheListCategoryCounts(client, 'my', counts, 100);
            expect(client.getQueryData(inboxKeys.categoryCounts('my'))).toEqual(counts);
            expect(client.getQueryData(inboxKeys.categoryCounts('approved'))).toEqual({ ...counts, PR: 1, ALL: 13 });
        } finally { client.clear(); }
    });
});
