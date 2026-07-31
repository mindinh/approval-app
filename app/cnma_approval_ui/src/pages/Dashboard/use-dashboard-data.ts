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

// ─── Bar Data ─────────────────────────────────────────────
export interface BarDataItem {
    label: string;
    total: number;
    'In Approving': number;
    'Completed'?: number;
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
    // 1. Normalize statuses and filter data for the main table (fully filtered)
    const filteredTasks = useMemo(() => {
        return tasks.map((t) => {
            const status = normalizeDashboardStatus(t.status);
            return { ...t, status };
        }).filter((t) => {
            // Apply status filter (multiselect status: array of canonical statuses, e.g. ['In Approving'])
            if (Array.isArray(appliedFilters.status) && appliedFilters.status.length > 0) {
                if (!appliedFilters.status.includes(t.status)) return false;
            }

            // Apply documentType filter (select type, e.g. 'PR')
            if (appliedFilters.documentType) {
                if (t.documentType !== appliedFilters.documentType) return false;
            }
            return true;
        });
    }, [tasks, appliedFilters]);

    // 2. Compute visual datasets excluding the Status filter
    const tasksFilteredExcludingStatus = useMemo(() => {
        return tasks.map((t) => {
            const status = normalizeDashboardStatus(t.status);
            return { ...t, status };
        }).filter((t) => {
            if (appliedFilters.documentType) {
                const docType = t.documentType || t.taskType || '';
                if (docType !== appliedFilters.documentType) return false;
            }
            return true;
        });
    }, [tasks, appliedFilters.documentType]);

    // 3. Compute dynamic KPI metrics (counts only)
    const kpiMetrics = useMemo(() => {
        let totalCount = 0;
        const counts: Record<string, number> = { 'In Approving': 0, 'Completed': 0 };

        // When a document type filter is active, derive status counts specifically for that document type
        if (appliedFilters.documentType) {
            for (const t of tasksFilteredExcludingStatus) {
                totalCount++;
                counts[t.status] = (counts[t.status] || 0) + 1;
            }
        } else if (statusCounts && statusCounts.length > 0) {
            for (const s of statusCounts) {
                const label = s.statusLabel || normalizeDashboardStatus(s.WorkflowTaskStatus);
                counts[label] = (counts[label] || 0) + Number(s.RequestCount || 0);
                totalCount += Number(s.RequestCount || 0);
            }
        } else {
            for (const t of tasksFilteredExcludingStatus) {
                totalCount++;
                counts[t.status] = (counts[t.status] || 0) + 1;
            }
        }

        return {
            total: totalCount,
            'In Approving': counts['In Approving'] || 0,
            Completed: counts['Completed'] || 0,
        };
    }, [statusCounts, tasksFilteredExcludingStatus, appliedFilters.documentType]);

    // 4. Compute Chart 1: Donut segments (Count only)
    const donutSegments = useMemo(() => {
        return STATUS_LABELS.map((s) => ({
            label: s,
            value: kpiMetrics[s],
            color: STATUS_COLORS[s],
        }));
    }, [kpiMetrics]);

    // 5. Compute Chart 2: Stacked Bar Chart (Count only)
    const barData = useMemo(() => {
        if (docTypeCounts && docTypeCounts.length > 0) {
            const groups = new Map<string, { total: number; 'In Approving': number }>();
            for (const item of docTypeCounts) {
                const rawKey = item.DocumentType || 'Standard';
                const key = getDocTypeDescription(rawKey, item.DocumentTypeText);
                let g = groups.get(key);
                if (!g) {
                    g = { total: 0, 'In Approving': 0 };
                    groups.set(key, g);
                }
                const count = Number(item.RequestCount || 0);
                g.total += count;
                g['In Approving'] += count;
            }
            return Array.from(groups.entries())
                .map(([label, data]) => ({ label, ...data }))
                .sort((a, b) => b.total - a.total);
        }

        const groups = new Map<string, { total: number; 'In Approving': number }>();
        for (const t of tasksFilteredExcludingStatus) {
            const rawKey = t.documentType || t.taskType || 'Standard';
            const key = getDocTypeDescription(rawKey, t.documentTypeDesc);
            let g = groups.get(key);
            if (!g) {
                g = { total: 0, 'In Approving': 0 };
                groups.set(key, g);
            }
            g.total++;
            g['In Approving']++;
        }
        return Array.from(groups.entries())
            .map(([label, data]) => ({ label, ...data }))
            .sort((a, b) => b.total - a.total);
    }, [docTypeCounts, tasksFilteredExcludingStatus]);

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
        return filteredTasks.map((t) => ({
            taskType: t.taskType,
            documentTypeDesc: getDocTypeDescription(t.documentType || t.taskType || 'Standard', t.documentTypeDesc),
            docNumber: t.documentNumber,
            currency: t.currency,
            status: t.status,
            totalNetAmount: t.totalNetAmount,
            displayCurrency: t.displayCurrency || t.currency,
            createdAt: t.createdAt,
        }));
    }, [filteredTasks]);

    return {
        filteredTasks,
        donutSegments,
        barData,
        documentTypeOptions,
        tableRows,
        kpiMetrics,
    };
}

