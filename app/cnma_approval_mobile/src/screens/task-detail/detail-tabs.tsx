import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View, type LayoutChangeEvent, type ScrollViewInstance, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import Animated from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { haptics } from '@/lib/haptics';
import { cssEasing, duration, radius, spacing, useColors } from '@/theme';
import type { DetailTab, DetailTabKey } from '@/utils/task-detail';

const TRACK_PADDING = 3;
/** Track = segment + padding + hairline = 40, the height of the decision buttons below. */
const SEGMENT_HEIGHT = 32;
/** Width of the fade that hints at more tabs past the edge. */
const FADE_WIDTH = 28;
/** Lift of the active segment; small enough to stay inside the track padding (a scroll view clips its content). */
const SEGMENT_SHADOW = '0 1px 2px rgba(28, 31, 35, 0.10)';

/**
 * Segmented tabs of the detail (Overview · Details · Workflow · Attachments · Comments) with counts.
 * One rounded track: segments share its width evenly and scroll sideways when they do not fit; then a fade
 * marks the hidden side and the active tab is scrolled into view. The active segment lifts onto the card
 * surface; content switches instantly.
 */
export function DetailTabs({ tabs, active, onChange }: { tabs: readonly DetailTab[]; active: DetailTabKey; onChange: (key: DetailTabKey) => void }) {
    const colors = useColors();
    const scrollRef = useRef<ScrollViewInstance>(null);
    const segments = useRef(new Map<DetailTabKey, { x: number; width: number }>());
    const [viewport, setViewport] = useState({ width: 0, content: 0, x: 0 });
    const overflowsLeft = viewport.x > 2;
    const overflowsRight = viewport.content - viewport.width - viewport.x > 2;

    // Keep the active tab fully visible (selected by swipe, "next tab" hint or a tap near the edge).
    useEffect(() => {
        const segment = segments.current.get(active);
        if (!segment || viewport.width === 0) return;
        const { x } = viewport;
        if (segment.x - FADE_WIDTH < x) scrollRef.current?.scrollTo({ x: Math.max(0, segment.x - FADE_WIDTH), animated: true });
        else if (segment.x + segment.width + FADE_WIDTH > x + viewport.width) scrollRef.current?.scrollTo({ x: segment.x + segment.width + FADE_WIDTH - viewport.width, animated: true });
        // Only when the active tab changes, not on every scroll.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active, viewport.width]);

    const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const x = event.nativeEvent.contentOffset.x;
        setViewport((current) => (Math.abs(current.x - x) < 1 ? current : { ...current, x }));
    };

    return (
        <View style={{ borderRadius: radius.full, borderCurve: 'continuous', backgroundColor: colors.fillBackground, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden' }}>
            <ScrollView
                ref={scrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={32}
                onLayout={(event: LayoutChangeEvent) => {
                    const width = event.nativeEvent.layout.width;
                    setViewport((current) => ({ ...current, width }));
                }}
                onContentSizeChange={(content) => setViewport((current) => ({ ...current, content }))}
                style={{ flexGrow: 0 }}
                // The padding lives inside the scroll content, so the active segment and its shadow are never cut by the track edge.
                contentContainerStyle={{ flexGrow: 1, gap: 2, padding: TRACK_PADDING }}
            >
                {tabs.map((tab) => {
                    const selected = tab.key === active;
                    return (
                        <Pressable
                            key={tab.key}
                            style={{ flexGrow: 1 }}
                            onLayout={(event: LayoutChangeEvent) => {
                                const { x, width } = event.nativeEvent.layout;
                                segments.current.set(tab.key, { x, width });
                            }}
                            accessibilityRole="tab"
                            accessibilityState={{ selected }}
                            accessibilityLabel={tab.count ? `${tab.label}, ${tab.count}` : tab.label}
                            onPress={() => {
                                if (selected) return;
                                haptics.selection();
                                onChange(tab.key);
                            }}
                        >
                            <Animated.View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: spacing.xs + 2,
                                    minHeight: SEGMENT_HEIGHT,
                                    paddingHorizontal: spacing.smd,
                                    paddingVertical: 4,
                                    borderRadius: radius.full,
                                    borderCurve: 'continuous',
                                    borderWidth: 1,
                                    borderColor: selected ? colors.cardBorder : 'transparent',
                                    backgroundColor: selected ? colors.elevatedBackground : 'transparent',
                                    boxShadow: selected ? SEGMENT_SHADOW : undefined,
                                    transitionProperty: 'backgroundColor',
                                    transitionDuration: duration.fast,
                                    transitionTimingFunction: cssEasing.out,
                                }}
                            >
                                <ThemedText variant="subhead" numberOfLines={1} style={{ color: selected ? colors.label : colors.secondaryLabel, fontWeight: selected ? '600' : '500' }}>
                                    {tab.label}
                                </ThemedText>
                                {tab.count ? (
                                    <View
                                        style={{
                                            minWidth: 20,
                                            paddingHorizontal: 6,
                                            borderRadius: radius.full,
                                            backgroundColor: selected ? colors.accentSoft : `${colors.secondaryLabel}1A`,
                                            alignItems: 'center',
                                        }}
                                    >
                                        <ThemedText variant="caption" style={{ color: selected ? colors.accent : colors.secondaryLabel, fontVariant: ['tabular-nums'] }}>
                                            {tab.count}
                                        </ThemedText>
                                    </View>
                                ) : null}
                            </Animated.View>
                        </Pressable>
                    );
                })}
            </ScrollView>
            {overflowsLeft ? <EdgeFade side="left" color={colors.fillBackground} /> : null}
            {overflowsRight ? <EdgeFade side="right" color={colors.fillBackground} /> : null}
        </View>
    );
}

/** Soft fade over the track edge where more tabs are scrolled out of view. */
function EdgeFade({ side, color }: { side: 'left' | 'right'; color: string }) {
    return (
        <View
            pointerEvents="none"
            style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                [side]: 0,
                width: FADE_WIDTH,
                experimental_backgroundImage: `linear-gradient(${side === 'right' ? '90deg' : '270deg'}, ${color}00 0%, ${color} 85%)`,
            }}
        />
    );
}
