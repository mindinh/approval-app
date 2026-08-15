/**
 * Task Card Mapper — transforms raw InboxTask data into display-ready models.
 *
 * Extracts the useBusinessChips logic from TaskCard.tsx so that the component
 * receives pre-computed display data instead of applying business rules inline.
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

// ─── Mapper ────────────────────────────────────────────────

export function resolveFrontendTotalAmount(task: InboxTask): number | undefined {
    const typeUpper = (task.objectType || task.businessContext?.type || '').toUpperCase();
    const isPO = typeUpper === 'PO' || typeUpper === 'BUS2012';
    const docTypeUpper = (task.documentType || task.doctyp || task.documentTypeDisplay || '').toUpperCase();
    const isZubPo = isPO && (docTypeUpper.includes('ZUB') || task.documentType === 'ZUB');

    if (isZubPo) {
        const val = task.TotalNetAmountLocalCrcy ?? task.totalNetAmountLocalCrcy ?? task.total;
        return val !== undefined && val !== null ? Number(val) : undefined;
    }
    if (isPO) {
        const val = task.TotalOrderValue ?? task.totalOrderValue ?? task.total;
        return val !== undefined && val !== null ? Number(val) : undefined;
    }
    const val = task.total ?? task.TotalNetAmountLocalCrcy ?? task.TotalOrderValue;
    return val !== undefined && val !== null ? Number(val) : undefined;
}

/**
 * Extract key business details per document type from the task's
 * businessContext (enriched by the backend at list level).
 *
 * Pure function — no hooks, no side effects.
 */
export function mapBusinessChips(task: InboxTask): BusinessChip[] {
    const chips: BusinessChip[] = [];

    // 1. If backend returns pre-configured dynamic chips, map and format them
    if (task.businessChips && task.businessChips.length > 0) {
        task.businessChips.forEach((chip) => {
            let formattedValue = '';
            if (chip.dataType === 'AMOUNT') {
                const currency = chip.currency || task.curr_vnd || task.doc_curr;
                formattedValue = formatAmountWithCurrency(chip.value, currency);
            } else if (chip.dataType === 'DATE') {
                formattedValue = formatDateShortLocale(String(chip.value));
            } else if (chip.dataType === 'QUANTITY') {
                const num = Number(chip.value);
                const formattedNum = Number.isNaN(num) ? String(chip.value) : num.toLocaleString('vi-VN');
                formattedValue = chip.unit ? `${formattedNum} ${chip.unit}` : formattedNum;
            } else if (chip.dataType === 'BOOLEAN') {
                formattedValue = chip.value ? 'Yes' : 'No';
            } else {
                formattedValue = String(chip.value);
            }

            chips.push({
                label: chip.label,
                value: formattedValue,
                isPrimary: chip.isPrimary,
            });
        });
    } else {
        // 2. Fallback to legacy hardcoded logic
        const ctx = task.businessContext;
        if (ctx) {
            if (ctx.type === 'PO' && ctx.po) {
                const po = ctx.po as PurchaseOrderFactsheetData;
                const hdr = po.header;
                if (hdr) {
                    if (hdr.purchaseOrderNetAmount) {
                        const cur = hdr.documentCurrency || '';
                        chips.push({
                            label: 'Total',
                            value: `${formatAmount(hdr.purchaseOrderNetAmount)} ${cur}`.trim(),
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
                }
            } else if (ctx.type === 'PR' && ctx.pr) {
                const pr = ctx.pr as PurchaseRequisitionFactsheetData;
                const hdr = pr.header;
                if (hdr) {
                    const totalValue = hdr.totalNetAmount;
                    const totalCurrency = hdr.displayCurrency || '';
                    if (totalValue) {
                        chips.push({
                            label: 'Total',
                            value: `${formatAmount(totalValue)} ${totalCurrency}`.trim(),
                            isPrimary: true,
                        });
                    }
                    const prTypeVal = hdr.purchaseRequisitionTypeText || hdr.purchaseRequisitionType;
                    if (prTypeVal) {
                        chips.push({ label: 'Type', value: prTypeVal });
                    }
                    const compCodeVal = hdr.companyCodeDisplay || (hdr.companyCode ? (hdr.companyCodeName ? `${hdr.companyCode} - ${hdr.companyCodeName}` : `${hdr.companyCode} - `) : task.companyCodeDisplay);
                    if (compCodeVal) {
                        chips.push({ label: 'Company Code', value: compCodeVal });
                    }
                    const deptVal = hdr.departmentDisplay || hdr.department;
                    if (deptVal) {
                        chips.push({ label: 'Dept', value: deptVal });
                    }
                }
            }
        }
    }

    // 3. Root-level total amount fallback (ensure no duplicate Total chip is added)
    const hasTotalChip = chips.some((c) => c.label === 'Total' || c.label === 'Total Amount');
    const totalValue = resolveFrontendTotalAmount(task);

    if (!hasTotalChip && totalValue !== undefined && totalValue !== null) {
        const totalCurrency = task.curr_vnd || task.doc_curr || 'VND';
        chips.push({
            label: 'Total',
            value: formatAmountWithCurrency(totalValue, totalCurrency),
            isPrimary: true,
        });
    }


    // 4. Root-level Company Code fallback
    const hasCompCodeChip = chips.some((c) => c.label === 'Company Code');
    if (!hasCompCodeChip && task.companyCodeDisplay) {
        chips.push({
            label: 'Company Code',
            value: task.companyCodeDisplay,
        });
    }

    // 5. Root-level Document Type fallback (e.g. Type: ZFO8 - Expense PO or RESV - Reservation)
    const hasTypeChip = chips.some((c) => c.label === 'Type');
    if (!hasTypeChip) {
        const objTypeUpper = (task.objectType || task.businessContext?.type || '').toUpperCase();
        const docTypeUpper = (task.documentType || task.documentTypeDisplay || '').toUpperCase();
        const isReservation = objTypeUpper === 'RE' || objTypeUpper === 'ZBUS2093' || objTypeUpper === 'BUS2093' || docTypeUpper.includes('RESV') || docTypeUpper === 'RE';
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
