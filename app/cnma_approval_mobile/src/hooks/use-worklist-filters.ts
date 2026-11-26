import { useCallback, useSyncExternalStore } from 'react';
import type { TaskCategory, TaskScope } from '@/lib/api/bff-api';
import { EMPTY_FILTERS, filtersForCategory, type TaskFilters } from '@/utils/task-filters';

export type CategoryFilterValue = TaskCategory | 'ALL';

export interface WorklistFilterState {
    category: CategoryFilterValue;
    filters: TaskFilters;
}

const INITIAL: WorklistFilterState = { category: 'ALL', filters: EMPTY_FILTERS };

/**
 * Filter state per worklist (Inbox / Approved), shared between the list screen and the filter sheet
 * route. Kept in memory for the session, like the web filter bar.
 */
const state: Record<TaskScope, WorklistFilterState> = { open: INITIAL, approved: INITIAL };
const listeners = new Set<() => void>();

function update(scope: TaskScope, next: WorklistFilterState) {
    state[scope] = next;
    listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function useWorklistFilters(scope: TaskScope) {
    const current = useSyncExternalStore(subscribe, () => state[scope]);

    const setCategory = useCallback((category: CategoryFilterValue) => update(scope, { category, filters: filtersForCategory(state[scope].filters, category) }), [scope]);
    const setFilters = useCallback((filters: TaskFilters) => update(scope, { ...state[scope], filters }), [scope]);
    const reset = useCallback(() => update(scope, INITIAL), [scope]);

    return { ...current, setCategory, setFilters, reset };
}
