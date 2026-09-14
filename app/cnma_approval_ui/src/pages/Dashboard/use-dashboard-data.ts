import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inboxApi } from '@/services/inbox/inbox.api';
import { inboxKeys } from '@/pages/Inbox/hooks/inboxKeys';
import type { DashboardTask, StatusCountItem, DocTypeCountItem } from '@/services/inbox/inbox.types';
import type { FilterValues } from '@/components/filterbar/types';

// ─── Status Constants ─────────────────────────────────────
// The backend normalizes status to these display labels.
export const STATUS_LABELS = ['In Approving', 'Completed'] as const;

export const STATUS_COLORS: Record<string, string> = {
    'In Approving': 'var(--color-warning)',  // SAP Warning Orange (#e76500)
    'Completed': 'var(--color-success)',    // SAP Success Green (#30914c)
};

/**
 * Mapping code values to human-readable descriptions alongside original codes.
 */
export function getDocTypeDescription(code: string, text?: string): string {
    if (text && text.trim()) {
        const cleanCode = (code || '').toUpperCase().trim();
        if (cleanCode && !text.includes(`(${cleanCode})`)) {
            return `${text.trim()} (${cleanCode})`;
        }
        return text.trim();
    }
    const clean = (code || '').toUpperCase().trim();
    switch (clean) {
        case 'ZASS': return 'Asset (ZASS)';
        case 'ZEXP': return 'Expense PR (ZEXP)';
        case 'ZMAK': return 'Marketing (ZMAK)';
        case 'ZNB1': return 'Standard (ZNB1)';
        case 'ZNB2': return 'Non-Stock 2 (ZNB2)';
        case 'ZTOL': return 'Tooling (ZTOL)';
        case 'STANDARD': return 'Standard';
        case 'NB': return 'Standard (NB)';
        case 'ZCON': return 'Contract (ZCON)';
        case 'ZCOR': return 'Core (ZCOR)';
        case 'ZNBR': return 'Non-Stock (ZNBR)';
        case 'ZUB': return 'Stock Transfer (ZUB)';
        case 'ZFO8': return 'Expense PO (ZFO8)';
        default: return code; // Fallback to raw code
    }
}

/**
 * Client-side normalization: maps any backend status value to our 2 canonical labels.
 * Handles both old labels (Ready, In Process) and SAP codes (READY, STARTED, IN PROCESSING, etc.)
 */
export function normalizeDashboardStatus(raw: string): string {
    const upper = (raw || '').toUpperCase().trim().replace(/\s+/g, '_');
    switch (upper) {
        case 'NEW':
        case 'READY':
        case 'RESERVED':
        case 'IN_PROGRESS':
        case 'IN_PROCESS':
        case 'IN_PROCESSING':
        case 'STARTED':
            return 'In Approving';
        case 'APPROVED':
        case 'COMPLETED':
        case 'COMPLETE':
        case 'REJECTED':
            return 'Completed';
        default:
            return 'In Approving'; // Default unknown statuses to In Approving
    }
}

// ─── Donut Segment ────────────────────────────────────────
export interface DonutSegment {
    label: string;
    value: number;
    color: string;
}

// ─── Category Constants & Color Definitions ──────────────────
export type CategoryType = 'PO' | 'PR' | 'RESV' | 'CLAIM' | 'OTHER';

export const CATEGORY_COLORS: Record<CategoryType, { name: string; fill: string; border: string; bg: string; text: string }> = {
    PO: { name: 'PO (Purchase Order)', fill: 'var(--info, #0070f2)', border: '#80b8f9', bg: '#e1f4ff', text: '#0070f2' },         // Info Blue (matches PO task card)
    PR: { name: 'PR (Purchase Requisition)', fill: 'var(--color-brand, #cc0000)', border: '#990000', bg: '#ffebeb', text: '#cc0000' }, // Brand Red (matches PR task card)
    RESV: { name: 'Reservation (RESV)', fill: 'var(--warning, #e76500)', border: '#f3b280', bg: '#fff8d6', text: '#e76500' },      // Warning Orange (matches RE task card)
    CLAIM: { name: 'Claim', fill: 'var(--success, #30914c)', border: '#98c8a6', bg: '#f5fae5', text: '#30914c' },                     // Success Green (matches CLAIM task card)
    OTHER: { name: 'Other', fill: 'var(--muted-foreground, #666666)', border: '#cccccc', bg: '#f0f0f0', text: '#666666' },
};

export function resolveCategory(docCategory?: string, rawDocType?: string, label?: string): CategoryType {
    const cat = (docCategory || '').toUpperCase();
    const type = (rawDocType || '').toUpperCase();
    const lbl = (label || '').toUpperCase();

    if (cat === 'BUS2012' || type.includes('PO') || lbl.includes('PO')) return 'PO';
    if (cat === 'BUS2105' || type.includes('PR') || lbl.includes('PR')) return 'PR';
    if (cat.includes('2093') || cat.includes('RESV') || type === 'RESV' || type === 'RE' || lbl.includes('RESERVATION') || lbl.includes('RESV')) return 'RESV';
    if (cat === 'CLAIM' || type.includes('CLAIM') || lbl.includes('CLAIM')) return 'CLAIM';
    return 'OTHER';
}

/** Per document-type breakdown with the status split resolved from the task list. */
export interface TaskTypeCount {
    /** Human readable document type label, e.g. "Expense PR (ZEXP)". */
    type: string;
    /** Raw S/4 document type code the label was derived from. */
    rawDocType: string;
    category: CategoryType;
    count: number;
    inApprovingCount: number;
    completedCount: number;
}

/** Counts keyed by category, plus an ALL total. */
export type CategoryCounts = Record<CategoryType, number> & { ALL: number };

const EMPTY_CATEGORY_COUNTS = (): CategoryCounts => ({
    PO: 0, PR: 0, RESV: 0, CLAIM: 0, OTHER: 0, ALL: 0
});

/** A task after status normalization, with category and display label resolved once. */
interface NormalizedTask extends DashboardTask {
    category: CategoryType;
    typeLabel: string;
}

// ─── Table Row ────────────────────────────────────────────
export interface TableRow {
    taskType: string;
    documentTypeDesc: string;
    docNumber: string;
    currency: string;
    status: string;
    totalNetAmount: number | null;
    displayCurrency: string;
    createdAt?: string;
}

// ─── API Query Hook ───────────────────────────────────────
export function useDashboardQuery(options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: inboxKeys.dashboard(),
        queryFn: () => inboxApi.getDashboard(),
        staleTime: 5 * 60 * 1000,  // 5 min
        refetchOnWindowFocus: true,
        ...options
    });
}

// ─── Data Derivation Hook ─────────────────────────────────
/**
 * Core hook: derives all chart datasets from aggregated OData counts and task list.
 * Cross-filtering and dynamic summaries are calculated client-side.
 */
export function useDashboardData(
    tasks: DashboardTask[],
    appliedFilters: FilterValues,
    statusCounts?: StatusCountItem[],
    docTypeCounts?: DocTypeCountItem[]
) {
    // 0. Normalize status, category and display label once for every task
    const normalizedTasks: NormalizedTask[] = useMemo(() => {
        return tasks.map((t) => ({
            ...t,
            status: normalizeDashboardStatus(t.status),
            category: resolveCategory(t.docCategory, t.documentType || t.taskType, t.documentTypeDesc),
            typeLabel: getDocTypeDescription(t.documentType || t.taskType || 'Standard', t.documentTypeDesc),
        }));
    }, [tasks]);

    const { status: statusFilter, documentType: typeFilter, category: categoryFilter } = appliedFilters;

    // 1. Fully filtered set — drives the detail table
    const filteredTasks = useMemo(() => {
        return normalizedTasks.filter((t) => {
            // Status filter (multiselect: array of canonical statuses, e.g. ['In Approving'])
            if (Array.isArray(statusFilter) && statusFilter.length > 0) {
                if (!statusFilter.includes(t.status)) return false;
            }
            // Category filter (PO / PR / RESV / CLAIM)
            if (categoryFilter && t.category !== categoryFilter) return false;
            // Document type filter (raw S/4 code, e.g. 'ZEXP')
            if (typeFilter && t.documentType !== typeFilter) return false;

            return true;
        });
    }, [normalizedTasks, statusFilter, categoryFilter, typeFilter]);

    // 2. Status totals for the donut.
    //
    //    Deliberately independent of every other filter: status is the top of the
    //    drill-down, so the donut always reports the full picture and the category,
    //    type and search selections below it narrow the levels underneath — never
    //    the donut itself. Clicking a slice sets the status filter, which is why
    //    the status filter is not applied here either.
    const kpiMetrics = useMemo(() => {
        const counts: Record<string, number> = { 'In Approving': 0, 'Completed': 0 };
        let totalCount = 0;

        if (statusCounts && statusCounts.length > 0) {
            // Server-side aggregate — authoritative and not subject to the 1000-row cap
            for (const s of statusCounts) {
                const label = s.statusLabel || normalizeDashboardStatus(s.WorkflowTaskStatus);
                counts[label] = (counts[label] || 0) + Number(s.RequestCount || 0);
                totalCount += Number(s.RequestCount || 0);
            }
        } else {
            for (const t of normalizedTasks) {
                totalCount++;
                counts[t.status] = (counts[t.status] || 0) + 1;
            }
        }

        return {
            total: totalCount,
            'In Approving': counts['In Approving'] || 0,
            Completed: counts['Completed'] || 0,
        };
    }, [statusCounts, normalizedTasks]);

    // 4. Compute Chart 1: Donut segments (Count only)
    const donutSegments = useMemo(() => {
        return STATUS_LABELS.map((s) => ({
            label: s,
            value: kpiMetrics[s],
            color: STATUS_COLORS[s],
        }));
    }, [kpiMetrics]);

    // 5a. Per document-type breakdown feeding the category drill-down cards.
    const typesData: TaskTypeCount[] = useMemo(() => {
        const groups = new Map<string, TaskTypeCount>();

        for (const t of normalizedTasks) {
            const rawDocType = t.documentType || t.taskType || 'Standard';
            let g = groups.get(t.typeLabel);
            if (!g) {
                g = { type: t.typeLabel, rawDocType, category: t.category, count: 0, inApprovingCount: 0, completedCount: 0 };
                groups.set(t.typeLabel, g);
            }
            g.count++;
            if (t.status === 'Completed') g.completedCount++;
            else g.inApprovingCount++;
        }

        return Array.from(groups.values()).sort((a, b) => b.count - a.count);
    }, [normalizedTasks]);

    // 5b. Category roll-ups for the 4 overview cards (total / pending / completed).
    // Total always represents the grand total across all statuses (In Approving + Completed).
    const { categoryCounts, pendingCounts, completedCounts } = useMemo(() => {
        const total = EMPTY_CATEGORY_COUNTS();
        const pending = EMPTY_CATEGORY_COUNTS();
        const completed = EMPTY_CATEGORY_COUNTS();

        for (const t of normalizedTasks) {
            total[t.category]++;
            total.ALL++;
            if (t.status === 'Completed') {
                completed[t.category]++;
                completed.ALL++;
            } else {
                pending[t.category]++;
                pending.ALL++;
            }
        }

        return { categoryCounts: total, pendingCounts: pending, completedCounts: completed };
    }, [normalizedTasks]);

    // 5d. The task list is capped at 1000 rows server-side. When the status aggregate
    //     reports more than we received, the per-type and per-category splits above are
    //     computed over a subset — surface that so the UI can say so.
    const isTruncated = useMemo(() => {
        if (!statusCounts || statusCounts.length === 0) return false;
        const aggregateTotal = statusCounts.reduce((sum, s) => sum + Number(s.RequestCount || 0), 0);
        return aggregateTotal > normalizedTasks.length;
    }, [statusCounts, normalizedTasks.length]);

    // 6. Dynamic document type filter dropdown options (distinct values)
    const documentTypeOptions = useMemo(() => {
        const unique = new Map<string, string>();
        if (docTypeCounts && docTypeCounts.length > 0) {
            for (const item of docTypeCounts) {
                if (item.DocumentType) {
                    unique.set(item.DocumentType, getDocTypeDescription(item.DocumentType, item.DocumentTypeText));
                }
            }
        } else {
            for (const t of tasks) {
                if (t.documentType) {
                    unique.set(t.documentType, getDocTypeDescription(t.documentType, t.documentTypeDesc));
                }
            }
        }
        return Array.from(unique.entries()).map(([value, label]) => ({ value, label }));
    }, [docTypeCounts, tasks]);

    // 7. Table rows formatting (fully filtered)
    const tableRows = useMemo(() => {
        return filteredTasks.map((t: any) => {
            const taskType = (t.taskType || t.documentType || '').toUpperCase();
            const docCat = (t.docCategory || '').toUpperCase();

            let amount: number | null = t.totalNetAmount;
            if (amount === undefined || amount === null) {
                if (taskType === 'PO' || docCat === 'BUS2012') {
                    amount = t.TotalOrderValue !== undefined && t.TotalOrderValue !== null ? Number(t.TotalOrderValue) : null;
                } else if (taskType === 'CLAIM' || docCat === 'CLAIM') {
                    amount = t.PaymentAmountLocalCrcy !== undefined && t.PaymentAmountLocalCrcy !== null ? Number(t.PaymentAmountLocalCrcy) : null;
                } else {
                    amount = t.TotalNetAmountLocalCrcy !== undefined && t.TotalNetAmountLocalCrcy !== null ? Number(t.TotalNetAmountLocalCrcy) : null;
                }
            }

            return {
                taskType: t.taskType,
                documentTypeDesc: t.typeLabel,
                docNumber: t.documentNumber,
                currency: t.currency || 'VND',
                status: t.status,
                totalNetAmount: amount,
                displayCurrency: t.displayCurrency || t.currency || 'VND',
                createdAt: t.createdAt,
            };
        });
    }, [filteredTasks]);

    return {
        filteredTasks,
        donutSegments,
        typesData,
        categoryCounts,
        pendingCounts,
        completedCounts,
        documentTypeOptions,
        tableRows,
        kpiMetrics,
        isTruncated,
    };
}

