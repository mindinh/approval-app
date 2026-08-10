import { formatAmountWithCurrency, parseDate } from '@/pages/Inbox/utils/formatters';

export function formatRawDate(value: unknown, timeValue?: unknown): string {
    if (value === null || value === undefined || value === '') return '-';
    const strVal = String(value).trim();
    if (!strVal) return '-';

    const dateObj = parseDate(strVal);
    if (Number.isNaN(dateObj.getTime())) return strVal;

    const strTime = timeValue !== null && timeValue !== undefined ? String(timeValue).trim() : '';
    if (strTime && strTime !== '00:00:00') {
        const parts = strTime.split(':');
        if (parts[0] !== undefined) dateObj.setHours(Number(parts[0]) || 0);
        if (parts[1] !== undefined) dateObj.setMinutes(Number(parts[1]) || 0);
        if (parts[2] !== undefined) dateObj.setSeconds(Number(parts[2]) || 0);
    }

    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();

    const hasTime = (strTime && strTime !== '00:00:00') || strVal.includes('T') || strVal.includes(' ') || strVal.startsWith('/Date(');
    if (hasTime && (dateObj.getHours() !== 0 || dateObj.getMinutes() !== 0 || dateObj.getSeconds() !== 0 || (strTime && strTime !== '00:00:00'))) {
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const mins = String(dateObj.getMinutes()).padStart(2, '0');
        const secs = String(dateObj.getSeconds()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${mins}:${secs}`;
    }

    return `${day}/${month}/${year}`;
}

export function formatRawAmount(value: unknown, currency?: string): string {
    if (value === null || value === undefined || value === '') return '-';
    return formatAmountWithCurrency(String(value), currency);
}

export function formatRawQuantity(value: unknown, unit?: string): string {
    if (value === null || value === undefined || value === '') return '-';
    const num = Number(value);
    if (Number.isNaN(num)) return String(value);
    const formatted = num.toLocaleString('en-US', { maximumFractionDigits: 3 });
    return unit ? `${formatted} ${unit}` : formatted;
}

export function formatCodeText(code?: unknown, text?: unknown): string {
    const cleanCode = code !== null && code !== undefined ? String(code).trim() : '';
    const cleanText = text !== null && text !== undefined ? String(text).trim() : '';

    if (cleanCode && cleanText) {
        if (cleanCode === cleanText) return cleanCode;
        return `${cleanCode} - ${cleanText}`;
    }
    return cleanCode || cleanText || '-';
}

export function formatRawValue(value: unknown): string {
    if (value === null || value === undefined) return '-';
    const str = String(value).trim();
    return str === '' ? '-' : str;
}

export function formatRawMultilineText(value: unknown, record?: any, navPropName?: string): string {
    if (typeof value === 'string' && value.trim()) {
        return value.trim();
    }

    const extractLines = (arr: any[]): string[] => {
        return arr.map(item => {
            if (item === null || item === undefined) return '';
            if (typeof item === 'string') return item.trim();
            if (typeof item === 'object') {
                const textVal = item.LongText ?? item.TextLine ?? item.NoteText ?? item.longText ?? item.text ?? item.Text ?? '';
                return String(textVal).trim();
            }
            return String(item).trim();
        }).filter(Boolean);
    };

    if (Array.isArray(value) && value.length > 0) {
        const lines = extractLines(value);
        if (lines.length > 0) return lines.join('\n');
    }

    if (record && typeof record === 'object' && navPropName) {
        const keys = Object.keys(record);
        const matchKey = keys.find(k => k.toLowerCase() === navPropName.toLowerCase());
        if (matchKey && Array.isArray(record[matchKey]) && record[matchKey].length > 0) {
            const lines = extractLines(record[matchKey]);
            if (lines.length > 0) return lines.join('\n');
        }
    }

    return '-';
}
