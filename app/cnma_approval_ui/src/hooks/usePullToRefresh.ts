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
    threshold = 65,
    maxPull = 100,
    disabled = false,
}: UsePullToRefreshOptions) {
    const [pullDistance, setPullDistance] = useState(0);
    const [isPulling, setIsPulling] = useState(false);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const startYRef = useRef<number | null>(null);
    const isDraggingRef = useRef(false);

    const handleTouchStart = useCallback(
        (e: TouchEvent | React.TouchEvent<HTMLDivElement>) => {
            if (disabled || isRefreshing) return;
            const container = containerRef.current;
            if (!container) return;

            if (container.scrollTop <= 0) {
                const touch = 'touches' in e ? e.touches[0] : (e as TouchEvent).touches[0];
                if (touch) {
                    startYRef.current = touch.clientY;
                    isDraggingRef.current = true;
                }
            } else {
                startYRef.current = null;
                isDraggingRef.current = false;
            }
        },
        [disabled, isRefreshing]
    );

    const handleTouchMove = useCallback(
        (e: TouchEvent | React.TouchEvent<HTMLDivElement>) => {
            if (!isDraggingRef.current || startYRef.current === null || disabled || isRefreshing) return;
            const container = containerRef.current;
            if (!container) return;

            if (container.scrollTop > 0 && pullDistance === 0) {
                isDraggingRef.current = false;
                return;
            }

            const touch = 'touches' in e ? e.touches[0] : (e as TouchEvent).touches[0];
            if (!touch) return;

            const currentY = touch.clientY;
            const diff = currentY - startYRef.current;

            if (diff > 0 && container.scrollTop <= 0) {
                const distance = Math.min(diff * 0.45, maxPull);
                setPullDistance(distance);
                setIsPulling(true);
            } else if (diff <= 0) {
                setPullDistance(0);
                setIsPulling(false);
            }
        },
        [disabled, isRefreshing, maxPull, pullDistance]
    );

    const handleTouchEnd = useCallback(() => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;
        startYRef.current = null;
        setIsPulling(false);

        if (pullDistance >= threshold && !isRefreshing) {
            void onRefresh();
        }
        setPullDistance(0);
    }, [isRefreshing, onRefresh, pullDistance, threshold]);

    const handleTouchCancel = useCallback(() => {
        isDraggingRef.current = false;
        startYRef.current = null;
        setIsPulling(false);
        setPullDistance(0);
    }, []);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const onTouchStart = (e: TouchEvent) => handleTouchStart(e);
        const onTouchMove = (e: TouchEvent) => handleTouchMove(e);
        const onTouchEnd = () => handleTouchEnd();
        const onTouchCancel = () => handleTouchCancel();

        el.addEventListener('touchstart', onTouchStart, { passive: true });
        el.addEventListener('touchmove', onTouchMove, { passive: true });
        el.addEventListener('touchend', onTouchEnd, { passive: true });
        el.addEventListener('touchcancel', onTouchCancel, { passive: true });

        return () => {
            el.removeEventListener('touchstart', onTouchStart);
            el.removeEventListener('touchmove', onTouchMove);
            el.removeEventListener('touchend', onTouchEnd);
            el.removeEventListener('touchcancel', onTouchCancel);
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel]);

    useEffect(() => {
        if (!isRefreshing) {
            setPullDistance(0);
            setIsPulling(false);
        }
    }, [isRefreshing]);

    const isThresholdReached = pullDistance >= threshold;

    return {
        containerRef,
        pullDistance,
        isPulling,
        isThresholdReached,
        isRefreshing,
        touchHandlers: {
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd,
            onTouchCancel: handleTouchCancel,
        },
    };
}
