/**
 * Pure dashboard derivations (no React), mirroring the web Dashboard page: two canonical statuses,
 * category roll-ups and the per document-type breakdown from the server aggregates.
 */
import type { DashboardTask, DocTypeCountItem, StatusCountItem, TaskCategory } from '@/lib/api/bff-api';

export type DashboardStatus = 'In Approving' | 'Completed';
export const DASHBOARD_STATUSES: readonly DashboardStatus[] = ['In Approving', 'Completed'];

export type DashboardCategory = TaskCategory | 'OTHER';
export const DASHBOARD_CATEGORIES: readonly { key: TaskCategory; label: string; short: string }[] = [
    { key: 'PR', label: 'Purchase Requisition', short: 'PR' },
    { key: 'PO', label: 'Purchase Order', short: 'PO' },
    { key: 'CLAIM', label: 'Claim', short: 'Claim' },
    { key: 'RESERVATION', label: 'Reservation', short: 'Reservation' },
];

const IN_APPROVING_CODES = new Set(['NEW', 'READY', 'RESERVED', 'IN_PROGRESS', 'IN_PROCESS', 'IN_PROCESSING', 'STARTED', 'IN_APPROVING']);

/** Any backend status → one of the two dashboard statuses (unknown counts as In Approving, as on the web). */
export function normalizeDashboardStatus(raw: string | undefined): DashboardStatus {
    const code = (raw || '').toUpperCase().trim().replace(/\s+/g, '_');
    if (IN_APPROVING_CODES.has(code)) return 'In Approving';
    if (['APPROVED', 'COMPLETED', 'COMPLETE', 'REJECTED', 'CANCELLED', 'CANCELED'].includes(code)) return 'Completed';
    return 'In Approving';
}

/** SAP object code / document type / label → worklist category (web `resolveCategory`). */
export function resolveDashboardCategory(docCategory?: string, rawDocType?: string, label?: string): DashboardCategory {
    const category = (docCategory || '').toUpperCase();
    const type = (rawDocType || '').toUpperCase();
    const text = (label || '').toUpperCase();
    if (category === 'BUS2012' || category === 'PO' || type.includes('PO') || text.includes('PO')) return 'PO';
    if (category === 'BUS2105' || category === 'PR' || type.includes('PR') || text.includes('PR')) return 'PR';
    if (category.includes('2093') || category.includes('RES') || category === 'RE' || type === 'RE' || text.includes('RESERVATION')) return 'RESERVATION';
    if (category === 'CLAIM' || type.includes('CLAIM') || text.includes('CLAIM')) return 'CLAIM';
    return 'OTHER';
}

/** "Expense PR (ZEXP)" style label: SAP text plus the code, or the code alone. */
export function docTypeLabel(code: string, text?: string): string {
    const clean = (code || '').toUpperCase().trim();
    const label = (text || '').trim();
    if (!label) return clean || 'Standard';
    return clean && !label.includes(`(${clean})`) ? `${label} (${clean})` : label;
}

export interface StatusTotals {
    total: number;
    'In Approving': number;
    Completed: number;
}

export function statusTotals(statusCounts: readonly StatusCountItem[] | undefined): StatusTotals {
    const totals: StatusTotals = { total: 0, 'In Approving': 0, Completed: 0 };
    for (const item of statusCounts ?? []) {
        const status = (item.statusLabel as DashboardStatus | undefined) ?? normalizeDashboardStatus(item.WorkflowTaskStatus);
        const count = Number(item.RequestCount || 0);
        totals[status === 'Completed' ? 'Completed' : 'In Approving'] += count;
        totals.total += count;
    }
    return totals;
}

export interface CountSplit {
    total: number;
    inApproving: number;
    completed: number;
}

export interface DocTypeBreakdown extends CountSplit {
    label: string;
    /** Raw S/4 code, the `documentType` filter value. */
    code: string;
    category: DashboardCategory;
}

const emptySplit = (): CountSplit => ({ total: 0, inApproving: 0, completed: 0 });

function addTo(split: CountSplit, status: DashboardStatus, count: number) {
    split.total += count;
    if (status === 'Completed') split.completed += count;
    else split.inApproving += count;
}

/** Category roll-ups and document-type rows from the server's document-type aggregate. */
export function breakdown(docTypeCounts: readonly DocTypeCountItem[] | undefined) {
    const categories = new Map<DashboardCategory, CountSplit>();
    const types = new Map<string, DocTypeBreakdown>();
    for (const item of docTypeCounts ?? []) {
        const code = item.DocumentType || 'Standard';
        const label = docTypeLabel(code, item.DocumentTypeText);
        const category = resolveDashboardCategory(item.DocCategory, code, item.DocumentTypeText);
        const status = normalizeDashboardStatus(item.Status);
        const count = Number(item.RequestCount || 0);

        const categorySplit = categories.get(category) ?? emptySplit();
        addTo(categorySplit, status, count);
        categories.set(category, categorySplit);

        const type = types.get(label) ?? { label, code, category, ...emptySplit() };
        addTo(type, status, count);
        types.set(label, type);
    }
    return {
        categoryOf: (category: DashboardCategory) => categories.get(category) ?? emptySplit(),
        typesOf: (category: DashboardCategory) => [...types.values()].filter((type) => type.category === category).sort((a, b) => b.total - a.total),
    };
}

/** Amount shown in the task list: the resolved net amount, else the raw field of the object type. */
export function dashboardAmount(task: DashboardTask & Record<string, unknown>): number | null {
    if (task.totalNetAmount !== undefined && task.totalNetAmount !== null) return task.totalNetAmount;
    const kind = (task.taskType || task.documentType || '').toUpperCase();
    const category = (task.docCategory || '').toUpperCase();
    const raw = kind === 'PO' || category === 'BUS2012' ? task.TotalOrderValue : kind === 'CLAIM' || category === 'CLAIM' ? task.PaymentAmountLocalCrcy : task.TotalNetAmountLocalCrcy;
    return raw === undefined || raw === null || raw === '' ? null : Number(raw);
}
