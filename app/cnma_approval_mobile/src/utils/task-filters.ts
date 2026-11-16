/**
 * Worklist filters beyond category and search: document subtypes and task type. The BFF list API only
 * filters by category/search, so — as on the web — these apply to the loaded tasks on the device, using
 * the web's `matchTaskDocumentType` so both apps match subtypes identically.
 */
import { getDocumentCreationTimestamp, matchTaskDocumentType } from '@approval-core/task-filters';
import type { InboxTask, TaskCategory } from '@/lib/api/bff-api';

export type TaskTypeFilter = 'ALL' | 'NORMAL' | 'TAGGED';

export interface TaskFilters {
    /** Selected subtype labels, e.g. "Asset PR", "Trading PO" (empty = all). */
    documentTypes: readonly string[];
    taskType: TaskTypeFilter;
    /** Document "Created on" range as local calendar days, YYYY-MM-DD (web: createdDate range). */
    createdFrom?: string;
    createdTo?: string;
}

export const EMPTY_FILTERS: TaskFilters = { documentTypes: [], taskType: 'ALL' };

/** Local calendar day of a date as YYYY-MM-DD. */
export function toDayKey(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Start of a YYYY-MM-DD day in local time. */
export function fromDayKey(day: string): Date {
    const [year, month, date] = day.split('-').map(Number);
    return new Date(year, month - 1, date);
}

const DAY_MS = 24 * 60 * 60 * 1000;

function inCreatedRange(task: InboxTask, from: string | undefined, to: string | undefined): boolean {
    if (!from && !to) return true;
    const created = getDocumentCreationTimestamp(task);
    if (created === null) return false;
    if (from && created < fromDayKey(from).getTime()) return false;
    if (to && created >= fromDayKey(to).getTime() + DAY_MS) return false;
    return true;
}

/** Same options as the web filter bar (`INBOX_FILTER_CONFIG.documentType`). */
export const SUBTYPE_GROUPS: readonly { category: Extract<TaskCategory, 'PR' | 'PO'>; title: string; options: readonly string[] }[] = [
    { category: 'PR', title: 'Purchase Requisition', options: ['Asset PR', 'Expense PR', 'Marketing PR', 'Trading PR', 'Non-Trade PR', 'Tools PR'] },
    {
        category: 'PO',
        title: 'Purchase Order',
        options: ['Asset PO', 'Consignment PO', 'Consignment Return PO', 'Expense PO', 'Marketing PO', 'Trading PO', 'Non-Trade PO', 'Trading Return PO', 'Tools PO', 'Stock Transport Order'],
    },
];

export const TASK_TYPE_OPTIONS: readonly { value: TaskTypeFilter; label: string }[] = [
    { value: 'ALL', label: 'All' },
    { value: 'NORMAL', label: 'Standard' },
    { value: 'TAGGED', label: 'CC' },
];

/** Subtype groups relevant to the selected category (none for Claim / Reservation). */
export function subtypeGroupsFor(category: TaskCategory | 'ALL') {
    return SUBTYPE_GROUPS.filter((group) => category === 'ALL' || group.category === category);
}

/** Drops subtypes that do not belong to the newly selected category. */
export function filtersForCategory(filters: TaskFilters, category: TaskCategory | 'ALL'): TaskFilters {
    const allowed = new Set(subtypeGroupsFor(category).flatMap((group) => group.options));
    const documentTypes = filters.documentTypes.filter((type) => allowed.has(type));
    return documentTypes.length === filters.documentTypes.length ? filters : { ...filters, documentTypes };
}

export function activeFilterCount(filters: TaskFilters): number {
    return filters.documentTypes.length + (filters.taskType === 'ALL' ? 0 : 1) + (filters.createdFrom || filters.createdTo ? 1 : 0);
}

export function applyTaskFilters(tasks: readonly InboxTask[], filters: TaskFilters): readonly InboxTask[] {
    if (activeFilterCount(filters) === 0) return tasks;
    return tasks.filter((task) => {
        if (filters.taskType === 'NORMAL' && task.normalTask === false) return false;
        if (filters.taskType === 'TAGGED' && task.normalTask !== false) return false;
        if (!inCreatedRange(task, filters.createdFrom, filters.createdTo)) return false;
        return filters.documentTypes.length === 0 || filters.documentTypes.some((type) => matchTaskDocumentType(task, type));
    });
}

export function toggleDocumentType(filters: TaskFilters, type: string, selected: boolean): TaskFilters {
    const others = filters.documentTypes.filter((value) => value !== type);
    return { ...filters, documentTypes: selected ? [...others, type] : others };
}
