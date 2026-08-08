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

const SAP_GUI_COLUMN_MAP: Record<string, { rank: number; defaultLabel?: string }> = {
    // 1. Status
    status: { rank: 1, defaultLabel: 'Status' },
    itemstatus: { rank: 1, defaultLabel: 'Status' },
    sta: { rank: 1, defaultLabel: 'Status' },
    // 2. Item
    item: { rank: 2, defaultLabel: 'Item' },
    itemnumber: { rank: 2, defaultLabel: 'Item' },
    purchaseorderitem: { rank: 2, defaultLabel: 'Item' },
    purchaserequisitionitem: { rank: 2, defaultLabel: 'Item' },
    itemno: { rank: 2, defaultLabel: 'Item' },
    // 3. Acct Assg (A)
    acctassignmentcategory: { rank: 3, defaultLabel: 'Acct Assg' },
    acctassg: { rank: 3, defaultLabel: 'Acct Assg' },
    accountassignmentcategory: { rank: 3, defaultLabel: 'Acct Assg' },
    accountassignment: { rank: 3, defaultLabel: 'Acct Assg' },
    kappl: { rank: 3, defaultLabel: 'Acct Assg' },
    knttp: { rank: 3, defaultLabel: 'Acct Assg' },
    // 4. Item Cat (I)
    itemcategory: { rank: 4, defaultLabel: 'Item Cat' },
    itemcat: { rank: 4, defaultLabel: 'Item Cat' },
    pstyp: { rank: 4, defaultLabel: 'Item Cat' },
    // 5. Material
    material: { rank: 5, defaultLabel: 'Material' },
    materialnumber: { rank: 5, defaultLabel: 'Material' },
    matnr: { rank: 5, defaultLabel: 'Material' },
    // 6. Short Text
    shorttext: { rank: 6, defaultLabel: 'Short Text' },
    materialtext: { rank: 6, defaultLabel: 'Short Text' },
    purchaseorderitemtext: { rank: 6, defaultLabel: 'Short Text' },
    purreqnitemtext: { rank: 6, defaultLabel: 'Short Text' },
    description: { rank: 6, defaultLabel: 'Short Text' },
    txz01: { rank: 6, defaultLabel: 'Short Text' },
    // 7. Quantity (Combined with UoM!)
    quantity: { rank: 7, defaultLabel: 'Quantity' },
    purreqnquantity: { rank: 7, defaultLabel: 'Quantity' },
    orderquantity: { rank: 7, defaultLabel: 'Quantity' },
    menge: { rank: 7, defaultLabel: 'Quantity' },
    // 8. Valn Price / Valuation Price / Price
    price: { rank: 8, defaultLabel: 'Valuation Price' },
    valuationprice: { rank: 8, defaultLabel: 'Valuation Price' },
    netprice: { rank: 8, defaultLabel: 'Valuation Price' },
    valnprice: { rank: 8, defaultLabel: 'Valuation Price' },
    preis: { rank: 8, defaultLabel: 'Valuation Price' },
    // 9. Total Value / Net Amount
    totalamount: { rank: 9, defaultLabel: 'Total Value' },
    totalvalue: { rank: 9, defaultLabel: 'Total Value' },
    netamount: { rank: 9, defaultLabel: 'Total Value' },
    netwr: { rank: 9, defaultLabel: 'Total Value' },
    // 10. Currency (Crcy)
    currency: { rank: 10, defaultLabel: 'Currency' },
    documentcurrency: { rank: 10, defaultLabel: 'Currency' },
    purreqnitemcurrency: { rank: 10, defaultLabel: 'Currency' },
    doccurrency: { rank: 10, defaultLabel: 'Currency' },
    crcy: { rank: 10, defaultLabel: 'Currency' },
    waers: { rank: 10, defaultLabel: 'Currency' },
    // 11. Delivery Date
    deliverydate: { rank: 11, defaultLabel: 'Delivery Date' },
    eeind: { rank: 11, defaultLabel: 'Delivery Date' },
    badat: { rank: 11, defaultLabel: 'Delivery Date' },
    // 12. Material Group
    materialgroup: { rank: 12, defaultLabel: 'Material Group' },
    matkl: { rank: 12, defaultLabel: 'Material Group' },
    // 13. Plant
    plant: { rank: 13, defaultLabel: 'Plant' },
    werke: { rank: 13, defaultLabel: 'Plant' },
    // 14. Storage Location (Stor. Loc.)
    storagelocation: { rank: 140, defaultLabel: 'Storage Location' },
    storloc: { rank: 140, defaultLabel: 'Storage Location' },
    lgort: { rank: 140, defaultLabel: 'Storage Location' },
    // 14.5 Reference PR / Reference Document Number
    referencepr: { rank: 145, defaultLabel: 'Reference PR' },
    referencedocumentnumber: { rank: 145, defaultLabel: 'Reference PR' },
    purchaserequisition: { rank: 145, defaultLabel: 'Reference PR' },
    refdocnumber: { rank: 145, defaultLabel: 'Reference PR' },
    refdocumentnumber: { rank: 145, defaultLabel: 'Reference PR' },
    banfn: { rank: 145, defaultLabel: 'Reference PR' },
    // 15. Purchasing Org (POrg)
    purchasingorg: { rank: 150, defaultLabel: 'POrg' },
    purchasingorganization: { rank: 150, defaultLabel: 'POrg' },
    porg: { rank: 150, defaultLabel: 'POrg' },
    ekorg: { rank: 150, defaultLabel: 'POrg' },
    // 16. Purchasing Group (PGr)
    purchasinggroup: { rank: 160, defaultLabel: 'PGr' },
    pgr: { rank: 160, defaultLabel: 'PGr' },
    ekgrp: { rank: 160, defaultLabel: 'PGr' },
    // 17. Vendor
    vendor: { rank: 170, defaultLabel: 'Vendor' },
    vendorname: { rank: 170, defaultLabel: 'Vendor' },
    supplier: { rank: 170, defaultLabel: 'Vendor' },
    suppliername: { rank: 170, defaultLabel: 'Vendor' },
    lifnr: { rank: 170, defaultLabel: 'Vendor' },
};

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

    const indexedColumns = filteredColumns.map((col, index) => {
        const cleanKey = col.key.toLowerCase().replace(/[^a-z0-9]/g, '');
        const match = SAP_GUI_COLUMN_MAP[cleanKey];
        const rank = match ? match.rank : 1000 + index;
        return { col, rank };
    });

    indexedColumns.sort((a, b) => a.rank - b.rank);

    const orderedColumns = indexedColumns.map((item) => item.col);

    return {
        ...table,
        columns: orderedColumns,
        rows: updatedRows,
    };
}
