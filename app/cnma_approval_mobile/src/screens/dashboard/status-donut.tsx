import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { ThemedText } from '@/components/themed-text';
import { PressableScale } from '@/components/pressable-scale';
import { haptics } from '@/lib/haptics';
import { cssEasing, duration, radius, spacing, useColors } from '@/theme';
import type { DashboardStatus, StatusTotals } from '@/utils/dashboard';

const SIZE = 148;
const STROKE = 16;
const R = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;
/** Gap between the two arcs, in px along the ring. */
const GAP = 4;

/**
 * "Tasks by status" (web StatusDonutCard): a two-segment ring with the total — or the selected
 * status — in the middle, and a legend. Tapping a status filters the categories and tasks below it;
 * the ring itself always shows the full picture.
 */
export function StatusDonut({ totals, selected, onSelect }: { totals: StatusTotals; selected: DashboardStatus | null; onSelect: (status: DashboardStatus | null) => void }) {
    const colors = useColors();
    const segments: { status: DashboardStatus; value: number; color: string }[] = [
        { status: 'In Approving', value: totals['In Approving'], color: colors.warning },
        { status: 'Completed', value: totals.Completed, color: colors.success },
    ];
    const total = totals.total;
    const center = selected ? totals[selected] : total;

    let offset = 0;
    const arcs = segments.map((segment) => {
        const length = total > 0 ? (segment.value / total) * CIRCUMFERENCE : 0;
        const visible = Math.max(0, length - (segments.every((s) => s.value > 0) ? GAP : 0));
        const arc = { ...segment, dash: `${visible} ${CIRCUMFERENCE - visible}`, dashOffset: -offset };
        offset += length;
        return arc;
    });

    const toggle = (status: DashboardStatus) => {
        haptics.selection();
        onSelect(selected === status ? null : status);
    };

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg, padding: spacing.md }}>
            <View style={{ width: SIZE, height: SIZE }}>
                <Svg width={SIZE} height={SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
                    <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={colors.fillBackground} strokeWidth={STROKE} fill="none" />
                    {arcs.map((arc) =>
                        arc.value > 0 ? (
                            <Circle
                                key={arc.status}
                                cx={SIZE / 2}
                                cy={SIZE / 2}
                                r={R}
                                stroke={arc.color}
                                strokeWidth={STROKE}
                                strokeDasharray={arc.dash}
                                strokeDashoffset={arc.dashOffset}
                                strokeLinecap="butt"
                                fill="none"
                                opacity={selected && selected !== arc.status ? 0.25 : 1}
                            />
                        ) : null
                    )}
                </Svg>
                <View pointerEvents="none" style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
                    <ThemedText variant="statLarge">{center}</ThemedText>
                    <ThemedText variant="caption">{selected ?? 'Total tasks'}</ThemedText>
                </View>
            </View>

            <View style={{ flex: 1, gap: spacing.sm }}>
                {segments.map((segment) => {
                    const active = selected === segment.status;
                    const share = total > 0 ? Math.round((segment.value / total) * 100) : 0;
                    return (
                        <PressableScale
                            key={segment.status}
                            accessibilityRole="button"
                            accessibilityState={{ selected: active }}
                            accessibilityLabel={`${segment.status}, ${segment.value} tasks`}
                            onPress={() => toggle(segment.status)}
                            scale={0.97}
                        >
                            <Animated.View
                                style={{
                                    gap: 2,
                                    padding: spacing.smd,
                                    borderRadius: radius.md,
                                    borderCurve: 'continuous',
                                    borderWidth: 1,
                                    borderColor: active ? segment.color : 'transparent',
                                    backgroundColor: active ? colors.cardBackground : colors.fillBackground,
                                    transitionProperty: ['backgroundColor', 'borderColor'],
                                    transitionDuration: duration.fast,
                                    transitionTimingFunction: cssEasing.out,
                                }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <View style={{ width: 8, height: 8, borderRadius: radius.full, backgroundColor: segment.color }} />
                                    <ThemedText variant="caption" style={{ flex: 1 }}>
                                        {segment.status}
                                    </ThemedText>
                                </View>
                                <ThemedText variant="headline" style={{ fontVariant: ['tabular-nums'] }}>
                                    {segment.value}
                                    <ThemedText variant="caption"> · {share}%</ThemedText>
                                </ThemedText>
                            </Animated.View>
                        </PressableScale>
                    );
                })}
            </View>
        </View>
    );
}
