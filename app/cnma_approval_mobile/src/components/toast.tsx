import { useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FullWindowOverlay } from 'react-native-screens';
import { duration, easing, radius, spacing, useColors } from '@/theme';
import { Icon } from './icon';
import { ThemedText } from './themed-text';

/** How long a toast stays up. */
const TOAST_MS = 2_000;

interface ToastMessage {
    id: number;
    text: string;
}

let current: ToastMessage | null = null;
let nextId = 1;
const listeners = new Set<() => void>();

function emit(next: ToastMessage | null) {
    current = next;
    listeners.forEach((listener) => listener());
}

/** Short confirmation at the bottom of the screen (e.g. "Copied …"), the same on iOS and Android. */
export const toast = {
    show: (text: string) => {
        emit({ id: nextId++, text });
        AccessibilityInfo.announceForAccessibility(text);
    },
};

function useToast(): ToastMessage | null {
    return useSyncExternalStore(
        (onChange) => {
            listeners.add(onChange);
            return () => listeners.delete(onChange);
        },
        () => current,
        () => current
    );
}

/** iOS: a window above native sheets too (a copy inside the Profile sheet still shows its toast). */
const Overlay = process.env.EXPO_OS === 'ios' ? FullWindowOverlay : ({ children }: { children: ReactNode }) => children;

/** Renders the current toast above everything; mount once at the root. */
export function ToastHost() {
    const colors = useColors();
    const { bottom } = useSafeAreaInsets();
    const message = useToast();

    useEffect(() => {
        if (!message) return;
        const timer = setTimeout(() => current?.id === message.id && emit(null), TOAST_MS);
        return () => clearTimeout(timer);
    }, [message]);

    if (!message) return null;
    return (
        <Overlay>
            <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: bottom + spacing.xl * 2, alignItems: 'center', paddingHorizontal: spacing.lg }}>
                <Animated.View
                    key={message.id}
                    entering={FadeInDown.duration(duration.base).easing(easing.out)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, maxWidth: 480, paddingHorizontal: spacing.md, paddingVertical: spacing.smd, borderRadius: radius.full, backgroundColor: colors.label }}
                >
                    <Icon name={{ ios: 'doc.on.doc.fill', android: 'content_copy' }} size={14} color={colors.groupedBackground} />
                    <ThemedText variant="footnote" numberOfLines={2} style={{ flexShrink: 1, color: colors.groupedBackground, fontWeight: '600' }}>
                        {message.text}
                    </ThemedText>
                </Animated.View>
            </View>
        </Overlay>
    );
}
