import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, Keyframe, ReduceMotion, useReducedMotion } from 'react-native-reanimated';
import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { haptics } from '@/lib/haptics';
import { duration, easing, radius, riseIn, spacing, useColors } from '@/theme';

const BADGE = 88;
/** The sheet closes on its own after this, unless the user taps Done first. */
export const SUCCESS_AUTO_CLOSE_MS = 1600;

/** Badge pops in: from 0.6 (never 0) to a slight overshoot, then settles. Transform + opacity only. */
const badgeIn = new Keyframe({
    0: { opacity: 0, transform: [{ scale: 0.6 }] },
    55: { opacity: 1, transform: [{ scale: 1.08 }], easing: easing.out },
    100: { opacity: 1, transform: [{ scale: 1 }], easing: easing.out },
})
    .duration(480)
    .reduceMotion(ReduceMotion.Never);

/** The mark lands a beat after the badge. */
const markIn = new Keyframe({
    0: { opacity: 0, transform: [{ scale: 0.5 }, { rotate: '-20deg' }] },
    100: { opacity: 1, transform: [{ scale: 1 }, { rotate: '0deg' }], easing: easing.out },
})
    .duration(320)
    .delay(160)
    .reduceMotion(ReduceMotion.Never);

/** Soft ring that grows out of the badge once, like a ripple of confirmation. */
const ringOut = new Keyframe({
    0: { opacity: 0.5, transform: [{ scale: 0.9 }] },
    100: { opacity: 0, transform: [{ scale: 1.7 }], easing: easing.out },
})
    .duration(700)
    .delay(200)
    .reduceMotion(ReduceMotion.Never);

/**
 * Confirmation after a decision reached SAP (rare moment: the one place with a little delight). Success
 * haptic in the same frame the badge appears; under Reduce Motion everything only fades in.
 */
export function DecisionSuccess({ positive, title, detail, onDone }: { positive: boolean; title: string; detail: string; onDone: () => void }) {
    const colors = useColors();
    const reduceMotion = useReducedMotion();
    const tint = positive ? colors.success : colors.danger;
    const fade = FadeIn.duration(duration.base).reduceMotion(ReduceMotion.Never);

    useEffect(() => {
        haptics.success();
        const timer = setTimeout(onDone, SUCCESS_AUTO_CLOSE_MS);
        return () => clearTimeout(timer);
        // Once, when the confirmation appears.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <View accessibilityLiveRegion="polite" style={{ alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xl }}>
            <View style={{ width: BADGE, height: BADGE, alignItems: 'center', justifyContent: 'center' }}>
                {reduceMotion ? null : (
                    <Animated.View entering={ringOut} style={{ position: 'absolute', width: BADGE, height: BADGE, borderRadius: radius.full, borderWidth: 2, borderColor: tint }} />
                )}
                <Animated.View
                    entering={reduceMotion ? fade : badgeIn}
                    style={{ width: BADGE, height: BADGE, borderRadius: radius.full, backgroundColor: tint, alignItems: 'center', justifyContent: 'center', boxShadow: `0 10px 24px ${tint}55` }}
                >
                    <Animated.View entering={reduceMotion ? fade : markIn}>
                        <Icon name={positive ? { ios: 'checkmark', android: 'check' } : { ios: 'xmark', android: 'close' }} size={40} color={positive ? colors.onSuccess : '#FFFFFF'} />
                    </Animated.View>
                </Animated.View>
            </View>
            <Animated.View entering={riseIn(3, reduceMotion)} style={{ alignItems: 'center', gap: spacing.xs }}>
                <ThemedText variant="title2" style={{ textAlign: 'center' }}>
                    {title}
                </ThemedText>
                <ThemedText variant="subhead" style={{ textAlign: 'center' }}>
                    {detail}
                </ThemedText>
            </Animated.View>
            <Animated.View entering={riseIn(5, reduceMotion)} style={{ alignSelf: 'stretch' }}>
                <Button title="Done" variant="secondary" onPress={onDone} />
            </Animated.View>
        </View>
    );
}
