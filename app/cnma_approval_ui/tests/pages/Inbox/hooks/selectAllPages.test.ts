import { describe, expect, it, vi } from 'vitest';
import { advanceSelectAllPages } from '@/pages/Inbox/hooks/selectAllPages';
import type { InboxTask } from '@/services/inbox/inbox.types';

describe('explicit multi-page selection', () => {
    it('selects all 1001 actionable tasks across every page, beyond the initially loaded 25', () => {
        const allTasks = Array.from({ length: 1001 }, (_, index) => ({ instanceId: String(index), normalTask: true })) as InboxTask[];
        let selected = new Set<string>();
        const loadMore = vi.fn();
        const stop = vi.fn();
        for (let loaded = 25; loaded < allTasks.length + 25; loaded += 25) {
            advanceSelectAllPages({
                tasks: allTasks.slice(0, loaded),
                hasNextPage: loaded < allTasks.length,
                isFetchingNextPage: false,
                hasError: false,
                updateSelectedIds: ids => { selected = ids; },
                loadMore,
                stop,
            });
        }
        expect(selected.size).toBe(1001);
        expect(selected.has('1000')).toBe(true);
        expect(loadMore).toHaveBeenCalledTimes(40);
        expect(stop).toHaveBeenCalledOnce();
    });
    const tasks = [{ instanceId: 'loaded', normalTask: true }, { instanceId: 'history', normalTask: false }] as InboxTask[];
    it('stops on a failed later page even when the query still has more pages', () => {
        const loadMore = vi.fn();
        const stop = vi.fn();
        const updateSelectedIds = vi.fn();
        advanceSelectAllPages({ tasks, hasNextPage: true, isFetchingNextPage: false, hasError: true, loadMore, stop, updateSelectedIds });
        expect(loadMore).not.toHaveBeenCalled();
        expect(stop).toHaveBeenCalledOnce();
        expect(updateSelectedIds).toHaveBeenCalledWith(new Set(['loaded']));
    });
    it('loads subsequent pages only after the previous request finishes and stops at the end', () => {
        const loadMore = vi.fn();
        const stop = vi.fn();
        const options = { tasks, hasNextPage: true, isFetchingNextPage: true, hasError: false, loadMore, stop, updateSelectedIds: vi.fn() };
        advanceSelectAllPages(options);
        expect(loadMore).not.toHaveBeenCalled();
        advanceSelectAllPages({ ...options, isFetchingNextPage: false });
        expect(loadMore).toHaveBeenCalledOnce();
        advanceSelectAllPages({ ...options, isFetchingNextPage: false, hasNextPage: false });
        expect(loadMore).toHaveBeenCalledOnce();
        expect(stop).toHaveBeenCalledOnce();
    });
});
