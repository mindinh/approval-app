/** Small pure display formatters shared by screens. */

const KB = 1024;
const SIZE_UNITS = ['B', 'KB', 'MB', 'GB'] as const;

/** 1536 → "1.5 KB"; 0 / unknown → "". */
export function formatFileSize(bytes: number): string {
    if (!bytes || bytes < 0) return '';
    const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(KB)), SIZE_UNITS.length - 1);
    const value = bytes / KB ** exponent;
    return `${value >= 10 || exponent === 0 ? Math.round(value) : value.toFixed(1)} ${SIZE_UNITS[exponent]}`;
}

/** SAP OData v2 dates look like "/Date(1791471044000)/" (optionally with an offset, "+0700"). */
const ODATA_V2_DATE = /^\/Date\((-?\d+)(?:[+-]\d{4})?\)\/$/;

/** Parses ISO strings and OData v2 "/Date(ms)/" values. */
export function parseDate(value: string): Date {
    const odata = ODATA_V2_DATE.exec(value.trim());
    return odata ? new Date(Number(odata[1])) : new Date(value);
}

/** ISO, SAP "YYYY-MM-DDTHH:mm:ss" or "/Date(ms)/" → "3 Nov 2026, 14:05"; unparsable input is returned as-is. */
export function formatDateTime(value: string | undefined): string {
    if (!value) return '';
    const date = parseDate(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString([], { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** "3 Nov 2026"; unparsable input is returned as-is. */
export function formatDate(value: string | undefined): string {
    if (!value) return '';
    const date = parseDate(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}
