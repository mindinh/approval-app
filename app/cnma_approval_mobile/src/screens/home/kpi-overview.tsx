import type { SymbolViewProps } from 'expo-symbols';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Icon } from '@/components/icon';
import { PressableScale } from '@/components/pressable-scale';
import { Skeleton } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { APPROVED_HREF, INBOX_HREF } from '@/constants/tabs';
import type { TaskStatusCountsResponse } from '@/lib/api/bff-api';
import { cardSurface, fadeInContent, radius, shadows, spacing, useColors } from '@/theme';

const HERO_RADIUS = 24;
const HERO_VALUE_SIZE = 44;
const TILE_VALUE_SIZE = 24;
const ICON_BUBBLE = 36;
const PROGRESS_HEIGHT = 6;

function pendingCaption(pending: number): string {
    if (pending === 0) return "You're all caught up";
    return pending === 1 ? 'request waiting for you' : 'requests waiting for you';
}

/** Share of all tasks already completed, 0–1 (0 when there is nothing yet). */
function completedRatio(counts?: TaskStatusCountsResponse): number {
    if (!counts?.total) return 0;
    return Math.min(1, counts.completed / counts.total);
}

/**
 * Two faint circles in the corner of the hero: depth without adding color. They live in their own
 * clipped layer so the card itself keeps its shadow (overflow: hidden would clip it on iOS).
 */
function HeroDecoration({ color }: { color: string }) {
    return (
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: HERO_RADIUS, overflow: 'hidden' }}>
            <View style={{ position: 'absolute', width: 180, height: 180, top: -70, right: -50, borderRadius: radius.full, backgroundColor: color }} />
            <View style={{ position: 'absolute', width: 110, height: 110, top: 40, right: -40, borderRadius: radius.full, backgroundColor: color }} />
        </View>
    );
}

/**
 * The headline number on the one colored surface of the screen: a deep SAP-blue gradient with the
 * pending count and how much is already done. Tapping it opens the Inbox tab.
 */
function PendingHero({ counts }: { counts?: TaskStatusCountsResponse }) {
    const router = useRouter();
    const colors = useColors();
    const pending = counts?.inApproval;
    const ratio = completedRatio(counts);
    const muted = `${colors.onHero}BF`;
    const track = `${colors.onHero}33`;

    return (
        <PressableScale
            accessibilityRole="button"
            accessibilityLabel={pending === undefined ? 'Pending approvals, loading' : `${pending} pending approvals`}
            accessibilityHint="Opens the Inbox tab"
            onPress={() => router.navigate(INBOX_HREF)}
            style={{
                padding: spacing.lg - spacing.xs,
                gap: spacing.md,
                borderRadius: HERO_RADIUS,
                borderCurve: 'continuous',
                backgroundColor: colors.heroTo,
                experimental_backgroundImage: `linear-gradient(135deg, ${colors.heroFrom} 0%, ${colors.heroTo} 100%)`,
                boxShadow: shadows.hero,
            }}
        >
            <HeroDecoration color={`${colors.onHero}0F`} />
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ThemedText variant="subhead" style={{ flex: 1, color: muted, fontWeight: '500' }}>
                    Pending approvals
                </ThemedText>
                <View style={{ width: 28, height: 28, borderRadius: radius.full, backgroundColor: track, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={{ ios: 'arrow.up.right', android: 'arrow_outward' }} size={14} color={colors.onHero} />
                </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm }}>
                {pending === undefined ? (
                    <Skeleton width={64} height={HERO_VALUE_SIZE} style={{ opacity: 0.3 }} />
                ) : (
                    <Animated.View entering={fadeInContent}>
                        <ThemedText style={{ fontSize: HERO_VALUE_SIZE, lineHeight: HERO_VALUE_SIZE + 6, fontWeight: '700', color: colors.onHero, fontVariant: ['tabular-nums'] }}>
                            {pending}
                        </ThemedText>
                    </Animated.View>
                )}
                <ThemedText variant="callout" style={{ flex: 1, color: muted }}>
                    {pending === undefined ? ' ' : pendingCaption(pending)}
                </ThemedText>
            </View>

            <View style={{ gap: spacing.sm }}>
                <View style={{ height: PROGRESS_HEIGHT, borderRadius: radius.full, backgroundColor: track, overflow: 'hidden' }}>
                    <View style={{ width: `${Math.round(ratio * 100)}%`, height: '100%', borderRadius: radius.full, backgroundColor: colors.onHero }} />
                </View>
                <ThemedText variant="caption" style={{ color: muted, fontVariant: ['tabular-nums'] }}>
                    {counts ? `${Math.round(ratio * 100)}% of all requests completed` : ' '}
                </ThemedText>
            </View>
        </PressableScale>
    );
}

/** Quiet stat tile: neutral icon bubble, number, label. With `onPress` it is a button (chevron, press scale). */
function StatTile({ label, value, icon, onPress, hint }: { label: string; value?: number; icon: SymbolViewProps['name']; onPress?: () => void; hint?: string }) {
    const colors = useColors();
    const Container = onPress ? PressableScale : View;
    // The flex wrapper sizes the tile in the row (PressableScale styles its inner, scaling surface).
    return (
        <View style={{ flex: 1 }}>
            <Container
                accessible
                accessibilityRole={onPress ? 'button' : undefined}
                accessibilityHint={hint}
                accessibilityLabel={value === undefined ? `${label}, loading` : `${label}, ${value}`}
                onPress={onPress}
                style={{ flex: 1, gap: spacing.smd, padding: spacing.md, ...cardSurface(colors) }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ width: ICON_BUBBLE, height: ICON_BUBBLE, borderRadius: radius.full, backgroundColor: colors.fillBackground, alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name={icon} size={17} color={colors.secondaryLabel} />
                    </View>
                    {onPress ? <Icon name={{ ios: 'chevron.right', android: 'chevron_right' }} size={13} color={colors.tertiaryLabel} /> : null}
                </View>
                <View style={{ gap: 2 }}>
                    {value === undefined ? (
                        <Skeleton width={40} height={TILE_VALUE_SIZE} />
                    ) : (
                        <Animated.View entering={fadeInContent}>
                            <ThemedText style={{ fontSize: TILE_VALUE_SIZE, lineHeight: TILE_VALUE_SIZE + 4, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{value}</ThemedText>
                        </Animated.View>
                    )}
                    <ThemedText variant="footnote" numberOfLines={1}>
                        {label}
                    </ThemedText>
                </View>
            </Container>
        </View>
    );
}

/** Pending hero card + Completed / Total tiles from GET /tasks/status-counts. */
export function KpiOverview({ counts }: { counts?: TaskStatusCountsResponse }) {
    const router = useRouter();
    return (
        <View style={{ gap: spacing.smd }}>
            <PendingHero counts={counts} />
            <View style={{ flexDirection: 'row', gap: spacing.smd }}>
                <StatTile
                    label="Completed"
                    value={counts?.completed}
                    icon={{ ios: 'checkmark.circle', android: 'task_alt' }}
                    hint="Opens the Approved tab"
                    onPress={() => router.navigate(APPROVED_HREF)}
                />
                <StatTile label="Total requests" value={counts?.total} icon={{ ios: 'tray.full', android: 'inbox' }} />
            </View>
        </View>
    );
}
