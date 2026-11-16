import { FlashList, type FlashListRef, type ViewToken } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Button } from '@/components/button';
import { EmptyState } from '@/components/empty-state';
import { Icon } from '@/components/icon';
import { CountBadge } from '@/components/count-badge';
import { ErrorState, InlineErrorRow } from '@/components/error-state';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { BrandRefreshControl, TopWash, useScreenContentInsets } from '@/components/screen-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Section } from '@/components/section';
import { TaskCardSkeleton } from '@/components/task-card';
import { TaskCardLink } from '@/components/task-card-link';
import { useCategoryCounts } from '@/hooks/queries/use-task-queries';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useWorklistFilters } from '@/hooks/use-worklist-filters';
import { useWindowClass } from '@/hooks/use-window-class';
import type { TaskCategory, TaskScope } from '@/lib/api/bff-api';
import { haptics } from '@/lib/haptics';
import { radius, shadows, spacing, useColors } from '@/theme';
import { activeFilterCount } from '@/utils/task-filters';
import type { TaskSummary } from '@/utils/task-summary';
import { CATEGORY_GROUPS, CategoryGroupFooter, CategoryGroupHeader, useCategoryGroup, type CategoryGroupData } from './category-group';
import { SEARCH_FIELD_HEIGHT, SearchField } from '@/components/search-field';

const SEARCH_DEBOUNCE_MS = 350;
const SKELETON_CARDS = 3;
/** Start loading a group's next page when a card this close to the group's end becomes visible. */
const PREFETCH_DISTANCE = 5;
/** Past this scroll offset the floating "Collapse all" pill appears. */
const SHOW_TOP_PILL_AFTER = 900;
const VIEWABILITY = { itemVisiblePercentThreshold: 10, minimumViewTime: 120 } as const;

const COPY: Record<TaskScope, { title: string; subtitle: (total: number) => string; empty: string; emptyMessage: string; search: string }> = {
    open: {
        title: 'Inbox',
        subtitle: (total) => (total === 1 ? '1 request waiting for you' : `${total} requests waiting for you`),
        empty: "You're all caught up",
        emptyMessage: 'New approval requests from SAP will show up here.',
        search: 'Search title, doc number, creator…',
    },
    approved: {
        title: 'Approved',
        subtitle: (total) => (total === 1 ? '1 request you approved' : `${total} requests you approved`),
        empty: 'Nothing approved yet',
        emptyMessage: 'Requests you approve will be listed here.',
        search: 'Search title, doc number, creator…',
    },
};

/** One row of the grouped list: a group header, a task card, or the state / footer of an open group. */
type Row =
    | { type: 'header'; category: TaskCategory }
    | { type: 'task'; category: TaskCategory; task: TaskSummary; now: number; /** Cards left below it in its group. */ remaining: number }
    | { type: 'loading'; category: TaskCategory }
    | { type: 'error'; category: TaskCategory; error: Error }
    | { type: 'empty'; category: TaskCategory }
    | { type: 'footer'; category: TaskCategory };

/** Matching tasks of a group while searching: the server total, or the loaded matches when local filters apply. */
function matchCount(group: CategoryGroupData, filtered: boolean): number {
    return filtered ? group.summaries.length : (group.total ?? group.summaries.length);
}

/**
 * Inbox (open) and Approved (history) worklists, organized like the web: one collapsible group per
 * category (Purchase Requisition, Purchase Order, Claim, Reservation) with "In Approving / Total"
 * counts. A group fetches its own pages only while open. Searching (title, document number, creator)
 * opens every group and hides the ones without matches. Advanced filters live in the filter sheet.
 *
 * Performance: headers, cards and group footers are rows of one virtualized FlashList (recycled views,
 * one row type per kind). Each open group loads 20 tasks at a time, and only when one of its last cards
 * actually scrolls into view, so collapsed or off-screen groups never fetch. "Collapse all" closes every
 * group and returns to the top (also from a floating pill once scrolled far down).
 */
export function TaskListScreen({ scope }: { scope: TaskScope }) {
    const colors = useColors();
    const copy = COPY[scope];
    const wide = useWindowClass() === 'expanded';
    const { paddingTop, paddingBottom, refreshOffset } = useScreenContentInsets(true);

    const router = useRouter();
    const { filters, reset: resetFilters } = useWorklistFilters(scope);
    const [searchInput, setSearchInput] = useState('');
    const search = useDebouncedValue(searchInput.trim(), SEARCH_DEBOUNCE_MS);
    const searching = search !== '';
    const filterCount = activeFilterCount(filters);
    const filtered = filterCount > 0;

    const counts = useCategoryCounts(scope);
    // The other scope's counts complete the badge: Total = In Approving + Completed (as on the web).
    const otherCounts = useCategoryCounts(scope === 'open' ? 'approved' : 'open');
    const [expanded, setExpanded] = useState<ReadonlySet<TaskCategory> | null>(null);

    // Until the user toggles a group, the first group that has tasks is open (PR while counts load).
    const firstWithTasks = CATEGORY_GROUPS.find((group) => (counts.data?.[group.key] ?? 0) > 0)?.key;
    const openGroups: ReadonlySet<TaskCategory> = expanded ?? new Set<TaskCategory>(firstWithTasks ? [firstWithTasks] : counts.data ? [] : ['PR']);
    const isOpen = (category: TaskCategory) => searching || openGroups.has(category);

    const groups: Record<TaskCategory, CategoryGroupData> = {
        PR: useCategoryGroup(scope, 'PR', search, isOpen('PR'), filters),
        PO: useCategoryGroup(scope, 'PO', search, isOpen('PO'), filters),
        CLAIM: useCategoryGroup(scope, 'CLAIM', search, isOpen('CLAIM'), filters),
        RESERVATION: useCategoryGroup(scope, 'RESERVATION', search, isOpen('RESERVATION'), filters),
    };
    const [pulling, setPulling] = useState(false);
    const listRef = useRef<FlashListRef<Row>>(null);
    const [showTopPill, setShowTopPill] = useState(false);

    const toggle = (category: TaskCategory) => {
        if (searching) return;
        const next = new Set(openGroups);
        if (next.has(category)) next.delete(category);
        else next.add(category);
        setExpanded(next);
    };

    const anyOpen = CATEGORY_GROUPS.some((group) => openGroups.has(group.key));
    const collapseAll = () => {
        haptics.light();
        if (!searching) setExpanded(new Set());
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
    };

    // Infinite load per group: a visible card near the end of its group pulls that group's next page.
    // The viewability callback must keep one identity, so it reads the latest groups through a ref.
    const groupsRef = useRef(groups);
    useEffect(() => {
        groupsRef.current = groups;
    });
    const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken<Row>[] }) => {
        for (const token of viewableItems) {
            const row = token.item;
            if (row && ((row.type === 'task' && row.remaining < PREFETCH_DISTANCE) || row.type === 'footer')) groupsRef.current[row.category].loadMore();
        }
    }, []);

    const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const next = event.nativeEvent.contentOffset.y > SHOW_TOP_PILL_AFTER;
        if (next !== showTopPill) setShowTopPill(next);
    };

    const refresh = async () => {
        haptics.light();
        setPulling(true);
        await Promise.all([counts.refetch(), otherCounts.refetch(), ...Object.values(groups).map((group) => group.refetch())]);
        setPulling(false);
    };

    const clearAll = () => {
        resetFilters();
        setSearchInput('');
    };

    // Flatten the groups into list rows.
    const rows: Row[] = [];
    let searchResults = 0;
    let searchPending = false;
    for (const { key: category } of CATEGORY_GROUPS) {
        const group = groups[category];
        if (searching) {
            searchPending ||= group.isPending;
            const matches = matchCount(group, filtered);
            searchResults += group.isPending ? 0 : matches;
            if (!group.isPending && matches === 0 && !group.error) continue;
        }
        rows.push({ type: 'header', category });
        if (!isOpen(category)) continue;
        if (group.isPending) rows.push({ type: 'loading', category });
        else if (group.error && group.loaded === 0) rows.push({ type: 'error', category, error: group.error });
        else if (group.summaries.length === 0) rows.push({ type: 'empty', category });
        else {
            group.summaries.forEach((task, index) => rows.push({ type: 'task', category, task, now: group.fetchedAt, remaining: group.summaries.length - 1 - index }));
            rows.push({ type: 'footer', category });
        }
    }
    const searchEmpty = searching && !searchPending && searchResults === 0;
    const total = counts.data ? CATEGORY_GROUPS.reduce((sum, group) => sum + (counts.data?.[group.key] ?? 0), 0) : undefined;
    const allDone = counts.data !== undefined && total === 0 && !searching && !filtered;
    const indent = wide ? spacing.lg : spacing.xs;

    const renderItem = ({ item }: { item: Row }) => {
        const group = groups[item.category];
        const def = CATEGORY_GROUPS.find((candidate) => candidate.key === item.category) ?? CATEGORY_GROUPS[0];
        switch (item.type) {
            case 'header': {
                const count = counts.data?.[item.category] ?? undefined;
                const other = otherCounts.data?.[item.category] ?? undefined;
                return (
                    <View style={{ paddingTop: spacing.smd }}>
                        <CategoryGroupHeader
                            title={def.title}
                            category={item.category}
                            tone={def.tone}
                            scope={scope}
                            count={count}
                            total={count !== undefined && other !== undefined ? count + other : undefined}
                            resultCount={searching && !group.isPending ? matchCount(group, filtered) : undefined}
                            expanded={isOpen(item.category)}
                            loading={group.isPending}
                            onToggle={() => toggle(item.category)}
                        />
                    </View>
                );
            }
            case 'task':
                return (
                    <View style={{ paddingTop: spacing.smd, paddingLeft: indent }}>
                        <TaskCardLink task={item.task} now={item.now} />
                    </View>
                );
            case 'loading':
                return (
                    <View style={{ gap: spacing.smd, paddingTop: spacing.smd, paddingLeft: indent }}>
                        {Array.from({ length: SKELETON_CARDS }, (_, index) => (
                            <TaskCardSkeleton key={index} />
                        ))}
                    </View>
                );
            case 'error':
                return (
                    <View style={{ paddingTop: spacing.smd, paddingLeft: indent }}>
                        <Section>
                            <InlineErrorRow title={`Could not load ${def.title}`} error={item.error} onRetry={() => group.refetch()} />
                        </Section>
                    </View>
                );
            case 'empty':
                return (
                    <View
                        style={{
                            marginTop: spacing.smd,
                            marginLeft: indent,
                            paddingVertical: spacing.lg,
                            borderRadius: radius.card,
                            borderWidth: 1,
                            borderStyle: 'dashed',
                            borderColor: colors.separator,
                            alignItems: 'center',
                            gap: spacing.xs,
                        }}
                    >
                        <ThemedText variant="footnote">{filtered ? 'No tasks match the filters' : 'No tasks in this category'}</ThemedText>
                        {filtered ? (
                            <Pressable accessibilityRole="button" hitSlop={8} onPress={resetFilters}>
                                <ThemedText variant="footnote" style={{ color: colors.accent, fontWeight: '600' }}>
                                    Clear filters
                                </ThemedText>
                            </Pressable>
                        ) : null}
                    </View>
                );
            default:
                return (
                    <View style={{ paddingTop: spacing.sm, paddingLeft: indent }}>
                        <CategoryGroupFooter group={group} />
                    </View>
                );
        }
    };

    const header = (
        <View style={{ gap: spacing.md, marginBottom: spacing.xs }}>
            <ScreenHeader title={copy.title} subtitle={total === undefined ? undefined : copy.subtitle(total)} />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <View style={{ flex: 1 }}>
                    <SearchField value={searchInput} onChangeText={setSearchInput} placeholder={copy.search} />
                </View>
                <FilterButton count={filterCount} onPress={() => router.push({ pathname: '/filters', params: { scope } })} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 28, paddingHorizontal: spacing.xs }}>
                <ThemedText variant="footnote" style={{ flex: 1 }}>
                    {searching ? (searchPending ? 'Searching…' : searchResults === 1 ? '1 matching task' : `${searchResults} matching tasks`) : 'Categories'}
                </ThemedText>
                {!searching && anyOpen ? (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Collapse all categories"
                        hitSlop={8}
                        onPress={collapseAll}
                        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 4, opacity: pressed ? 0.6 : 1 })}
                    >
                        <Icon name={{ ios: 'rectangle.compress.vertical', android: 'unfold_less' }} size={14} color={colors.accent} />
                        <ThemedText variant="footnote" style={{ color: colors.accent, fontWeight: '600' }}>
                            Collapse all
                        </ThemedText>
                    </Pressable>
                ) : null}
            </View>
        </View>
    );

    // Nothing could be loaded at all (offline, service down, session expired): one full error panel.
    const listUnavailable = counts.error && !counts.data && CATEGORY_GROUPS.every((group) => !groups[group.key].loaded);
    const emptyContent = listUnavailable ? (
        <ErrorState error={counts.error} context={`Loading the ${copy.title}`} onRetry={refresh} />
    ) : searchEmpty ? (
        <EmptyState
            icon={{ ios: 'magnifyingglass', android: 'search_off' }}
            tint={{ foreground: colors.secondaryLabel, background: colors.fillBackground }}
            title="No matching tasks"
            message="Search by words of the title, the document number or the creator."
            action={<Button title="Clear search & filters" variant="secondary" onPress={clearAll} style={{ alignSelf: 'stretch' }} />}
        />
    ) : allDone ? (
        <EmptyState
            icon={scope === 'open' ? { ios: 'checkmark.seal', android: 'verified' } : { ios: 'tray', android: 'inbox' }}
            tint={{ foreground: colors.accent, background: colors.accentSoft }}
            title={copy.empty}
            message={copy.emptyMessage}
        />
    ) : null;

    return (
        <View style={{ flex: 1, backgroundColor: colors.groupedBackground }}>
            <TopWash />
            <FlashList
                ref={listRef}
                data={emptyContent ? [] : rows}
                // Position is part of a task key: CC tasks can share an all-zero SAP InstanceID.
                keyExtractor={(row) => (row.type === 'task' ? `task-${row.task.key}` : `${row.type}-${row.category}`)}
                getItemType={(row) => row.type}
                renderItem={renderItem}
                extraData={rows}
                ListHeaderComponent={header}
                ListEmptyComponent={emptyContent}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={VIEWABILITY}
                onScroll={onScroll}
                scrollEventThrottle={64}
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
                contentInsetAdjustmentBehavior="automatic"
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: spacing.md, paddingTop, paddingBottom }}
                refreshControl={<BrandRefreshControl refreshing={pulling} onRefresh={refresh} offset={refreshOffset} />}
            />
            {showTopPill ? <TopPill label={searching || !anyOpen ? 'Back to top' : 'Collapse all'} onPress={collapseAll} /> : null}
        </View>
    );
}

/**
 * Floating pill at the top of the screen once the list is scrolled far down: collapses the groups and
 * scrolls up. It sits under the status bar (where the list scrolls back to), so it never depends on the
 * height of the platform tab bar.
 */
function TopPill({ label, onPress }: { label: string; onPress: () => void }) {
    const colors = useColors();
    const { top } = useSafeAreaInsets();
    return (
        <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)} style={{ position: 'absolute', alignSelf: 'center', top: top + spacing.sm }}>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={label}
                onPress={onPress}
                style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.xs + 2,
                    minHeight: 40,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: radius.full,
                    backgroundColor: colors.label,
                    boxShadow: shadows.raised,
                    opacity: pressed ? 0.85 : 1,
                })}
            >
                <Icon name={{ ios: 'arrow.up', android: 'arrow_upward' }} size={14} color={colors.groupedBackground} />
                <ThemedText variant="subhead" style={{ color: colors.groupedBackground, fontWeight: '600' }}>
                    {label}
                </ThemedText>
            </Pressable>
        </Animated.View>
    );
}

/** Round filter button beside the search field; shows how many extra filters are active. */
function FilterButton({ count, onPress }: { count: number; onPress: () => void }) {
    const colors = useColors();
    const active = count > 0;
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={active ? `Filters, ${count} active` : 'Filters'}
            onPress={() => {
                haptics.light();
                onPress();
            }}
            style={({ pressed }) => ({
                width: SEARCH_FIELD_HEIGHT,
                height: SEARCH_FIELD_HEIGHT,
                borderRadius: radius.full,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: active ? colors.accent : colors.cardBackground,
                borderWidth: active ? 0 : 1,
                borderColor: colors.cardBorder,
                boxShadow: shadows.card,
                opacity: pressed ? 0.7 : 1,
            })}
        >
            <Icon name={{ ios: 'line.3.horizontal.decrease', android: 'tune' }} size={18} color={active ? colors.onAccent : colors.label} />
            {active ? <CountBadge value={count} color={colors.label} textColor={colors.cardBackground} ringColor={colors.groupedBackground} offset={{ top: -2, right: -2 }} /> : null}
        </Pressable>
    );
}
