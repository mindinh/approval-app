/**
 * useTaskSelection — manages multi-select state for the task list.
 *
 * Owns:
 *   - selection mode toggle
 *   - selected task IDs
 *   - select all / toggle individual / clear
 *
 * Supports both controlled (external) and uncontrolled (internal) modes.
 */
import { useState, useCallback, useLayoutEffect, useRef } from 'react';
import type { InboxTask } from '@/services/inbox/inbox.types';

interface UseTaskSelectionOptions {
    /** External selection mode (controlled) */
    selectionMode?: boolean;
    /** External selected IDs (controlled) */
    selectedIds?: Set<string>;
    /** Callback when selection mode changes */
    onSelectionModeChange?: (mode: boolean) => void;
    /** Callback when selected IDs change */
    onSelectedIdsChange?: (ids: Set<string>) => void;
}

export function useTaskSelection(options: UseTaskSelectionOptions = {}) {
    const { onSelectionModeChange, onSelectedIdsChange } = options;
    const [internalMode, setInternalMode] = useState(false);
    const [internalIds, setInternalIds] = useState<Set<string>>(() => new Set());

    const selectionMode = options.selectionMode !== undefined ? options.selectionMode : internalMode;
    const selectedIds = options.selectedIds !== undefined ? options.selectedIds : internalIds;

    // Latest committed selection, also advanced eagerly by updateSelectedIds so
    // consecutive updates within one event see each other.
    const selectedIdsRef = useRef(selectedIds);
    useLayoutEffect(() => {
        selectedIdsRef.current = selectedIds;
    });

    const setSelectionMode = useCallback(
        (mode: boolean) => {
            setInternalMode(mode);
            onSelectionModeChange?.(mode);
        },
        [onSelectionModeChange]
    );

    const updateSelectedIds = useCallback(
        (newIds: Set<string>) => {
            const previous = selectedIdsRef.current;
            if (previous.size === newIds.size && [...newIds].every(id => previous.has(id))) return;
            selectedIdsRef.current = newIds;
            setInternalIds(newIds);
            onSelectedIdsChange?.(newIds);
        },
        [onSelectedIdsChange]
    );

    const toggleSelection = useCallback(
        (taskId: string) => {
            const prev = selectedIdsRef.current;
            const next = new Set(prev);
            if (next.has(taskId)) {
                next.delete(taskId);
            } else {
                next.add(taskId);
            }
            updateSelectedIds(next);
        },
        [updateSelectedIds]
    );

    const toggleSelectAll = useCallback(
        (tasks: InboxTask[]) => {
            const prev = selectedIdsRef.current;
            const allSelected = tasks.length > 0 && tasks.every((t) => prev.has(t.instanceId));
            if (allSelected) {
                updateSelectedIds(new Set<string>());
            } else {
                updateSelectedIds(new Set(tasks.map((t) => t.instanceId)));
            }
        },
        [updateSelectedIds]
    );

    const exitSelectionMode = useCallback(() => {
        setSelectionMode(false);
        updateSelectedIds(new Set<string>());
    }, [setSelectionMode, updateSelectedIds]);

    return {
        selectionMode,
        selectedIds,
        setSelectionMode,
        updateSelectedIds,
        toggleSelection,
        toggleSelectAll,
        exitSelectionMode,
    };
}
