import type { SymbolViewProps } from 'expo-symbols';
import { useNavigation, useRouter } from 'expo-router';
import { Keyboard, View } from 'react-native';
import { Icon } from '@/components/icon';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { useIsOnline } from '@/hooks/use-is-online';
import { haptics } from '@/lib/haptics';
import { radius, spacing, useColors, type ThemeColors } from '@/theme';
import type { TaskDecision } from '@/utils/task-detail';

/** Same height as the tab track above, so the sticky block reads as two even rows. */
export const DECISION_BUTTON_HEIGHT = 40;

function decisionLook(colors: ThemeColors, nature: TaskDecision['nature']): { icon: SymbolViewProps['name']; foreground: string; background: string; border: string } {
    switch (nature) {
        case 'POSITIVE':
            return { icon: { ios: 'checkmark.circle.fill', android: 'check_circle' }, foreground: colors.onSuccess, background: colors.success, border: colors.success };
        case 'NEGATIVE':
            return { icon: { ios: 'xmark.circle', android: 'cancel' }, foreground: colors.danger, background: colors.cardBackground, border: `${colors.danger}55` };
        default:
            return { icon: { ios: 'questionmark.circle', android: 'help' }, foreground: colors.label, background: colors.cardBackground, border: colors.separator };
    }
}

/**
 * Decision buttons of an open task, right under the tabs like the web (Reject before Approve). They stay
 * stuck with the tab bar while scrolling, so the decision is always one tap away. Each opens the decision
 * sheet (comment + confirm). Heights are minimums, so large text sizes grow the buttons instead of clipping.
 */
export function DecisionBar({ instanceId, decisions }: { instanceId: string; decisions: readonly TaskDecision[] }) {
    const colors = useColors();
    const router = useRouter();
    const navigation = useNavigation();
    const online = useIsOnline();
    if (decisions.length === 0) return null;

    return (
        <View style={{ gap: spacing.xs }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm, opacity: online ? 1 : 0.6 }}>
            {decisions.map((decision) => {
                const look = decisionLook(colors, decision.nature);
                return (
                    <View key={decision.key} style={{ flex: decision.nature === 'POSITIVE' ? 1.4 : 1 }}>
                    <PressableScale
                        scale={0.97}
                        accessibilityRole="button"
                        accessibilityLabel={decision.text}
                        accessibilityHint="Opens a confirmation sheet"
                        onPress={() => {
                            // A second tap while the sheet is already sliding in lands here after focus moved: ignore it.
                            if (!navigation.isFocused()) return;
                            Keyboard.dismiss();
                            haptics.light();
                            router.push({ pathname: '/decision', params: { id: instanceId, key: decision.key } });
                        }}
                    >
                        <View
                            style={{
                                minHeight: DECISION_BUTTON_HEIGHT,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                paddingHorizontal: spacing.md,
                                paddingVertical: 6,
                                borderRadius: radius.full,
                                borderCurve: 'continuous',
                                backgroundColor: look.background,
                                borderWidth: 1,
                                borderColor: look.border,
                            }}
                        >
                            <Icon name={look.icon} size={16} color={look.foreground} />
                            <ThemedText variant="subhead" numberOfLines={1} style={{ color: look.foreground, fontWeight: '600' }}>
                                {decision.text}
                            </ThemedText>
                        </View>
                    </PressableScale>
                    </View>
                );
            })}
        </View>
            {online ? null : (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }} accessibilityLiveRegion="polite">
                    <Icon name={{ ios: 'wifi.slash', android: 'wifi_off' }} size={12} color={colors.secondaryLabel} />
                    <ThemedText variant="caption">Offline: you can write a comment, sending needs a connection</ThemedText>
                </View>
            )}
        </View>
    );
}
