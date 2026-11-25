import type { Tone } from '@approval-core/renderers';
import { useEffect, useMemo } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Icon } from '@/components/icon';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { CATEGORY_ICONS } from '@/components/task-card';
import { categoryColor } from '@/components/tone-text';
import { FILTERED_PAGE_SIZE, useTaskList } from '@/hooks/queries/use-task-queries';
import type { TaskCategory, TaskScope } from '@/lib/api/bff-api';
import { haptics } from '@/lib/haptics';
import { cssEasing, duration, radius, shadows, spacing, useColors } from '@/theme';
import { activeFilterCount, applyTaskFilters, type TaskFilters } from '@/utils/task-filters';
import { toTaskSummary, type TaskSummary } from '@/utils/task-summary';

/** Width of the gradient border of group headers. */
const BORDER = 1.5;

/** Same groups, order, titles and tones as the web Inbox accordion (`CATEGORY_ACCORDION_SECTIONS`). */
export const CATEGORY_GROUPS: readonly {
    key: TaskCategory;
    title: string;
    tone: Tone;
}[] = [
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
    /** Device-side filters are on: pages load on their own until the group is fully scanned. */
    scanning: boolean;
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
    const filterCount = activeFilterCount(filters);
    const list = useTaskList(scope, category, search, enabled, filterCount > 0 ? FILTERED_PAGE_SIZE : undefined);
    const pages = list.data?.pages;
    const fetchedAt = list.dataUpdatedAt;

    // $skip paging can return a task twice when the worklist shifts between pages (a new task arrives): keep the first.
    const loaded = useMemo(() => uniqueByInstanceId((pages ?? []).flatMap((page) => page.items)), [pages]);
    const summaries = useMemo(() => applyTaskFilters(loaded, filters).map((task) => toTaskSummary(task, fetchedAt, scope)), [loaded, filters, fetchedAt, scope]);

    // Subtype / task-type / date filters run on loaded tasks (the API cannot filter them). Matches can be
    // sparse, so the group scans on in the background (large pages) until it is exhausted: found tasks show
    // as they arrive and can be opened right away, instead of waiting for the next page to be scrolled into
    // view — which never re-triggered while the footer stayed on screen.
    // A failed page stops the scan (no request loop); the footer offers Retry.
    const { hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage } = list;
    const scanning = enabled && filterCount > 0;
    useEffect(() => {
        if (scanning && hasNextPage && !isFetchingNextPage && !isFetchNextPageError) void fetchNextPage();
    }, [scanning, hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);

    return {
        category,
        summaries,
        total: pages?.[0]?.total,
        loaded: loaded.length,
        scanning,
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
 * Group header (web accordion header, sized for touch): category icon in its color, title, the count as
 * colored text ("N In Approving / M Total" in amber, or "N Completed / M Total" in green) and a rotating
 * chevron, framed by a gradient border in the category color (Inbox and Approved).
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
    /** While searching: number of matching tasks (replaces the count). */
    resultCount?: number;
    expanded: boolean;
    loading: boolean;
    onToggle: () => void;
}) {
    const colors = useColors();
    const tint = categoryColor(colors, tone);
    const countTone = scope === 'open' ? { color: colors.pending, label: 'In Approving' } : { color: colors.success, label: 'Completed' };
    const countLabel =
        resultCount !== undefined
            ? `${resultCount} ${resultCount === 1 ? 'result' : 'results'}`
            : count !== undefined
              ? `${count} ${countTone.label}${total !== undefined ? ` / ${total} Total` : ''}`
              : undefined;

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
            {/* Gradient border in the category color: an outer gradient layer behind an inner card. */}
            <View
                style={{
                    padding: BORDER,
                    borderRadius: radius.card,
                    borderCurve: 'continuous',
                    boxShadow: shadows.card,
                    experimental_backgroundImage: `linear-gradient(120deg, ${tint} 0%, ${tint}66 40%, ${tint}1A 100%)`,
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.smd,
                        paddingVertical: spacing.smd,
                        paddingHorizontal: spacing.md,
                        borderRadius: radius.card - BORDER,
                        borderCurve: 'continuous',
                        backgroundColor: colors.cardBackground,
                    }}
                >
                    <Icon name={CATEGORY_ICONS[category]} size={20} color={tint} />
                    <View style={{ flex: 1, gap: 2 }}>
                        <ThemedText variant="headline" numberOfLines={1}>
                            {title}
                        </ThemedText>
                        {countLabel ? (
                            <ThemedText
                                variant="caption"
                                numberOfLines={1}
                                style={{
                                    color: resultCount !== undefined ? colors.secondaryLabel : countTone.color,
                                    fontWeight: '600',
                                    fontVariant: ['tabular-nums'],
                                }}
                            >
                                {countLabel}
                            </ThemedText>
                        ) : null}
                    </View>
                    {loading ? (
                        <ActivityIndicator size="small" color={colors.secondaryLabel} />
                    ) : (
                        <Animated.View
                            style={{
                                transform: [{ rotate: expanded ? '180deg' : '0deg' }],
                                transitionProperty: 'transform',
                                transitionDuration: duration.base,
                                transitionTimingFunction: cssEasing.out,
                            }}
                        >
                            <Icon name={{ ios: 'chevron.down', android: 'expand_more' }} size={15} color={colors.tertiaryLabel} />
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
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: spacing.sm,
                    paddingVertical: spacing.md,
                }}
            >
                <ActivityIndicator size="small" color={colors.secondaryLabel} />
                <ThemedText variant="caption" style={{ fontVariant: ['tabular-nums'] }}>
                    {group.total === undefined ? 'Loading more…' : group.scanning ? `Finding matches · ${group.loaded} of ${group.total} checked` : `Loading more · ${group.loaded} of ${group.total}`}
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
                style={({ pressed }) => ({
                    alignSelf: 'center',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.xs + 2,
                    paddingVertical: spacing.sm,
                    opacity: pressed ? 0.6 : 1,
                })}
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
            <ThemedText
                variant="caption"
                style={{
                    textAlign: 'center',
                    color: colors.tertiaryLabel,
                    paddingVertical: spacing.xs,
                }}
            >
                {group.scanning ? `All ${group.loaded} tasks checked` : group.loaded === 1 ? '1 task' : `All ${group.loaded} tasks loaded`}
            </ThemedText>
        );
    }
    return null;
}
