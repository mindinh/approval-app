import { useMemo, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { InlineErrorRow } from '@/components/error-state';
import { ScreenHeader } from '@/components/screen-header';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { Section } from '@/components/section';
import { useOpenTasks, useStatusCounts } from '@/hooks/queries/use-task-queries';
import { useWindowClass } from '@/hooks/use-window-class';
import { userNameOf } from '@/lib/auth/jwt';
import { useSession } from '@/lib/auth/session';
import { haptics } from '@/lib/haptics';
import { layout, spacing } from '@/theme';
import { toTaskSummary } from '@/utils/task-summary';
import { KpiOverview } from './kpi-overview';
import { LatestTasksSection } from './latest-tasks-section';

/** Number of newest tasks previewed on Home (same as the web Home page). */
const NEWEST_TASKS_COUNT = 5;

function greetingFor(hour: number): string {
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

/** Phone: one column. Expanded window (tablet, unfolded phone): overview on the side, tasks beside it. */
function HomeLayout({ wide, overview, tasks }: { wide: boolean; overview: ReactNode; tasks: ReactNode }) {
    if (!wide) {
        return (
            <>
                {overview}
                {tasks}
            </>
        );
    }
    return (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.lg }}>
            <View style={{ width: layout.sideColumnWidth, gap: spacing.lg }}>{overview}</View>
            <View style={{ flex: 1 }}>{tasks}</View>
        </View>
    );
}

/** Home: greeting, the pending summary and the newest open tasks. Both queries load in parallel. */
export function HomeScreen() {
    const { user } = useSession();
    const counts = useStatusCounts();
    const tasks = useOpenTasks(NEWEST_TASKS_COUNT);
    const wide = useWindowClass() === 'expanded';
    const [pulling, setPulling] = useState(false);

    const items = tasks.data?.items;
    // Aging is measured at the time the list was fetched, so it updates on every (re)load.
    const fetchedAt = tasks.dataUpdatedAt;
    const summaries = useMemo(() => items?.map((task) => toTaskSummary(task, fetchedAt)), [items, fetchedAt]);

    const refresh = async () => {
        haptics.light();
        setPulling(true);
        await Promise.all([counts.refetch(), tasks.refetch()]);
        setPulling(false);
    };

    const now = new Date();
    const firstName = (user?.claims?.name || userNameOf(user?.claims ?? null) || '').split(/\s+/)[0];
    const greeting = greetingFor(now.getHours());

    const overview =
        counts.error && !counts.data ? (
            <Section>
                <InlineErrorRow title="Could not load counters" error={counts.error} onRetry={() => counts.refetch()} />
            </Section>
        ) : (
            <KpiOverview counts={counts.data} />
        );

    return (
        <ScreenScrollView headerless wash refreshing={pulling} onRefresh={refresh} maxWidth={wide ? layout.maxWideContentWidth : layout.maxContentWidth}>
            <ScreenHeader eyebrow={now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })} title={firstName ? `${greeting}, ${firstName}` : greeting} />
            <HomeLayout
                wide={wide}
                overview={overview}
                tasks={<LatestTasksSection tasks={summaries} now={fetchedAt} total={counts.data?.inApproval} isLoading={tasks.isPending} error={tasks.error} onRetry={() => tasks.refetch()} />}
            />
        </ScreenScrollView>
    );
}
