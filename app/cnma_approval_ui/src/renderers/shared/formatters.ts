import { formatAmountWithCurrency, formatDateShortLocale, formatTime, parseDate } from '@/pages/Inbox/utils/formatters';

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
