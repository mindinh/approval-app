import type { Tone } from '@approval-core/renderers';
import { useEffect, useMemo } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Icon } from '@/components/icon';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { CATEGORY_ICONS, moduleTile } from '@/components/task-card';
import { useTaskList } from '@/hooks/queries/use-task-queries';
import type { TaskCategory, TaskScope } from '@/lib/api/bff-api';
import { haptics } from '@/lib/haptics';
import { cssEasing, duration, radius, shadows, spacing, useColors } from '@/theme';
import { activeFilterCount, applyTaskFilters, type TaskFilters } from '@/utils/task-filters';
import { toTaskSummary, type TaskSummary } from '@/utils/task-summary';

/** With local filters active, a group keeps loading pages until at least this many matches are shown. */
const MIN_FILTERED_RESULTS = 8;

/** Same groups, order, titles and tones as the web Inbox accordion (`CATEGORY_ACCORDION_SECTIONS`). */
export const CATEGORY_GROUPS: readonly { key: TaskCategory; title: string; tone: Tone }[] = [
    { key: 'PR', title: 'Purchase Requisition', tone: 'primary' },
    { key: 'PO', title: 'Purchase Order', tone: 'info' },
    { key: 'CLAIM', title: 'Claim', tone: 'success' },
    { key: 'RESERVATION', title: 'Reservation', tone: 'warning' },
];

function uniqueByInstanceId<T extends { instanceId: string }>(tasks: T[]): T[] {
    const seen = new Set<string>();
    return tasks.filter((task) => !seen.has(task.instanceId) && Boolean(seen.add(task.instanceId)));
}

export interface CategoryGroupData {
    category: TaskCategory;
    summaries: TaskSummary[];
    /** Server total for the group (with search), undefined until the first page arrives. */
    total?: number;
    /** Tasks loaded so far (before local filters). */
    loaded: number;
    /** When the group was fetched: reference time for card ages. */
    fetchedAt: number;
    isPending: boolean;
    isFetchingNextPage: boolean;
    hasNextPage: boolean;
    error: Error | null;
    loadMore: () => void;
    refetch: () => Promise<unknown>;
}

/**
 * One worklist group: its own paged query (fetched only while open or searching) with the advanced
 * filters applied to the loaded tasks, like the web.
 */
export function useCategoryGroup(scope: TaskScope, category: TaskCategory, search: string, enabled: boolean, filters: TaskFilters): CategoryGroupData {
    const list = useTaskList(scope, category, search, enabled);
    const pages = list.data?.pages;
    const fetchedAt = list.dataUpdatedAt;
    const filterCount = activeFilterCount(filters);

    // $skip paging can return a task twice when the worklist shifts between pages (a new task arrives): keep the first.
    const loaded = useMemo(() => uniqueByInstanceId((pages ?? []).flatMap((page) => page.items)), [pages]);
    const summaries = useMemo(() => applyTaskFilters(loaded, filters).map((task) => toTaskSummary(task, fetchedAt, scope)), [loaded, filters, fetchedAt, scope]);

    // Subtype / task-type / date filters run on loaded tasks (the API cannot filter them): load further
    // pages until enough matches are visible or the group is exhausted.
    // A failed page stops the auto-load (no request loop); the footer offers Retry.
    const { hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage } = list;
    useEffect(() => {
        if (enabled && filterCount > 0 && summaries.length < MIN_FILTERED_RESULTS && hasNextPage && !isFetchingNextPage && !isFetchNextPageError) void fetchNextPage();
    }, [enabled, filterCount, summaries.length, hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);

    return {
        category,
        summaries,
        total: pages?.[0]?.total,
        loaded: loaded.length,
        fetchedAt,
        isPending: enabled && list.isPending,
        isFetchingNextPage,
        hasNextPage,
        error: list.error,
        loadMore: () => {
            if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
        },
        refetch: () => (enabled ? list.refetch() : Promise.resolve()),
    };
}

/**
 * Group header card (web accordion header, sized for touch): tone stripe, category icon, title, the
 * "N In Approving / M Total" (or "N Completed / M Total") badge and a rotating chevron.
 */
export function CategoryGroupHeader({
    title,
    category,
    tone,
    scope,
    count,
    total,
    resultCount,
    expanded,
    loading,
    onToggle,
}: {
    title: string;
    category: TaskCategory;
    tone: Tone;
    scope: TaskScope;
    /** In Approving (Inbox) or Completed (Approved) count. */
    count?: number;
    /** In Approving + Completed. */
    total?: number;
    /** While searching: number of matching tasks (replaces the count badge). */
    resultCount?: number;
    expanded: boolean;
    loading: boolean;
    onToggle: () => void;
}) {
    const colors = useColors();
    const tile = moduleTile(colors, tone);
    const badge = scope === 'open' ? { tint: colors.warning, soft: colors.warningSoft, label: 'In Approving' } : { tint: colors.success, soft: colors.successSoft, label: 'Completed' };
    const countLabel =
        resultCount !== undefined ? `${resultCount} ${resultCount === 1 ? 'result' : 'results'}` : count !== undefined ? `${count} ${badge.label}${total !== undefined ? ` / ${total} Total` : ''}` : undefined;

    return (
        <PressableScale
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            accessibilityLabel={[title, countLabel].filter(Boolean).join(', ')}
            onPress={() => {
                haptics.selection();
                onToggle();
            }}
            scale={0.985}
        >
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.smd,
                    paddingVertical: spacing.smd,
                    paddingLeft: spacing.md + 2,
                    paddingRight: spacing.smd,
                    borderRadius: radius.card,
                    borderCurve: 'continuous',
                    backgroundColor: colors.cardBackground,
                    borderWidth: 1,
                    borderColor: expanded ? `${tile.foreground}55` : colors.cardBorder,
                    boxShadow: shadows.card,
                    overflow: 'hidden',
                }}
            >
                <View style={{ position: 'absolute', left: 0, top: spacing.smd, bottom: spacing.smd, width: 4, borderTopRightRadius: 4, borderBottomRightRadius: 4, backgroundColor: tile.foreground }} />
                <View style={{ width: 42, height: 42, borderRadius: radius.md + 2, borderCurve: 'continuous', backgroundColor: tile.background, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={CATEGORY_ICONS[category]} size={20} color={tile.foreground} />
                </View>
                <View style={{ flex: 1, gap: 4, alignItems: 'flex-start' }}>
                    <ThemedText variant="headline" numberOfLines={1} style={{ fontWeight: '700' }}>
                        {title}
                    </ThemedText>
                    {countLabel ? (
                        <View style={{ paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm, backgroundColor: resultCount !== undefined ? colors.fillBackground : badge.soft }}>
                            <ThemedText variant="caption" numberOfLines={1} style={{ color: resultCount !== undefined ? colors.secondaryLabel : badge.tint, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
                                {countLabel}
                            </ThemedText>
                        </View>
                    ) : null}
                </View>
                <View style={{ width: 32, height: 32, borderRadius: radius.full, backgroundColor: colors.fillBackground, alignItems: 'center', justifyContent: 'center' }}>
                    {loading ? (
                        <ActivityIndicator size="small" color={colors.accent} />
                    ) : (
                        <Animated.View
                            style={{
                                transform: [{ rotate: expanded ? '180deg' : '0deg' }],
                                transitionProperty: 'transform',
                                transitionDuration: duration.base,
                                transitionTimingFunction: cssEasing.out,
                            }}
                        >
                            <Icon name={{ ios: 'chevron.down', android: 'expand_more' }} size={15} color={colors.secondaryLabel} />
                        </Animated.View>
                    )}
                </View>
            </View>
        </PressableScale>
    );
}

/**
 * Bottom of an open group. Pages load on their own as the group's last cards scroll into view; the footer
 * shows that progress ("Loading more…"), a retry when a page failed, or "All N loaded".
 */
export function CategoryGroupFooter({ group }: { group: CategoryGroupData }) {
    const colors = useColors();
    if (group.isFetchingNextPage) {
        return (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md }}>
                <ActivityIndicator size="small" color={colors.accent} />
                <ThemedText variant="caption" style={{ fontVariant: ['tabular-nums'] }}>
                    {group.total !== undefined ? `Loading more · ${group.loaded} of ${group.total}` : 'Loading more…'}
                </ThemedText>
            </View>
        );
    }
    if (group.error && group.hasNextPage) {
        return (
            <Pressable
                accessibilityRole="button"
                onPress={() => {
                    haptics.light();
                    group.loadMore();
                }}
                style={({ pressed }) => ({ alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2, paddingVertical: spacing.sm, opacity: pressed ? 0.6 : 1 })}
            >
                <Icon name={{ ios: 'arrow.clockwise', android: 'refresh' }} size={14} color={colors.accent} />
                <ThemedText variant="footnote" style={{ color: colors.accent, fontWeight: '600' }}>
                    Could not load more — tap to retry
                </ThemedText>
            </Pressable>
        );
    }
    if (group.hasNextPage) {
        // Placeholder height while the next page is about to be requested (keeps the list from jumping).
        return <View style={{ height: spacing.lg }} />;
    }
    if (group.loaded > 0) {
        return (
            <ThemedText variant="caption" style={{ textAlign: 'center', color: colors.tertiaryLabel, paddingVertical: spacing.xs }}>
                {group.loaded === 1 ? '1 task' : `All ${group.loaded} tasks loaded`}
            </ThemedText>
        );
    }
    return null;
}
