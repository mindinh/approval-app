import { useState, useRef, useCallback, useEffect } from 'react';

interface UsePullToRefreshOptions {
    onRefresh: () => Promise<unknown> | void;
    isRefreshing: boolean;
    threshold?: number;
    maxPull?: number;
    disabled?: boolean;
}

export function usePullToRefresh({
    onRefresh,
    isRefreshing,
    threshold = 60,
    maxPull = 95,
    disabled = false,
}: UsePullToRefreshOptions) {
    const [pullDistance, setPullDistance] = useState(0);
    const [isPulling, setIsPulling] = useState(false);
    const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const startYRef = useRef<number | null>(null);
    const isDraggingRef = useRef(false);
    const pullDistanceRef = useRef(0);

    // Callback ref for dynamic DOM node attachment across tab/page remounts
    const setRef = useCallback((node: HTMLDivElement | null) => {
        containerRef.current = node;
        setContainerEl(node);
    }, []);

    const getScrollTop = (container: HTMLDivElement | null) => {
        if (!container) return 0;
        return container.scrollTop || 0;
    };

    const handleTouchStart = useCallback(
        (e: TouchEvent) => {
            if (disabled || isRefreshing) return;
            const container = containerEl || containerRef.current;
            if (!container) return;

            const st = getScrollTop(container);
            // Allow PTR gesture initiation only if container is at top (scrollTop <= 2px)
            if (st <= 2) {
                const touch = e.touches[0];
                if (touch) {
                    startYRef.current = touch.clientY;
                    isDraggingRef.current = true;
                    pullDistanceRef.current = 0;
                }
            } else {
                startYRef.current = null;
                isDraggingRef.current = false;
                pullDistanceRef.current = 0;
            }
        },
        [disabled, isRefreshing, containerEl]
    );

    const handleTouchMove = useCallback(
        (e: TouchEvent) => {
            if (!isDraggingRef.current || startYRef.current === null || disabled || isRefreshing) return;
            const container = containerEl || containerRef.current;
            if (!container) return;

            const touch = e.touches[0];
            if (!touch) return;

            const currentY = touch.clientY;
            const diff = currentY - startYRef.current;
            const st = getScrollTop(container);

            // ONLY calculate pull distance when pulling down at the very top of container
            if (diff > 0 && st <= 2) {
                const distance = Math.min(diff * 0.48, maxPull);
                pullDistanceRef.current = distance;
                setPullDistance(distance);
                setIsPulling(true);
            } else {
                // If scrolling down into the list (diff <= 0 or st > 2), release PTR dragging immediately so native scrolling works!
                isDraggingRef.current = false;
                startYRef.current = null;
                pullDistanceRef.current = 0;
                setPullDistance(0);
                setIsPulling(false);
            }
        },
        [disabled, isRefreshing, maxPull, containerEl]
    );

    const handleTouchEnd = useCallback(() => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;
        startYRef.current = null;
        setIsPulling(false);

        const currentPull = pullDistanceRef.current;
        if (currentPull >= threshold && !isRefreshing) {
            void onRefresh();
        }

        pullDistanceRef.current = 0;
        setPullDistance(0);
    }, [isRefreshing, onRefresh, threshold]);

    const handleTouchCancel = useCallback(() => {
        isDraggingRef.current = false;
        startYRef.current = null;
        pullDistanceRef.current = 0;
        setIsPulling(false);
        setPullDistance(0);
    }, []);

    useEffect(() => {
        const el = containerEl || containerRef.current;
        if (!el || disabled) return;

        // Strictly scope passive listeners to container element (allows 100% native momentum scrolling)
        el.addEventListener('touchstart', handleTouchStart, { passive: true });
        el.addEventListener('touchmove', handleTouchMove, { passive: true });
        el.addEventListener('touchend', handleTouchEnd, { passive: true });
        el.addEventListener('touchcancel', handleTouchCancel, { passive: true });

        return () => {
            el.removeEventListener('touchstart', handleTouchStart);
            el.removeEventListener('touchmove', handleTouchMove);
            el.removeEventListener('touchend', handleTouchEnd);
            el.removeEventListener('touchcancel', handleTouchCancel);
        };
    }, [containerEl, disabled, handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel]);

    useEffect(() => {
        if (!isRefreshing) {
            pullDistanceRef.current = 0;
            setPullDistance(0);
            setIsPulling(false);
        }
    }, [isRefreshing]);

    const isThresholdReached = pullDistance >= threshold;

    return {
        containerRef: setRef,
        pullDistance,
        isPulling,
        isThresholdReached,
        isRefreshing,
    };
}
