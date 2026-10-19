import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { invalidateAfterComment } from '@/pages/Inbox/hooks/inboxInvalidation';

describe('comment refresh completion', () => {
    it('waits for the updated conversation and refetches it only once', async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        let finish!: (value: { comments: string[] }) => void;
        const read = vi.fn(() => new Promise<{ comments: string[] }>(resolve => { finish = resolve; }));
        const observer = new QueryObserver(client, {
            queryKey: ['inbox', 'task', '123'], queryFn: read,
            initialData: { comments: [] as string[] }, staleTime: Infinity,
        });
        const unsubscribe = observer.subscribe(() => {});
        try {
            const refresh = invalidateAfterComment(client, '000123');
            expect(refresh).toBeInstanceOf(Promise);
            expect(read).toHaveBeenCalledTimes(1);
            let completed = false;
            void refresh.then(() => { completed = true; });
            await Promise.resolve();
            expect(completed).toBe(false);
            finish({ comments: ['Saved comment'] });
            await refresh;
            expect(client.getQueryData(['inbox', 'task', '123'])).toEqual({ comments: ['Saved comment'] });
            expect(read).toHaveBeenCalledTimes(1);
        } finally { unsubscribe(); client.clear(); }
    });

    it('invalidates padded ID aliases and workflow without affecting other tasks or lists', async () => {
        const client = new QueryClient();
        const matching = [['inbox', 'task', '00123'], ['inbox', 'task', '123'], ['inbox', 'workflow', '00123', {}]];
        const unrelated = [['inbox', 'task', '456'], ['inbox', 'tasks'], ['inbox', 'approvedTasks']];
        for (const key of [...matching, ...unrelated]) client.setQueryData(key, {});
        await invalidateAfterComment(client, '123');
        for (const key of matching) expect(client.getQueryState(key)?.isInvalidated).toBe(true);
        for (const key of unrelated) expect(client.getQueryState(key)?.isInvalidated).toBe(false);
        client.clear();
    });
});
