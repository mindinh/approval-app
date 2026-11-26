/**
 * Pure view model of a worklist task (no React). Mirrors the web TaskCard: document id, CC badge,
 * status, title, business chips (from the shared renderers), requester and created time / aging.
 */
import { findObjectTypeModule, resolveTaskCardConfigForTask, type BusinessChip, type Tone } from '@approval-core/renderers';
import { isApprovedApprovalStatus } from '@approval-core/status-predicates';
import type { InboxTask, TaskScope } from '@/lib/api/bff-api';
import { taskStatus, type TaskStatus } from './task-status';
import { formatDate, parseDate } from './format';

const DAY_MS = 24 * 60 * 60 * 1000;
/** Same threshold as the web worklist: an open task older than this is overdue. */
const OVERDUE_AFTER_DAYS = 5;

export interface TaskAging {
    days: number;
    isOverdue: boolean;
}

export interface TaskSummary {
    key: string;
    instanceId: string;
    documentId: string;
    typeLabel: string;
    /** Renderer module category (PR, PO, CLAIM, RESERVATION…), undefined for unknown types. */
    category?: string;
    title: string;
    requester: string;
    tone: Tone;
    status: TaskStatus;
    /** CC (tagged for information, `normalTask === false`): review only, no decision. */
    isCc: boolean;
    /** The primary chip (usually the total amount). */
    amount?: BusinessChip;
    /** The other chips, label + value as on the web card. */
    details: BusinessChip[];
    /** ISO creation time, for the "x days ago" label. */
    createdOn?: string;
    /** Open tasks only: days waiting and whether that is overdue. */
    aging: TaskAging | null;
    /** Approved history or a task SAP reports as done: shown in the Completed green, without accents. */
    completed: boolean;
    /** What the BFF needs to send a decision without opening the task (mass approve / reject). */
    decisionContext: { businessObjectType: string; sapOrigin: string };
}

/** Age of an open task in days since `createdOn`, or null when the date is missing or invalid. */
export function getAging(createdOn: string | undefined, now: number): TaskAging | null {
    if (!createdOn) return null;
    const createdTime = parseDate(createdOn).getTime();
    if (Number.isNaN(createdTime)) return null;
    const diffDays = (now - createdTime) / DAY_MS;
    return { isOverdue: diffDays > OVERDUE_AFTER_DAYS, days: Math.floor(diffDays) };
}

const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
/** Past this age a relative label stops being useful; show the date instead. */
const RELATIVE_LIMIT_DAYS = 30;

/**
 * Relative time like the web card (date-fns formatDistanceToNow): "5 min ago", "3 h ago",
 * "2 days ago", then the date. A timestamp in the future (clock or SAP time-zone skew) shows the
 * absolute date instead of a misleading "Today".
 */
export function relativeTime(value: string | undefined, now: number): string | null {
    if (!value) return null;
    const time = parseDate(value).getTime();
    if (Number.isNaN(time)) return null;
    const diff = now - time;
    if (diff < 0) return formatDate(value);
    if (diff < HOUR_MS) return `${Math.max(1, Math.round(diff / MINUTE_MS))} min ago`;
    if (diff < DAY_MS) return `${Math.floor(diff / HOUR_MS)} h ago`;
    const days = Math.floor(diff / DAY_MS);
    if (days > RELATIVE_LIMIT_DAYS) return formatDate(value);
    return days === 1 ? '1 day ago' : `${days} days ago`;
}

function displayTitle(task: InboxTask, typeLabel: string, documentId: string, completed: boolean): string {
    const hasBorCode = task.title?.includes('BUS2') || task.title?.includes('ZBUS2');
    if (task.title && !hasBorCode) return task.title;
    const review = task.normalTask === false;
    const action = review ? (completed ? 'Reviewed' : 'Review') : completed ? 'Approved' : 'Approve';
    return `${action} ${typeLabel} ${documentId}`;
}

/**
 * @param now   reference time for aging (the time the list was fetched)
 * @param scope approved history shows no aging (as on the web)
 */
export function toTaskSummary(task: InboxTask, now: number, scope: TaskScope = 'open'): TaskSummary {
    const { tone, chips, module } = resolveTaskCardConfigForTask(task);
    const category = task.objectType || task.DocCategory || task.TechnicalWrkflwObjectType || task.businessContext?.type;
    const typeLabel = task.DocumentTypeText || task.doctyp_desc || task.documentTypeDisplay || findObjectTypeModule(category)?.label || task.objectType || 'Task';
    const documentId = task.businessContext?.documentId || task.instid || task.instanceId;
    const requester = task.requestorName || task.createdByName || task.CreatedByUser || task.CreatedByName || task.createdByUser || task.UserName || task.UserFullName || '—';
    const status = taskStatus(task.status);
    // Same rule as the web card: approved history, or a task SAP reports as approved / completed.
    const completed = scope === 'approved' || isApprovedApprovalStatus(task.status) || task.status === 'COMPLETED' || task.status === 'APPROVED';

    return {
        key: task.instanceId,
        instanceId: task.instanceId,
        documentId,
        typeLabel,
        category: module?.category,
        title: displayTitle(task, typeLabel, documentId, completed),
        requester,
        tone,
        status,
        isCc: task.normalTask === false,
        amount: chips.find((chip) => chip.isPrimary),
        details: chips.filter((chip) => !chip.isPrimary),
        createdOn: task.createdOn,
        aging: completed ? null : getAging(task.createdOn, now),
        completed,
        // Same fields as the web mass decision (InboxPage handleConfirmMassDecision).
        decisionContext: {
            businessObjectType: task.businessContext?.type || (task as { businessObjectType?: string }).businessObjectType || task.DocCategory || '',
            sapOrigin: task.sapOrigin || 'LOCAL',
        },
    };
}
