import type { SymbolViewProps } from 'expo-symbols';
import type { TabTriggerSlotProps } from 'expo-router/ui';
import { createContext, use, type ReactNode } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptics } from '@/lib/haptics';
import { cssEasing, duration, radius, shadows, spacing, useColors } from '@/theme';
import { CountBadge } from './count-badge';
import { Icon } from './icon';
import { ThemedText } from './themed-text';

export const TAB_BAR_HEIGHT = 66;
const BAR_SIDE_MARGIN = 20;
const BAR_MIN_BOTTOM = 12;
const BAR_PADDING = 6;
/** On tablets and unfolded phones the bar stays a compact centered pill instead of spanning the screen. */
const BAR_MAX_WIDTH = 520;
/** Tab labels are sized to the fixed-height bar; like system tab bars they scale only a little. */
const LABEL_MAX_FONT_SCALE = 1.2;

/** Space scroll content must leave at the bottom so it can scroll clear of a floating tab bar. */
const TabBarInsetContext = createContext(0);

export function useTabBarInset(): number {
    return use(TabBarInsetContext);
}

/** Bottom offset of the floating bar: above the home indicator / gesture bar. */
export function useFloatingTabBarLayout() {
    const insets = useSafeAreaInsets();
    const bottom = Math.max(insets.bottom, BAR_MIN_BOTTOM) + spacing.xs;
    return { bottom, contentInset: bottom + TAB_BAR_HEIGHT + spacing.md };
}

export function TabBarInsetProvider({ value, children }: { value: number; children: ReactNode }) {
    return <TabBarInsetContext value={value}>{children}</TabBarInsetContext>;
}

/** Container style of the floating bar (a rounded card hovering above the content). */
export function useFloatingTabBarStyle() {
    const colors = useColors();
    const { bottom } = useFloatingTabBarLayout();
    const { width: windowWidth } = useWindowDimensions();
    const width = Math.min(windowWidth - BAR_SIDE_MARGIN * 2, BAR_MAX_WIDTH);
    return {
        position: 'absolute',
        left: (windowWidth - width) / 2,
        width,
        bottom,
        height: TAB_BAR_HEIGHT,
        flexDirection: 'row',
        padding: BAR_PADDING,
        gap: BAR_PADDING,
        borderRadius: radius.full,
        borderCurve: 'continuous',
        backgroundColor: colors.cardBackground,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        boxShadow: shadows.raised,
    } as const;
}

/**
 * One tab of the floating bar. Rendered through `<TabTrigger asChild>`, which supplies `isFocused`
 * and `onPress`. The active tab gets a soft accent pill (background crossfade, no sliding: tabs are
 * peers and switch dozens of times a day).
 */
export function FloatingTabButton({
    isFocused = false,
    label,
    icon,
    activeIcon,
    badge,
    onPress,
    ...pressableProps
}: Omit<TabTriggerSlotProps, 'ref'> & { label: string; icon: SymbolViewProps['name']; activeIcon: SymbolViewProps['name']; badge?: string | null }) {
    const colors = useColors();
    const tint = isFocused ? colors.accent : colors.tertiaryLabel;

    return (
        <Pressable
            {...pressableProps}
            accessibilityRole="tab"
            accessibilityLabel={badge ? `${label}, ${badge} pending` : label}
            accessibilityState={{ selected: isFocused }}
            onPress={(event) => {
                if (!isFocused) haptics.selection();
                onPress?.(event);
            }}
            style={{ flex: 1 }}
        >
            <Animated.View
                style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    borderRadius: radius.full,
                    backgroundColor: isFocused ? colors.accentSoft : 'transparent',
                    transitionProperty: 'backgroundColor',
                    transitionDuration: duration.fast,
                    transitionTimingFunction: cssEasing.out,
                }}
            >
                <View>
                    <Icon name={isFocused ? activeIcon : icon} size={22} color={tint} />
                    {badge ? <CountBadge value={badge} color={colors.accent} textColor={colors.onAccent} ringColor={colors.cardBackground} /> : null}
                </View>
                <ThemedText variant="caption" numberOfLines={1} maxFontSizeMultiplier={LABEL_MAX_FONT_SCALE} style={{ color: tint, fontSize: 11, fontWeight: isFocused ? '600' : '500' }}>
                    {label}
                </ThemedText>
            </Animated.View>
        </Pressable>
    );
}
