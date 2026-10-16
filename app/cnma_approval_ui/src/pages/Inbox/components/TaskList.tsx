/**
 * TaskList — container component for the inbox task list.
 *
 * Decomposed architecture:
 *   - useTaskSelection      (selection state)
 *   - useTaskFilters        (filter state + client-side filtering)
 *   - useTaskListScroll     (category accordion state, centering, and infinite scroll sentinel)
 *   - TaskListHeader        (DesktopHeader, ScopeTabs, MobileHeader)
 *   - TaskListStates        (Skeleton, EmptyState, ListErrorState)
 *   - TaskListFilterDrawer  (Mobile filter drawer)
 *   - MassActionBar         (bulk action UI)
 *   - CategoryAccordionGroup(accordion sections and task cards)
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@cnma/react-ui';
import { MassActionBar } from './MassActionBar';
import type { InboxTask } from '@/services/inbox/inbox.types';
import { RefreshCw, Loader2, ArrowDown, ChevronsUp } from 'lucide-react';
import { CategoryAccordionGroup } from './CategoryAccordionGroup';
import { cn } from '@/lib/utils';
import { FilterBar } from '@/components/filterbar';
import type { ObjectCategory } from '../utils/categoryUtils';
import { useTaskSelection } from '@/pages/Inbox/hooks/useTaskSelection';
import { useTaskFilters } from '@/pages/Inbox/hooks/useTaskFilters';
import { useTaskListScroll } from '@/pages/Inbox/hooks/useTaskListScroll';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useTranslation } from 'react-i18next';
import { DesktopHeader, ScopeTabs, MobileHeader } from './TaskListHeader';
import { ListErrorState, EmptyState, TaskListSkeleton } from './TaskListStates';
import { TaskListFilterDrawer } from './TaskListFilterDrawer';

export interface TaskListProps {
    tasks: InboxTask[];
    selectedTaskId: string | null;
    onSelectTask: (task: InboxTask) => void;
    isLoading: boolean;
    isError?: boolean;
    error?: unknown;
    onRefresh: () => void;
    isRefreshing: boolean;
    totalItems?: number;
    overallTotalItems?: number;
    hasNextPage?: boolean;
    isFetchingNextPage?: boolean;
    onLoadMore?: (categories: ObjectCategory[]) => void;
    onSearchChange?: (search: string) => void;
    showScopeTabs?: boolean;
    myTasksCount?: number;
    approvedTasksCount?: number;
    scope?: 'my' | 'approved';
    onScopeChange?: (scope: 'my' | 'approved') => void;
    onToggleCollapse?: () => void;
    isMobile?: boolean;
    selectionMode?: boolean;
    selectedIds?: Set<string>;
    onSelectionModeChange?: (mode: boolean) => void;
    onSelectedIdsChange?: (ids: Set<string>) => void;
    onMassDecision?: (decisionKey: string, taskIds: string[]) => void;
    isExecutingMass?: boolean;
    showTaskActions?: boolean;
    hasMobileScopeBar?: boolean;
    activeCategory?: ObjectCategory | null;
    onCategoryChange?: (category: ObjectCategory | null) => void;
    onBackToCategories?: () => void;
    categoryTotals?: Record<ObjectCategory, { pending: number; completed: number; total: number }>;
    categoryTotalsAreAuthoritative?: boolean;
}

export function TaskList({
    tasks,
    selectedTaskId,
    onSelectTask,
    isLoading,
    isError = false,
    error,
    onRefresh,
    isRefreshing,
    totalItems = tasks.length,
    overallTotalItems = totalItems,
    hasNextPage = false,
    isFetchingNextPage = false,
    onLoadMore,
    onSearchChange,
    showScopeTabs = false,
    myTasksCount,
    approvedTasksCount,
    scope = 'my',
    onScopeChange,
    onToggleCollapse,
    isMobile = false,
    selectionMode: externalSelectionMode,
    selectedIds: externalSelectedIds,
    onSelectionModeChange,
    onSelectedIdsChange,
    onMassDecision,
    isExecutingMass = false,
    showTaskActions = true,
    activeCategory,
    onCategoryChange,
    onBackToCategories,
    categoryTotals,
    categoryTotalsAreAuthoritative = false,
}: TaskListProps) {
    const { t } = useTranslation();

    const selection = useTaskSelection({
        selectionMode: externalSelectionMode,
        selectedIds: externalSelectedIds,
        onSelectionModeChange,
        onSelectedIdsChange,
    });

    const [isSelectingAllPages, setIsSelectingAllPages] = useState(false);
    const filters = useTaskFilters(tasks, scope, activeCategory);

    const ptr = usePullToRefresh({
        onRefresh,
        isRefreshing,
        disabled: !isMobile,
    });

    const normSelectedId = selectedTaskId ? String(selectedTaskId).replace(/^0+/, '') : '';

    const {
        scrollContainerRef,
        expandedCategories,
        isAllCollapsed,
        handleToggleCategory,
        handleScrollToTopAndCollapse,
        handleToggleCollapseAll,
        canLoadMoreForExpandedCategories,
        loadableExpandedCategories,
        sentinelCallbackRef,
    } = useTaskListScroll({
        tasks,
        selectedTaskId,
        normSelectedId,
        activeCategory,
        hasLocalFilter: filters.hasLocalFilter,
        filteredTasks: filters.filteredTasks,
        hasNextPage,
        isFetchingNextPage,
        onLoadMore,
        categoryTotals,
        categoryTotalsAreAuthoritative,
        scope,
    });

    const handleCardClick = useCallback(
        (task: InboxTask) => {
            if (showTaskActions && selection.selectionMode) {
                setIsSelectingAllPages(false);
                selection.toggleSelection(task.instanceId);
            } else {
                onSelectTask(task);
            }
        },
        [showTaskActions, selection.selectionMode, selection.toggleSelection, onSelectTask]
    );

    const handleExitSelectionMode = useCallback(() => {
        setIsSelectingAllPages(false);
        selection.exitSelectionMode();
    }, [selection]);

    // Reset multi-page select all if selection mode is exited
    useEffect(() => {
        if (!selection.selectionMode) {
            setIsSelectingAllPages(false);
        }
    }, [selection.selectionMode]);

    useEffect(() => {
        onSearchChange?.(String(filters.appliedValues.search || '').trim());
    }, [filters.appliedValues.search, onSearchChange]);

    // Auto-fetch remaining pages only for an explicit Select All action
    useEffect(() => {
        if (!isSelectingAllPages) return;

        const allActionableIds = new Set(
            filters.filteredTasks
                .filter((t) => t.normalTask !== false)
                .map((t) => t.instanceId)
        );
        selection.updateSelectedIds(allActionableIds);

        if (hasNextPage && !isFetchingNextPage && onLoadMore) {
            onLoadMore(['PR', 'PO', 'CLAIM', 'RESERVATION']);
        } else if (!hasNextPage) {
            setIsSelectingAllPages(false);
        }
    }, [isSelectingAllPages, filters.filteredTasks, hasNextPage, isFetchingNextPage, onLoadMore, selection]);

    const actionableFilteredTasks = useMemo(
        () => filters.filteredTasks.filter((t) => t.normalTask !== false),
        [filters.filteredTasks]
    );

    const handleToggleSelectAll = useCallback(() => {
        const allFilteredSelected =
            actionableFilteredTasks.length > 0 &&
            actionableFilteredTasks.every((t) => selection.selectedIds.has(t.instanceId));

        if (allFilteredSelected && (!hasNextPage || isSelectingAllPages)) {
            setIsSelectingAllPages(false);
            selection.updateSelectedIds(new Set<string>());
        } else {
            const allActionableIds = new Set(actionableFilteredTasks.map((t) => t.instanceId));
            selection.updateSelectedIds(allActionableIds);
            if (hasNextPage) {
                setIsSelectingAllPages(true);
                if (!isFetchingNextPage && onLoadMore) {
                    onLoadMore(['PR', 'PO', 'CLAIM', 'RESERVATION']);
                }
            }
        }
    }, [actionableFilteredTasks, selection, hasNextPage, isSelectingAllPages, isFetchingNextPage, onLoadMore]);

    const selectionSummary =
        showTaskActions && selection.selectionMode
            ? isSelectingAllPages && isFetchingNextPage
                ? t('inbox.selectingAllTasks', {
                      count: selection.selectedIds.size,
                      defaultValue: `Selecting all... (${selection.selectedIds.size} loaded)`,
                  })
                : t('inbox.selectedCount', {
                      count: selection.selectedIds.size,
                      defaultValue: `${selection.selectedIds.size} selected`,
                  })
            : filters.hasLocalFilter
              ? t('inbox.filteredSummary', {
                    count: filters.filteredTasks.length,
                    total: tasks.length,
                    defaultValue: `Showing ${filters.filteredTasks.length} of ${tasks.length} tasks`,
                })
              : t('inbox.scopeTotalSummary', {
                    count: totalItems,
                    total: overallTotalItems,
                    defaultValue: `${totalItems} of ${overallTotalItems} tasks`,
                });

    if (isLoading) {
        return <TaskListSkeleton />;
    }

    return (
        <div
            className={cn(
                'flex h-full flex-col bg-background border-r border-border/40',
                isMobile && 'bg-background'
            )}
        >
            {/* ── Desktop Header ── */}
            {!isMobile && (
                <div className="border-b border-border/60">
                    <DesktopHeader
                        totalItems={totalItems}
                        selectionMode={selection.selectionMode}
                        exitSelectionMode={handleExitSelectionMode}
                        enterSelectionMode={() => selection.setSelectionMode(true)}
                        showTaskActions={showTaskActions}
                        onRefresh={onRefresh}
                        isRefreshing={isRefreshing}
                        onToggleCollapse={onToggleCollapse}
                        scope={scope}
                        onToggleCollapseAll={handleToggleCollapseAll}
                        isAllCollapsed={isAllCollapsed}
                    />

                    {showScopeTabs && (
                        <ScopeTabs
                            scope={scope}
                            onScopeChange={onScopeChange}
                            myTasksCount={myTasksCount ?? (scope === 'my' ? totalItems : 0)}
                            approvedTasksCount={
                                approvedTasksCount ?? (scope === 'approved' ? totalItems : 0)
                            }
                        />
                    )}

                    <div className="px-3 pb-3">
                        <FilterBar
                            config={filters.filterConfig}
                            allFilterConfig={filters.allFilterConfig}
                            values={filters.filterValues}
                            onChange={filters.setFilterValues}
                            onApply={filters.handleFilterApply}
                            onClear={filters.handleFilterClear}
                            onAdaptFilter={filters.handleAdaptFilter}
                            isLoading={isRefreshing}
                            defaultExpanded={false}
                        />
                    </div>

                    <div className="px-4 pb-2 text-xs font-medium text-muted-foreground">
                        {selectionSummary}
                    </div>
                </div>
            )}

            {/* ── Mobile Header ── */}
            {isMobile && (
                <MobileHeader
                    totalItems={totalItems}
                    showScopeTabs={showScopeTabs}
                    scope={scope}
                    onScopeChange={onScopeChange}
                    myTasksCount={myTasksCount ?? (scope === 'my' ? totalItems : 0)}
                    approvedTasksCount={
                        approvedTasksCount ?? (scope === 'approved' ? totalItems : 0)
                    }
                    filterValues={filters.filterValues}
                    setFilterValues={filters.setFilterValues}
                    selectionSummary={selectionSummary}
                    onRefresh={onRefresh}
                    isRefreshing={isRefreshing}
                    mobileActiveFilterCount={filters.mobileActiveFilterCount}
                    onOpenFilters={() => filters.setMobileFiltersOpen(true)}
                    selectionMode={selection.selectionMode}
                    exitSelectionMode={handleExitSelectionMode}
                    enterSelectionMode={() => selection.setSelectionMode(true)}
                    showTaskActions={showTaskActions}
                    activeCategory={activeCategory}
                    onCategoryChange={onCategoryChange}
                    onBackToCategories={onBackToCategories}
                    categoryCounts={filters.categoryCounts}
                />
            )}

            {/* ── Desktop Select All ── */}
            {showTaskActions && selection.selectionMode && filters.filteredTasks.length > 0 && !isMobile && (
                <MassActionBar
                    selectedCount={selection.selectedIds.size}
                    totalCount={filters.filteredTasks.length}
                    onToggleSelectAll={handleToggleSelectAll}
                    onMassDecision={onMassDecision}
                    selectedIds={selection.selectedIds}
                    isExecuting={isExecutingMass}
                    isMobile={false}
                />
            )}

            {/* ── Task Results ── */}
            <div
                ref={(node) => {
                    scrollContainerRef.current = node;
                    ptr.containerRef(node);
                }}
                className="flex-1 min-h-0 overflow-y-auto bg-background"
            >
                {/* ── Mobile Pull-to-Refresh Indicator ── */}
                {isMobile && (ptr.pullDistance > 0 || ptr.isRefreshing) && (
                    <div
                        className="flex items-center justify-center overflow-hidden transition-all duration-150 py-1"
                        style={{
                            height: ptr.isRefreshing ? 48 : Math.min(ptr.pullDistance, 60),
                            opacity: ptr.isRefreshing ? 1 : Math.min(ptr.pullDistance / 40, 1),
                        }}
                    >
                        <div className="flex items-center gap-2 rounded-full bg-card px-3.5 py-1 text-xs font-semibold text-primary shadow-sm border border-border">
                            {ptr.isRefreshing ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin text-primary" />
                                    <span>{t('common.refreshing', 'Refreshing...')}</span>
                                </>
                            ) : ptr.isThresholdReached ? (
                                <>
                                    <RefreshCw className="size-3.5 text-primary animate-bounce" />
                                    <span>{t('common.releaseToRefresh', 'Release to refresh')}</span>
                                </>
                            ) : (
                                <>
                                    <ArrowDown
                                        className="size-3.5 text-primary transition-transform duration-200"
                                        style={{ transform: `rotate(${Math.min(ptr.pullDistance * 3, 180)}deg)` }}
                                    />
                                    <span>{t('common.pullToRefresh', 'Pull down to refresh')}</span>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {isError && tasks.length === 0 ? (
                    <ListErrorState error={error} onRefresh={onRefresh} isRefreshing={isRefreshing} />
                ) : filters.filteredTasks.length === 0 ? (
                    <EmptyState
                        hasSearch={!!filters.appliedValues.search?.trim()}
                        hasFilters={filters.hasLocalFilter}
                        hasNextPage={hasNextPage}
                        isFetchingNextPage={isFetchingNextPage}
                        onLoadMore={() => onLoadMore?.(loadableExpandedCategories)}
                    />
                ) : (
                    <div className={cn('p-2.5 space-y-3', isMobile && 'px-3.5 pb-28 pt-2')}>
                        <CategoryAccordionGroup
                            tasks={filters.filteredTasks}
                            selectedTaskId={selectedTaskId}
                            normSelectedId={normSelectedId}
                            onSelectTask={onSelectTask}
                            handleCardClick={handleCardClick}
                            isMobile={isMobile}
                            scope={scope}
                            showTaskActions={showTaskActions}
                            selectionMode={selection.selectionMode}
                            selectedIds={selection.selectedIds}
                            onToggleSelection={(id) => {
                                setIsSelectingAllPages(false);
                                selection.toggleSelection(id);
                            }}
                            expandedCategories={expandedCategories}
                            onToggleCategory={handleToggleCategory}
                            categoryTotals={categoryTotals}
                        />

                        {/* ── Infinite Scroll Sentinel ── */}
                        <div ref={sentinelCallbackRef} className="h-2" />
                        {isFetchingNextPage && canLoadMoreForExpandedCategories && (
                            <div className="flex items-center justify-center py-4 gap-2">
                                <Loader2 className="size-4 animate-spin text-primary" />
                                <span className="text-xs text-muted-foreground">
                                    {t('common.loadingMore', 'Loading more...')}
                                </span>
                            </div>
                        )}
                        {!hasNextPage && tasks.length > 0 && !isFetchingNextPage && (
                            <p className="text-center text-xs text-muted-foreground py-3">
                                {t('inbox.allTasksLoaded', 'All tasks loaded')}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* ── Mobile Mass Action Bar ── */}
            {showTaskActions && selection.selectionMode && isMobile && filters.filteredTasks.length > 0 && (
                <MassActionBar
                    selectedCount={selection.selectedIds.size}
                    totalCount={filters.filteredTasks.length}
                    onToggleSelectAll={handleToggleSelectAll}
                    onMassDecision={onMassDecision}
                    selectedIds={selection.selectedIds}
                    isExecuting={isExecutingMass}
                    isMobile={true}
                />
            )}

            {/* ── Floating Action Button (Mobile only): Scroll to Top & Collapse All ── */}
            {isMobile && (
                <div
                    className={cn(
                        'pointer-events-none transition-all duration-300 z-40 fixed right-4',
                        showTaskActions && selection.selectionMode && selection.selectedIds.size > 0
                            ? 'bottom-28'
                            : 'bottom-20'
                    )}
                >
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleScrollToTopAndCollapse}
                        className={cn(
                            'pointer-events-auto size-11 sm:size-12 rounded-full shadow-lg border border-border/80 bg-card/95 hover:bg-card text-foreground backdrop-blur-md active:scale-95 transition-all group cursor-pointer',
                            'hover:shadow-xl hover:border-primary/50'
                        )}
                        title={t('inbox.scrollToTopAndCollapse', 'Scroll to top & Collapse all')}
                    >
                        <ChevronsUp className="size-5.5 text-primary group-hover:-translate-y-0.5 transition-transform" />
                    </Button>
                </div>
            )}

            {/* ── Mobile Filter Drawer ── */}
            <TaskListFilterDrawer
                open={filters.mobileFiltersOpen}
                onOpenChange={filters.setMobileFiltersOpen}
                filters={filters}
                isRefreshing={isRefreshing}
            />
        </div>
    );
}
