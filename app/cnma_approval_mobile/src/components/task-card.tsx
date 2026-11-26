import type { SymbolViewProps } from 'expo-symbols';
import { memo } from 'react';
import { View } from 'react-native';
import { cardSurface, spacing, useColors, type ThemeColors } from '@/theme';
import type { TaskSummary } from '@/utils/task-summary';
import { relativeTime } from '@/utils/task-summary';
import { Avatar } from './avatar';
import { CornerGlow } from './corner-glow';
import { Icon } from './icon';
import { SlaIcon } from './sla-icon';
import { Skeleton } from './skeleton';
import { ThemedText } from './themed-text';
import { categoryColor, ToneText } from './tone-text';

const LEADING = 44;

export const CATEGORY_ICONS: Record<string, SymbolViewProps['name']> = {
    PR: { ios: 'doc.text', android: 'description' },
    PO: { ios: 'cart', android: 'shopping_cart' },
    CLAIM: { ios: 'creditcard', android: 'receipt_long' },
    RESERVATION: { ios: 'shippingbox', android: 'inventory_2' },
};
export const DEFAULT_CATEGORY_ICON: SymbolViewProps['name'] = { ios: 'doc', android: 'article' };

/**
 * Worklist card with the same information and layout as the web TaskCard: the SLA face (open tasks) or
 * category icon on the left, type and document number, status on the right, title, business fields
 * (total highlighted), requester and age. Labels are colored text, never badges, so the card stays light.
 * Open tasks have a soft glow of their category color in the top-right corner, behind the status; completed
 * ones show their status in green without it.
 *
 * Large text (Dynamic Type): the status may take at most about half of the top row and the type label
 * truncates first; business fields wrap onto more lines; nothing has a fixed height.
 *
 * @param now reference time for the age (the time the list was fetched)
 */
export const TaskCard = memo(function TaskCard({ task, now }: { task: TaskSummary; now: number }) {
    const colors = useColors();
    const tint = categoryColor(colors, task.tone);
    const age = relativeTime(task.createdOn, now);
    const overdue = task.aging?.isOverdue ?? false;

    return (
        <View style={{ padding: spacing.md, paddingLeft: spacing.md + 2, gap: spacing.smd, ...cardSurface(colors), overflow: 'hidden' }}>
            {task.completed ? null : <CornerGlow color={tint} />}

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.smd }}>
                <View style={{ width: LEADING, height: LEADING, alignItems: 'center', justifyContent: 'center' }}>
                    {task.aging ? (
                        <SlaIcon isOverdue={overdue} size={34} />
                    ) : (
                        <Icon name={(task.category && CATEGORY_ICONS[task.category]) || DEFAULT_CATEGORY_ICON} size={24} color={tint} />
                    )}
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                    <ThemedText variant="footnote" numberOfLines={1} style={{ fontWeight: '600', color: colors.label }}>
                        {task.typeLabel}
                    </ThemedText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                        <ThemedText variant="caption" numberOfLines={1} style={{ color: tint, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
                            #{task.documentId}
                        </ThemedText>
                        {task.isCc ? <ToneText label="CC" tone="warning" /> : null}
                    </View>
                </View>
                <View style={{ flexShrink: 1, maxWidth: '45%', alignItems: 'flex-end' }}>
                    <ToneText label={task.status.label} tone={task.completed ? 'success' : task.status.tone} />
                </View>
            </View>

            <ThemedText variant="headline" numberOfLines={2} style={{ fontSize: 16, lineHeight: 21 }}>
                {task.title}
            </ThemedText>

            {task.amount || task.details.length > 0 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.smd, rowGap: 4 }}>
                    {task.amount ? <Field label={task.amount.label} value={task.amount.value} primary colors={colors} /> : null}
                    {task.details.map((chip, index) => (
                        <Field key={`${chip.label}-${index}`} label={chip.label} value={chip.value} colors={colors} />
                    ))}
                </View>
            ) : null}

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingTop: spacing.smd, borderTopWidth: 0.5, borderTopColor: colors.separator }}>
                <Avatar name={task.requester} size={24} tone="neutral" />
                <ThemedText variant="footnote" numberOfLines={1} style={{ flex: 1 }}>
                    {task.requester}
                </ThemedText>
                {age ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1, maxWidth: '55%' }}>
                        <Icon name={{ ios: 'clock', android: 'schedule' }} size={11} color={task.aging ? (overdue ? colors.warning : colors.success) : colors.tertiaryLabel} />
                        <ThemedText
                            variant="caption"
                            numberOfLines={1}
                            style={{ flexShrink: 1, color: task.aging ? (overdue ? colors.warning : colors.success) : colors.tertiaryLabel, fontWeight: task.aging ? '600' : '500', fontVariant: ['tabular-nums'] }}
                        >
                            {overdue ? `Overdue · ${age}` : age}
                        </ThemedText>
                    </View>
                ) : null}
            </View>
        </View>
    );
});

/**
 * Business field as plain text, same size as the old chips: "Label: value". All fields share one text size
 * so they line up; the total stands out by weight only.
 */
function Field({ label, value, primary = false, colors }: { label?: string; value: string; primary?: boolean; colors: ThemeColors }) {
    return (
        <ThemedText variant="caption" numberOfLines={1} style={{ maxWidth: '100%', color: colors.secondaryLabel }}>
            {label ? `${label}: ` : ''}
            <ThemedText variant="caption" style={{ color: colors.label, fontWeight: primary ? '700' : '600', fontVariant: ['tabular-nums'] }}>
                {value}
            </ThemedText>
        </ThemedText>
    );
}

/** Loading placeholder with the same footprint as TaskCard. */
export function TaskCardSkeleton() {
    const colors = useColors();
    return (
        // Same surface as the card it stands in for, so nothing shifts when the data arrives.
        <View style={{ padding: spacing.md, gap: spacing.smd, ...cardSurface(colors) }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.smd }}>
                <Skeleton width={LEADING} height={LEADING} borderRadius={LEADING / 2} />
                <View style={{ flex: 1, gap: spacing.xs }}>
                    <Skeleton width="40%" height={12} />
                    <Skeleton width="25%" height={10} />
                </View>
                <Skeleton width={72} height={12} />
            </View>
            <Skeleton width="85%" height={16} />
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <Skeleton width={110} height={14} />
                <Skeleton width={90} height={14} />
            </View>
        </View>
    );
}
