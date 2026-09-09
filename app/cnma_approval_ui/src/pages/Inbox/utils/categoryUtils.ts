import type { InboxTask } from '@/services/inbox/inbox.types';
import {
    ShoppingCart,
    Package,
    BookmarkCheck,
    Receipt,
    Layers,
    FileText,
    CalendarCheck,
    type LucideIcon,
} from 'lucide-react';

export type ObjectCategory = 'ALL' | 'PR' | 'PO' | 'RESERVATION' | 'CLAIM';

export interface CategoryMeta {
    key: ObjectCategory;
    title: string;
    shortCode: string;
    description: string;
    icon: LucideIcon;
    bgGradient: string;
    textColor: string;
    borderColor: string;
    badgeBg: string;
}

export const CATEGORY_CONFIG: Record<ObjectCategory, CategoryMeta> = {
    ALL: {
        key: 'ALL',
        title: 'All Tasks',
        shortCode: 'ALL',
        description: 'All pending approval tasks',
        icon: Layers,
        bgGradient: 'from-muted/40 to-muted/10',
        textColor: 'text-foreground',
        borderColor: 'border-border',
        badgeBg: 'bg-muted text-muted-foreground',
    },
    PR: {
        key: 'PR',
        title: 'Purchase Requisition',
        shortCode: 'PR',
        description: 'Material & service purchase requests',
        icon: ShoppingCart,
        bgGradient: 'from-primary/15 to-primary/5',
        textColor: 'text-primary',
        borderColor: 'border-primary/20',
        badgeBg: 'bg-primary/10 text-primary',
    },
    PO: {
        key: 'PO',
        title: 'Purchase Order',
        shortCode: 'PO',
        description: 'Purchase orders & vendor contracts',
        icon: Package,
        bgGradient: 'from-info/15 to-info/5',
        textColor: 'text-info',
        borderColor: 'border-info/20',
        badgeBg: 'bg-info/10 text-info',
    },
    RESERVATION: {
        key: 'RESERVATION',
        title: 'Reservation',
        shortCode: 'RESV',
        description: 'Warehouse & material reservations',
        icon: BookmarkCheck,
        bgGradient: 'from-warning/15 to-warning/5',
        textColor: 'text-warning',
        borderColor: 'border-warning/20',
        badgeBg: 'bg-warning/10 text-warning',
    },
    CLAIM: {
        key: 'CLAIM',
        title: 'Claim',
        shortCode: 'CLAIM',
        description: 'Expense reimbursement & claims',
        icon: Receipt,
        bgGradient: 'from-success/15 to-success/5',
        textColor: 'text-success',
        borderColor: 'border-success/20',
        badgeBg: 'bg-success/10 text-success',
    },
};

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
        title: 'PR',
        icon: FileText,
        stripeClass: 'before:bg-primary',
        iconBgClass: 'bg-primary/10 text-primary border-primary/20',
    },
    {
        key: 'PO',
        title: 'PO',
        icon: Package,
        stripeClass: 'before:bg-info',
        iconBgClass: 'bg-info/10 text-info border-info/20',
    },
    {
        key: 'RESERVATION',
        title: 'Reservation',
        icon: CalendarCheck,
        stripeClass: 'before:bg-warning',
        iconBgClass: 'bg-warning/10 text-warning border-warning/20',
    },
    {
        key: 'CLAIM',
        title: 'Claim form',
        icon: Receipt,
        stripeClass: 'before:bg-success',
        iconBgClass: 'bg-success/10 text-success border-success/20',
    },
];

export const MAIN_CATEGORIES: ObjectCategory[] = ['PR', 'PO', 'RESERVATION', 'CLAIM'];

/**
 * Normalizes an InboxTask to one of the 4 main object categories.
 */
export function getTaskObjectCategory(task: InboxTask): 'PR' | 'PO' | 'RESERVATION' | 'CLAIM' | 'OTHER' {
    const bType = String(task.businessContext?.type || '').toUpperCase().trim();
    const objType = String(
        task.objectType ||
        (task as any).DocCategory ||
        (task as any).TechnicalWrkflwObjectType ||
        ''
    ).toUpperCase().trim();
    const taskDefId = String(task.taskDefinitionId || '').toUpperCase().trim();
    const docType = String((task as any).documentType || '').toUpperCase().trim();
    const title = String(task.title || '').toUpperCase().trim();

    // 1. PR Check (BUS2105, PR)
    if (
        bType === 'PR' ||
        bType === 'BUS2105' ||
        objType === 'PR' ||
        objType === 'BUS2105' ||
        taskDefId.includes('BUS2105') ||
        docType === 'PR' ||
        title.includes('PR ') ||
        title.includes('PURCHASE REQUISITION')
    ) {
        return 'PR';
    }

    // 2. PO Check (BUS2012, PO)
    if (
        bType === 'PO' ||
        bType === 'BUS2012' ||
        objType === 'PO' ||
        objType === 'BUS2012' ||
        taskDefId.includes('BUS2012') ||
        docType === 'PO' ||
        title.includes('PO ') ||
        title.includes('PURCHASE ORDER')
    ) {
        return 'PO';
    }

    // 3. Reservation Check (BUS2093, ZBUS2093, RE, RESV, RESERVATION)
    if (
        bType === 'RE' ||
        bType === 'RESV' ||
        bType === 'RESERVATION' ||
        bType === 'BUS2093' ||
        bType === 'ZBUS2093' ||
        objType === 'RE' ||
        objType === 'RESV' ||
        objType === 'RESERVATION' ||
        objType === 'BUS2093' ||
        objType === 'ZBUS2093' ||
        taskDefId.includes('BUS2093') ||
        docType === 'RESV' ||
        docType === 'RE' ||
        title.includes('RESERVATION')
    ) {
        return 'RESERVATION';
    }

    // 4. Claim Check (CLAIM, ZCLAIM)
    if (
        bType === 'CLAIM' ||
        bType === 'ZCLAIM' ||
        objType === 'CLAIM' ||
        objType === 'ZCLAIM' ||
        taskDefId.includes('CLAIM') ||
        docType === 'CLAIM' ||
        title.includes('CLAIM')
    ) {
        return 'CLAIM';
    }

    return 'OTHER';
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
