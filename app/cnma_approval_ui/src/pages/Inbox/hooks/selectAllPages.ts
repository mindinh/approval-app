import type { InboxTask } from '@/services/inbox/inbox.types';
import type { ObjectCategory } from '../utils/categoryUtils';

/** Advance an explicitly requested Select All; failures require a user retry. */
export function advanceSelectAllPages(options: {
    tasks: InboxTask[];
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    hasError: boolean;
    updateSelectedIds: (ids: Set<string>) => void;
    stop: () => void;
    loadMore?: (categories: ObjectCategory[]) => void;
}) {
    options.updateSelectedIds(new Set(options.tasks
        .filter(task => task.normalTask !== false)
        .map(task => task.instanceId)));
    if (options.hasError || !options.hasNextPage) {
        options.stop();
    } else if (!options.isFetchingNextPage) {
        options.loadMore?.(['PR', 'PO', 'CLAIM', 'RESERVATION']);
    }
}
