import { useEffect } from 'react';
import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { duration, radius, useColors } from '@/theme';

const DIM_OPACITY = 0.45;

/** Placeholder block shaped like the content it stands in for. Pulses unless Reduce Motion is on. */
export function Skeleton({ width = '100%', height = 14, borderRadius = radius.sm, style }: { width?: DimensionValue; height?: number; borderRadius?: number; style?: StyleProp<ViewStyle> }) {
    const colors = useColors();
    const reduceMotion = useReducedMotion();
    const opacity = useSharedValue(1);

    useEffect(() => {
        if (reduceMotion) return;
        opacity.set(withRepeat(withTiming(DIM_OPACITY, { duration: duration.pulse }), -1, true));
        return () => cancelAnimation(opacity);
    }, [opacity, reduceMotion]);

    const pulse = useAnimatedStyle(() => ({ opacity: opacity.get() }));

    return (
        <Animated.View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[{ width, height, borderRadius, borderCurve: 'continuous', backgroundColor: colors.fillBackground }, pulse, style]}
        />
    );
}
