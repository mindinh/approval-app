import type { ReactNode } from 'react';
import type { InboxTask } from '@/services/inbox/inbox.types';

/** Task status totals shown in the Home stat / KPI cards. */
export interface HomeStats {
    totalTasks: number;
    newTasks: number;
    approved: number;
}

export interface QuickAccessItem {
    icon: ReactNode;
    iconClass: string;
    label: string;
    description: string;
    badge?: string;
    badgeVariant: 'warning' | 'success' | 'default';
    to: string;
}

/** Everything the mobile and desktop Home layouts render; both share the same data. */
export interface HomeViewProps {
    displayName?: string;
    /** Localized "N pending approvals" / "All caught up" subtitle under the greeting. */
    pendingSubtitle: string;
    stats: HomeStats;
    isCountLoading: boolean;
    newestTasks: InboxTask[];
    isInboxLoading: boolean;
    homeError: unknown;
    isRefreshing: boolean;
    onRetry: () => void;
    quickAccessItems: QuickAccessItem[];
}
