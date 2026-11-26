/**
 * Task status label and tone. Labels follow the web StatusBadge (`STATUS_CONFIG`); tones are the
 * web mapping: open states amber (fresh pending tone), done green, rejected red.
 */
export type StatusTone = 'pending' | 'success' | 'danger' | 'neutral';

export interface TaskStatus {
    label: string;
    tone: StatusTone;
}

const STATUS: Record<string, TaskStatus> = {
    NEW: { label: 'In Approving', tone: 'pending' },
    READY: { label: 'In Approving', tone: 'pending' },
    RESERVED: { label: 'In Approving', tone: 'pending' },
    IN_PROGRESS: { label: 'In Approving', tone: 'pending' },
    IN_PROCESSING: { label: 'In Approving', tone: 'pending' },
    IN_APPROVING: { label: 'In Approving', tone: 'pending' },
    PENDING_APPROVAL: { label: 'Pending Approval', tone: 'pending' },
    PARTIALLY_APPROVED: { label: 'Partially Approved', tone: 'pending' },
    PENDING_VERIFY: { label: 'Pending Verify', tone: 'pending' },
    VERIFIED: { label: 'Verified', tone: 'success' },
    COMPLETED: { label: 'Completed', tone: 'success' },
    APPROVED: { label: 'Approved', tone: 'success' },
    REJECTED: { label: 'Rejected', tone: 'danger' },
    CANCELLED: { label: 'Cancelled', tone: 'neutral' },
};

/** Synonyms the web StatusBadge folds into a known status. */
const ALIASES: Record<string, string> = { IN_PROCESS: 'NEW', STARTED: 'NEW', COMPLETE: 'COMPLETED' };

const FALLBACK: TaskStatus = { label: 'In Approving', tone: 'neutral' };

export function taskStatus(raw: string | undefined): TaskStatus {
    if (!raw) return FALLBACK;
    const upper = raw.toUpperCase();
    // SAP OData sends NOT_VALID for unmapped values; the web shows them as In Approving.
    if (upper.includes('NOT_VALID') || upper.includes('NOT VALID')) return STATUS.IN_APPROVING;
    const key = upper.replace(/\s+/g, '_');
    return STATUS[key] ?? STATUS[ALIASES[key]] ?? FALLBACK;
}
