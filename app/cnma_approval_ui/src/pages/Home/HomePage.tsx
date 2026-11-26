import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Inbox, CheckCheck, BarChart3 } from 'lucide-react';
import { useIsMobile } from '@cnma/react-ui';
import type { InboxTask } from '@/services/inbox/inbox.types';
import { useStatusCounts, useTasks, useCurrentUser } from '@/pages/Inbox/hooks/inboxQueries';
import { HomeMobileView } from './HomeMobileView';
import { HomeDesktopView } from './HomeDesktopView';
import type { HomeStats, HomeViewProps, QuickAccessItem } from './homePage.types';

/** Number of newest tasks previewed on the Home page. */
const NEWEST_TASKS_COUNT = 5;
/** SAP orders and limits the result; keep it fresh for quick return navigation. */
const NEWEST_TASKS_STALE_TIME_MS = 60_000;

function buildQuickAccessItems(t: TFunction, stats: HomeStats): QuickAccessItem[] {
    return [
        {
            icon: <Inbox className="w-5 h-5 sm:w-6 sm:h-6" />,
            iconClass: 'text-warning bg-warning-bg',
            label: t('nav.myTasks', 'My Tasks'),
            description: t('home.quickAccessMyTasksDesc', 'Pending items awaiting your review & approval'),
            badge: stats.newTasks > 0 ? `${stats.newTasks}` : undefined,
            badgeVariant: 'warning',
            to: '/inbox',
        },
        {
            icon: <CheckCheck className="w-5 h-5 sm:w-6 sm:h-6" />,
            iconClass: 'text-success bg-success-bg',
            label: t('nav.approvedTasks', 'Approved Tasks'),
            description: t('home.quickAccessApprovedDesc', 'History of requests you previously approved'),
            badge: stats.approved > 0 ? `${stats.approved}` : undefined,
            badgeVariant: 'success',
            to: '/approved',
        },
        {
            icon: <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />,
            iconClass: 'text-info bg-info-bg',
            label: t('nav.dashboard', 'Dashboard'),
            description: t('home.quickAccessDashboardDesc', 'Performance analytics, charts & approval metrics'),
            badge: undefined,
            badgeVariant: 'default',
            to: '/dashboard',
        },
    ];
}

/**
 * HomePage — Clean & responsive landing page across all devices.
 * - Mobile: Exactly preserves original mobile layout, styles, and card behavior.
 * - Tablet & Desktop: Executive layout with high-end KPI metric cards, streamlined navigation,
 *   and no clutter (system overview and role badge removed).
 */
export default function HomePage() {
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    const { data: userInfo } = useCurrentUser();

    const {
        data: taskCounts,
        isLoading: isCountLoading,
        error: countError,
        isFetching: isCountFetching,
        refetch: refetchCounts,
    } = useStatusCounts();
    const stats: HomeStats = {
        totalTasks: taskCounts?.total ?? 0,
        newTasks: taskCounts?.inApproval ?? 0,
        approved: taskCounts?.completed ?? 0,
    };

    const {
        data: inboxData,
        isLoading: isInboxLoading,
        error: inboxError,
        isFetching: isInboxFetching,
        refetch: refetchInbox,
    } = useTasks({ top: NEWEST_TASKS_COUNT, staleTime: NEWEST_TASKS_STALE_TIME_MS });
    const newestTasks: InboxTask[] = inboxData?.items ?? [];
    const handleRetryHome = () => {
        void refetchCounts();
        void refetchInbox();
    };

    const viewProps: HomeViewProps = {
        displayName: userInfo?.displayName,
        pendingSubtitle: stats.newTasks > 0
            ? t('home.pendingApprovals', { count: stats.newTasks, defaultValue: `${stats.newTasks} pending approvals` })
            : t('home.allCaughtUp', 'All caught up! No pending approvals'),
        stats,
        isCountLoading,
        newestTasks,
        isInboxLoading,
        homeError: inboxError || countError,
        isRefreshing: isInboxFetching || isCountFetching,
        onRetry: handleRetryHome,
        quickAccessItems: buildQuickAccessItems(t, stats),
    };

    return (
        <div className="h-full overflow-y-auto bg-background">
            {isMobile ? <HomeMobileView {...viewProps} /> : <HomeDesktopView {...viewProps} />}
        </div>
    );
}
