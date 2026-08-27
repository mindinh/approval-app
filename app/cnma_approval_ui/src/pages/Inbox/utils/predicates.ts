/**
 * Centralized predicate / classification utilities for the Inbox feature.
 *
 * Replaces duplicated approval-status helpers that were defined locally in
 * TaskDetailPanels.tsx and error-checking helpers in useInbox.ts.
 */

// ─── Approval Status ──────────────────────────────────────

/**
 * Normalize a raw approval status string to uppercase for comparison.
 */
export function normalizeApprovalStatus(value?: string): string {
    if (!value) return 'UNKNOWN';
    return value.trim().toUpperCase();
}

/**
 * Converts a raw status string into a normalized lookup key (UPPERCASE with underscores).
 * e.g., 'In Approving' -> 'IN_APPROVING'
 */
function toStatusKey(value?: string): string {
    if (!value) return '';
    return value.trim().toUpperCase().replace(/\s+/g, '_');
}

const PENDING_STATUS_KEYS = new Set([
    'PENDING',
    'PENDING_APPROVAL',
    'PARTIALLY_APPROVED',
    'IN_PROCESS',
    'IN_APPROVING',
    'CURRENT',
    'OPEN',
]);

const IN_APPROVING_STATUS_KEYS = new Set([
    'IN_APPROVING',
    'IN_PROCESS',
]);

const REJECTED_STATUS_KEYS = new Set([
    'REJECTED',
    'REJECT',
    'DECLINED',
    'DECLINE',
    'CANCELLED',
    'CANCELED',
    'RETURNED',
    'RETURN',
]);

const APPROVED_STATUS_KEYS = new Set([
    'APPROVED',
    'APPROVE',
    'ACCEPT',
    'ACCEPTED',
    'COMPLETED',
    'COMPLETE',
]);

/**
 * Returns `true` if the approval status represents a "pending" state.
 */
export function isPendingApprovalStatus(value?: string): boolean {
    return PENDING_STATUS_KEYS.has(toStatusKey(value));
}

/**
 * Returns `true` if the approval status explicitly represents an "in approving" state.
 */
export function isInApprovingStatus(value?: string): boolean {
    return IN_APPROVING_STATUS_KEYS.has(toStatusKey(value));
}

/**
 * Returns `true` if the approval status explicitly represents a "rejected" or "declined" state.
 */
export function isRejectedApprovalStatus(value?: string): boolean {
    return REJECTED_STATUS_KEYS.has(toStatusKey(value));
}

/**
 * Returns `true` if the approval status explicitly represents an "approved" or "completed" state.
 */
export function isApprovedApprovalStatus(value?: string): boolean {
    return APPROVED_STATUS_KEYS.has(toStatusKey(value));
}

/**
 * Format a raw approval status string into a human-readable label.
 * Example: `'IN_PROCESS'` → `'In Process'`
 */
export function formatApprovalStatus(value?: string): string {
    const status = normalizeApprovalStatus(value);
    if (status === 'UNKNOWN') return 'Unknown';
    return status
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

// ─── Error Classification ──────────────────────────────────

/**
 * Detect the SAP user mapping error so we can disable polling / retry.
 */
export function isSapUserMappingMissing(error: any): boolean {
    return error?.response?.data?.code === 'SAP_USER_MAPPING_MISSING';
}

/**
 * Extract a usable string error message from an Axios-style error object.
 */
export function extractErrorMessage(error: any, fallback: string): string {
    if (!error) return fallback;
    const responseErr = error?.response?.data?.error;
    if (typeof responseErr === 'string' && responseErr.trim()) {
        return responseErr.trim();
    }
    if (responseErr && typeof responseErr === 'object' && typeof responseErr.message === 'string' && responseErr.message.trim()) {
        return responseErr.message.trim();
    }
    const responseData = error?.response?.data;
    if (typeof responseData === 'string' && responseData.trim()) {
        return responseData.trim();
    }
    if (responseData && typeof responseData === 'object' && typeof responseData.message === 'string' && responseData.message.trim()) {
        return responseData.message.trim();
    }
    if (typeof error?.message === 'string' && error.message.trim()) {
        return error.message.trim();
    }
    return fallback;
}
