import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { FadeIn, useAnimatedReaction, useAnimatedRef, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { KeyboardEvents, useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { ErrorState, InlineErrorRow } from '@/components/error-state';
import { BrandRefreshControl, useScreenContentInsets } from '@/components/screen-scroll-view';
import { Section } from '@/components/section';
import { Skeleton } from '@/components/skeleton';
import { useReferencePrView, useTaskDetailView } from '@/hooks/queries/use-task-queries';
import { ApiError } from '@/lib/api/http-client';
import { haptics } from '@/lib/haptics';
import { duration, easing, fadeInContent, layout, radius, shadows, spacing, useColors } from '@/theme';
import type { DetailTabKey, TaskDetailView } from '@/utils/task-detail';
import { AttachmentsTab } from './attachments-tab';
import { COMPOSER_HEIGHT, CommentComposer } from './comment-composer';
import { CommentsTab } from './comments-tab';
import { DecisionBar } from './decision-bar';
import { DetailHeader, DetailTopBar } from './detail-header';
import { DetailTabs } from './detail-tabs';
import { LineItemsTab } from './line-items-tab';
import { NextTabHint } from './next-tab-hint';
import { OverviewTab } from './overview-tab';
import { WorkflowTab } from './workflow-tab';

/** Pulling this far past the end of a tab (iOS overscroll) switches to the next tab — web: 45px damped. */
const PULL_THRESHOLD = 64;
/** Within this distance of the end, new comments scroll into view (like a chat); further up they do not jump. */
const AT_END_SLACK = 120;
/** Horizontal swipe that switches tabs: distance or a flick. */
const SWIPE_DISTANCE = 56;
const SWIPE_VELOCITY = 600;
/** A link without a task id (malformed deep link) reads as "not found" instead of loading forever. */
const MISSING_TASK_ID = new ApiError('The link has no task id', 'HTTP_ERROR', 404);
const MISSING_PR_NUMBER = new ApiError('The link has no PR number', 'HTTP_ERROR', 404);
/** How far the stuck tab backdrop reaches above the tabs (covers sticky-header lag while flinging). */
const STICKY_OVERDRAW = 48;
/** Tab content swaps with a short crossfade — tabs are peers, so they never slide. */
const tabContentIn = FadeIn.duration(duration.fast).easing(easing.out);

function TabContent({ tab, view }: { tab: DetailTabKey; view: TaskDetailView }) {
    switch (tab) {
        case 'details':
            return <LineItemsTab model={view.model} />;
        case 'workflow':
            return <WorkflowTab steps={view.approvalSteps} />;
        case 'attachments':
            return <AttachmentsTab attachments={view.attachments} context={view.context} />;
        case 'comments':
            return <CommentsTab comments={view.comments} instanceId={view.instanceId} context={view.context} />;
        default:
            return <OverviewTab model={view.model} />;
    }
}

/** First-load placeholder shaped like the title, tabs and an overview card. */
function DetailSkeleton() {
    const colors = useColors();
    return (
        <View style={{ gap: spacing.lg }}>
            <View style={{ gap: spacing.smd, paddingHorizontal: spacing.xs }}>
                <Skeleton width="85%" height={22} />
                <Skeleton width="55%" height={22} />
                <Skeleton width={110} height={22} borderRadius={radius.full} />
            </View>
            <Skeleton height={44} borderRadius={radius.full} />
            <View style={{ padding: spacing.md, gap: spacing.smd, borderRadius: radius.card, backgroundColor: colors.cardBackground }}>
                {Array.from({ length: 7 }, (_, index) => (
                    <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Skeleton width="30%" height={12} />
                        <Skeleton width="40%" height={12} />
                    </View>
                ))}
            </View>
        </View>
    );
}

/**
 * Task detail with the same information as the web: title + status, then Overview · Details ·
 * Workflow · Attachments · Comments. The tab bar sticks under the header; swipe left / right to change
 * tab, or (as on the web) pull past the end of a tab to open the next one. Pull down to refresh. The
 * decision buttons (Reject / Approve) sit under the tabs like the web and stick with them; the screen is
 * pushed above the tab bar, so the whole height goes to content and decisions.
 *
 * With `referencePr` it shows a PO line's reference PR instead (web: ReferencePrDetailView): same tabs,
 * read-only — no decisions and no comment composer.
 */
export function TaskDetailScreen({ instanceId = '', referencePr }: { instanceId?: string; referencePr?: string }) {
    const colors = useColors();
    const [activeTab, setActiveTab] = useState<DetailTabKey>('overview');
    const readOnly = referencePr !== undefined;
    // The open thread reloads by itself, so new comments arrive like in a chat.
    const taskDetail = useTaskDetailView(readOnly ? '' : instanceId, { live: activeTab === 'comments' });
    const prDetail = useReferencePrView(referencePr ?? '');
    const detail = readOnly ? prDetail : taskDetail;
    const view = detail.data ?? null;
    const [pulling, setPulling] = useState(false);
    const [armed, setArmed] = useState(false);
    const { paddingBottom: basePadding } = useScreenContentInsets(false);
    const { top: safeTop, bottom: safeBottom } = useSafeAreaInsets();
    // The detail sits above the tabs (no tab bar): only the home indicator needs clearing.
    const restPadding = Math.max(basePadding, safeBottom + spacing.lg);

    const scrollRef = useAnimatedRef<Animated.ScrollView>();
    const tabsY = useSharedValue(0);
    const scrollY = useSharedValue(0);
    const pull = useSharedValue(0);
    /** Whether the user is reading the end of the content (then new messages scroll into view). */
    const atEnd = useSharedValue(true);

    // The tab bar only gets a backdrop (and a hairline) once it is stuck under the top bar, so at rest
    // it is a single track on the page instead of a box inside a box.
    const stuckBackdrop = useAnimatedStyle(() => ({ opacity: scrollY.get() >= tabsY.get() - 1 && tabsY.get() > 0 ? 1 : 0 }));

    // A tab that disappears after a refresh (e.g. workflow) falls back to the overview.
    const tabs = useMemo(() => view?.tabs ?? [], [view]);
    const tab = tabs.some((candidate) => candidate.key === activeTab) ? activeTab : 'overview';
    const index = tabs.findIndex((candidate) => candidate.key === tab);
    const next = tabs[index + 1];
    // Open tasks can be commented on: the Comments tab then shows a composer pinned to the bottom.
    const showComposer = !readOnly && tab === 'comments' && view !== null && view.status.tone !== 'success' && view.status.tone !== 'danger';
    const [composerHeight, setComposerHeight] = useState(COMPOSER_HEIGHT + safeBottom);
    const paddingBottom = showComposer ? composerHeight + spacing.lg : restPadding;

    // While typing a comment the keyboard covers the thread: grow the content by the part of the keyboard
    // above the home indicator (the composer already rides on it) and keep the newest message in view.
    const keyboard = useReanimatedKeyboardAnimation();
    const keyboardSpacer = useAnimatedStyle(() => ({ height: Math.max(0, -keyboard.height.get() - safeBottom) }));
    useEffect(() => {
        if (!showComposer) return;
        const subscription = KeyboardEvents.addListener('keyboardDidShow', () => scrollRef.current?.scrollToEnd({ animated: true }));
        return () => subscription.remove();
    }, [showComposer, scrollRef]);

    // New comments (a reload, or someone else writing) come into view if the user was at the latest message.
    const commentCount = view?.comments.length ?? 0;
    useEffect(() => {
        if (tab !== 'comments' || !atEnd.get()) return;
        const frame = requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
        return () => cancelAnimationFrame(frame);
    }, [commentCount, tab, atEnd, scrollRef]);

    const selectTab = useCallback(
        (key: DetailTabKey) => {
            setActiveTab(key);
            setArmed(false);
            // Keep the tab bar in view: if the user had scrolled past it, bring the new tab's start up to it.
            const target = tabsY.get();
            if (scrollY.get() > target) scrollRef.current?.scrollTo({ y: target, animated: false });
            // Like a chat, the comments open at the latest message.
            if (key === 'comments') setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
        },
        [scrollRef, scrollY, tabsY]
    );

    const goRelative = useCallback(
        (step: 1 | -1) => {
            const target = tabs[index + step];
            if (!target) return;
            haptics.selection();
            selectTab(target.key);
        },
        [index, selectTab, tabs]
    );
    const goNext = useCallback(() => goRelative(1), [goRelative]);
    const goPrevious = useCallback(() => goRelative(-1), [goRelative]);

    const hasNext = Boolean(next);
    const scrollHandler = useAnimatedScrollHandler(
        {
            onScroll: (event) => {
                const inset = event.contentInset ?? { top: 0, bottom: 0 };
                scrollY.set(event.contentOffset.y);
                // iOS rubber-band past the end of the content. Short content cannot scroll, so its "end" is the
                // resting top position — otherwise a pull-to-refresh drag would count as pulling past the end.
                const maxOffset = Math.max(event.contentSize.height + inset.bottom - event.layoutMeasurement.height, -inset.top);
                const overscroll = event.contentOffset.y - maxOffset;
                atEnd.set(overscroll > -AT_END_SLACK);
                pull.set(hasNext ? Math.max(0, overscroll) : 0);
            },
            onEndDrag: () => {
                if (hasNext && pull.get() >= PULL_THRESHOLD) scheduleOnRN(goNext);
            },
        },
        [hasNext, goNext]
    );

    // Flip the hint label (and tick a haptic) once when the pull crosses the threshold, not per frame.
    useAnimatedReaction(
        () => pull.get() >= PULL_THRESHOLD,
        (reached, previous) => {
            if (reached === previous || previous === null) return;
            scheduleOnRN(setArmed, reached);
            if (reached) scheduleOnRN(haptics.selection);
        }
    );

    const swipe = usePanGesture({
        activeOffsetX: [-24, 24],
        failOffsetY: [-14, 14],
        runOnJS: true,
        onDeactivate: (event) => {
            if (event.canceled) return;
            if (event.translationX < -SWIPE_DISTANCE || event.velocityX < -SWIPE_VELOCITY) goNext();
            else if (event.translationX > SWIPE_DISTANCE || event.velocityX > SWIPE_VELOCITY) goPrevious();
        },
    });

    const refresh = async () => {
        haptics.light();
        setPulling(true);
        await detail.refetch();
        setPulling(false);
    };

    const contentWidth = { width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center' } as const;

    return (
        <View style={{ flex: 1, backgroundColor: colors.groupedBackground }}>
            <View style={[contentWidth, { paddingTop: safeTop + spacing.xs, paddingHorizontal: spacing.md, paddingBottom: spacing.xs }]}>
                <DetailTopBar view={view} />
            </View>
            <Animated.ScrollView
                ref={scrollRef}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                contentInsetAdjustmentBehavior="never"
                // With the comment keyboard open, the first tap on a decision button or tab must act, not only close the keyboard.
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                stickyHeaderIndices={view ? [1] : undefined}
                // No top padding on the container: a sticky header pins that far below the edge, and content would show through the gap.
                contentContainerStyle={{ paddingHorizontal: spacing.md, paddingTop: view ? 0 : spacing.sm, paddingBottom }}
                refreshControl={view ? <BrandRefreshControl refreshing={pulling} onRefresh={refresh} offset={0} /> : undefined}
            >
                {view ? (
                    <Animated.View entering={fadeInContent} style={[contentWidth, { gap: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm }]}>
                        <DetailHeader view={view} />
                        {detail.error ? (
                            <Section>
                                <InlineErrorRow title="Could not refresh" error={detail.error} context="Refreshing the task" onRetry={() => detail.refetch()} />
                            </Section>
                        ) : null}
                    </Animated.View>
                ) : null}
                {view ? (
                    <View
                        onLayout={(event: LayoutChangeEvent) => {
                            tabsY.set(event.nativeEvent.layout.y);
                        }}
                        // No padding here: a sticky header moves its own style (padding included) onto an outer wrapper,
                        // so the backdrop below would stop at the buttons and content would show through the padding.
                        style={contentWidth}
                    >
                        <Animated.View
                            pointerEvents="none"
                            style={[
                                // Extends above the block: while scrolling fast the native sticky offset can trail a frame behind,
                                // and the gap above the tabs must not show the content underneath.
                                { position: 'absolute', top: -STICKY_OVERDRAW, bottom: 0, left: -spacing.md, right: -spacing.md, backgroundColor: colors.groupedBackground, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator, boxShadow: shadows.card },
                                stuckBackdrop,
                            ]}
                        />
                        <View style={{ gap: spacing.sm, paddingTop: spacing.sm, paddingBottom: spacing.md }}>
                            <DetailTabs tabs={tabs} active={tab} onChange={selectTab} />
                            {readOnly ? null : <DecisionBar instanceId={instanceId} decisions={view.decisions} />}
                        </View>
                    </View>
                ) : null}
                {view ? (
                    <GestureDetector gesture={swipe}>
                        <View style={[contentWidth, { paddingTop: spacing.sm, minHeight: 320 }]}>
                            <Animated.View key={tab} entering={tabContentIn}>
                                <TabContent tab={tab} view={view} />
                            </Animated.View>
                            {showComposer ? <Animated.View style={keyboardSpacer} /> : null}
                            {next ? <NextTabHint nextLabel={next.label} pull={pull} threshold={PULL_THRESHOLD} armed={armed} onPress={goNext} /> : null}
                        </View>
                    </GestureDetector>
                ) : detail.error || !(readOnly ? referencePr : instanceId) ? (
                    <View style={[contentWidth, { paddingTop: spacing.lg }]}>
                        <ErrorState
                            error={detail.error ?? (readOnly ? MISSING_PR_NUMBER : MISSING_TASK_ID)}
                            context={readOnly ? `Opening reference PR ${referencePr}` : `Opening task ${instanceId}`}
                            onRetry={() => detail.refetch()}
                        />
                    </View>
                ) : (
                    <View style={contentWidth}>
                        <DetailSkeleton />
                    </View>
                )}
            </Animated.ScrollView>
            {showComposer && view ? <CommentComposer instanceId={view.instanceId} context={view.context} onHeightChange={setComposerHeight} onSent={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80)} /> : null}
        </View>
    );
}
