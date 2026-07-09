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
                formattedValue = formatAmountWithCurrency(chip.value, chip.currency);
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
                    // Department: hardcoded per business requirement
                    chips.push({ label: 'Dept', value: '1001201000 - IT department' });
                }
            }
        }
    }

    // 3. Root-level total amount fallback (ensure no duplicate Total chip is added)
    const hasTotalChip = chips.some((c) => c.label === 'Total');
    if (!hasTotalChip && task.total !== undefined && task.total !== null) {
        const totalCurrency = task.curr_vnd || task.doc_curr || '';
        chips.push({
            label: 'Total',
            value: formatAmountWithCurrency(task.total, totalCurrency),
            isPrimary: true,
        });
    }

    return chips;
}
