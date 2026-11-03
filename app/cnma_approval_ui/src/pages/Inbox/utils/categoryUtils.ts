import type { InboxTask } from '@/services/inbox/inbox.types';
import {
    Package,
    Receipt,
    FileText,
    CalendarCheck,
    type LucideIcon,
} from 'lucide-react';

export type ObjectCategory = 'ALL' | 'PR' | 'PO' | 'RESERVATION' | 'CLAIM';

export interface CategorySectionDef {
    key: ObjectCategory;
    title: string;
    icon: LucideIcon;
    stripeClass: string;
    iconBgClass: string;
}

export const CATEGORY_ACCORDION_SECTIONS: CategorySectionDef[] = [
    {
        key: 'PR',
        title: 'Purchase Requisition',
        icon: FileText,
        stripeClass: 'before:bg-primary',
        iconBgClass: 'bg-primary/10 text-primary border-primary/20',
    },
    {
        key: 'PO',
        title: 'Purchase Order',
        icon: Package,
        stripeClass: 'before:bg-info',
        iconBgClass: 'bg-info/10 text-info border-info/20',
    },
    {
        key: 'CLAIM',
        title: 'Claim',
        icon: Receipt,
        stripeClass: 'before:bg-success',
        iconBgClass: 'bg-success/10 text-success border-success/20',
    },
    {
        key: 'RESERVATION',
        title: 'Reservation',
        icon: CalendarCheck,
        stripeClass: 'before:bg-warning',
        iconBgClass: 'bg-warning/10 text-warning border-warning/20',
    },
];

export const MAIN_CATEGORIES: ObjectCategory[] = ['PR', 'PO', 'CLAIM', 'RESERVATION'];

export function getFirstTaskByCategoryOrder(tasks: InboxTask[]): InboxTask | undefined {
    for (const category of MAIN_CATEGORIES) {
        const firstTask = tasks.find((task) => getTaskObjectCategory(task) === category);
        if (firstTask) return firstTask;
    }
    return tasks[0];
}

type MainCategory = Exclude<ObjectCategory, 'ALL'>;

interface CategoryRule {
    category: MainCategory;
    /** Codes matched exactly against businessContext.type and objectType / DocCategory. */
    objectCodes: readonly string[];
    /** Substring of the SAP task definition ID. */
    taskDefinitionMarker: string;
    documentTypes: readonly string[];
    titleMarkers: readonly string[];
}

/** Evaluated in order; the first matching rule wins. */
const CATEGORY_RULES: readonly CategoryRule[] = [
    // 1. PR (BUS2105, PR)
    { category: 'PR', objectCodes: ['PR', 'BUS2105'], taskDefinitionMarker: 'BUS2105', documentTypes: ['PR'], titleMarkers: ['PR ', 'PURCHASE REQUISITION'] },
    // 2. PO (BUS2012, PO)
    { category: 'PO', objectCodes: ['PO', 'BUS2012'], taskDefinitionMarker: 'BUS2012', documentTypes: ['PO'], titleMarkers: ['PO ', 'PURCHASE ORDER'] },
    // 3. Reservation (BUS2093, ZBUS2093, RE, RESV, RESERVATION)
    {
        category: 'RESERVATION',
        objectCodes: ['RE', 'RESV', 'RESERVATION', 'BUS2093', 'ZBUS2093'],
        taskDefinitionMarker: 'BUS2093',
        documentTypes: ['RESV', 'RE'],
        titleMarkers: ['RESERVATION'],
    },
    // 4. Claim (CLAIM, ZCLAIM)
    { category: 'CLAIM', objectCodes: ['CLAIM', 'ZCLAIM'], taskDefinitionMarker: 'CLAIM', documentTypes: ['CLAIM'], titleMarkers: ['CLAIM'] },
];

const normalizeCode = (value: unknown): string => String(value || '').toUpperCase().trim();

/**
 * Normalizes an InboxTask to one of the 4 main object categories.
 */
export function getTaskObjectCategory(task: InboxTask): MainCategory | 'OTHER' {
    const bType = normalizeCode(task.businessContext?.type);
    const objType = normalizeCode(task.objectType || task.DocCategory || task.TechnicalWrkflwObjectType);
    const taskDefId = normalizeCode(task.taskDefinitionId);
    const docType = normalizeCode(task.documentType);
    const title = normalizeCode(task.title);

    const rule = CATEGORY_RULES.find((candidate) =>
        candidate.objectCodes.includes(bType) ||
        candidate.objectCodes.includes(objType) ||
        taskDefId.includes(candidate.taskDefinitionMarker) ||
        candidate.documentTypes.includes(docType) ||
        candidate.titleMarkers.some((marker) => title.includes(marker))
    );
    return rule?.category ?? 'OTHER';
}

/**
 * Filter tasks by category.
 */
export function filterTasksByCategory(tasks: InboxTask[], category: ObjectCategory | null): InboxTask[] {
    if (!category || category === 'ALL') return tasks;

    return tasks.filter((task) => {
        const cat = getTaskObjectCategory(task);
        return cat === category;
    });
}

/**
 * Computes pending count for each category.
 */
export function computeCategoryCounts(tasks: InboxTask[]): Record<ObjectCategory, number> {
    const counts: Record<ObjectCategory, number> = {
        ALL: tasks.length,
        PR: 0,
        PO: 0,
        RESERVATION: 0,
        CLAIM: 0,
    };

    for (const task of tasks) {
        const cat = getTaskObjectCategory(task);
        if (cat !== 'OTHER') {
            counts[cat] = (counts[cat] || 0) + 1;
        }
    }

    return counts;
}

const FALLBACK_SUBTYPE: Record<MainCategory | 'OTHER', string> = {
    PR: 'Standard PR',
    PO: 'Standard PO',
    RESERVATION: 'Reservation',
    CLAIM: 'Claim',
    OTHER: 'Other',
};

/**
 * Resolves the display subtype of a task.
 */
export function getTaskSubtype(task: InboxTask): string {
    const raw =
        task.documentTypeDisplay ||
        task.DocumentTypeText ||
        task.doctyp_desc ||
        task.documentTypeDesc ||
        task.DocumentTypeDisplay ||
        task.documentType ||
        '';
    const trimmed = String(raw).trim();
    if (trimmed) return trimmed;

    return FALLBACK_SUBTYPE[getTaskObjectCategory(task)];
}

/**
 * Extracts distinct subtypes and their task counts for a given list of tasks.
 */
export function extractSubtypeCounts(tasks: InboxTask[]): { name: string; count: number }[] {
    const countMap = new Map<string, number>();

    for (const task of tasks) {
        const subtype = getTaskSubtype(task);
        if (subtype) {
            countMap.set(subtype, (countMap.get(subtype) || 0) + 1);
        }
    }

    return Array.from(countMap.entries()).map(([name, count]) => ({
        name,
        count,
    }));
}
