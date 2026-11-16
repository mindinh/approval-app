import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { cssEasing, duration, radius, spacing, useColors } from '@/theme';

const IS_IOS = process.env.EXPO_OS === 'ios';
const TRACK_WIDTH = 112;

/**
 * Footer of a detail tab pointing at the next one (the web "pull to view next tab" indicator).
 * iOS: pulling past the end fills the bar; at the threshold the label flips and releasing switches.
 * Android has no overscroll, so the hint says "swipe" — tapping it also switches, on both platforms.
 */
export function NextTabHint({ nextLabel, pull, threshold, armed, onPress }: { nextLabel: string; pull: SharedValue<number>; threshold: number; armed: boolean; onPress: () => void }) {
    const colors = useColors();
    // Absolute, childless fill: animating its width re-lays out nothing else.
    const fillStyle = useAnimatedStyle(() => ({ width: Math.min(pull.get() / threshold, 1) * TRACK_WIDTH }));

    const label = armed ? `Release for ${nextLabel}` : IS_IOS ? `Pull up for ${nextLabel}` : `Swipe left for ${nextLabel}`;

    return (
        <Pressable accessibilityRole="button" accessibilityLabel={`Show ${nextLabel}`} onPress={onPress} style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg }}>
            <Animated.View style={{ transform: [{ rotate: armed ? '180deg' : '0deg' }], transitionProperty: 'transform', transitionDuration: duration.fast, transitionTimingFunction: cssEasing.out }}>
                <Icon name={{ ios: 'chevron.up', android: 'expand_less' }} size={14} color={armed ? colors.accent : colors.tertiaryLabel} />
            </Animated.View>
            <ThemedText variant="caption" style={{ color: armed ? colors.accent : colors.tertiaryLabel }}>
                {label}
            </ThemedText>
            {IS_IOS ? (
                <View style={{ width: TRACK_WIDTH, height: 4, borderRadius: radius.full, backgroundColor: colors.fillBackground, overflow: 'hidden' }}>
                    <Animated.View style={[{ position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: radius.full, backgroundColor: colors.accent }, fillStyle]} />
                </View>
            ) : null}
        </Pressable>
    );
}
