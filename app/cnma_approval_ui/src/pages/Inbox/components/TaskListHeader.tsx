import { useTranslation } from 'react-i18next';
import { Button, Tabs, TabsList, TabsTrigger, Input } from '@cnma/react-ui';
import {
    RefreshCw,
    ListChecks,
    X,
    PanelLeftClose,
    Filter,
    Search,
    ChevronsDownUp,
    ChevronsUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ObjectCategory } from '../utils/categoryUtils';

export function DesktopHeader({
    totalItems,
    selectionMode,
    exitSelectionMode,
    enterSelectionMode,
    showTaskActions,
    onRefresh,
    isRefreshing,
    onToggleCollapse,
    scope,
    onToggleCollapseAll,
    isAllCollapsed,
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
    onToggleCollapseAll?: () => void;
    isAllCollapsed?: boolean;
}) {
    const { t } = useTranslation();
    const title =
        scope === 'approved'
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
                        title={
                            selectionMode
                                ? t('common.cancel', 'Exit selection')
                                : t('inbox.select', 'Select tasks')
                        }
                    >
                        {selectionMode ? <X className="size-4" /> : <ListChecks className="size-4" />}
                    </Button>
                )}
                {onToggleCollapseAll && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleCollapseAll}
                        className="h-8 w-8 rounded-lg hover:bg-muted"
                        title={
                            isAllCollapsed
                                ? t('inbox.expandAll', 'Expand all')
                                : t('inbox.collapseAll', 'Collapse all')
                        }
                    >
                        {isAllCollapsed ? (
                            <ChevronsUpDown className="size-4" />
                        ) : (
                            <ChevronsDownUp className="size-4" />
                        )}
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

export function ScopeTabs({
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

export function MobileHeader({
    showScopeTabs,
    scope,
    onScopeChange,
    myTasksCount,
    approvedTasksCount,
    filterValues,
    setFilterValues,
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
    selectionSummary: string;
    onRefresh: () => void;
    isRefreshing: boolean;
    mobileActiveFilterCount: number;
    onOpenFilters: () => void;
    selectionMode: boolean;
    exitSelectionMode: () => void;
    enterSelectionMode: () => void;
    showTaskActions: boolean;
    activeCategory?: ObjectCategory | null;
    onCategoryChange?: (category: ObjectCategory | null) => void;
    onBackToCategories?: () => void;
    categoryCounts?: Record<ObjectCategory, number>;
}) {
    const { t } = useTranslation();

    return (
        <div className="border-b-0 bg-transparent backdrop-blur-none">
            <div className="space-y-3 px-4 pt-3 pb-4">
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
                        placeholder={t('inbox.searchTasks', 'Search by title...')}
                        value={filterValues.search || ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            setFilterValues((prev: any) => ({ ...prev, search: val }));
                        }}
                        className="rounded-xl border-border bg-card pl-8 text-sm shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] h-11"
                    />
                </div>

                <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-medium text-muted-foreground truncate min-w-0 flex-1">
                        {selectionSummary}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                            variant="outline"
                            onClick={onOpenFilters}
                            disabled={showTaskActions && selectionMode}
                            className="h-8 rounded-lg border-border bg-card px-2.5 text-xs font-medium text-muted-foreground shadow-2xs hover:bg-muted/30"
                        >
                            <Filter className="mr-1.5 size-3.5" />
                            {t('common.filter', 'Filter')}
                            {mobileActiveFilterCount > 0 && (
                                <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0 text-[10px] font-semibold text-white">
                                    {mobileActiveFilterCount}
                                </span>
                            )}
                        </Button>
                        {showTaskActions && (
                            <Button
                                variant="outline"
                                onClick={() => (selectionMode ? exitSelectionMode() : enterSelectionMode())}
                                className={cn(
                                    'h-8 rounded-lg border bg-card px-2.5 text-xs font-medium shadow-2xs',
                                    selectionMode
                                        ? 'border-destructive/30 text-destructive hover:bg-error-bg'
                                        : 'border-border text-muted-foreground hover:bg-muted/30'
                                )}
                            >
                                {selectionMode ? (
                                    <>
                                        <X className="mr-1.5 size-3.5" />
                                        {t('common.cancel', 'Cancel')}
                                    </>
                                ) : (
                                    <>
                                        <ListChecks className="mr-1.5 size-3.5" />
                                        {t('inbox.select', 'Select')}
                                    </>
                                )}
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onRefresh?.()}
                            disabled={isRefreshing}
                            className="h-8 w-8 rounded-lg border border-border bg-card text-muted-foreground shadow-2xs hover:bg-muted/30"
                            title={t('common.refresh', 'Refresh')}
                        >
                            <RefreshCw className={cn('size-3.5', isRefreshing && 'animate-spin')} />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
