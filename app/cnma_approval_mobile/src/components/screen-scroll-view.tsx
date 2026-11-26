import type { ReactNode, Ref } from 'react';
import { RefreshControl, ScrollView, View, type RefreshControlProps, type ScrollViewInstance, type ScrollViewProps } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout, spacing, useColors } from '@/theme';
import { useTabBarInset } from './floating-tab-bar';

const IS_IOS = process.env.EXPO_OS === 'ios';
/** How far the brand wash reaches below the status bar: only the header area. */
const WASH_HEIGHT = 180;

/**
 * Content padding of a scrolling screen. With `headerless` (tab roots that draw a ScreenHeader), iOS
 * insets for the status bar and tab bar itself (contentInsetAdjustmentBehavior); Android pads below the
 * status bar explicitly. The bottom always clears a floating tab bar. Shared by ScrollView and lists.
 */
export function useScreenContentInsets(headerless: boolean) {
    const insets = useSafeAreaInsets();
    const tabBarInset = useTabBarInset();
    return {
        paddingTop: headerless ? (IS_IOS ? spacing.smd : insets.top + spacing.smd) : spacing.md,
        paddingBottom: Math.max(spacing.xl, tabBarInset),
        /** Where the pull-to-refresh spinner should appear. */
        refreshOffset: headerless && !IS_IOS ? insets.top : 0,
        statusBarHeight: insets.top,
    };
}

/** Solid wash above the content, so an iOS pull-down (rubber band) never shows a white gap. */
const WASH_OVERSCROLL = 400;

/**
 * Short brand wash at the top of the four tab screens (Home, Inbox, Approved, Dashboard). It is part of the
 * scroll content, so it covers the area under the status bar / Dynamic Island and the header, then scrolls
 * away with them: the rest of the screen stays a plain off-white.
 *
 * Put it first inside the ScrollView's content (absolutely positioned, behind the rest). Lists use WashScrollView.
 */
function ScrollingWash() {
    const colors = useColors();
    const { top } = useSafeAreaInsets();
    // iOS insets the content below the status bar (contentInsetAdjustmentBehavior); Android pads instead.
    const underStatusBar = IS_IOS ? top : 0;
    const height = WASH_OVERSCROLL + top + WASH_HEIGHT;
    const solidUntil = Math.round((WASH_OVERSCROLL / height) * 100);
    return (
        <View
            pointerEvents="none"
            style={{
                position: 'absolute',
                top: -(WASH_OVERSCROLL + underStatusBar),
                left: 0,
                right: 0,
                height,
                experimental_backgroundImage: `linear-gradient(180deg, ${colors.accent}24 0%, ${colors.accent}24 ${solidUntil}%, ${colors.accent}0D ${solidUntil + Math.round((100 - solidUntil) * 0.55)}%, ${colors.accent}00 100%)`,
            }}
        />
    );
}

/**
 * Scroll view with the same short wash, for virtualized lists (Inbox, Approved): pass it as FlashList's
 * `renderScrollComponent`. The wash lives in the scroll content like on Home and scrolls away with the header;
 * on iOS add StatusBarWash for the strip under the status bar.
 */
export function WashScrollView({ children, ref, ...props }: ScrollViewProps & { ref?: Ref<ScrollViewInstance> }) {
    return (
        <ScrollView ref={ref} {...props}>
            <ScrollingWash />
            {children}
        </ScrollView>
    );
}

/** Wash opacity (0x24) at the top and (0x0D) where its fade ends, as two-digit hex alpha. */
const WASH_ALPHA_TOP = 0x24;
const WASH_ALPHA_FADED = 0x0d;
const hexAlpha = (value: number) => Math.round(value).toString(16).padStart(2, '0');

/**
 * iOS only: the status-bar strip of the list wash, drawn over the list. On iOS 26 the system scroll-edge
 * effect (a band ending in a line) sits on top of a FlashList under the status bar: react-native-screens
 * turns it off only for a scroll view it finds when the screen mounts, which misses the list. This strip
 * repeats the wash's own colors there, so the screen looks like Home; it fades out as the list scrolls,
 * letting the content show under the status bar again.
 *
 * @param scrollY the list's offset from its resting position (0 at rest), e.g. from onScroll
 */
export function StatusBarWash({ scrollY }: { scrollY: SharedValue<number> }) {
    const colors = useColors();
    const { top } = useSafeAreaInsets();
    const fade = useAnimatedStyle(() => ({ opacity: interpolate(scrollY.get(), [0, top], [1, 0], 'clamp') }));
    if (!IS_IOS || top === 0) return null;
    // Same colors as ScrollingWash at this height: it fades from 0x24 to 0x0D over 55% of (status bar + header).
    const bottomAlpha = WASH_ALPHA_TOP - (WASH_ALPHA_TOP - WASH_ALPHA_FADED) * Math.min(1, top / ((top + WASH_HEIGHT) * 0.55));
    return (
        <Animated.View
            pointerEvents="none"
            style={[
                {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: top,
                    backgroundColor: colors.groupedBackground,
                    experimental_backgroundImage: `linear-gradient(180deg, ${colors.accent}${hexAlpha(WASH_ALPHA_TOP)} 0%, ${colors.accent}${hexAlpha(bottomAlpha)} 100%)`,
                },
                fade,
            ]}
        />
    );
}

/**
 * Pull-to-refresh tinted with the brand color. It must forward every prop: on Android the ScrollView
 * clones this element and passes the scroll content in as children (and a style) — dropping them
 * renders an empty screen.
 */
export function BrandRefreshControl({ offset, ...props }: RefreshControlProps & { offset: number }) {
    const colors = useColors();
    return <RefreshControl {...props} tintColor={colors.accent} colors={[colors.accent]} progressViewOffset={offset} />;
}

/**
 * Grouped-background scroll screen. Centers content on wide screens, clears a floating tab bar, and
 * optionally supports pull-to-refresh.
 * The background is the plain off-white grouped background; tab screens add a short brand wash at the top.
 *
 * @param headerless the screen has no native header (tab roots draw a ScreenHeader)
 * @param wash       the short brand wash behind the header, scrolling with it (tab screens only)
 */
export function ScreenScrollView({
    children,
    refreshing,
    onRefresh,
    maxWidth = layout.maxContentWidth,
    headerless = false,
    wash = false,
}: {
    children: ReactNode;
    refreshing?: boolean;
    onRefresh?: () => void;
    maxWidth?: number;
    headerless?: boolean;
    wash?: boolean;
}) {
    const colors = useColors();
    const { paddingTop, paddingBottom, refreshOffset } = useScreenContentInsets(headerless);

    // The ScrollView stays the root view: native form sheets (Profile, Filters) size their content from it.
    return (
        <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            // Sheets with inputs (decision comment): a tap on a button acts at once instead of only closing the
            // keyboard, and the content scrolls above the keyboard.
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            automaticallyAdjustKeyboardInsets
            style={{ backgroundColor: colors.groupedBackground }}
            contentContainerStyle={{ padding: spacing.md, paddingTop, paddingBottom }}
            refreshControl={onRefresh ? <BrandRefreshControl refreshing={!!refreshing} onRefresh={onRefresh} offset={refreshOffset} /> : undefined}
        >
            {wash ? <ScrollingWash /> : null}
            <View style={{ width: '100%', maxWidth, alignSelf: 'center', gap: spacing.lg }}>{children}</View>
        </ScrollView>
    );
}
