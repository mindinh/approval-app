import { formatAmountWithCurrency, formatDateShortLocale } from '@/pages/Inbox/utils/formatters';

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
 * - Material Master: "Material Number - Material Description"
 * - Free Text: "Material Description (Text)"
 */
export function formatMaterialShortText(item: Record<string, any>): string {
    const matNum = item.material || item.materialNumber;
    const shortText = item.shortText || item.materialText || item.purchaseOrderItemText || item.purReqnItemText;

    const cleanMat = matNum != null && String(matNum).trim() !== '' ? String(matNum).trim() : '';
    const cleanText = shortText != null && String(shortText).trim() !== '' ? String(shortText).trim() : '';

    if (!cleanMat) return cleanText || EMPTY_VALUE;
    if (!cleanText) return cleanMat;

    if (cleanMat === cleanText) return cleanMat;

    if (
        cleanText.startsWith(`${cleanMat} -`) ||
        cleanText.startsWith(`${cleanMat}-`) ||
        cleanText.startsWith(`${cleanMat} `)
    ) {
        return cleanText;
    }

    return `${cleanMat} - ${cleanText}`;
}

export function formatAmount(value: unknown, currency?: string): string {
    if (value == null || value === '') return EMPTY_VALUE;
    return formatAmountWithCurrency(String(value), currency || '');
}

export function formatDate(value: unknown): string {
    if (value == null || value === '') return EMPTY_VALUE;
    return formatDateShortLocale(String(value));
}
