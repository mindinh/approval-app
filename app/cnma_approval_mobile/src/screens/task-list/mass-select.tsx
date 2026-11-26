import { useRouter } from 'expo-router';
import { memo } from 'react';
import { Alert, Pressable, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { Icon } from '@/components/icon';
import { PressableScale } from '@/components/pressable-scale';
import { TaskCard } from '@/components/task-card';
import { ThemedText } from '@/components/themed-text';
import { isSelectable, MASS_LIMIT, massSelection } from '@/hooks/mutations/mass-selection';
import type { MassDecisionKind } from '@/hooks/mutations/use-decide-tasks';
import { useIsOnline } from '@/hooks/use-is-online';
import { haptics } from '@/lib/haptics';
import { cssEasing, duration, easing, radius, shadows, spacing, useColors } from '@/theme';
import type { TaskSummary } from '@/utils/task-summary';

const CHECK = 24;

/** Height the action bar covers, so the list can scroll its last card above it. */
export const MASS_BAR_HEIGHT = 72;

/**
 * A task card in selection mode: a check circle on the left, the whole card toggles it (one haptic tick).
 * CC tasks are review-only and cannot be decided, so they are dimmed and say why instead of selecting.
 */
export const SelectableTaskCard = memo(function SelectableTaskCard({ task, now, selected }: { task: TaskSummary; now: number; selected: boolean }) {
    const colors = useColors();
    const selectable = isSelectable(task);

    const toggle = () => {
        if (!selectable) {
            haptics.error();
            Alert.alert('Review only', 'You were copied (CC) on this request, so it cannot be approved or rejected.');
            return;
        }
        if (massSelection.toggle(task)) haptics.selection();
        else {
            haptics.error();
            Alert.alert(`Up to ${MASS_LIMIT} at a time`, `Decide these ${MASS_LIMIT} first, then select the next ones.`);
        }
    };

    return (
        <PressableScale
            scale={0.98}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected, disabled: !selectable }}
            accessibilityLabel={[task.title, task.typeLabel, task.documentId, task.amount?.value, selectable ? undefined : 'review only'].filter(Boolean).join(', ')}
            onPress={toggle}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, opacity: selectable ? 1 : 0.5 }}
        >
            <Animated.View
                style={{
                    width: CHECK,
                    height: CHECK,
                    borderRadius: radius.full,
                    borderWidth: selected ? 0 : 1.5,
                    borderColor: colors.tertiaryLabel,
                    backgroundColor: selected ? colors.accentFill : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transitionProperty: 'backgroundColor',
                    transitionDuration: duration.fast,
                    transitionTimingFunction: cssEasing.out,
                }}
            >
                {selected ? <Icon name={{ ios: 'checkmark', android: 'check' }} size={13} color={colors.onAccent} /> : null}
            </Animated.View>
            <View
                style={{
                    flex: 1,
                    borderRadius: radius.card,
                    borderCurve: 'continuous',
                    borderWidth: 1.5,
                    // Selected: a ring in the accent around the card; otherwise the card's own hairline.
                    borderColor: selected ? colors.accent : 'transparent',
                }}
            >
                <TaskCard task={task} now={now} />
            </View>
        </PressableScale>
    );
});

/**
 * Bottom bar of selection mode (web: MassActionBar on mobile): select / clear all loaded tasks, the count,
 * and Reject / Approve, each opening the mass decision sheet. Sits above the tab bar; decisions need a
 * connection, so the buttons are disabled offline. The screen positions it (above its tab bar).
 *
 * @param selected   the current selection
 * @param candidates the tasks currently loaded in open groups (what "Select all" selects)
 */
export function MassActionBar({ selected, candidates }: { selected: ReadonlyMap<string, TaskSummary>; candidates: readonly TaskSummary[] }) {
    const colors = useColors();
    const router = useRouter();
    const online = useIsOnline();
    const selectable = candidates.filter(isSelectable);
    const count = selected.size;
    // "All" means every loaded request that can be selected (up to the limit) is selected.
    const allSelected = selectable.length > 0 && selectable.slice(0, MASS_LIMIT).every((task) => selected.has(task.instanceId));
    const canDecide = count > 0 && online;

    const open = (kind: MassDecisionKind) => {
        if (!canDecide) return;
        haptics.light();
        router.push({ pathname: '/mass-decision', params: { kind } });
    };

    return (
        <Animated.View
            entering={FadeInDown.duration(duration.base).easing(easing.out)}
            exiting={FadeOutDown.duration(duration.fast)}
            style={{
                marginHorizontal: spacing.md,
                marginBottom: spacing.sm,
                minHeight: MASS_BAR_HEIGHT - spacing.sm,
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                padding: spacing.sm,
                paddingLeft: spacing.md,
                borderRadius: radius.card,
                borderCurve: 'continuous',
                backgroundColor: colors.cardBackground,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                boxShadow: shadows.raised,
            }}
        >
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={allSelected ? 'Clear selection' : 'Select all loaded requests'}
                hitSlop={8}
                onPress={() => {
                    haptics.selection();
                    massSelection.toggleAll(candidates);
                }}
                style={({ pressed }) => ({ flex: 1, gap: 1, opacity: pressed ? 0.6 : 1 })}
            >
                <ThemedText variant="subhead" numberOfLines={1} style={{ color: colors.label, fontWeight: '600', fontVariant: ['tabular-nums'] }}>
                    {count === 0 ? 'Select requests' : `${count} selected`}
                </ThemedText>
                <ThemedText variant="caption" numberOfLines={1} style={{ color: colors.accent, fontWeight: '600' }}>
                    {allSelected ? 'Clear' : 'Select all'}
                </ThemedText>
            </Pressable>
            <BarButton label="Reject" icon={{ ios: 'xmark', android: 'close' }} tone="reject" disabled={!canDecide} onPress={() => open('reject')} />
            <BarButton label="Approve" icon={{ ios: 'checkmark', android: 'check' }} tone="approve" disabled={!canDecide} onPress={() => open('approve')} />
        </Animated.View>
    );
}

function BarButton({ label, icon, tone, disabled, onPress }: { label: string; icon: Parameters<typeof Icon>[0]['name']; tone: 'approve' | 'reject'; disabled: boolean; onPress: () => void }) {
    const colors = useColors();
    const approve = tone === 'approve';
    const foreground = approve ? colors.onSuccess : colors.danger;
    return (
        <PressableScale
            accessibilityRole="button"
            accessibilityLabel={`${label} selected requests`}
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={onPress}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                minHeight: 44,
                paddingHorizontal: spacing.md,
                borderRadius: radius.full,
                backgroundColor: approve ? colors.successFill : colors.cardBackground,
                borderWidth: approve ? 0 : 1,
                borderColor: `${colors.danger}55`,
                opacity: disabled ? 0.4 : 1,
            }}
        >
            <Icon name={icon} size={14} color={foreground} />
            <ThemedText variant="subhead" style={{ color: foreground, fontWeight: '600' }}>
                {label}
            </ThemedText>
        </PressableScale>
    );
}
