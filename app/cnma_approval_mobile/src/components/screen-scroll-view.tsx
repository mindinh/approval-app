import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, View, type RefreshControlProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout, spacing, useColors } from '@/theme';
import { useTabBarInset } from './floating-tab-bar';

/** Height of the brand wash below the status bar; it fades out completely by then. */
const WASH_HEIGHT = 340;
const IS_IOS = process.env.EXPO_OS === 'ios';

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

/**
 * Faint brand wash pinned to the very top of the screen: it starts under the status bar, notch,
 * Dynamic Island or camera cutout, so the background runs edge to edge instead of stopping at the
 * safe area. Place it as the first child of a full-screen container, behind transparent content.
 */
export function TopWash() {
    const colors = useColors();
    const { top } = useSafeAreaInsets();
    return (
        <View
            pointerEvents="none"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: WASH_HEIGHT + top,
                experimental_backgroundImage: `linear-gradient(180deg, ${colors.accent}1F 0%, ${colors.accent}0A 45%, ${colors.accent}00 100%)`,
            }}
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
 *
 * @param headerless the screen has no native header (tab roots draw a ScreenHeader)
 * @param wash       a faint brand wash pinned behind the top of the screen, under the status bar
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

    const scroll = (transparent: boolean) => (
        <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            // Sheets with inputs (decision comment): a tap on a button acts at once instead of only closing the
            // keyboard, and the content scrolls above the keyboard.
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            automaticallyAdjustKeyboardInsets
            style={transparent ? { flex: 1 } : { backgroundColor: colors.groupedBackground }}
            contentContainerStyle={{ padding: spacing.md, paddingTop, paddingBottom }}
            refreshControl={onRefresh ? <BrandRefreshControl refreshing={!!refreshing} onRefresh={onRefresh} offset={refreshOffset} /> : undefined}
        >
            <View style={{ width: '100%', maxWidth, alignSelf: 'center', gap: spacing.lg }}>{children}</View>
        </ScrollView>
    );

    return (
        // Without a wash the ScrollView must stay the root view: native form sheets (Profile, Filters) size
        // their content from it, and an extra wrapper collapses the sheet to an empty page.
        wash ? (
            <View style={{ flex: 1, backgroundColor: colors.groupedBackground }}>
                <TopWash />
                {scroll(true)}
            </View>
        ) : (
            scroll(false)
        )
    );
}
