import type { QueryClient } from '@tanstack/react-query';
import { inboxKeys } from './inboxKeys';

/** Cancel pagination only; leave first-page loads, detail and other scopes alone. */
export function cancelCategoryPagination(client: QueryClient, scope: 'my' | 'approved', search: string) {
    return client.cancelQueries({
        queryKey: inboxKeys.scopedTasksPrefix(scope),
        predicate: query => query.queryKey[4] === search &&
            query.state.fetchMeta?.fetchMore?.direction === 'forward',
    });
}
