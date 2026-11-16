import { Fragment } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Icon } from '@/components/icon';
import { Pill } from '@/components/pill';
import { RowSeparator } from '@/components/section';
import { ThemedText } from '@/components/themed-text';
import type { DashboardTask } from '@/lib/api/bff-api';
import { haptics } from '@/lib/haptics';
import { radius, shadows, spacing, useColors } from '@/theme';
import { dashboardAmount, docTypeLabel, normalizeDashboardStatus } from '@/utils/dashboard';

const INDEX_WIDTH = 30;

/** Amount like the web table: VND without decimals, other currencies with two. */
export function formatDashboardAmount(value: number | null, currency: string): string {
    if (value === null || Number.isNaN(value)) return '—';
    const digits = currency.toUpperCase() === 'VND' ? 0 : 2;
    return `${value.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })} ${currency}`;
}

/**
 * "Task details" table of the dashboard, laid out for a phone: a header row (# · Document · Amount /
 * Status), zebra-free rows with the running number, document number in the accent color and the type
 * below it, amount and status on the right, then a pager ("1–20 of 134", previous / next).
 */
export function DashboardTaskTable({
    items,
    total,
    page,
    pageSize,
    loading,
    onPageChange,
}: {
    items: readonly DashboardTask[];
    total: number;
    /** 1-based page. */
    page: number;
    pageSize: number;
    /** A new page is loading (the current rows stay dimmed). */
    loading: boolean;
    onPageChange: (page: number) => void;
}) {
    const colors = useColors();
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const offset = (page - 1) * pageSize;
    const rangeEnd = Math.min(offset + items.length, total);

    return (
        <View style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md }}>
                <ThemedText variant="caption" style={{ flex: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Task details
                </ThemedText>
                {total > 0 ? (
                    <ThemedText variant="caption" style={{ fontVariant: ['tabular-nums'] }}>
                        {total} {total === 1 ? 'task' : 'tasks'}
                    </ThemedText>
                ) : null}
            </View>
            <View
                style={{
                    borderRadius: radius.card,
                    borderCurve: 'continuous',
                    backgroundColor: colors.cardBackground,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                    boxShadow: shadows.card,
                    overflow: 'hidden',
                }}
            >
                {/* Column header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.fillBackground }}>
                    <ThemedText variant="caption" style={{ width: INDEX_WIDTH, fontWeight: '700', textTransform: 'uppercase' }}>
                        #
                    </ThemedText>
                    <ThemedText variant="caption" style={{ flex: 1, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                        Document
                    </ThemedText>
                    <ThemedText variant="caption" style={{ fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                        Amount · Status
                    </ThemedText>
                </View>

                {items.length === 0 ? (
                    <ThemedText variant="footnote" style={{ padding: spacing.lg, textAlign: 'center' }}>
                        No tasks match these filters.
                    </ThemedText>
                ) : (
                    <View style={{ opacity: loading ? 0.5 : 1 }}>
                        {items.map((task, index) => {
                            const status = normalizeDashboardStatus(task.status);
                            const currency = task.displayCurrency || task.currency || 'VND';
                            return (
                                <Fragment key={`${task.taskId}-${offset + index}`}>
                                    {index > 0 ? <RowSeparator /> : null}
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.smd }}>
                                        <ThemedText variant="caption" style={{ width: INDEX_WIDTH, fontWeight: '700', color: colors.tertiaryLabel, fontVariant: ['tabular-nums'] }}>
                                            {offset + index + 1}
                                        </ThemedText>
                                        <View style={{ flex: 1, gap: 2 }}>
                                            <ThemedText variant="subhead" selectable numberOfLines={1} style={{ color: colors.accent, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
                                                {task.documentNumber || task.taskId}
                                            </ThemedText>
                                            <ThemedText variant="caption" numberOfLines={1}>
                                                {docTypeLabel(task.documentType || task.taskType, task.documentTypeDesc)}
                                            </ThemedText>
                                        </View>
                                        <View style={{ alignItems: 'flex-end', gap: 4, maxWidth: '50%' }}>
                                            <ThemedText variant="footnote" numberOfLines={1} style={{ color: colors.label, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
                                                {formatDashboardAmount(dashboardAmount(task as DashboardTask & Record<string, unknown>), currency)}
                                            </ThemedText>
                                            <Pill label={status} tone={status === 'Completed' ? 'success' : 'warning'} compact />
                                        </View>
                                    </View>
                                </Fragment>
                            );
                        })}
                    </View>
                )}

                {/* Pager */}
                {total > 0 ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 0.5, borderTopColor: colors.separator }}>
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                            <ThemedText variant="footnote" style={{ fontVariant: ['tabular-nums'] }}>
                                {offset + 1}–{rangeEnd} of {total}
                            </ThemedText>
                            {loading ? <ActivityIndicator size="small" color={colors.accent} /> : null}
                        </View>
                        <PagerButton direction="previous" disabled={page <= 1 || loading} onPress={() => onPageChange(page - 1)} />
                        <ThemedText variant="footnote" style={{ minWidth: 44, textAlign: 'center', color: colors.label, fontWeight: '600', fontVariant: ['tabular-nums'] }}>
                            {page} / {pageCount}
                        </ThemedText>
                        <PagerButton direction="next" disabled={page >= pageCount || loading} onPress={() => onPageChange(page + 1)} />
                    </View>
                ) : null}
            </View>
        </View>
    );
}

function PagerButton({ direction, disabled, onPress }: { direction: 'previous' | 'next'; disabled: boolean; onPress: () => void }) {
    const colors = useColors();
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={direction === 'previous' ? 'Previous page' : 'Next page'}
            accessibilityState={{ disabled }}
            disabled={disabled}
            hitSlop={6}
            onPress={() => {
                haptics.selection();
                onPress();
            }}
            style={({ pressed }) => ({
                width: 36,
                height: 36,
                borderRadius: radius.full,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.fillBackground,
                opacity: disabled ? 0.35 : pressed ? 0.7 : 1,
            })}
        >
            <Icon name={direction === 'previous' ? { ios: 'chevron.left', android: 'chevron_left' } : { ios: 'chevron.right', android: 'chevron_right' }} size={14} color={colors.label} />
        </Pressable>
    );
}
