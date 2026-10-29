import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { InboxTask } from '@/services/inbox/inbox.types';
import { bindScrollPagination } from './scrollPagination';
import {
    computeCategoryCounts,
    getTaskObjectCategory,
    type ObjectCategory,
} from '../utils/categoryUtils';

export interface UseTaskListScrollOptions {
    tasks: InboxTask[];
    selectedTaskId: string | null;
    normSelectedId: string;
    activeCategory?: ObjectCategory | null;
    hasLocalFilter: boolean;
    filteredTasks: InboxTask[];
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    pauseAutoLoad?: boolean;
    isMobile?: boolean;
    onLoadMore?: (categories: ObjectCategory[]) => void;
    categoryTotals?: Record<ObjectCategory, { pending: number; completed: number; total: number }>;
    categoryTotalsAreAuthoritative?: boolean;
    scope?: 'my' | 'approved';
}

export function useTaskListScroll({
    tasks,
    selectedTaskId,
    normSelectedId,
    activeCategory,
    hasLocalFilter,
    filteredTasks,
    hasNextPage,
    isFetchingNextPage,
    pauseAutoLoad = false,
    isMobile = false,
    onLoadMore,
    categoryTotals,
    categoryTotalsAreAuthoritative = false,
    scope = 'my',
}: UseTaskListScrollOptions) {
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const lastScrolledTaskIdRef = useRef<string | null>(null);
    const lastRevealedTaskIdRef = useRef<string | null>(null);

    // ─── 4-Section Category Accordion state ───────────────────
    const [expandedCategories, setExpandedCategories] = useState<Set<ObjectCategory>>(
        () => new Set<ObjectCategory>()
    );

    // If activeCategory is explicitly selected, expand it
    useEffect(() => {
        if (activeCategory && activeCategory !== 'ALL') {
            setExpandedCategories((current) => {
                if (current.has(activeCategory)) return current;
                const next = isMobile ? new Set<ObjectCategory>() : new Set(current);
                next.add(activeCategory);
                return next;
            });
        }
    }, [activeCategory, isMobile]);

    // Reveal matching groups after search/filter without collapsing groups the user opened
    useEffect(() => {
        if (!hasLocalFilter || filteredTasks.length === 0) return;

        const matchingCategories = new Set<ObjectCategory>();
        for (const task of filteredTasks) {
            const category = getTaskObjectCategory(task);
            if (category !== 'OTHER') matchingCategories.add(category);
        }

        setExpandedCategories((current) => {
            const next = new Set(current);
            let changed = false;
            for (const category of matchingCategories) {
                if (!next.has(category)) {
                    next.add(category);
                    changed = true;
                }
            }
            return changed ? next : current;
        });
    }, [filteredTasks, hasLocalFilter]);

    // Focus the selected task by keeping only its category expanded & centering card
    useEffect(() => {
        if (!selectedTaskId) {
            lastScrolledTaskIdRef.current = null;
            lastRevealedTaskIdRef.current = null;
            return;
        }

        if (tasks.length === 0) return;

        const currentTask = tasks.find(
            (t) =>
                t.instanceId === selectedTaskId ||
                String(t.instanceId).replace(/^0+/, '') === normSelectedId
        );
        if (!currentTask) return;

        const cat = getTaskObjectCategory(currentTask);
        // Reveal once per selection, independently of delayed card scrolling.
        // List/query updates must respect a category the user manually closed.
        if (cat && cat !== 'OTHER' && lastRevealedTaskIdRef.current !== currentTask.instanceId) {
            lastRevealedTaskIdRef.current = currentTask.instanceId;
            setExpandedCategories((current) => {
                if (current.has(cat as ObjectCategory)) return current;
                const next = new Set(current);
                next.add(cat as ObjectCategory);
                return next;
            });
        }

        if (lastScrolledTaskIdRef.current === currentTask.instanceId) {
            return;
        }

        let attempts = 0;
        const maxAttempts = 12;
        let timeoutId: ReturnType<typeof setTimeout>;

        const attemptScroll = () => {
            const el =
                document.getElementById(`task-card-${currentTask.instanceId}`) ||
                (selectedTaskId ? document.getElementById(`task-card-${selectedTaskId}`) : null);
            const container = scrollContainerRef.current;

            if (el && container) {
                const containerRect = container.getBoundingClientRect();
                const elRect = el.getBoundingClientRect();

                // If card is not already comfortably visible inside the scroll container, scroll to center it
                const isFullyVisible =
                    elRect.top >= containerRect.top + 30 &&
                    elRect.bottom <= containerRect.bottom - 30;

                if (!isFullyVisible) {
                    const relativeTop = elRect.top - containerRect.top + container.scrollTop;
                    const targetScrollTop = relativeTop - container.clientHeight / 2 + elRect.height / 2;
                    container.scrollTo({
                        top: Math.max(0, targetScrollTop),
                        behavior: 'smooth',
                    });
                }
                lastScrolledTaskIdRef.current = currentTask.instanceId;
            } else if (attempts < maxAttempts) {
                attempts++;
                timeoutId = setTimeout(attemptScroll, 80);
            }
        };

        // Delay 250ms to allow category accordion expand animation to settle
        timeoutId = setTimeout(attemptScroll, 250);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [selectedTaskId, tasks, normSelectedId]);

    const handleToggleCategory = useCallback((cat: ObjectCategory) => {
        setExpandedCategories((prev) => {
            const next = new Set(prev);
            if (next.has(cat)) {
                next.delete(cat);
            } else {
                if (isMobile) next.clear();
                next.add(cat);
            }
            return next;
        });
    }, [isMobile]);

    const handleScrollToTopAndCollapse = useCallback(() => {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        setExpandedCategories(new Set());
    }, []);

    const handleToggleCollapseAll = useCallback(() => {
        setExpandedCategories((prev) => {
            if (prev.size > 0) {
                return new Set<ObjectCategory>();
            }
            return new Set<ObjectCategory>(['PR', 'PO', 'CLAIM', 'RESERVATION']);
        });
    }, []);

    const isAllCollapsed = expandedCategories.size === 0;

    const loadedCategoryCounts = useMemo(() => computeCategoryCounts(tasks), [tasks]);

    const canLoadMoreForExpandedCategories = useMemo(() => {
        if (isAllCollapsed || !hasNextPage) return false;
        if (!categoryTotalsAreAuthoritative) return true;

        return Array.from(expandedCategories).some((category) => {
            if (category === 'ALL') return false;
            const loaded = loadedCategoryCounts[category] ?? 0;
            const totals = categoryTotals?.[category];
            const activeTotal =
                scope === 'approved' ? totals?.completed ?? loaded : totals?.pending ?? loaded;
            return loaded < activeTotal;
        });
    }, [
        categoryTotals,
        categoryTotalsAreAuthoritative,
        expandedCategories,
        hasNextPage,
        isAllCollapsed,
        loadedCategoryCounts,
        scope,
    ]);

    const loadableExpandedCategories = useMemo(
        () =>
            Array.from(expandedCategories).filter((category) => {
                if (category === 'ALL') return false;
                if (!categoryTotalsAreAuthoritative) return true;
                const loaded = loadedCategoryCounts[category] ?? 0;
                const totals = categoryTotals?.[category];
                const activeTotal =
                    scope === 'approved' ? totals?.completed ?? loaded : totals?.pending ?? loaded;
                return loaded < activeTotal;
            }),
        [categoryTotals, categoryTotalsAreAuthoritative, expandedCategories, loadedCategoryCounts, scope]
    );

    // ─── Infinite scroll sentinel ────────────────────────────
    const paginationRef = useRef({ canLoadMoreForExpandedCategories, isFetchingNextPage, pauseAutoLoad, loadableExpandedCategories, onLoadMore });
    const scrollContextRef = useRef('');
    scrollContextRef.current = `${scope}:${activeCategory ?? ''}:${[...expandedCategories].sort().join(',')}:${pauseAutoLoad}`;
    paginationRef.current = { canLoadMoreForExpandedCategories, isFetchingNextPage, pauseAutoLoad, loadableExpandedCategories, onLoadMore };
    const disconnectPaginationRef = useRef<(() => void) | null>(null);
    const sentinelCallbackRef = useCallback((node: HTMLDivElement | null) => {
        disconnectPaginationRef.current?.();
        disconnectPaginationRef.current = null;
        const container = node?.closest<HTMLDivElement>('[data-task-scroll-container]');
        if (!node || !container) return;
        disconnectPaginationRef.current = bindScrollPagination(container, () => {
            const state = paginationRef.current;
            if (state.canLoadMoreForExpandedCategories && !state.isFetchingNextPage && !state.pauseAutoLoad) {
                state.onLoadMore?.(state.loadableExpandedCategories);
            }
        }, () => scrollContextRef.current);
    }, []);

    return {
        scrollContainerRef,
        expandedCategories,
        isAllCollapsed,
        handleToggleCategory,
        handleScrollToTopAndCollapse,
        handleToggleCollapseAll,
        canLoadMoreForExpandedCategories,
        loadableExpandedCategories,
        sentinelCallbackRef,
    };
}
