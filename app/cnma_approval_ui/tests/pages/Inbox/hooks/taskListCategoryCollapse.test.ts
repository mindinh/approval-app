import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { InboxTask } from '@/services/inbox/inbox.types';

// Hook lifecycle harness: run effects and preserve state across renders without
// a DOM. In particular, task arrays can change while the selected ID stays put.
const lifecycle = vi.hoisted(() => ({ slots: [] as unknown[], cursor: 0, effects: [] as (() => unknown)[] }));
vi.mock('react', () => ({
    useRef: (initial: unknown) => {
        const index = lifecycle.cursor++;
        return lifecycle.slots[index] ??= { current: initial };
    },
    useState: (initial: unknown) => {
        const index = lifecycle.cursor++;
        if (!(index in lifecycle.slots)) lifecycle.slots[index] = typeof initial === 'function' ? initial() : initial;
        return [lifecycle.slots[index], (value: unknown) => {
            lifecycle.slots[index] = typeof value === 'function' ? value(lifecycle.slots[index]) : value;
        }];
    },
    useEffect: (effect: () => unknown, deps: unknown[]) => {
        const index = lifecycle.cursor++;
        const previous = lifecycle.slots[index] as unknown[] | undefined;
        if (!previous || deps.some((value, i) => !Object.is(value, previous[i]))) lifecycle.effects.push(effect);
        lifecycle.slots[index] = deps;
    },
    useMemo: (fn: () => unknown) => fn(),
    useCallback: (fn: unknown) => fn,
}));
import { useTaskListScroll } from '@/pages/Inbox/hooks/useTaskListScroll';

beforeEach(() => { lifecycle.slots = []; lifecycle.cursor = 0; lifecycle.effects = []; vi.useFakeTimers(); });
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); });

function RenderHarness(selectedTaskId: string | null = '37260', isMobile = false) {
    lifecycle.cursor = 0;
    const tasks = [{ instanceId: '37260', objectType: 'PR' }, { instanceId: '37261', objectType: 'PR' }] as InboxTask[];
    const result = useTaskListScroll({ tasks, selectedTaskId, normSelectedId: selectedTaskId ?? '',
        filteredTasks: tasks, hasLocalFilter: false, hasNextPage: true, isFetchingNextPage: false, isMobile });
    const effects = lifecycle.effects.splice(0);
    effects.forEach(effect => effect());
    return result;
}

describe('selected task category reveal', () => {
    it.each([false, true])('allows PR to stay closed after list updates (mobile=%s)', isMobile => {
        RenderHarness('37260', isMobile);
        let result = RenderHarness('37260', isMobile);
        expect(result.expandedCategories.has('PR')).toBe(true);
        result.handleToggleCategory('PR');
        RenderHarness('37260', isMobile);
        result = RenderHarness('37260', isMobile);
        expect(result.expandedCategories.has('PR')).toBe(false);
    });

    it('reveals the category again when a different task is selected', () => {
        RenderHarness();
        RenderHarness().handleToggleCategory('PR');
        RenderHarness('37261');
        expect(RenderHarness('37261').expandedCategories.has('PR')).toBe(true);
    });

    it('keeps collapse-all closed despite updates to the selected task list', () => {
        RenderHarness();
        RenderHarness().handleToggleCollapseAll();
        RenderHarness();
        expect(RenderHarness().isAllCollapsed).toBe(true);
    });
});
