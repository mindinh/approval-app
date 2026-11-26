import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { cssEasing, duration } from '@/theme';

const PRESSED_SCALE = 0.97;

/**
 * Button-like surface that scales to 0.97 while pressed (CSS transition on the UI thread):
 * feedback on press-in, the action commits on press-out. `style` styles the scaling surface,
 * `containerStyle` the pressable box (flex / grid sizing).
 */
export function PressableScale({
    children,
    style,
    containerStyle,
    scale = PRESSED_SCALE,
    ...pressableProps
}: Omit<PressableProps, 'style' | 'children'> & { children: ReactNode; style?: StyleProp<ViewStyle>; containerStyle?: StyleProp<ViewStyle>; scale?: number }) {
    return (
        <Pressable pressRetentionOffset={16} style={containerStyle} {...pressableProps}>
            {({ pressed }) => (
                <Animated.View
                    style={[style, { transform: [{ scale: pressed ? scale : 1 }], transitionProperty: 'transform', transitionDuration: duration.press, transitionTimingFunction: cssEasing.out }]}
                >
                    {children}
                </Animated.View>
            )}
        </Pressable>
    );
}
