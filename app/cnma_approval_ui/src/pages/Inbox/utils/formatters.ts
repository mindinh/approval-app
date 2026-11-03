/**
 * Centralized formatting utilities for the Inbox feature.
 *
 * Consolidates duplicated formatDate / parseDate / formatAmount / safe / etc.
 * functions that were previously scattered across TaskDetailPanels, TaskCard,
 * MassSelectionView, and TaskDetail components.
 */
import { format } from 'date-fns';
import { formatAmountWithCurrency, formatDateShortLocale, parseDate } from '@/renderers/core/formatters';

// Shared with the document renderers; re-exported so existing imports keep working.
export { formatAmountWithCurrency, formatDateShortLocale, parseDate };

// ─── Date Helpers ──────────────────────────────────────────

/**
 * Format a date string to `dd MMM yyyy, HH:mm`.
 * Returns `'-'` for falsy or unparseable values.
 */
export function formatDate(value?: string, timeValue?: string): string {
    if (!value) return '-';
    if (timeValue && typeof timeValue === 'string') {
        const cleanDate = value.split('T')[0];
        const combined = `${cleanDate}T${timeValue}`;
        const date = parseDate(combined);
        if (!Number.isNaN(date.getTime())) {
            return format(date, 'dd MMM yyyy, HH:mm:ss');
        }
        return `${value} ${timeValue}`;
    }
    const date = parseDate(value);
    if (Number.isNaN(date.getTime())) return value;
    return format(date, 'dd MMM yyyy, HH:mm');
}

/**
 * Format a date string as a short date for list views (e.g. `09 Apr 2026`).
 */
export function formatShortDate(value?: string): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

// ─── Number / Amount Helpers ───────────────────────────────

/**
 * Format a numeric string with locale-aware thousand separators and max-2 decimals.
 */
export function formatAmount(value: string): string {
    const num = Number(value);
    if (Number.isNaN(num)) return value;
    return num.toLocaleString('en-US', {
        maximumFractionDigits: 2,
    });
}

/**
 * Human-readable file size (`512 B`, `1.5 KB`, `2.0 MB`).
 */
export function formatFileSize(size?: number): string {
    if (size == null || Number.isNaN(size)) return '-';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Return the value if non-empty, otherwise `'-'`.
 * Use wherever optional string values are rendered in UI.
 */
export function safe(value?: string): string {
    return value && String(value).trim() ? value : '-';
}

/**
 * Convert a camelCase or snake_case key into a human-readable label.
 * Example: `purchaseOrderNetAmount` → `Purchase order net amount`
 */
export function prettifyFieldLabel(key: string): string {
    const withSpaces = key
        .replace(/[_-]+/g, ' ')
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .trim();
    if (!withSpaces) return key;
    return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}
