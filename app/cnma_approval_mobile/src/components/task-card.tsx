import type { Tone } from '@approval-core/renderers';
import type { SymbolViewProps } from 'expo-symbols';
import { memo } from 'react';
import { View } from 'react-native';
import { cardSurface, radius, spacing, useColors, type ThemeColors } from '@/theme';
import type { TaskSummary } from '@/utils/task-summary';
import { relativeTime } from '@/utils/task-summary';
import { Avatar } from './avatar';
import { Icon } from './icon';
import { Pill, toneColors } from './pill';
import { SlaIcon } from './sla-icon';
import { Skeleton } from './skeleton';
import { ThemedText } from './themed-text';

const ICON_TILE = 44;

export const CATEGORY_ICONS: Record<string, SymbolViewProps['name']> = {
    PR: { ios: 'doc.text', android: 'description' },
    PO: { ios: 'cart', android: 'shopping_cart' },
    CLAIM: { ios: 'creditcard', android: 'receipt_long' },
    RESERVATION: { ios: 'shippingbox', android: 'inventory_2' },
};
export const DEFAULT_CATEGORY_ICON: SymbolViewProps['name'] = { ios: 'doc', android: 'article' };

/** Pastel tile for a renderer module tone (PR, PO, Claim…): the only per-type color on the card. */
export function moduleTile(colors: ThemeColors, tone: Tone): { foreground: string; background: string } {
    switch (tone) {
        case 'info':
            return { foreground: colors.info, background: colors.infoSoft };
        case 'warning':
            return { foreground: colors.warning, background: colors.warningSoft };
        case 'success':
            return { foreground: colors.success, background: colors.successSoft };
        default:
            return { foreground: colors.accent, background: colors.accentSoft };
    }
}

/**
 * Worklist card with the same information as the web TaskCard: a stripe and document id in the module
 * tone, type (+ CC), status, title, business chips (total highlighted), requester and created time.
 * Open tasks show the web's SLA face (smiling, or worried once overdue after five days) and an age pill
 * in green / rose; approved history keeps the category icon.
 *
 * @param now reference time for the age (the time the list was fetched)
 */
export const TaskCard = memo(function TaskCard({ task, now }: { task: TaskSummary; now: number }) {
    const colors = useColors();
    const tile = moduleTile(colors, task.tone);
    // Open tasks: age in days (overdue after five). Approved history: when the task reached you, like the web.
    const age = relativeTime(task.createdOn, now);
    const overdue = task.aging?.isOverdue ?? false;
    const agePill = task.aging ? toneColors(colors, overdue ? 'danger' : 'success') : null;
    const slaTile = task.aging ? toneColors(colors, overdue ? 'danger' : 'success') : null;

    return (
        <View
            style={{
                padding: spacing.md,
                paddingLeft: spacing.md + 2,
                gap: spacing.smd,
                ...cardSurface(colors),
                overflow: 'hidden',
            }}
        >
            {/* Module tone stripe on the leading edge, like the web card. */}
            <View style={{ position: 'absolute', left: 0, top: spacing.md, bottom: spacing.md, width: 4, borderTopRightRadius: 4, borderBottomRightRadius: 4, backgroundColor: tile.foreground }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.smd }}>
                <View
                    style={{
                        width: ICON_TILE,
                        height: ICON_TILE,
                        borderRadius: radius.md + 2,
                        borderCurve: 'continuous',
                        backgroundColor: slaTile?.background ?? tile.background,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {task.aging ? (
                        <SlaIcon isOverdue={overdue} size={28} />
                    ) : (
                        <Icon name={(task.category && CATEGORY_ICONS[task.category]) || DEFAULT_CATEGORY_ICON} size={20} color={tile.foreground} />
                    )}
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                    <ThemedText variant="footnote" numberOfLines={1} style={{ fontWeight: '600', color: colors.label }}>
                        {task.typeLabel}
                    </ThemedText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                        <ThemedText variant="caption" numberOfLines={1} style={{ color: tile.foreground, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
                            #{task.documentId}
                        </ThemedText>
                        {task.isCc ? <Pill label="CC" tone="warning" compact /> : null}
                    </View>
                </View>
                <Pill label={task.status.label} tone={task.status.tone} />
            </View>

            <ThemedText variant="headline" numberOfLines={2} style={{ lineHeight: 22 }}>
                {task.title}
            </ThemedText>

            {task.amount || task.details.length > 0 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs + 2 }}>
                    {task.amount ? <Chip label={task.amount.label} value={task.amount.value} primary colors={colors} /> : null}
                    {task.details.map((chip, index) => (
                        <Chip key={`${chip.label}-${index}`} label={chip.label} value={chip.value} colors={colors} />
                    ))}
                </View>
            ) : null}

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingTop: spacing.smd, borderTopWidth: 0.5, borderTopColor: colors.separator }}>
                <Avatar name={task.requester} size={24} tone="neutral" />
                <ThemedText variant="footnote" numberOfLines={1} style={{ flex: 1 }}>
                    {task.requester}
                </ThemedText>
                {age ? (
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                            paddingHorizontal: agePill ? spacing.sm : 0,
                            paddingVertical: agePill ? 3 : 0,
                            borderRadius: radius.full,
                            backgroundColor: agePill?.background,
                        }}
                    >
                        <Icon name={{ ios: 'clock', android: 'schedule' }} size={11} color={agePill?.foreground ?? colors.tertiaryLabel} />
                        <ThemedText variant="caption" style={{ color: agePill?.foreground ?? colors.tertiaryLabel, fontWeight: agePill ? '600' : '500', fontVariant: ['tabular-nums'] }}>
                            {overdue ? `Overdue · ${age}` : age}
                        </ThemedText>
                    </View>
                ) : null}
            </View>
        </View>
    );
});

/** Business chip: "Label: value". The primary (total) chip uses the soft accent. */
function Chip({ label, value, primary = false, colors }: { label?: string; value: string; primary?: boolean; colors: ThemeColors }) {
    const tint = primary ? toneColors(colors, 'accent') : null;
    return (
        <View
            style={{
                flexDirection: 'row',
                maxWidth: '100%',
                paddingHorizontal: spacing.sm + 2,
                paddingVertical: 4,
                borderRadius: radius.full,
                backgroundColor: tint?.background ?? colors.fillBackground,
            }}
        >
            <ThemedText variant="caption" numberOfLines={1} style={{ flexShrink: 1, color: tint?.foreground ?? colors.secondaryLabel }}>
                {label ? `${label}: ` : ''}
                <ThemedText variant="caption" style={{ color: tint?.foreground ?? colors.label, fontWeight: primary ? '700' : '600' }}>
                    {value}
                </ThemedText>
            </ThemedText>
        </View>
    );
}

/** Loading placeholder with the same footprint as TaskCard. */
export function TaskCardSkeleton() {
    const colors = useColors();
    return (
        // Same surface as the card it stands in for, so nothing shifts when the data arrives.
        <View style={{ padding: spacing.md, gap: spacing.smd, ...cardSurface(colors) }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.smd }}>
                <Skeleton width={ICON_TILE} height={ICON_TILE} borderRadius={radius.md + 2} />
                <View style={{ flex: 1, gap: spacing.xs }}>
                    <Skeleton width="40%" height={12} />
                    <Skeleton width="25%" height={10} />
                </View>
                <Skeleton width={80} height={22} borderRadius={radius.full} />
            </View>
            <Skeleton width="85%" height={16} />
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                <Skeleton width={110} height={24} borderRadius={radius.full} />
                <Skeleton width={90} height={24} borderRadius={radius.full} />
            </View>
        </View>
    );
}
