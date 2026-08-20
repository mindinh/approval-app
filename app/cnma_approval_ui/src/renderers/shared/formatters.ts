import { formatAmountWithCurrency, formatDateShortLocale, formatTime, parseDate } from '@/pages/Inbox/utils/formatters';
import type { DetailTableModel, DetailTableRow } from '../TaskDetailSections.types';

export { formatTime };

export const EMPTY_VALUE = '-';

export function normalizeDisplayValue(value: unknown): string {
    if (value == null) return EMPTY_VALUE;
    const text = String(value).trim();
    return text ? text : EMPTY_VALUE;
}

/**
 * Formats SAP Code + Description pattern (e.g. "1000 - Plant Hanoi")
 */
export function formatCodeWithText(code?: unknown, text?: unknown): string {
    const cleanCode = code != null && String(code).trim() !== '' ? String(code).trim() : '';
    const cleanText = text != null && String(text).trim() !== '' ? String(text).trim() : '';

    if (!cleanCode) return cleanText || EMPTY_VALUE;
    if (!cleanText) return cleanCode;

    if (cleanCode === cleanText) return cleanCode;

    if (
        cleanText.startsWith(`${cleanCode} -`) ||
        cleanText.startsWith(`${cleanCode}-`) ||
        cleanText.startsWith(`${cleanCode} `)
    ) {
        return cleanText;
    }

    return `${cleanCode} - ${cleanText}`;
}

/**
 * Formats Material / Short Text rule:
 * - Returns only the short text description without repeating the material number prefix.
 * - E.g. "40000143 - sữa chua uống vinamilk" -> "sữa chua uống vinamilk"
 */
export function formatMaterialShortText(item: Record<string, any>): string {
    const matNum = item.material || item.materialNumber;
    const shortText = item.shortText || item.materialText || item.purchaseOrderItemText || item.purReqnItemText;

    const cleanMat = matNum != null && String(matNum).trim() !== '' ? String(matNum).trim() : '';
    let cleanText = shortText != null && String(shortText).trim() !== '' ? String(shortText).trim() : '';

    if (!cleanText) return cleanMat || EMPTY_VALUE;

    if (cleanMat) {
        if (cleanText.startsWith(`${cleanMat} -`)) {
            cleanText = cleanText.slice(cleanMat.length + 2).trim();
        } else if (cleanText.startsWith(`${cleanMat}-`)) {
            cleanText = cleanText.slice(cleanMat.length + 1).trim();
        } else if (cleanText.startsWith(`${cleanMat} `)) {
            cleanText = cleanText.slice(cleanMat.length + 1).trim();
        }
    }

    return cleanText || cleanMat || EMPTY_VALUE;
}

export function formatAmount(value: unknown, currency?: string): string {
    if (value == null || value === '') return EMPTY_VALUE;
    return formatAmountWithCurrency(String(value), currency || '');
}


export function formatDate(value: unknown, timeValue?: unknown): string {
    if (value == null || value === '') return EMPTY_VALUE;
    const dateStr = String(value);
    const timeStr = timeValue != null && timeValue !== '' ? formatTime(timeValue) : '';

    if (timeStr) {
        const datePart = formatDateShortLocale(dateStr);
        return `${datePart} ${timeStr}`;
    }

    const dateObj = parseDate(dateStr);
    if (!Number.isNaN(dateObj.getTime())) {
        const hasTime = dateObj.getUTCHours() !== 0 || dateObj.getUTCMinutes() !== 0 || dateObj.getUTCSeconds() !== 0;
        if (hasTime) {
            const dateFormatted = dateObj.toLocaleDateString('en-GB');
            const timeFormatted = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            return `${dateFormatted} ${timeFormatted}`;
        }
    }

    return formatDateShortLocale(dateStr);
}



const UNIT_KEYS = new Set([
    'unit',
    'uom',
    'baseunit',
    'meins',
    'purchaseorderquantityunit',
    'purreqnquantityunit',
]);

export function extractReferencePr(item: any): string {
    if (!item || typeof item !== 'object') return EMPTY_VALUE;

    const val =
        item.ReferenceDocumentNumber ??
        item.referenceDocumentNumber ??
        item.ReferenceDocument ??
        item.referenceDocument ??
        item.PurchaseRequisition ??
        item.purchaseRequisition ??
        item.PurchaseRequisitionNumber ??
        item.purchaseRequisitionNumber ??
        item.RefrncDocNo ??
        item.refrncDocNo ??
        item.RefDocNo ??
        item.refDocNo ??
        item.RefDoc ??
        item.refDoc ??
        item.Banfn ??
        item.banfn ??
        item.RefPrNumber ??
        item.refPrNumber ??
        item.ReferencePr ??
        item.referencePr;

    if (val != null && String(val).trim() !== '' && String(val).trim() !== '0000000000') {
        return String(val).trim();
    }

    for (const [k, v] of Object.entries(item)) {
        const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (
            (cleanK.includes('referencedocument') ||
                cleanK.includes('purchaserequisition') ||
                cleanK.includes('referencepr') ||
                cleanK.includes('refpr') ||
                cleanK.includes('refrncdoc') ||
                cleanK.includes('banfn')) &&
            v != null &&
            String(v).trim() !== '' &&
            String(v).trim() !== '0000000000'
        ) {
            return String(v).trim();
        }
    }

    return EMPTY_VALUE;
}

export function normalizeAndOrderTableColumns(table: DetailTableModel): DetailTableModel {
    if (!table || !table.columns || table.columns.length === 0) return table;

    if (table.preserveOrder) {
        return table;
    }

    let hasRefPrValue = false;

    const updatedRows: DetailTableRow[] = (table.rows || []).map((row) => {
        const values = { ...row.values };

        // 1. Extract Unit and combine into Quantity
        let unitVal = '';
        for (const [k, v] of Object.entries(values)) {
            const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (UNIT_KEYS.has(cleanK) && v && v !== EMPTY_VALUE && String(v).trim() !== '') {
                unitVal = String(v).trim();
                break;
            }
        }

        if (unitVal) {
            for (const [k, v] of Object.entries(values)) {
                const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
                if (
                    (cleanK === 'quantity' || cleanK === 'purreqnquantity' || cleanK === 'orderquantity' || cleanK === 'menge') &&
                    v &&
                    v !== EMPTY_VALUE
                ) {
                    if (!String(v).includes(unitVal)) {
                        values[k] = `${v} ${unitVal}`;
                    }
                }
            }
        }

        // 2. Extract Reference PR / ReferenceDocumentNumber
        const refVal = extractReferencePr(values);
        if (refVal !== EMPTY_VALUE) {
            hasRefPrValue = true;
            values.referencePr = refVal;
        }

        return { ...row, values };
    });

    const columnsCopy = [...table.columns];
    const hasRefPrCol = columnsCopy.some((col) => {
        const cleanK = col.key.toLowerCase().replace(/[^a-z0-9]/g, '');
        return (
            cleanK === 'referencepr' ||
            cleanK === 'referencedocumentnumber' ||
            cleanK === 'purchaserequisition' ||
            cleanK === 'refdocnumber' ||
            cleanK === 'refdocumentnumber' ||
            cleanK === 'banfn'
        );
    });

    if (hasRefPrValue && !hasRefPrCol) {
        columnsCopy.push({ key: 'referencePr', label: 'Reference PR' });
    }

    const filteredColumns = columnsCopy.filter((col) => {
        const cleanKey = col.key.toLowerCase().replace(/[^a-z0-9]/g, '');
        return !UNIT_KEYS.has(cleanKey);
    });

    return {
        ...table,
        columns: filteredColumns,
        rows: updatedRows,
    };
}
