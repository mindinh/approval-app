/**
 * TaskList — container component for the inbox task list.
 *
 * Phase 3 decomposition: this file now delegates to:
 *   - useTaskSelection (selection state)
 *   - useTaskFilters   (filter state + client-side filtering)
 *   - MassActionBar    (bulk action UI)
 *   - TaskCard         (individual task rendering)
 *
 * Uses infinite scroll (IntersectionObserver) instead of pagination.
 */
import { useRef, useEffect, useCallback } from 'react';
import { Skeleton, Button, Tabs, TabsList, TabsTrigger, Checkbox, Input, Drawer, DrawerContent } from '@cnma/react-ui';
import { TaskCard } from './TaskCard';
import { MassActionBar } from './MassActionBar';
import type { InboxTask } from '@/services/inbox/inbox.types';
import {
    Inbox,
    RefreshCw,
    ListChecks,
    X,
    PanelLeftClose,
    Filter,
    Search,
    Loader2,
    AlertTriangle,
    ArrowDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FilterBar } from '@/components/filterbar';
import { useTaskSelection } from '@/pages/Inbox/hooks/useTaskSelection';
import { useTaskFilters } from '@/pages/Inbox/hooks/useTaskFilters';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useTranslation } from 'react-i18next';
import { parseError } from '@/utils/parseError';


interface TaskListProps {
    tasks: InboxTask[];
    selectedTaskId: string | null;
    onSelectTask: (task: InboxTask) => void;
    isLoading: boolean;
    isError?: boolean;
    error?: unknown;
    onRefresh: () => void;
    isRefreshing: boolean;
    totalItems?: number;
    // Infinite scroll
    hasNextPage?: boolean;
    isFetchingNextPage?: boolean;
    onLoadMore?: () => void;
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
    onMassDecision?: (decisionKey: string, comment: string, taskIds: string[]) => void;
    isExecutingMass?: boolean;
    showTaskActions?: boolean;
    hasMobileScopeBar?: boolean;
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
    hasNextPage = false,
    isFetchingNextPage = false,
    onLoadMore,
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
    hasMobileScopeBar = false,
}: TaskListProps) {
    // ─── Hooks ─────────────────────────────────────────────
    const selection = useTaskSelection({
        selectionMode: externalSelectionMode,
        selectedIds: externalSelectedIds,
        onSelectionModeChange,
        onSelectedIdsChange,
    });

    const filters = useTaskFilters(tasks);

    const ptr = usePullToRefresh({
        onRefresh,
        isRefreshing,
        disabled: !isMobile,
    });

    const handleCardClick = useCallback((task: InboxTask) => {
        if (showTaskActions && selection.selectionMode) {
            selection.toggleSelection(task.instanceId);
        } else {
            onSelectTask(task);
        }
    }, [showTaskActions, selection.selectionMode, selection.toggleSelection, onSelectTask]);

    // ─── Infinite scroll sentinel (Callback Ref for clean unmount/remount) ─
    const observerRef = useRef<IntersectionObserver | null>(null);

    const sentinelCallbackRef = useCallback(
        (node: HTMLDivElement | null) => {
            if (observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null;
            }

            if (!node || !onLoadMore) return;

            const container = ptr.containerRef.current;
            const observer = new IntersectionObserver(
                (entries) => {
                    if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                        onLoadMore();
                    }
                },
                {
                    root: container || null,
                    rootMargin: '100px',
                    threshold: 0,
                }
            );
            observer.observe(node);
            observerRef.current = observer;
        },
        [hasNextPage, isFetchingNextPage, onLoadMore, ptr.containerRef]
    );

    // ─── Auto-fetch next page when filtering and local results are empty ────────
    useEffect(() => {
        if (
            filters.hasLocalFilter &&
            filters.filteredTasks.length === 0 &&
            hasNextPage &&
            !isFetchingNextPage &&
            onLoadMore
        ) {
            onLoadMore();
        }
    }, [filters.hasLocalFilter, filters.filteredTasks.length, hasNextPage, isFetchingNextPage, onLoadMore]);

    // ─── Derived state ─────────────────────────────────────
    const { t } = useTranslation();

    const selectionSummary = showTaskActions && selection.selectionMode
        ? t('inbox.selectedCount', { count: selection.selectedIds.size, defaultValue: `${selection.selectedIds.size} selected` })
        : filters.hasLocalFilter
            ? t('inbox.filteredSummary', { count: filters.filteredTasks.length, total: tasks.length, defaultValue: `Showing ${filters.filteredTasks.length} of ${tasks.length} on this page` })
            : t('inbox.loadedSummary', { loaded: tasks.length, total: totalItems, defaultValue: `${tasks.length} of ${totalItems} tasks` });

    // ─── Loading skeleton ──────────────────────────────────
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
                        exitSelectionMode={selection.exitSelectionMode}
                        enterSelectionMode={() => selection.setSelectionMode(true)}
                        showTaskActions={showTaskActions}
                        onRefresh={onRefresh}
                        isRefreshing={isRefreshing}
                        onToggleCollapse={onToggleCollapse}
                        scope={scope}
                    />

                    {showScopeTabs && (
                        <ScopeTabs
                            scope={scope}
                            onScopeChange={onScopeChange}
                            myTasksCount={myTasksCount ?? (scope === 'my' ? totalItems : 0)}
                            approvedTasksCount={approvedTasksCount ?? (scope === 'approved' ? totalItems : 0)}
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
                    approvedTasksCount={approvedTasksCount ?? (scope === 'approved' ? totalItems : 0)}
                    filterValues={filters.filterValues}
                    setFilterValues={filters.setFilterValues}
                    handleFilterApply={filters.handleFilterApply}
                    selectionSummary={selectionSummary}
                    onRefresh={onRefresh}
                    isRefreshing={isRefreshing}
                    mobileActiveFilterCount={filters.mobileActiveFilterCount}
                    onOpenFilters={() => filters.setMobileFiltersOpen(true)}
                    selectionMode={selection.selectionMode}
                    exitSelectionMode={selection.exitSelectionMode}
                    enterSelectionMode={() => selection.setSelectionMode(true)}
                    showTaskActions={showTaskActions}
                />
            )}

            {/* ── Desktop Select All ── */}
            {showTaskActions && selection.selectionMode && filters.filteredTasks.length > 0 && !isMobile && (
                <MassActionBar
                    selectedCount={selection.selectedIds.size}
                    totalCount={filters.filteredTasks.length}
                    onToggleSelectAll={() => selection.toggleSelectAll(filters.filteredTasks)}
                    onMassDecision={onMassDecision}
                    selectedIds={selection.selectedIds}
                    isExecuting={isExecutingMass}
                    isMobile={false}
                />
            )}

            {/* ── Task Results — native scroll so the scrollbar gutter sits OUTSIDE cards ── */}
            <div
                ref={ptr.containerRef}
                {...(isMobile ? ptr.touchHandlers : {})}
                className={cn(
                    'flex-1 min-h-0 overflow-y-auto overscroll-y-contain touch-pan-y',
                    isMobile && 'will-change-scroll [webkit-overflow-scrolling:touch]'
                )}
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
                        onLoadMore={onLoadMore}
                    />
                ) : (
                    <div
                        className={cn(
                            'space-y-2 p-2.5',
                            isMobile && 'space-y-3 px-4 pb-24 pt-1'
                        )}
                    >
                        {filters.filteredTasks.map((task) => (
                            <div key={task.instanceId} className="flex items-start gap-2">
                                {showTaskActions && selection.selectionMode && (
                                    <div className={cn('shrink-0 pl-1', isMobile ? 'pt-4' : 'pt-3')}>
                                        <Checkbox
                                            checked={selection.selectedIds.has(task.instanceId)}
                                            onCheckedChange={() => selection.toggleSelection(task.instanceId)}
                                        />
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <TaskCard
                                        task={task}
                                        isSelected={task.instanceId === selectedTaskId}
                                        onClick={handleCardClick}
                                        variant={isMobile ? 'mobile' : 'desktop'}
                                    />
                                </div>
                            </div>
                        ))}

                        {/* ── Infinite Scroll Sentinel ── */}
                        <div ref={sentinelCallbackRef} className="h-4" />
                        {isFetchingNextPage && (
                            <div className="flex items-center justify-center py-4 gap-2">
                                <Loader2 className="size-4 animate-spin text-primary" />
                                <span className="text-xs text-muted-foreground">{t('common.loadingMore', 'Loading more...')}</span>
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
                    onToggleSelectAll={() => selection.toggleSelectAll(filters.filteredTasks)}
                    onMassDecision={onMassDecision}
                    selectedIds={selection.selectedIds}
                    isExecuting={isExecutingMass}
                    isMobile={true}
                />
            )}

            {/* ── Mobile Filter Drawer ── */}
            <Drawer
                open={filters.mobileFiltersOpen}
                onOpenChange={filters.setMobileFiltersOpen}
                direction="bottom"
            >
                <DrawerContent className="h-[100dvh] rounded-none border-none p-0">
                    <FilterBar
                        isMobile={true}
                        config={filters.filterConfig}
                        allFilterConfig={filters.allFilterConfig}
                        values={filters.filterValues}
                        onChange={filters.setFilterValues}
                        onApply={(v) => {
                            filters.handleFilterApply(v);
                            filters.setMobileFiltersOpen(false);
                        }}
                        onClear={filters.handleFilterClear}
                        onAdaptFilter={filters.handleAdaptFilter}
                        isLoading={isRefreshing}
                    />
                </DrawerContent>
            </Drawer>
        </div>
    );
}

// ─── Sub-components ────────────────────────────────────────

function DesktopHeader({
    totalItems,
    selectionMode,
    exitSelectionMode,
    enterSelectionMode,
    showTaskActions,
    onRefresh,
    isRefreshing,
    onToggleCollapse,
    scope,
}: {
    totalItems: number;
    selectionMode: boolean;
    exitSelectionMode: () => void;
    enterSelectionMode: () => void;
    showTaskActions: boolean;
    onRefresh: () => void;
    isRefreshing: boolean;
    onToggleCollapse?: () => void;
    scope?: 'my' | 'approved';
}) {
    const { t } = useTranslation();
    const title = scope === 'approved'
        ? t('nav.approvedTasks', 'Approved Tasks')
        : t('nav.myTasks', 'My Tasks');
    return (
        <div className="flex items-center justify-between px-3 py-3">
            <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">{title}</h2>
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                    {totalItems}
                </span>
            </div>
            <div className="flex items-center gap-0.5">
                {showTaskActions && (
                    <Button
                        variant={selectionMode ? 'secondary' : 'ghost'}
                        size="icon"
                        onClick={() => (selectionMode ? exitSelectionMode() : enterSelectionMode())}
                        className="h-8 w-8 rounded-lg hover:bg-muted"
                        title={selectionMode ? t('common.cancel', 'Exit selection') : t('inbox.select', 'Select tasks')}
                    >
                        {selectionMode ? <X className="size-4" /> : <ListChecks className="size-4" />}
                    </Button>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRefresh?.()}
                    disabled={isRefreshing}
                    className="h-8 w-8 rounded-lg hover:bg-muted"
                    title={t('common.refresh', 'Refresh')}
                >
                    <RefreshCw className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
                {onToggleCollapse && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleCollapse}
                        className="h-8 w-8 rounded-lg hover:bg-muted"
                        title={t('nav.collapseSidebar', 'Collapse sidebar')}
                    >
                        <PanelLeftClose className="size-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}

function ScopeTabs({
    scope,
    onScopeChange,
    myTasksCount,
    approvedTasksCount,
}: {
    scope: 'my' | 'approved';
    onScopeChange?: (scope: 'my' | 'approved') => void;
    myTasksCount: number;
    approvedTasksCount: number;
}) {
    const { t } = useTranslation();
    return (
        <div className="px-0 pb-3">
            <Tabs
                value={scope}
                onValueChange={(next) => onScopeChange?.(next as 'my' | 'approved')}
                className="gap-0"
            >
                <TabsList className="h-auto w-full justify-start border-b border-border/60 bg-transparent px-3 py-0 gap-1 rounded-none shadow-none">
                    <TabsTrigger
                        value="my"
                        className={cn(
                            'h-10 min-w-24 rounded-none border-b-2 border-transparent px-3 text-sm text-muted-foreground',
                            'hover:bg-muted/30 hover:text-foreground',
                            'data-[state=active]:border-b-primary data-[state=active]:text-primary data-[state=active]:font-medium',
                            'data-[state=active]:bg-transparent data-[state=active]:shadow-none'
                        )}
                    >
                        {t('nav.myTasks', 'My Tasks')}
                        <span className="ml-1.5 flex h-4.5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold bg-muted text-muted-foreground data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                            {myTasksCount}
                        </span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="approved"
                        className={cn(
                            'h-10 min-w-24 rounded-none border-b-2 border-transparent px-3 text-sm text-muted-foreground',
                            'hover:bg-muted/30 hover:text-foreground',
                            'data-[state=active]:border-b-primary data-[state=active]:text-primary data-[state=active]:font-medium',
                            'data-[state=active]:bg-transparent data-[state=active]:shadow-none'
                        )}
                    >
                        {t('nav.approvedTasks', 'Approved Tasks')}
                        <span className="ml-1.5 flex h-4.5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold bg-muted text-muted-foreground data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                            {approvedTasksCount}
                        </span>
                    </TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
    );
}

function MobileHeader({
    totalItems,
    showScopeTabs,
    scope,
    onScopeChange,
    myTasksCount,
    approvedTasksCount,
    filterValues,
    setFilterValues,
    handleFilterApply,
    selectionSummary,
    onRefresh,
    isRefreshing,
    mobileActiveFilterCount,
    onOpenFilters,
    selectionMode,
    exitSelectionMode,
    enterSelectionMode,
    showTaskActions,
}: {
    totalItems: number;
    showScopeTabs: boolean;
    scope: 'my' | 'approved';
    onScopeChange?: (scope: 'my' | 'approved') => void;
    myTasksCount: number;
    approvedTasksCount: number;
    filterValues: any;
    setFilterValues: (fn: any) => void;
    handleFilterApply: (v: any) => void;
    selectionSummary: string;
    onRefresh: () => void;
    isRefreshing: boolean;
    mobileActiveFilterCount: number;
    onOpenFilters: () => void;
    selectionMode: boolean;
    exitSelectionMode: () => void;
    enterSelectionMode: () => void;
    showTaskActions: boolean;
}) {
    const { t } = useTranslation();
    return (
        <div className="border-b-0 bg-transparent backdrop-blur-none">
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-foreground">{t('dashboard.charts.allTasks', 'All Tasks')}</h2>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
                        {totalItems}
                    </span>
                </div>
            </div>

            <div className="space-y-3 px-4 pb-4">
                {showScopeTabs && (
                    <Tabs
                        value={scope}
                        onValueChange={(next) => onScopeChange?.(next as 'my' | 'approved')}
                        className="gap-0 -mx-4 px-4 overflow-x-auto no-scrollbar border-b border-border/60"
                    >
                        <TabsList className="h-auto w-max justify-start bg-transparent p-0 gap-1 rounded-none shadow-none">
                            <TabsTrigger
                                value="my"
                                className={cn(
                                    'h-10 min-w-24 rounded-none border-b-2 border-transparent px-3 text-sm text-muted-foreground',
                                    'data-[state=active]:border-b-primary data-[state=active]:text-primary data-[state=active]:font-medium',
                                    'data-[state=active]:bg-transparent data-[state=active]:shadow-none'
                                )}
                            >
                                {t('nav.myTasks', 'My Tasks')}
                                <span className="ml-1.5 flex h-4.5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold bg-muted text-muted-foreground data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                                    {myTasksCount}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="approved"
                                className={cn(
                                    'h-10 min-w-24 rounded-none border-b-2 border-transparent px-3 text-sm text-muted-foreground',
                                    'data-[state=active]:border-b-primary data-[state=active]:text-primary data-[state=active]:font-medium',
                                    'data-[state=active]:bg-transparent data-[state=active]:shadow-none'
                                )}
                            >
                                {t('nav.approvedTasks', 'Approved Tasks')}
                                <span className="ml-1.5 flex h-4.5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold bg-muted text-muted-foreground data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                                    {approvedTasksCount}
                                </span>
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                )}

                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        id="inbox-search"
                        placeholder={t('inbox.searchTasks', 'Search tasks...')}
                        value={filterValues.search || ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            setFilterValues((prev: any) => ({ ...prev, search: val }));
                            handleFilterApply({ ...filterValues, search: val });
                        }}
                        className="rounded-xl border-border bg-card pl-8 text-sm shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] h-11"
                    />
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="text-xs font-medium text-muted-foreground">
                            {selectionSummary}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onRefresh?.()}
                            disabled={isRefreshing}
                            className="h-9 w-9 rounded-xl border border-border bg-card text-muted-foreground shadow-sm hover:bg-muted/30"
                        >
                            <RefreshCw className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={onOpenFilters}
                            disabled={showTaskActions && selectionMode}
                            className="h-10 rounded-xl border-border bg-card px-3 text-sm font-medium text-muted-foreground shadow-sm"
                        >
                            <Filter className="mr-2 size-4" />
                            {t('common.filter', 'Filter')}
                            {mobileActiveFilterCount > 0 && (
                                <span className="ml-2 rounded-full bg-primary px-1.5 py-0 text-xs font-semibold text-white">
                                    {mobileActiveFilterCount}
                                </span>
                            )}
                        </Button>
                        {showTaskActions && (
                            <Button
                                variant="outline"
                                onClick={() => (selectionMode ? exitSelectionMode() : enterSelectionMode())}
                                className={cn(
                                    'h-10 rounded-xl border bg-card px-3 text-sm font-medium shadow-sm',
                                    selectionMode
                                        ? 'border-destructive/30 text-destructive hover:bg-error-bg'
                                        : 'border-border text-muted-foreground hover:bg-muted/30'
                                )}
                            >
                                {selectionMode ? (
                                    <>
                                        <X className="mr-2 size-4" />
                                        {t('common.cancel', 'Cancel')}
                                    </>
                                ) : (
                                    <>
                                        <ListChecks className="mr-2 size-4" />
                                        {t('inbox.select', 'Select')}
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ListErrorState({
    error,
    onRefresh,
    isRefreshing,
}: {
    error: unknown;
    onRefresh: () => void;
    isRefreshing: boolean;
}) {
    const { t } = useTranslation();
    const parsed = parseError(error);

    return (
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center space-y-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="size-6" />
            </div>
            <h3 className="text-sm font-bold text-foreground">{parsed.title}</h3>
            <p className="max-w-60 text-xs text-muted-foreground leading-relaxed">
                {parsed.message}
            </p>
            <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="gap-1.5 text-xs mt-1"
            >
                <RefreshCw className={cn('size-3.5', isRefreshing && 'animate-spin')} />
                <span>{t('common.retry', 'Retry')}</span>
            </Button>
        </div>
    );
}

function EmptyState({
    hasSearch,
    hasFilters,
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
}: {
    hasSearch: boolean;
    hasFilters: boolean;
    hasNextPage?: boolean;
    isFetchingNextPage?: boolean;
    onLoadMore?: () => void;
}) {
    const { t } = useTranslation();
    const message = hasSearch || hasFilters ? t('inbox.noMatchingTasks', 'No matching tasks') : t('inbox.inboxEmpty', 'Inbox is empty');
    const sub = hasSearch || hasFilters
        ? isFetchingNextPage
            ? t('inbox.searchingServerTasks', 'Searching remaining tasks on server...')
            : t('inbox.tryAdjusting', 'Try adjusting your search or filter criteria.')
        : t('inbox.noPendingTasks', 'No pending tasks assigned to you.');

    return (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center space-y-3">
            <div className="mb-1 rounded-full bg-muted p-4">
                {isFetchingNextPage ? (
                    <Loader2 className="size-8 animate-spin text-primary" />
                ) : (
                    <Inbox className="size-8 text-muted-foreground" />
                )}
            </div>
            <h3 className="text-sm font-medium text-foreground">{message}</h3>
            <p className="max-w-56 text-xs text-muted-foreground">{sub}</p>

            {hasNextPage && (hasSearch || hasFilters) && onLoadMore && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onLoadMore}
                    disabled={isFetchingNextPage}
                    className="mt-2 text-xs gap-1.5 rounded-lg"
                >
                    {isFetchingNextPage ? (
                        <>
                            <Loader2 className="size-3.5 animate-spin text-primary" />
                            <span>{t('inbox.searchingServer', 'Searching server...')}</span>
                        </>
                    ) : (
                        <span>{t('inbox.loadMoreToSearch', 'Load more tasks to search')}</span>
                    )}
                </Button>
            )}
        </div>
    );
}

function TaskListSkeleton() {
    return (
        <div className="flex h-full flex-col">
            <div className="space-y-3 border-b border-border/50 p-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>
            <div className="flex-1 p-0">
                {Array.from({ length: 6 }).map((_, index) => (
                    <div
                        key={index}
                        className="mx-3 my-2 space-y-2 rounded-xl border border-border/50 bg-card/95 p-4"
                    >
                        <Skeleton className="h-4 w-3/4" />
                        <div className="flex gap-1.5">
                            <Skeleton className="h-4 w-14 rounded-md" />
                            <Skeleton className="h-4 w-12 rounded-md" />
                        </div>
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                ))}
            </div>
        </div>
    );
}
