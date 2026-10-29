import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { useTaskSelection } from '@/pages/Inbox/hooks/useTaskSelection';

describe('selection updates', () => {
    it('does not emit another update for the same 1000 selected IDs', () => {
        const selectedIds = new Set(Array.from({ length: 1000 }, (_, i) => String(i)));
        const changed = vi.fn();
        let selection!: ReturnType<typeof useTaskSelection>;
        function Probe() {
            selection = useTaskSelection({ selectedIds, onSelectedIdsChange: changed });
            return null;
        }
        renderToString(createElement(Probe));
        selection.updateSelectedIds(new Set(selectedIds));
        expect(changed).not.toHaveBeenCalled();
        selection.updateSelectedIds(new Set(['different']));
        expect(changed).toHaveBeenCalledTimes(1);
        selection.updateSelectedIds(new Set(['different']));
        expect(changed).toHaveBeenCalledTimes(1);
    });
});
