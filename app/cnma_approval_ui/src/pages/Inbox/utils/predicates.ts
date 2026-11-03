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
    'PENDING_VERIFY',
    'PENDING_VERIFICATION',
]);

const PENDING_VERIFY_STATUS_KEYS = new Set([
    'PENDING_VERIFY',
    'PENDING_VERIFICATION',
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
    'VERIFIED',
]);

/**
 * Returns `true` if the approval status represents a "pending" state.
 */
export function isPendingApprovalStatus(value?: string): boolean {
    return PENDING_STATUS_KEYS.has(toStatusKey(value));
}

/**
 * Returns `true` if the approval status specifically represents a "pending verify" state.
 */
export function isPendingVerifyStatus(value?: string): boolean {
    return PENDING_VERIFY_STATUS_KEYS.has(toStatusKey(value));
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
 * Example: `'IN_PROCESS'` → `'In Process'`, `'PENDING_VERIFY'` → `'Pending Verify'`
 */
export function formatApprovalStatus(value?: string): string {
    const status = normalizeApprovalStatus(value);
    if (status === 'UNKNOWN') return 'Unknown';
    if (status === 'PENDING VERIFY' || status === 'PENDING_VERIFY') return 'Pending Verify';
    if (status === 'VERIFIED') return 'Verified';
    return status
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

// ─── Error Classification ──────────────────────────────────

/** The parts of an Axios-style error the helpers below read. */
interface HttpErrorLike {
    message?: unknown;
    response?: { data?: unknown };
}

function asObject<T>(value: unknown): T | undefined {
    return value && typeof value === 'object' ? (value as T) : undefined;
}

function nonEmptyText(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

/** A string, or the `message` of an object. */
function messageOf(value: unknown): string | undefined {
    return nonEmptyText(value) ?? nonEmptyText(asObject<{ message?: unknown }>(value)?.message);
}

/**
 * Detect the SAP user mapping error so we can disable polling / retry.
 */
export function isSapUserMappingMissing(error: unknown): boolean {
    const data = asObject<{ code?: unknown }>(asObject<HttpErrorLike>(error)?.response?.data);
    return data?.code === 'SAP_USER_MAPPING_MISSING';
}

/**
 * Extract a usable string error message from an Axios-style error object:
 * `response.data.error` → `response.data` → `error.message` → fallback.
 */
export function extractErrorMessage(error: unknown, fallback: string): string {
    const httpError = asObject<HttpErrorLike>(error);
    const data = httpError?.response?.data;
    const responseError = asObject<{ error?: unknown }>(data)?.error;
    return messageOf(responseError) ?? messageOf(data) ?? nonEmptyText(httpError?.message) ?? fallback;
}

// ─── Detail Fields ────────────────────────────────────────

/**
 * True when a detail field or column holds a reference PR number (rendered as a link to the PR).
 */
export function isReferencePrField(key: string, label: string): boolean {
    const k = key.toLowerCase();
    const l = label.toLowerCase();
    return k === 'referencepr' || k === 'refpr' || l.includes('reference pr') || l.includes('ref pr');
}
