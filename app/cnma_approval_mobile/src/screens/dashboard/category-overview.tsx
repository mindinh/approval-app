import { Fragment } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { Icon } from '@/components/icon';
import { PressableScale } from '@/components/pressable-scale';
import { RowSeparator, Section } from '@/components/section';
import { findObjectTypeModule } from '@approval-core/renderers';
import { CATEGORY_ICONS, DEFAULT_CATEGORY_ICON, moduleTile } from '@/components/task-card';
import { ThemedText } from '@/components/themed-text';
import type { TaskCategory } from '@/lib/api/bff-api';
import { haptics } from '@/lib/haptics';
import { cssEasing, duration, easing, radius, shadows, spacing, useColors } from '@/theme';
import { DASHBOARD_CATEGORIES, type CountSplit, type DashboardStatus, type DocTypeBreakdown } from '@/utils/dashboard';

const reflow = LinearTransition.duration(duration.base).easing(easing.out);

/** Lead number of a card: the selected status, else what is still in approval (web rule). */
function leadOf(split: CountSplit, status: DashboardStatus | null) {
    return status === 'Completed' ? { value: split.completed, label: 'completed' } : { value: split.inApproving, label: 'in approving' };
}

/**
 * "Categories overview" (web CategoryOverviewCards): a 2×2 grid of PR / PO / Claim / Reservation.
 * Tapping a card selects that category and opens its document-type breakdown; tapping a type row
 * narrows the task list to that document type.
 */
export function CategoryOverview({
    categoryOf,
    typesOf,
    status,
    category,
    documentType,
    onSelectCategory,
    onSelectType,
}: {
    categoryOf: (category: TaskCategory) => CountSplit;
    typesOf: (category: TaskCategory) => DocTypeBreakdown[];
    status: DashboardStatus | null;
    category: TaskCategory | null;
    documentType: string | null;
    onSelectCategory: (category: TaskCategory | null) => void;
    onSelectType: (code: string | null) => void;
}) {
    const colors = useColors();
    const types = category ? typesOf(category) : [];

    return (
        <Animated.View layout={reflow} style={{ gap: spacing.md }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.smd }}>
                {DASHBOARD_CATEGORIES.map((item) => {
                    const split = categoryOf(item.key);
                    const lead = leadOf(split, status);
                    const selected = category === item.key;
                    // Same pastel tile as the category's task cards (PR red, PO blue, Claim green, Reservation amber).
                    const tile = moduleTile(colors, findObjectTypeModule(item.key)?.tone ?? 'primary');
                    return (
                        <PressableScale
                            key={item.key}
                            accessibilityRole="button"
                            accessibilityState={{ selected }}
                            accessibilityLabel={`${item.label}: ${lead.value} ${lead.label}, ${split.total} total`}
                            onPress={() => {
                                haptics.selection();
                                onSelectCategory(selected ? null : item.key);
                            }}
                            containerStyle={{ flexBasis: '47%', flexGrow: 1 }}
                        >
                            <Animated.View
                                style={{
                                    gap: spacing.sm,
                                    padding: spacing.md,
                                    borderRadius: radius.card,
                                    borderCurve: 'continuous',
                                    borderWidth: 1.5,
                                    borderColor: selected ? colors.accent : colors.cardBorder,
                                    backgroundColor: colors.cardBackground,
                                    boxShadow: shadows.card,
                                    transitionProperty: 'borderColor',
                                    transitionDuration: duration.fast,
                                    transitionTimingFunction: cssEasing.out,
                                }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                                    <View
                                        style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: radius.md,
                                            borderCurve: 'continuous',
                                            backgroundColor: tile.background,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Icon name={CATEGORY_ICONS[item.key] ?? DEFAULT_CATEGORY_ICON} size={16} color={tile.foreground} />
                                    </View>
                                    <ThemedText variant="footnote" numberOfLines={2} style={{ flex: 1, color: colors.label, fontWeight: '600' }}>
                                        {item.label}
                                    </ThemedText>
                                </View>
                                <ThemedText variant="stat">{lead.value}</ThemedText>
                                <ThemedText variant="caption">
                                    {lead.label} · {split.total} total
                                </ThemedText>
                            </Animated.View>
                        </PressableScale>
                    );
                })}
            </View>

            {category ? (
                <Animated.View entering={FadeIn.duration(duration.base).easing(easing.out)} exiting={FadeOut.duration(duration.fast)}>
                    <Section title="Document types breakdown" accessory={documentType ? <ClearButton onPress={() => onSelectType(null)} /> : undefined}>
                        {types.length === 0 ? (
                            <ThemedText variant="footnote" style={{ padding: spacing.md }}>
                                No documents in this category.
                            </ThemedText>
                        ) : (
                            types.map((type, index) => {
                                const lead = leadOf(type, status);
                                const ratio = type.total > 0 ? lead.value / type.total : 0;
                                const selected = documentType === type.code;
                                return (
                                    <Fragment key={type.label}>
                                        {index > 0 ? <RowSeparator /> : null}
                                        <Pressable
                                            accessibilityRole="button"
                                            accessibilityState={{ selected }}
                                            onPress={() => {
                                                haptics.selection();
                                                onSelectType(selected ? null : type.code);
                                            }}
                                            style={({ pressed }) => ({
                                                gap: spacing.sm,
                                                padding: spacing.md,
                                                backgroundColor: selected ? colors.accentSoft : pressed ? colors.fillBackground : 'transparent',
                                            })}
                                        >
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                                                <ThemedText
                                                    variant="subhead"
                                                    numberOfLines={1}
                                                    style={{ flex: 1, color: selected ? colors.accent : colors.label, fontWeight: selected ? '600' : '400' }}
                                                >
                                                    {type.label}
                                                </ThemedText>
                                                <ThemedText variant="footnote" style={{ fontVariant: ['tabular-nums'] }}>
                                                    {lead.value} / {type.total}
                                                </ThemedText>
                                            </View>
                                            <View style={{ height: 4, borderRadius: radius.full, backgroundColor: colors.fillBackground, overflow: 'hidden' }}>
                                                <View
                                                    style={{
                                                        width: `${Math.round(ratio * 100)}%`,
                                                        height: '100%',
                                                        borderRadius: radius.full,
                                                        backgroundColor: status === 'Completed' ? colors.success : colors.warning,
                                                    }}
                                                />
                                            </View>
                                        </Pressable>
                                    </Fragment>
                                );
                            })
                        )}
                    </Section>
                </Animated.View>
            ) : null}
        </Animated.View>
    );
}

function ClearButton({ onPress }: { onPress: () => void }) {
    const colors = useColors();
    return (
        <Pressable accessibilityRole="button" hitSlop={10} onPress={onPress}>
            <ThemedText variant="caption" style={{ color: colors.accent, fontWeight: '600' }}>
                Clear type
            </ThemedText>
        </Pressable>
    );
}
