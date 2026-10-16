import { useRef, useState, useCallback, useEffect } from 'react';

export interface TabItem {
    value: string;
    label: string;
    [key: string]: any;
}

export interface UseMobileTabGesturesOptions {
    isMobile: boolean;
    tabs: TabItem[];
    activeTab: string;
    containerRef: React.RefObject<HTMLDivElement | null>;
    onTabChange: (nextTab: string) => void;
}

export const PULL_THRESHOLD = 45; // 45px damped distance (~75px physical touch drag)
export const SWITCH_DELAY_MS = 350; // Smooth delay so user sees 100% full bar before transition

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

    // Reset container scroll to top, timers, & pull state whenever active tab changes
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = 0;
        }
        if (switchTimeoutRef.current) {
            clearTimeout(switchTimeoutRef.current);
            switchTimeoutRef.current = null;
        }
        setPullUpDistance(0);
        setIsSwitchingTab(false);
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
            }, 600);
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
            const { scrollTop, scrollHeight, clientHeight } = target;
            // 12px tolerance for Android subpixels, viewport resizing, or overscroll
            const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
            const isAtBottom = distanceFromBottom <= 12;

            const currentY = e.touches[0]?.clientY;
            if (currentY === undefined) return;

            // Start pull session when at bottom and dragging up
            if (isAtBottom && !isPullingRef.current) {
                if (pullUpStartYRef.current === null) {
                    pullUpStartYRef.current = currentY;
                }
                if (pullUpStartYRef.current - currentY > 2) {
                    isPullingRef.current = true;
                }
            }

            // If we are in an active pull session, calculate pull distance
            if (isPullingRef.current && pullUpStartYRef.current !== null) {
                const rawDiff = pullUpStartYRef.current - currentY; // Positive when dragging up

                if (rawDiff > 0) {
                    // Responsive resistance: 0.6 factor so 75px physical drag reaches full 45px threshold
                    const damped = Math.min(rawDiff * 0.6, PULL_THRESHOLD);
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
            const { scrollTop, scrollHeight, clientHeight } = target;
            const isAtBottom = (scrollHeight - (scrollTop + clientHeight)) <= 12;

            if (isAtBottom && e.deltaY > 0) {
                wheelAccumulatorRef.current += e.deltaY;
                if (wheelResetTimerRef.current) clearTimeout(wheelResetTimerRef.current);
                wheelResetTimerRef.current = setTimeout(() => {
                    wheelAccumulatorRef.current = 0;
                }, 300);

                if (wheelAccumulatorRef.current >= 70 && !switchTimeoutRef.current) {
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
