import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Icon } from '@/components/icon';
import { ErrorState } from '@/components/error-state';
import { ScreenHeader } from '@/components/screen-header';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { SearchField } from '@/components/search-field';
import { Section } from '@/components/section';
import { Skeleton } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { useDashboard } from '@/hooks/queries/use-task-queries';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import type { TaskCategory } from '@/lib/api/bff-api';
import { haptics } from '@/lib/haptics';
import { cardSurface, fadeInContent, radius, spacing, useColors } from '@/theme';
import { DASHBOARD_CATEGORIES, breakdown, statusTotals, type DashboardStatus } from '@/utils/dashboard';
import { CategoryOverview } from './category-overview';
import { StatusDonut } from './status-donut';
import { DashboardTaskTable } from './task-table';

/** Rows per table page (the web uses 50 on a wide table; a phone page stays short). */
const PAGE_SIZE = 20;
/** Wait for a pause in typing before asking the BFF. */
const SEARCH_DEBOUNCE_MS = 350;

/** Active drill-down filters as removable capsules (web: filter pills under the title). */
function ActiveFilters({ items, onClearAll }: { items: { key: string; label: string; onRemove: () => void }[]; onClearAll: () => void }) {
    const colors = useColors();
    if (items.length === 0) return null;
    return (
        <Animated.View entering={fadeInContent} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xs }}>
            {items.map((item) => (
                <Pressable
                    key={item.key}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove filter ${item.label}`}
                    onPress={() => {
                        haptics.selection();
                        item.onRemove();
                    }}
                    style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        minHeight: 30,
                        paddingVertical: 4,
                        paddingHorizontal: spacing.smd,
                        borderRadius: radius.full,
                        borderWidth: 1,
                        borderColor: colors.separator,
                        opacity: pressed ? 0.7 : 1,
                    })}
                >
                    <ThemedText variant="footnote" style={{ color: colors.label, fontWeight: '600' }}>
                        {item.label}
                    </ThemedText>
                    <Icon name={{ ios: 'xmark', android: 'close' }} size={10} color={colors.secondaryLabel} />
                </Pressable>
            ))}
            <Pressable accessibilityRole="button" hitSlop={8} onPress={onClearAll}>
                <ThemedText variant="footnote" style={{ color: colors.secondaryLabel }}>
                    Clear all
                </ThemedText>
            </Pressable>
        </Animated.View>
    );
}

function DashboardSkeleton() {
    const colors = useColors();
    const card = { padding: spacing.md, ...cardSurface(colors) };
    return (
        <>
            <View style={[card, { flexDirection: 'row', alignItems: 'center', gap: spacing.lg }]}>
                <Skeleton width={148} height={148} borderRadius={radius.full} />
                <View style={{ flex: 1, gap: spacing.sm }}>
                    <Skeleton height={56} borderRadius={radius.md} />
                    <Skeleton height={56} borderRadius={radius.md} />
                </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.smd }}>
                {Array.from({ length: 4 }, (_, index) => (
                    <View key={index} style={[card, { flexBasis: '47%', flexGrow: 1, gap: spacing.sm }]}>
                        <Skeleton width="50%" height={14} />
                        <Skeleton width="35%" height={26} />
                        <Skeleton width="70%" height={10} />
                    </View>
                ))}
            </View>
        </>
    );
}

/**
 * Dashboard with the web concept, laid out for a phone: tasks by status (donut) → categories overview
 * (2×2) → document-type breakdown → task details. Each level narrows the ones below it.
 */
export function DashboardScreen() {
    const [status, setStatusState] = useState<DashboardStatus | null>(null);
    const [category, setCategory] = useState<TaskCategory | null>(null);
    const [documentType, setDocumentTypeState] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    // Every drill-down change starts the table again at page 1.
    const setStatus = (next: DashboardStatus | null) => {
        setStatusState(next);
        setPage(1);
    };
    const setDocumentType = (next: string | null) => {
        setDocumentTypeState(next);
        setPage(1);
    };
    const [pulling, setPulling] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const documentNumber = useDebouncedValue(searchInput.trim(), SEARCH_DEBOUNCE_MS);
    const [searchedFor, setSearchedFor] = useState(documentNumber);
    // A new search term also starts the table again at page 1 (adjusted during render, not in an effect).
    if (searchedFor !== documentNumber) {
        setSearchedFor(documentNumber);
        setPage(1);
    }

    const dashboard = useDashboard({ top: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE, status: status ?? undefined, category: category ?? undefined, documentType: documentType ?? undefined, documentNumber: documentNumber || undefined });
    const data = dashboard.data;
    const totals = useMemo(() => statusTotals(data?.statusCounts), [data?.statusCounts]);
    const { categoryOf, typesOf } = useMemo(() => breakdown(data?.docTypeCounts), [data?.docTypeCounts]);

    const selectCategory = (next: TaskCategory | null) => {
        setCategory(next);
        setDocumentTypeState(null);
        setPage(1);
    };
    const clearAll = () => {
        haptics.light();
        setStatus(null);
        selectCategory(null);
        setSearchInput('');
    };

    const refresh = async () => {
        haptics.light();
        setPulling(true);
        await dashboard.refetch();
        setPulling(false);
    };

    const filters = [
        ...(status ? [{ key: 'status', label: status, onRemove: () => setStatus(null) }] : []),
        ...(category ? [{ key: 'category', label: DASHBOARD_CATEGORIES.find((item) => item.key === category)?.label ?? category, onRemove: () => selectCategory(null) }] : []),
        ...(documentType ? [{ key: 'type', label: documentType, onRemove: () => setDocumentType(null) }] : []),
        ...(documentNumber ? [{ key: 'number', label: `No. ${documentNumber}`, onRemove: () => setSearchInput('') }] : []),
    ];

    return (
        <ScreenScrollView headerless wash refreshing={pulling} onRefresh={refresh}>
            <ScreenHeader title="Dashboard" subtitle={data ? `${totals.total} tasks in total` : undefined} />
            <SearchField value={searchInput} onChangeText={setSearchInput} placeholder="Search document number" />
            <ActiveFilters items={filters} onClearAll={clearAll} />

            {dashboard.error && !data ? (
                <ErrorState error={dashboard.error} context="Loading the dashboard" onRetry={() => dashboard.refetch()} />
            ) : !data ? (
                <DashboardSkeleton />
            ) : (
                <Animated.View entering={fadeInContent} style={{ gap: spacing.lg }}>
                    <Section title="Tasks by status">
                        <StatusDonut totals={totals} selected={status} onSelect={setStatus} />
                    </Section>
                    <View style={{ gap: spacing.sm }}>
                        <ThemedText variant="caption" style={{ paddingHorizontal: spacing.md, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Categories overview
                        </ThemedText>
                        <CategoryOverview
                            categoryOf={categoryOf}
                            typesOf={typesOf}
                            status={status}
                            category={category}
                            documentType={documentType}
                            onSelectCategory={selectCategory}
                            onSelectType={setDocumentType}
                        />
                    </View>
                    <DashboardTaskTable items={data.items ?? []} total={data.total ?? 0} page={page} pageSize={PAGE_SIZE} loading={dashboard.isPlaceholderData} onPageChange={setPage} />
                </Animated.View>
            )}
        </ScreenScrollView>
    );
}
