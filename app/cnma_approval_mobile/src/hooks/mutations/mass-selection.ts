import { useSyncExternalStore } from 'react';
import type { TaskSummary } from '@/utils/task-summary';

/**
 * At most this many tasks per mass decision. The BFF decides four at a time against SAP, so a larger batch
 * would take minutes on a phone connection (and the request could time out with an unclear outcome).
 */
export const MASS_LIMIT = 50;

export interface MassSelectionState {
    /** Selection mode is on in the Inbox (cards show check marks, the action bar replaces navigation). */
    active: boolean;
    /** Selected tasks in the order they were picked. */
    tasks: ReadonlyMap<string, TaskSummary>;
}

const EMPTY: MassSelectionState = { active: false, tasks: new Map() };
let state = EMPTY;
const listeners = new Set<() => void>();

function set(next: MassSelectionState) {
    state = next;
    listeners.forEach((listener) => listener());
}

/** CC tasks are for review only: they can never be decided, so they cannot be selected (web rule). */
export const isSelectable = (task: TaskSummary) => !task.isCc && !task.completed;

/**
 * Inbox multi-select for mass Approve / Reject (web: MassActionBar + MassDecisionDialog). Shared by the
 * worklist (selecting) and the mass decision sheet (sending), in memory only.
 */
export const massSelection = {
    get: () => state,
    start: () => set({ active: true, tasks: new Map() }),
    /** Leaves selection mode and forgets the selection (Cancel, or after a decision). */
    end: () => set(EMPTY),
    /** @returns false when the task cannot be added (CC, or the limit is reached) */
    toggle: (task: TaskSummary): boolean => {
        const tasks = new Map(state.tasks);
        if (tasks.has(task.instanceId)) tasks.delete(task.instanceId);
        else if (!isSelectable(task) || tasks.size >= MASS_LIMIT) return false;
        else tasks.set(task.instanceId, task);
        set({ ...state, tasks });
        return true;
    },
    /** Selects the given tasks (up to the limit), or clears them all when every one is already selected. */
    toggleAll: (candidates: readonly TaskSummary[]) => {
        const selectable = candidates.filter(isSelectable);
        const allSelected = selectable.length > 0 && selectable.every((task) => state.tasks.has(task.instanceId));
        if (allSelected) {
            set({ ...state, tasks: new Map() });
            return;
        }
        const tasks = new Map(state.tasks);
        for (const task of selectable) {
            if (tasks.size >= MASS_LIMIT) break;
            tasks.set(task.instanceId, task);
        }
        set({ ...state, tasks });
    },
};

export function useMassSelection(): MassSelectionState {
    return useSyncExternalStore(
        (onChange) => {
            listeners.add(onChange);
            return () => listeners.delete(onChange);
        },
        () => state,
        () => EMPTY
    );
}
