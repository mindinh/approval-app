/**
 * Pure display formatters for SAP values. No UI or platform dependencies, so the same
 * output can be produced on web and mobile. Every formatter returns EMPTY_VALUE for missing data.
 */
import type { RawODataEntity } from '@/services/inbox/inbox.contracts';
import { EMPTY_VALUE } from './model';

/** Default locale for amounts and quantities. Changing it changes what every user sees. */
export const DEFAULT_NUMBER_LOCALE = 'en-US';

// Intl formatters are expensive to create; `toLocaleString` builds one per call.
const numberFormats = new Map<string, Intl.NumberFormat>();

function formatNumber(value: number, locale: string, maximumFractionDigits: number): string {
    const cacheKey = `${locale}|${maximumFractionDigits}`;
    let numberFormat = numberFormats.get(cacheKey);
    if (!numberFormat) {
        numberFormat = new Intl.NumberFormat(locale, { maximumFractionDigits });
        numberFormats.set(cacheKey, numberFormat);
    }
    return numberFormat.format(value);
}

// Created on first use so it picks up the runtime time zone.
let shortDateFormat: Intl.DateTimeFormat | undefined;

// ─── Dates ─────────────────────────────────────────────────

/** Parse a date string, handling the SAP `/Date(…)/` format transparently. */
export function parseDate(value: string): Date {
    const sapMatch = value.match(/\/Date\((\d+)(?:[+-]\d+)?\)\//);
    if (sapMatch) {
        return new Date(Number(sapMatch[1]));
    }
    return new Date(value);
}

/** Format a date as a short locale string (e.g. `09/04/2026`). */
export function formatDateShortLocale(value?: string): string {
    if (!value) return EMPTY_VALUE;
    const date = parseDate(value);
    if (Number.isNaN(date.getTime())) return value;
    shortDateFormat ??= new Intl.DateTimeFormat('en-GB');
    return shortDateFormat.format(date);
}

const pad2 = (n: number) => String(n).padStart(2, '0');
const isZeroTime = (time: string) => !time || time === '00:00:00';

/** `dd/MM/yyyy`, or `dd/MM/yyyy HH:mm:ss` when the value (or `timeValue`) carries a non-midnight time. */
export function formatRawDate(value: unknown, timeValue?: unknown): string {
    if (value === null || value === undefined || value === '') return EMPTY_VALUE;
    const strVal = String(value).trim();
    if (!strVal) return EMPTY_VALUE;

    const dateObj = parseDate(strVal);
    if (Number.isNaN(dateObj.getTime())) return strVal;

    const strTime = timeValue !== null && timeValue !== undefined ? String(timeValue).trim() : '';
    if (!isZeroTime(strTime)) {
        const [h, m, s] = strTime.split(':');
        if (h !== undefined) dateObj.setHours(Number(h) || 0);
        if (m !== undefined) dateObj.setMinutes(Number(m) || 0);
        if (s !== undefined) dateObj.setSeconds(Number(s) || 0);
    }

    const datePart = `${pad2(dateObj.getDate())}/${pad2(dateObj.getMonth() + 1)}/${dateObj.getFullYear()}`;
    const valueCarriesTime = strVal.includes('T') || strVal.includes(' ') || strVal.startsWith('/Date(');
    const hasClockTime = dateObj.getHours() !== 0 || dateObj.getMinutes() !== 0 || dateObj.getSeconds() !== 0;
    if ((!isZeroTime(strTime) || valueCarriesTime) && (hasClockTime || !isZeroTime(strTime))) {
        return `${datePart} ${pad2(dateObj.getHours())}:${pad2(dateObj.getMinutes())}:${pad2(dateObj.getSeconds())}`;
    }
    return datePart;
}

// ─── Numbers ───────────────────────────────────────────────

/** Amount with thousand separators and an optional trailing currency. VND has no decimals. */
export function formatAmountWithCurrency(value?: string | number, currency?: string, locale = DEFAULT_NUMBER_LOCALE): string {
    if (value == null) return EMPTY_VALUE;
    const num = Number(value);
    if (Number.isNaN(num)) return currency ? `${value} ${currency}` : String(value);

    const maxFractionDigits = currency?.toUpperCase() === 'VND' ? 0 : 2;
    const formatted = formatNumber(num, locale, maxFractionDigits);
    return currency ? `${formatted} ${currency}` : formatted;
}

export function formatRawAmount(value: unknown, currency?: string, locale?: string): string {
    if (value === null || value === undefined || value === '') return EMPTY_VALUE;
    return formatAmountWithCurrency(String(value), currency, locale);
}

export function formatRawQuantity(value: unknown, unit?: string): string {
    if (value === null || value === undefined || value === '') return EMPTY_VALUE;
    const num = Number(value);
    if (Number.isNaN(num)) return String(value);
    const formatted = formatNumber(num, DEFAULT_NUMBER_LOCALE, 3);
    return unit ? `${formatted} ${unit}` : formatted;
}

// ─── Text ──────────────────────────────────────────────────

const clean = (value: unknown) => (value !== null && value !== undefined ? String(value).trim() : '');

/** `"code - text"`, or whichever part exists. */
export function formatCodeText(code?: unknown, text?: unknown): string {
    const cleanCode = clean(code);
    const cleanText = clean(text);
    if (cleanCode && cleanText) {
        return cleanCode === cleanText ? cleanCode : `${cleanCode} - ${cleanText}`;
    }
    return cleanCode || cleanText || EMPTY_VALUE;
}

export function formatRawValue(value: unknown): string {
    return clean(value) || EMPTY_VALUE;
}

/** Normalizes line endings and trims each line of a note. */
export function formatNoteText(value: unknown): string {
    if (value === null || value === undefined || value === '') return EMPTY_VALUE;
    const str = String(value);
    if (!str.trim()) return EMPTY_VALUE;

    return str
        .replace(/\r\n|\r/g, '\n')
        .split('\n')
        .map((line) => line.trim())
        .join('\n')
        .trim();
}

const TEXT_LINE_KEYS = ['LongText', 'TextLine', 'NoteText', 'longText', 'text', 'Text'] as const;

function textLineOf(item: unknown): string {
    if (item === null || item === undefined) return '';
    if (typeof item === 'string') return item;
    if (typeof item === 'object') {
        const line = item as Record<string, unknown>;
        for (const key of TEXT_LINE_KEYS) {
            if (line[key] !== undefined && line[key] !== null) return String(line[key]);
        }
        return '';
    }
    return String(item);
}

function joinTextLines(lines: unknown[]): string | null {
    const texts = lines.map(textLineOf);
    return texts.some((t) => t.trim() !== '') ? texts.join('\n').trimEnd() : null;
}

/**
 * Long text that may arrive as a string, an array of text lines, or a navigation property
 * (e.g. `_HeaderText`) on the record.
 */
export function formatRawMultilineText(value: unknown, record?: Record<string, unknown>, navPropName?: string): string {
    if (typeof value === 'string' && value.trim()) {
        return formatNoteText(value);
    }

    if (Array.isArray(value) && value.length > 0) {
        const joined = joinTextLines(value);
        if (joined !== null) return joined;
    }

    if (record && typeof record === 'object' && navPropName) {
        const navKey = Object.keys(record).find((k) => k.toLowerCase() === navPropName.toLowerCase());
        const nav = navKey ? record[navKey] : undefined;
        if (Array.isArray(nav) && nav.length > 0) {
            const joined = joinTextLines(nav);
            if (joined !== null) return joined;
        }
    }

    return EMPTY_VALUE;
}

/** `"code - name1 name2 …"` for SAP vendor/supplier fields. */
export function formatVendorCodeAndName(record?: RawODataEntity): string {
    if (!record) return EMPTY_VALUE;
    const rawCode = (record.Vendor || record.Supplier || record.VendorCode || record.vendor || record.supplier || record.vendorCode || '').trim();
    const code = rawCode === EMPTY_VALUE ? '' : rawCode;
    const names = [
        record.VendorName || record.Name1 || record.SupplierName || '',
        record.VendorName2 || record.Name2 || '',
        record.VendorName3 || record.Name3 || '',
        record.VendorName4 || record.Name4 || '',
    ]
        .map((part) => String(part).trim())
        .filter((part) => Boolean(part) && part !== EMPTY_VALUE)
        .join(' ');

    if (code && names) return `${code} - ${names}`;
    return code || names || EMPTY_VALUE;
}
