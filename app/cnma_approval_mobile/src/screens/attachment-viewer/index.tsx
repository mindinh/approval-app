import { Image } from 'expo-image';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { StatusBar, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Extrapolation, interpolate, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { EmptyState } from '@/components/empty-state';
import { Icon } from '@/components/icon';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { useDismiss } from '@/hooks/use-dismiss';
import { haptics } from '@/lib/haptics';
import { duration, easing, radius, spacing } from '@/theme';

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const DOUBLE_TAP_SCALE = 2.5;
/** A downward drag this far, or a flick this fast, closes the viewer. */
const DISMISS_DISTANCE = 140;
const DISMISS_VELOCITY = 900;
const SETTLE = { duration: 400, dampingRatio: 1, reduceMotion: ReduceMotion.System } as const;
const SNAP_BACK = { duration: 400, dampingRatio: 0.8, reduceMotion: ReduceMotion.System } as const;
const CHROME = 'rgba(0, 0, 0, 0.55)';

function clamp(value: number, min: number, max: number): number {
    'worklet';
    return Math.min(Math.max(value, min), max);
}

/** How far the image may move at a zoom level before its edge leaves the screen edge. */
function panLimit(size: number, scale: number): number {
    'worklet';
    return Math.max(0, (size * scale - size) / 2);
}

/** Zoom with spring settle, keeping the pan inside the new limits. */
function settle(scale: SharedValue<number>, x: SharedValue<number>, y: SharedValue<number>, nextScale: number, width: number, height: number) {
    'worklet';
    const target = clamp(nextScale, MIN_SCALE, MAX_SCALE);
    scale.set(withSpring(target, SETTLE));
    x.set(withSpring(clamp(x.get(), -panLimit(width, target), panLimit(width, target)), SETTLE));
    y.set(withSpring(clamp(y.get(), -panLimit(height, target), panLimit(height, target)), SETTLE));
}

/**
 * Full-screen image viewer for attachments. Quick Look hides its controls on images until the user taps,
 * which looked like a dead end; here Close, the file name and Share are always visible. Pinch or double
 * tap to zoom, drag to pan while zoomed, swipe down (or flick) to close. Rotates with the device.
 */
export function AttachmentViewerScreen({ uri, title }: { uri: string | null; title: string }) {
    const dismiss = useDismiss();
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();
    const reduceMotion = useReducedMotion();
    const [failed, setFailed] = useState(false);

    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const x = useSharedValue(0);
    const y = useSharedValue(0);
    const savedX = useSharedValue(0);
    const savedY = useSharedValue(0);
    /** Downward drag at scale 1 (swipe to dismiss). */
    const drag = useSharedValue(0);

    const close = () => {
        haptics.light();
        dismiss();
    };

    const pinch = Gesture.Pinch()
        .onStart(() => {
            savedScale.set(scale.get());
        })
        .onUpdate((event) => {
            // A little give past the limits, then it springs back on release.
            scale.set(clamp(savedScale.get() * event.scale, MIN_SCALE * 0.8, MAX_SCALE * 1.2));
        })
        .onEnd(() => {
            settle(scale, x, y, scale.get(), width, height);
        });

    const pan = Gesture.Pan()
        .averageTouches(true)
        .onStart(() => {
            savedX.set(x.get());
            savedY.set(y.get());
        })
        .onUpdate((event) => {
            if (scale.get() > 1.01) {
                x.set(clamp(savedX.get() + event.translationX, -panLimit(width, scale.get()), panLimit(width, scale.get())));
                y.set(clamp(savedY.get() + event.translationY, -panLimit(height, scale.get()), panLimit(height, scale.get())));
            } else {
                drag.set(Math.max(0, event.translationY));
            }
        })
        .onEnd((event) => {
            if (scale.get() > 1.01) return;
            if (drag.get() > DISMISS_DISTANCE || event.velocityY > DISMISS_VELOCITY) {
                drag.set(withTiming(height, { duration: duration.base, easing: easing.out }));
                scheduleOnRN(close);
            } else {
                drag.set(withSpring(0, { ...SNAP_BACK, velocity: event.velocityY }));
            }
        });

    const doubleTap = Gesture.Tap()
        .numberOfTaps(2)
        .onEnd((event) => {
            if (scale.get() > 1.01) {
                settle(scale, x, y, 1, width, height);
                x.set(withSpring(0, SETTLE));
                y.set(withSpring(0, SETTLE));
                return;
            }
            // Zoom toward the tapped point.
            const target = DOUBLE_TAP_SCALE;
            scale.set(withSpring(target, SETTLE));
            x.set(withSpring(clamp((width / 2 - event.x) * (target - 1), -panLimit(width, target), panLimit(width, target)), SETTLE));
            y.set(withSpring(clamp((height / 2 - event.y) * (target - 1), -panLimit(height, target), panLimit(height, target)), SETTLE));
        });

    const gestures = Gesture.Simultaneous(pinch, pan, doubleTap);

    const imageStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: x.get() }, { translateY: y.get() + drag.get() }, { scale: scale.get() * (reduceMotion ? 1 : 1 - Math.min(drag.get() / height, 0.25) * 0.4) }],
    }));
    const backdropStyle = useAnimatedStyle(() => ({ opacity: 1 - Math.min(drag.get() / (DISMISS_DISTANCE * 2.5), 0.85) }));
    // Controls fade out while the image is being swiped away.
    const chromeStyle = useAnimatedStyle(() => ({ opacity: interpolate(drag.get(), [0, 60], [1, 0], Extrapolation.CLAMP) }));

    const share = async () => {
        if (!uri || !(await Sharing.isAvailableAsync())) return;
        haptics.light();
        await Sharing.shareAsync(uri, { dialogTitle: title });
    };

    return (
        <View style={{ flex: 1 }}>
            <StatusBar barStyle="light-content" />
            <Animated.View style={[{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: '#000' }, backdropStyle]} />

            {uri && !failed ? (
                <GestureDetector gesture={gestures}>
                    <Animated.View style={[{ flex: 1 }, imageStyle]} accessible accessibilityRole="image" accessibilityLabel={title} accessibilityHint="Pinch or double tap to zoom. Swipe down to close.">
                        <Image source={{ uri }} contentFit="contain" style={{ flex: 1 }} onError={() => setFailed(true)} transition={reduceMotion ? 0 : duration.fast} />
                    </Animated.View>
                </GestureDetector>
            ) : (
                <View style={{ flex: 1, justifyContent: 'center', padding: spacing.lg }}>
                    <EmptyState icon={{ ios: 'photo', android: 'image' }} tint={{ foreground: '#FFFFFF', background: 'rgba(255,255,255,0.12)' }} title="Cannot show this image" />
                </View>
            )}

            {/* Always-visible controls: the reason this screen exists. */}
            <Animated.View
                style={[
                    { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingTop: insets.top + spacing.xs, paddingBottom: spacing.sm, paddingLeft: Math.max(insets.left, spacing.md), paddingRight: Math.max(insets.right, spacing.md), backgroundColor: CHROME },
                    chromeStyle,
                ]}
            >
                <ChromeButton label="Close" icon={{ ios: 'xmark', android: 'close' }} onPress={close} />
                <ThemedText variant="subhead" numberOfLines={1} style={{ flex: 1, color: '#FFFFFF', fontWeight: '600', textAlign: 'center' }}>
                    {title}
                </ThemedText>
                {uri && !failed ? <ChromeButton label="Share" icon={{ ios: 'square.and.arrow.up', android: 'share' }} onPress={() => void share()} /> : <View style={{ width: 40 }} />}
            </Animated.View>
        </View>
    );
}

function ChromeButton({ label, icon, onPress }: { label: string; icon: Parameters<typeof Icon>[0]['name']; onPress: () => void }) {
    return (
        <PressableScale accessibilityRole="button" accessibilityLabel={label} hitSlop={8} onPress={onPress} style={{ width: 40, height: 40, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)' }}>
            <Icon name={icon} size={18} color="#FFFFFF" />
        </PressableScale>
    );
}
