/**
 * Centralized constants for the Inbox feature.
 *
 * Replaces magic strings for decision keys, status configs and query timings
 * that were previously hardcoded across TaskCard, MassSelectionView, TaskList, etc.
 */
import type { ComponentProps } from 'react';
import type { Badge } from '@cnma/react-ui';

// ─── Decision Keys ─────────────────────────────────────────
// SAP TASKPROCESSING standard decision option keys
export const DECISION_KEYS = {
    APPROVE: '0001',
    REJECT: '0002',
} as const;

// ─── Status Config ─────────────────────────────────────────

export type BadgeVariant = ComponentProps<typeof Badge>['variant'];

export interface BadgeConfig {
    variant: BadgeVariant;
    label: string;
}

export const STATUS_CONFIG: Record<string, BadgeConfig> = {
    NEW: { variant: 'warning', label: 'In Approving' },
    READY: { variant: 'warning', label: 'In Approving' },
    RESERVED: { variant: 'warning', label: 'In Approving' },
    IN_PROGRESS: { variant: 'warning', label: 'In Approving' },
    IN_PROCESSING: { variant: 'warning', label: 'In Approving' },
    IN_APPROVING: { variant: 'warning', label: 'In Approving' },  // normalized dashboard label
    PENDING_APPROVAL: { variant: 'warning', label: 'Pending Approval' },
    PARTIALLY_APPROVED: { variant: 'warning', label: 'Partially Approved' },
    PENDING_VERIFY: { variant: 'warning', label: 'Pending Verify' },
    VERIFIED: { variant: 'success', label: 'Verified' },
    COMPLETED: { variant: 'success', label: 'Completed' },
    APPROVED: { variant: 'success', label: 'Approved' },
    REJECTED: { variant: 'destructive', label: 'Rejected' },
    CANCELLED: { variant: 'secondary', label: 'Cancelled' },
};

export const STATUS_FALLBACK: BadgeConfig = { variant: 'secondary', label: '' };

// ─── Query Stale Times ─────────────────────────────────────

export const STALE = {
    LIST: 30_000,
    DETAIL: 15_000,
    /** Category / status counters and user lookups change slowly. */
    COUNTS: 60_000,
    USER_LOOKUP: 60_000,
} as const;

export const REFRESH = {
    LIST_MS: 180_000,
} as const;
