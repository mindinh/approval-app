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

const TEXT_TO_DOC_TYPE_MAP: Record<string, { code: string; isPR?: boolean; isPO?: boolean }> = {
    'ASSET PR': { code: 'ZASS', isPR: true },
    'EXPENSE PR': { code: 'ZEXP', isPR: true },
    'MARKETING PR': { code: 'ZMAK', isPR: true },
    'TRADING PR': { code: 'ZNB1', isPR: true },
    'NON-TRADE PR': { code: 'ZNB2', isPR: true },
    'TOOLS PR': { code: 'ZTOL', isPR: true },
    'ASSET PO': { code: 'ZASS', isPO: true },
    'CONSIGNMENT PO': { code: 'ZCON', isPO: true },
    'CONSIGNMENT RETURN PO': { code: 'ZCOR', isPO: true },
    'EXPENSE PO': { code: 'ZEXP', isPO: true },
    'MARKETING PO': { code: 'ZMAK', isPO: true },
    'TRADING PO': { code: 'ZNB1', isPO: true },
    'NON-TRADE PO': { code: 'ZNB2', isPO: true },
    'TRADING RETURN PO': { code: 'ZNBR', isPO: true },
    'TOOLS PO': { code: 'ZTOL', isPO: true },
    'STOCK TRANSPORT ORDER': { code: 'ZUB', isPO: true },
    'RESERVATION': { code: 'ZBUS2093' },
    'CLAIM': { code: 'CLAIM' },
};

/**
 * Matches a task against a selected document type filter target.
 * Supports exact text match, clean text options without codes, PR vs PO category scoping,
 * and high-level legacy values.
 */
export function matchTaskDocumentType(task: InboxTask, target: string): boolean {
    if (!target) return false;
    const targetTrimmed = target.trim();
    const targetUpper = targetTrimmed.toUpperCase();

    const docType = String(task.documentType || '').toUpperCase().trim();
    const objType = String(task.objectType || '').toUpperCase().trim();
    const bType = String(task.businessContext?.type || '').toUpperCase().trim();
    const taskDefId = String(task.taskDefinitionId || '').toUpperCase().trim();
    const docDisplay = String(task.documentTypeDisplay || '').toUpperCase().trim();
    const docDesc = String(task.documentTypeDesc || '').toUpperCase().trim();

    const taskIsPR = bType === 'PR' || objType === 'PR' || taskDefId.includes('BUS2105');
    const taskIsPO = bType === 'PO' || objType === 'PO' || taskDefId.includes('BUS2012');

    // 1. Check known text mapping (e.g. 'ASSET PR' -> ZASS + PR)
    const mapped = TEXT_TO_DOC_TYPE_MAP[targetUpper];
    if (mapped) {
        if (mapped.isPR && !taskIsPR) return false;
        if (mapped.isPO && !taskIsPO) return false;
        if (docType === mapped.code || bType === mapped.code || objType === mapped.code || taskDefId.includes(mapped.code)) {
            return true;
        }
        if (docDisplay && (docDisplay === targetUpper || docDisplay.includes(targetUpper) || targetUpper.includes(docDisplay))) {
            return true;
        }
        if (docDesc && (docDesc === targetUpper || docDesc.includes(targetUpper) || targetUpper.includes(docDesc))) {
            return true;
        }
    }

    // 2. High-level / legacy category matching ('PR', 'PO', 'ZBUS2093', 'RE', 'CLAIM')
    if (targetUpper === 'PR') {
        return taskIsPR || docType === 'PR';
    }
    if (targetUpper === 'PO') {
        return taskIsPO || docType === 'PO';
    }
    if (targetUpper === 'ZBUS2093' || targetUpper === 'RE' || targetUpper === 'BUS2093') {
        return (
            bType === 'RE' ||
            bType === 'ZBUS2093' ||
            bType === 'BUS2093' ||
            objType === 'RE' ||
            objType === 'ZBUS2093' ||
            objType === 'BUS2093' ||
            taskDefId.includes('BUS2093') ||
            docType === 'RESV' ||
            docType === 'RE'
        );
    }
    if (targetUpper === 'CLAIM') {
        return bType === 'CLAIM' || objType === 'CLAIM' || docType === 'CLAIM';
    }

    // 3. Direct text match against task's documentTypeDisplay or documentTypeDesc
    if (docDisplay && (docDisplay === targetUpper || docDisplay.includes(targetUpper) || targetUpper.includes(docDisplay))) {
        return true;
    }
    if (docDesc && (docDesc === targetUpper || docDesc.includes(targetUpper) || targetUpper.includes(docDesc))) {
        return true;
    }

    // 4. Code in parentheses extraction fallback (e.g. "Asset PR (ZASS)")
    const codeMatch = targetUpper.match(/\(([^)]+)\)/);
    const targetCode = codeMatch ? codeMatch[1].trim() : targetUpper;

    const targetIsPR = targetUpper.includes(' PR') || targetUpper.startsWith('PR ') || targetUpper === 'PR';
    const targetIsPO = targetUpper.includes(' PO') || targetUpper.startsWith('PO ') || targetUpper === 'PO';

    if (targetIsPR && !taskIsPR) return false;
    if (targetIsPO && !taskIsPO) return false;

    if (docType && docType === targetCode) {
        return true;
    }
    if (bType && bType === targetCode) {
        return true;
    }
    if (objType && objType === targetCode) {
        return true;
    }
    if (taskDefId && taskDefId.includes(targetCode)) {
        return true;
    }

    // Fallback: task title contains target text
    const targetTextWithoutCode = targetUpper.replace(/\s*\([^)]*\)/, '').trim();
    if (targetTextWithoutCode && task.title) {
        if (task.title.toUpperCase().includes(targetTextWithoutCode)) {
            return true;
        }
    }

    return false;
}

export function useTaskFilters(tasks: InboxTask[], scope?: string) {
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

        if (Array.isArray(v.priority) && v.priority.length > 0) {
            const prioritySet = new Set(v.priority as string[]);
            result = result.filter((task) => !!task.priority && prioritySet.has(task.priority));
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
                if (!task.createdOn) return false;
                const t = new Date(task.createdOn).getTime();
                return !isNaN(t) && t >= from && t <= to;
            });
        }

        return result;
    }, [tasks, appliedValues]);

    // ── Derived: has active filter ───────────────────────
    const hasLocalFilter =
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
        // Mobile
        mobileFiltersOpen,
        setMobileFiltersOpen,
        mobileActiveFilterCount,
    };
}
