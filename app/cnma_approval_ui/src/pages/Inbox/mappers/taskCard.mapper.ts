/**
 * Task Card Mapper — transforms raw InboxTask data into display-ready models.
 *
 * Extracts business chip mapping and total amount resolution logic into
 * pure, composable helper functions.
 */
import type {
    InboxTask,
    PurchaseOrderFactsheetData,
    PurchaseRequisitionFactsheetData,
} from '@/services/inbox/inbox.types';
import {
    formatAmount,
    formatAmountWithCurrency,
    formatDateShortLocale,
} from '@/pages/Inbox/utils/formatters';

// ─── Types ─────────────────────────────────────────────────

/**
 * A single info chip to display on a task card.
 */
export interface BusinessChip {
    label?: string;
    value: string;
    isPrimary?: boolean;
}

// ─── Internal Helpers ──────────────────────────────────────

/**
 * Safely extracts the business object record from the cached detail response.
 */
function extractBusinessObject(cachedDetail?: any): any {
    if (!cachedDetail) return undefined;
    return (
        cachedDetail.businessObject ||
        cachedDetail.header ||
        cachedDetail.rawDetail?.businessObject ||
        cachedDetail.rawDetail?.header
    );
}

/**
 * Resolves normalized object category and document type flags.
 */
function getDocumentTypes(task: InboxTask, bo?: any) {
    const objectType = (
        task.objectType ||
        task.businessContext?.type ||
        bo?.DocCategory ||
        ''
    ).toUpperCase();

    const documentType = (
        task.documentType ||
        task.doctyp ||
        task.documentTypeDisplay ||
        bo?.DocumentType ||
        ''
    ).toUpperCase();

    const isPO = objectType === 'PO' || objectType === 'BUS2012';
    const isZubPo =
        isPO &&
        (documentType.includes('ZUB') ||
            task.documentType === 'ZUB' ||
            bo?.DocumentType === 'ZUB');

    return { objectType, documentType, isPO, isZubPo };
}

/**
 * Formats dynamic chips returned directly from backend.
 */
function formatDynamicChip(chip: any, task: InboxTask): BusinessChip {
    let formattedValue = '';

    switch (chip.dataType) {
        case 'AMOUNT': {
            const currency = chip.currency || task.curr_vnd || task.doc_curr;
            formattedValue = formatAmountWithCurrency(chip.value, currency);
            break;
        }
        case 'DATE': {
            formattedValue = formatDateShortLocale(String(chip.value));
            break;
        }
        case 'QUANTITY': {
            const num = Number(chip.value);
            const formattedNum = Number.isNaN(num)
                ? String(chip.value)
                : num.toLocaleString('vi-VN');
            formattedValue = chip.unit ? `${formattedNum} ${chip.unit}` : formattedNum;
            break;
        }
        case 'BOOLEAN': {
            formattedValue = chip.value ? 'Yes' : 'No';
            break;
        }
        default: {
            formattedValue = String(chip.value ?? '');
            break;
        }
    }

    return {
        label: chip.label,
        value: formattedValue,
        isPrimary: chip.isPrimary,
    };
}

/**
 * Maps legacy factsheet context (PO / PR) to chips if present.
 */
function mapLegacyContextChips(ctx: any): BusinessChip[] {
    const chips: BusinessChip[] = [];
    if (!ctx) return chips;

    if (ctx.type === 'PO' && ctx.po?.header) {
        const hdr = ctx.po.header as PurchaseOrderFactsheetData['header'];
        if (hdr.purchaseOrderNetAmount) {
            chips.push({
                label: 'Total',
                value: `${formatAmount(hdr.purchaseOrderNetAmount)} ${hdr.documentCurrency || ''}`.trim(),
                isPrimary: true,
            });
        }
        if (hdr.purchaseOrderTypeText) {
            chips.push({ label: 'Type', value: hdr.purchaseOrderTypeText });
        }
        if (hdr.supplierName || hdr.supplier) {
            chips.push({ value: (hdr.supplierName || hdr.supplier)! });
        }
        if (hdr.purchasingGroupName || hdr.companyCodeName) {
            chips.push({ label: 'Dept', value: (hdr.purchasingGroupName || hdr.companyCodeName)! });
        }
    } else if (ctx.type === 'PR' && ctx.pr?.header) {
        const hdr = ctx.pr.header as PurchaseRequisitionFactsheetData['header'];
        if (hdr.totalNetAmount) {
            chips.push({
                label: 'Total',
                value: `${formatAmount(hdr.totalNetAmount)} ${hdr.displayCurrency || ''}`.trim(),
                isPrimary: true,
            });
        }
        const prTypeVal = hdr.purchaseRequisitionTypeText || hdr.purchaseRequisitionType;
        if (prTypeVal) {
            chips.push({ label: 'Type', value: prTypeVal });
        }
        if (hdr.companyCodeDisplay) {
            chips.push({ label: 'Company Code', value: hdr.companyCodeDisplay });
        }
        if (hdr.departmentDisplay || hdr.department) {
            chips.push({ label: 'Dept', value: (hdr.departmentDisplay || hdr.department)! });
        }
    }

    return chips;
}

// ─── Total Amount Resolver ─────────────────────────────────

export function resolveFrontendTotalAmount(task: InboxTask, cachedDetail?: any): number | undefined {
    const bo = extractBusinessObject(cachedDetail);
    const { isPO, isZubPo } = getDocumentTypes(task, bo);

    // 1. Prioritize live business object from detail cache
    if (bo) {
        if (isZubPo) {
            const val = bo.TotalNetAmountLocalCrcy ?? bo.totalNetAmountLocalCrcy ?? bo.TotalOrderValue ?? bo.totalOrderValue;
            if (val != null) return Number(val);
        } else if (isPO) {
            const val = bo.TotalOrderValue ?? bo.totalOrderValue ?? bo.TotalNetAmountLocalCrcy ?? bo.totalNetAmountLocalCrcy;
            if (val != null) return Number(val);
        } else {
            const val = bo.TotalNetAmountLocalCrcy ?? bo.TotalOrderValue ?? bo.TotalAmount ?? bo.total;
            if (val != null) return Number(val);
        }
    }

    // 2. Fallback to task item values
    if (isZubPo) {
        const val = task.TotalNetAmountLocalCrcy ?? task.totalNetAmountLocalCrcy ?? task.total;
        return val != null ? Number(val) : undefined;
    }
    if (isPO) {
        const val = task.TotalOrderValue ?? task.totalOrderValue ?? task.total;
        return val != null ? Number(val) : undefined;
    }
    const val = task.total ?? task.TotalNetAmountLocalCrcy ?? task.TotalOrderValue;
    return val != null ? Number(val) : undefined;
}

// ─── Main Mapper ───────────────────────────────────────────

/**
 * Extract key business details per document type from the task's
 * businessContext (enriched by backend or live detail cache).
 *
 * Pure function — no hooks, no side effects.
 */
export function mapBusinessChips(task: InboxTask, cachedDetail?: any): BusinessChip[] {
    // Step 1: Initialize base chips from dynamic backend chips or legacy factsheet context
    const chips: BusinessChip[] =
        task.businessChips && task.businessChips.length > 0
            ? task.businessChips.map((chip) => formatDynamicChip(chip, task))
            : mapLegacyContextChips(task.businessContext);

    // Step 2: Total amount processing (overriding or injecting primary Total chip)
    const totalValue = resolveFrontendTotalAmount(task, cachedDetail);
    if (totalValue != null) {
        const bo = extractBusinessObject(cachedDetail);
        const totalCurrency = bo?.LocalCurrency || bo?.DocumentCurrency || task.curr_vnd || task.doc_curr || 'VND';
        const formattedTotal = formatAmountWithCurrency(totalValue, totalCurrency);

        const totalChipIdx = chips.findIndex((c) => c.label === 'Total' || c.label === 'Total Amount');
        if (totalChipIdx !== -1) {
            chips[totalChipIdx] = { ...chips[totalChipIdx], value: formattedTotal };
        } else {
            chips.push({
                label: 'Total',
                value: formattedTotal,
                isPrimary: true,
            });
        }
    }

    // Step 3: Company Code fallback chip
    const hasCompCodeChip = chips.some((c) => c.label === 'Company Code');
    if (!hasCompCodeChip && task.companyCodeDisplay) {
        chips.push({
            label: 'Company Code',
            value: task.companyCodeDisplay,
        });
    }

    // Step 4: Document Type fallback chip
    const hasTypeChip = chips.some((c) => c.label === 'Type');
    if (!hasTypeChip) {
        const { objectType, documentType } = getDocumentTypes(task);
        const isReservation =
            objectType === 'RE' ||
            objectType === 'ZBUS2093' ||
            objectType === 'BUS2093' ||
            documentType.includes('RESV') ||
            documentType === 'RE';

        const typeVal = task.documentTypeDisplay || (isReservation ? 'RESV - Reservation' : undefined);
        if (typeVal) {
            chips.push({
                label: 'Type',
                value: typeVal,
            });
        }
    }

    return chips;
}
