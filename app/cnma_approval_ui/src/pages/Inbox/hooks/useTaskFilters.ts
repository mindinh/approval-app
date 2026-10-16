/**
 * useTaskFilters — manages client-side filter state for the inbox task list.
 *
 * Owns:
 *   - filter field configuration (visible set, ordering)
 *   - filter values (draft + applied)
 *   - client-side filtering of tasks[]
 *   - active filter count for badge display
 *
 * Must NOT:
 *   - Contain rendering logic
 *   - Trigger API calls (filtering is purely client-side on the current page)
 */
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { InboxTask } from '@/services/inbox/inbox.types';
import type { FilterFieldConfig, FilterValues, FilterSettingItem } from '@/components/filterbar/types';
import { initializeFilterValues } from '@/components/filterbar';
import { INBOX_FILTER_CONFIG } from '@/pages/Inbox/components/inboxFilterConfig';
import {
    getTaskObjectCategory,
    computeCategoryCounts,
    type ObjectCategory,
} from '../utils/categoryUtils';

import {
    TEXT_TO_DOC_TYPE_MAP,
    getDocumentCreationTimestamp,
    matchTaskDocumentType,
} from '../utils/taskFilterMatchers';

export {
    TEXT_TO_DOC_TYPE_MAP,
    getDocumentCreationTimestamp,
    matchTaskDocumentType,
};


export function useTaskFilters(tasks: InboxTask[], scope?: string, activeCategory?: ObjectCategory | null) {
    // ── Filter configuration ─────────────────────────────
    const [filterConfig, setFilterConfig] = useState<FilterFieldConfig[]>(
        () => INBOX_FILTER_CONFIG.filter((f) => f.visible !== false)
    );
    const [allFilterConfig] = useState<FilterFieldConfig[]>(() => [...INBOX_FILTER_CONFIG]);
    const [filterValues, setFilterValues] = useState<FilterValues>(
        () => initializeFilterValues(INBOX_FILTER_CONFIG)
    );
    const [appliedValues, setAppliedValues] = useState<FilterValues>(
        () => initializeFilterValues(INBOX_FILTER_CONFIG)
    );

    // Keep typing responsive by applying text search only after a short pause.
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setAppliedValues((current) => ({ ...current, search: filterValues.search }));
        }, 350);

        return () => clearTimeout(timeoutId);
    }, [filterValues.search]);

    // Live counts for 4 categories
    const categoryCounts = useMemo(() => computeCategoryCounts(tasks), [tasks]);

    // Auto-clear filters whenever scope changes (e.g., My Tasks <-> Approved Tasks)
    const prevScopeRef = useRef(scope);
    useEffect(() => {
        if (prevScopeRef.current !== scope) {
            prevScopeRef.current = scope;
            const cleared = initializeFilterValues(INBOX_FILTER_CONFIG);
            setFilterValues(cleared);
            setAppliedValues(cleared);
        }
    }, [scope]);

    // ── Mobile filter drawer ─────────────────────────────
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

    // ── Handlers ─────────────────────────────────────────
    const handleFilterApply = useCallback((values: FilterValues) => {
        setAppliedValues({ ...values });
    }, []);

    const handleFilterClear = useCallback(() => {
        const cleared = initializeFilterValues(INBOX_FILTER_CONFIG);
        setFilterValues(cleared);
        setAppliedValues(cleared);
    }, []);

    const handleAdaptFilter = useCallback(
        (filters: FilterSettingItem[]) => {
            const visibleKeys = new Set(filters.filter((f) => f.visible).map((f) => f.name));
            const orderedKeys = filters.map((f) => f.name);
            const newConfig: FilterFieldConfig[] = [];
            for (const key of orderedKeys) {
                if (visibleKeys.has(key)) {
                    const found = allFilterConfig.find((f) => f.key === key);
                    if (found) newConfig.push({ ...found, visible: true });
                }
            }
            setFilterConfig(newConfig);
        },
        [allFilterConfig]
    );

    // ── Client-side filtering ────────────────────────────
    const filteredTasks = useMemo(() => {
        let result = tasks;

        // 1. Filter by 4 Object Categories if selected
        if (activeCategory && activeCategory !== 'ALL') {
            result = result.filter((task) => getTaskObjectCategory(task) === activeCategory);
        }

        const v = appliedValues;

        if (v.search?.trim()) {
            const q = v.search.toLowerCase();
            result = result.filter(
                (task) =>
                    task.title.toLowerCase().includes(q) ||
                    task.requestorName?.toLowerCase().includes(q) ||
                    task.createdByName?.toLowerCase().includes(q) ||
                    task.businessContext?.documentId?.toLowerCase().includes(q)
            );
        }

        if (Array.isArray(v.status) && v.status.length > 0) {
            const statusSet = new Set(v.status as string[]);
            result = result.filter((task) => statusSet.has(task.status));
        }

        const selectedDocTypes = Array.isArray(v.documentType)
            ? (v.documentType as string[])
            : v.documentType
                ? [String(v.documentType)]
                : [];

        if (selectedDocTypes.length > 0) {
            result = result.filter((task) => {
                return selectedDocTypes.some((target) => matchTaskDocumentType(task, target));
            });
        }

        if (v.normalTask) {
            if (v.normalTask === 'NORMAL') {
                result = result.filter((task) => task.normalTask !== false);
            } else if (v.normalTask === 'TAGGED') {
                result = result.filter((task) => task.normalTask === false);
            }
        }

        if (v.createdBy?.trim()) {
            const q = v.createdBy.toLowerCase();
            result = result.filter(
                (task) =>
                    task.requestorName?.toLowerCase().includes(q) ||
                    task.createdByName?.toLowerCase().includes(q)
            );
        }

        if (v.documentId?.trim()) {
            const q = v.documentId.toLowerCase();
            result = result.filter(
                (task) => task.businessContext?.documentId?.toLowerCase().includes(q)
            );
        }

        if (v.createdDate?.from || v.createdDate?.to) {
            const fromDate = v.createdDate.from ? new Date(v.createdDate.from) : null;
            const toDate = v.createdDate.to ? new Date(v.createdDate.to) : null;
            const from = fromDate && !isNaN(fromDate.getTime()) ? fromDate.getTime() : 0;
            const to = toDate && !isNaN(toDate.getTime())
                ? new Date(toDate.getTime()).setHours(23, 59, 59, 999)
                : Infinity;
            result = result.filter((task) => {
                const documentCreatedAt = getDocumentCreationTimestamp(task);
                return documentCreatedAt !== null && documentCreatedAt >= from && documentCreatedAt <= to;
            });
        }

        return result;
    }, [tasks, appliedValues, activeCategory]);

    // ── Derived: has active filter ───────────────────────
    const hasLocalFilter =
        (!!activeCategory && activeCategory !== 'ALL') ||
        !!appliedValues.search?.trim() ||
        Object.entries(appliedValues).some(([key, value]) => {
            if (key === 'search') return false;
            if (Array.isArray(value)) return value.length > 0;
            if (typeof value === 'object' && value !== null)
                return Boolean((value as any).from || (value as any).to);
            return Boolean(value);
        });

    const mobileActiveFilterCount = Object.entries(appliedValues).filter(([k, v]) => {
        if (k === 'search') return false;
        if (Array.isArray(v)) return v.length > 0;
        if (typeof v === 'object' && v !== null) return (v as any).from || (v as any).to;
        return !!v;
    }).length;

    return {
        // Config
        filterConfig,
        allFilterConfig,
        // Values
        filterValues,
        setFilterValues,
        appliedValues,
        // Handlers
        handleFilterApply,
        handleFilterClear,
        handleAdaptFilter,
        // Filtered data
        filteredTasks,
        hasLocalFilter,
        categoryCounts,
        // Mobile
        mobileFiltersOpen,
        setMobileFiltersOpen,
        mobileActiveFilterCount,
    };
}
