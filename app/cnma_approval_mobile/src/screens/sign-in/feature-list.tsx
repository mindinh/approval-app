import type { SymbolViewProps } from 'expo-symbols';
import { View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { radius, riseIn, spacing, useColors } from '@/theme';

const FEATURES: readonly { icon: SymbolViewProps['name']; title: string; detail: string }[] = [
    { icon: { ios: 'checkmark.circle.fill', android: 'task_alt' }, title: 'Approve on the go', detail: 'Purchase requisitions, orders, reservations and claims.' },
    { icon: { ios: 'arrow.triangle.2.circlepath', android: 'sync' }, title: 'Always up to date', detail: 'Every list is loaded live from SAP.' },
    { icon: { ios: 'lock.shield.fill', android: 'shield_lock' }, title: 'Secure by design', detail: 'Company Microsoft sign-in; nothing is stored on the device.' },
];

const ICON_TILE = 36;
/** The list follows the brand block in the entrance sequence. */
const FIRST_STEP = 2;

/** Three short value statements under the brand block (first-run delight: staggered rise). */
export function FeatureList() {
    const colors = useColors();
    const reduceMotion = useReducedMotion();
    return (
        <View style={{ gap: spacing.md }}>
            {FEATURES.map((feature, index) => (
                <Animated.View key={feature.title} entering={riseIn(FIRST_STEP + index, reduceMotion)} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                    <View
                        style={{
                            width: ICON_TILE,
                            height: ICON_TILE,
                            borderRadius: radius.md,
                            borderCurve: 'continuous',
                            backgroundColor: colors.accentSoft,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Icon name={feature.icon} size={18} color={colors.accent} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                        <ThemedText variant="headline">{feature.title}</ThemedText>
                        <ThemedText variant="footnote">{feature.detail}</ThemedText>
                    </View>
                </Animated.View>
            ))}
        </View>
    );
}
