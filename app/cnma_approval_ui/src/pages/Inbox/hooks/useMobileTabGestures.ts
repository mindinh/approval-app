import { useRef, useState, useCallback, useEffect } from 'react';

/** Minimal tab shape the gestures need; callers may pass richer tab objects. */
export interface TabItem {
    value: string;
    label: string;
}

export interface UseMobileTabGesturesOptions {
    isMobile: boolean;
    tabs: TabItem[];
    activeTab: string;
    containerRef: React.RefObject<HTMLDivElement | null>;
    onTabChange: (nextTab: string) => void;
}

const PULL_THRESHOLD = 45; // 45px damped distance (~75px physical touch drag)
const SWITCH_DELAY_MS = 350; // Smooth delay so user sees 100% full bar before transition
/** Responsive resistance: 75px physical drag reaches the full 45px threshold. */
const PULL_DAMPING_FACTOR = 0.6;
/** Upward drag (px) needed before a pull session starts. */
const PULL_START_DISTANCE_PX = 2;
/** Tolerance for Android subpixels, viewport resizing, or overscroll. */
const BOTTOM_TOLERANCE_PX = 12;
/** Keep the new tab scrolled to top while its content mounts. */
const TAB_SWITCH_SETTLE_MS = 600;
const WHEEL_SWITCH_DELTA = 70;
const WHEEL_ACCUMULATOR_RESET_MS = 300;

function isScrolledToBottom({ scrollTop, scrollHeight, clientHeight }: HTMLElement): boolean {
    return scrollHeight - (scrollTop + clientHeight) <= BOTTOM_TOLERANCE_PX;
}

export function useMobileTabGestures({
    isMobile,
    tabs,
    activeTab,
    containerRef,
    onTabChange,
}: UseMobileTabGesturesOptions) {
    const tabButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const isSwitchingTabRef = useRef(false);
    const hasConsumedGestureRef = useRef(false);
    const pullUpStartYRef = useRef<number | null>(null);
    const isPullingRef = useRef(false);
    const switchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [pullUpDistance, setPullUpDistance] = useState(0);
    const [isSwitchingTab, setIsSwitchingTab] = useState(false);

    const currentTabIndex = tabs.findIndex((t) => t.value === activeTab);

    // Reset pull state whenever the active tab changes (adjusted during render, not in an effect)
    const [pullStateTab, setPullStateTab] = useState(activeTab);
    if (pullStateTab !== activeTab) {
        setPullStateTab(activeTab);
        setPullUpDistance(0);
        setIsSwitchingTab(false);
    }

    // Keep active tab centered in horizontal pill bar
    useEffect(() => {
        if (isMobile && activeTab && tabButtonRefs.current[activeTab]) {
            tabButtonRefs.current[activeTab]?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center',
            });
        }
    }, [activeTab, isMobile]);

    // Reset container scroll to top, timers, & gesture refs whenever active tab changes
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = 0;
        }
        if (switchTimeoutRef.current) {
            clearTimeout(switchTimeoutRef.current);
            switchTimeoutRef.current = null;
        }
        pullUpStartYRef.current = null;
        isPullingRef.current = false;
        isSwitchingTabRef.current = false;
    }, [activeTab, containerRef]);

    // Cleanup switch timer on unmount
    useEffect(() => {
        return () => {
            if (switchTimeoutRef.current) {
                clearTimeout(switchTimeoutRef.current);
            }
        };
    }, []);

    const triggerNextTab = useCallback(
        (container?: HTMLElement | null) => {
            const currentIdx = tabs.findIndex((t) => t.value === activeTab);
            if (currentIdx === -1 || currentIdx >= tabs.length - 1) return;

            const nextTab = tabs[currentIdx + 1];
            if (!nextTab) return;

            isSwitchingTabRef.current = true;
            onTabChange(nextTab.value);

            if (container) {
                container.scrollTop = 0;
            }

            setTimeout(() => {
                if (container) {
                    container.scrollTop = 0;
                }
                isSwitchingTabRef.current = false;
            }, TAB_SWITCH_SETTLE_MS);
        },
        [tabs, activeTab, onTabChange]
    );

    const handleContainerTouchStart = useCallback(
        (_e: React.TouchEvent<HTMLDivElement>) => {
            if (!isMobile) return;
            // A new touch begins: reset gesture consumption flag
            hasConsumedGestureRef.current = false;
            pullUpStartYRef.current = null;
            isPullingRef.current = false;
            if (switchTimeoutRef.current) {
                clearTimeout(switchTimeoutRef.current);
                switchTimeoutRef.current = null;
            }
            setIsSwitchingTab(false);
            setPullUpDistance(0);
        },
        [isMobile]
    );

    const handleContainerTouchMove = useCallback(
        (e: React.TouchEvent<HTMLDivElement>) => {
            if (!isMobile || isSwitchingTabRef.current || hasConsumedGestureRef.current) return;
            if (currentTabIndex >= tabs.length - 1) return;

            const target = e.currentTarget;
            const isAtBottom = isScrolledToBottom(target);

            const currentY = e.touches[0]?.clientY;
            if (currentY === undefined) return;

            // Start pull session when at bottom and dragging up
            if (isAtBottom && !isPullingRef.current) {
                if (pullUpStartYRef.current === null) {
                    pullUpStartYRef.current = currentY;
                }
                if (pullUpStartYRef.current - currentY > PULL_START_DISTANCE_PX) {
                    isPullingRef.current = true;
                }
            }

            // If we are in an active pull session, calculate pull distance
            if (isPullingRef.current && pullUpStartYRef.current !== null) {
                const rawDiff = pullUpStartYRef.current - currentY; // Positive when dragging up

                if (rawDiff > 0) {
                    const damped = Math.min(rawDiff * PULL_DAMPING_FACTOR, PULL_THRESHOLD);
                    setPullUpDistance(damped);

                    // Reached 100% threshold -> Schedule delayed transition
                    if (damped >= PULL_THRESHOLD && !switchTimeoutRef.current) {
                        hasConsumedGestureRef.current = true;
                        setIsSwitchingTab(true);

                        // Give user 350ms to see the full bar and transition indicator
                        switchTimeoutRef.current = setTimeout(() => {
                            triggerNextTab(target);
                            setIsSwitchingTab(false);
                            setPullUpDistance(0);
                            pullUpStartYRef.current = null;
                            isPullingRef.current = false;
                            switchTimeoutRef.current = null;
                        }, SWITCH_DELAY_MS);
                    }
                } else {
                    // Dragged back down -> Cancel pending switch and reset to 0
                    if (switchTimeoutRef.current) {
                        clearTimeout(switchTimeoutRef.current);
                        switchTimeoutRef.current = null;
                    }
                    hasConsumedGestureRef.current = false;
                    setIsSwitchingTab(false);
                    setPullUpDistance(0);
                    isPullingRef.current = false;
                    pullUpStartYRef.current = null;
                }
            }
        },
        [isMobile, currentTabIndex, tabs.length, triggerNextTab]
    );

    const handleContainerTouchEnd = useCallback(() => {
        if (!isMobile) return;
        isPullingRef.current = false;
        pullUpStartYRef.current = null;

        // If switch timer is already running (user reached 100% and lifted finger),
        // let the timer finish and transition to the next tab!
        if (switchTimeoutRef.current) {
            return;
        }

        // Otherwise (user lifted finger before reaching 100%), cancel and reset
        setPullUpDistance(0);
        setIsSwitchingTab(false);
        hasConsumedGestureRef.current = false;
    }, [isMobile]);

    const wheelAccumulatorRef = useRef(0);
    const wheelResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleContainerWheel = useCallback(
        (e: React.WheelEvent<HTMLDivElement>) => {
            if (!isMobile || isSwitchingTabRef.current || hasConsumedGestureRef.current) return;
            if (currentTabIndex >= tabs.length - 1) return;

            const target = e.currentTarget;
            const isAtBottom = isScrolledToBottom(target);

            if (isAtBottom && e.deltaY > 0) {
                wheelAccumulatorRef.current += e.deltaY;
                if (wheelResetTimerRef.current) clearTimeout(wheelResetTimerRef.current);
                wheelResetTimerRef.current = setTimeout(() => {
                    wheelAccumulatorRef.current = 0;
                }, WHEEL_ACCUMULATOR_RESET_MS);

                if (wheelAccumulatorRef.current >= WHEEL_SWITCH_DELTA && !switchTimeoutRef.current) {
                    wheelAccumulatorRef.current = 0;
                    hasConsumedGestureRef.current = true;
                    setIsSwitchingTab(true);
                    setPullUpDistance(PULL_THRESHOLD);

                    switchTimeoutRef.current = setTimeout(() => {
                        triggerNextTab(target);
                        setIsSwitchingTab(false);
                        setPullUpDistance(0);
                        switchTimeoutRef.current = null;
                    }, SWITCH_DELAY_MS);
                }
            } else if (e.deltaY < 0) {
                wheelAccumulatorRef.current = 0;
                if (switchTimeoutRef.current) {
                    clearTimeout(switchTimeoutRef.current);
                    switchTimeoutRef.current = null;
                }
                setIsSwitchingTab(false);
                setPullUpDistance(0);
                hasConsumedGestureRef.current = false;
            }
        },
        [isMobile, currentTabIndex, tabs.length, triggerNextTab]
    );

    return {
        pullUpDistance,
        isSwitchingTab,
        pullThreshold: PULL_THRESHOLD,
        tabButtonRefs,
        currentTabIndex,
        handleContainerTouchStart,
        handleContainerTouchMove,
        handleContainerTouchEnd,
        handleContainerWheel,
        triggerNextTab,
    };
}
