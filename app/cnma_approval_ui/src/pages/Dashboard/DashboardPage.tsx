import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useIsMobile, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@cnma/react-ui';
import { MobileTopBar } from '@/components/layouts/MobileTopBar';
import {
    ListFilter,
    X,
    Loader2,
    AlertCircle,
    RefreshCw,
} from 'lucide-react';

import { useDashboardQuery, useDashboardData, STATUS_COLORS, CATEGORY_COLORS } from './use-dashboard-data';
import type { CategoryType } from './use-dashboard-data';
import { CategoryOverviewCards } from './components/CategoryOverviewCards';
import { StatusDonutCard } from './components/StatusDonutCard';
import { StatusBadge } from '@/pages/Inbox/components/TaskBadges';
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton';
import type { FilterValues } from '@/components/filterbar/types';
import { cn } from '@/lib/utils';

/** Theme-token classes for the active-category filter pill, matching CATEGORY_COLORS. */
const CATEGORY_PILL_CLASS: Record<CategoryType, string> = {
    PR: 'bg-marketing-negative-bg text-primary border-primary',
    PO: 'bg-info-bg text-info border-info',
    RESV: 'bg-warning-bg text-warning border-warning',
    CLAIM: 'bg-success-bg text-success border-success',
    OTHER: 'bg-muted text-muted-foreground border-border',
};

// ═══════════════════════════════════════════════════════════
// Refetch Overlay — shown over each chart card while refreshing
// ═══════════════════════════════════════════════════════════
function RefetchOverlay() {
    return (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl backdrop-blur-xs transition-opacity duration-300 bg-white/55">
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="animate-spin text-primary" size={24} />
            </div>
        </div>
    );
}



// ═══════════════════════════════════════════════════════════
// Dashboard Page Component
// ═══════════════════════════════════════════════════════════
export default function DashboardPage() {
    const { t } = useTranslation();
    const isMobile = useIsMobile();

    // ── Filter & View States ──
    const [appliedFilters, setAppliedFilters] = useState<FilterValues>(() => ({
        status: [],
        documentType: '',
        category: '',
    }));
    const [tablePage, setTablePage] = useState(1);
    const [isManualRefresh, setIsManualRefresh] = useState(false);
    const tablePageSize = 50;
    // Fetch master tasks data
    const { data: dashboardData, isLoading, isError, refetch, isRefetching } = useDashboardQuery({
        top: tablePageSize,
        skip: (tablePage - 1) * tablePageSize,
        category: appliedFilters.category || undefined,
        documentType: appliedFilters.documentType || undefined,
        status: appliedFilters.status?.[0],
    });
    const tasks = dashboardData?.items ?? [];

    const handleManualRefresh = useCallback(async () => {
        setIsManualRefresh(true);
        try {
            await refetch();
        } finally {
            setIsManualRefresh(false);
        }
    }, [refetch]);

    // Derives filtered sets, KPI numbers, and charts data
    const {
        donutSegments,
        typesData,
        categoryCounts,
        pendingCounts,
        completedCounts,
        documentTypeOptions,
        tableRows,
        kpiMetrics,
        isTruncated,
    } = useDashboardData(tasks, appliedFilters, dashboardData?.statusCounts, dashboardData?.docTypeCounts);

    const tableTotal = dashboardData?.total ?? tableRows.length;
    const tablePageCount = Math.max(1, Math.ceil(tableTotal / tablePageSize));
    const currentTablePage = Math.min(tablePage, tablePageCount);
    const paginatedTableRows = tableRows;

    // ── Handlers ─────────────────────────────────────────
    const handleFilterClear = useCallback(() => {
        setTablePage(1);
        setAppliedFilters({
            status: [],
            documentType: '',
            category: '',
            });
    }, []);

    const handleCategorySelect = useCallback((category: CategoryType | '') => {
        setTablePage(1);
        setAppliedFilters((prev) => ({ ...prev, category }));
    }, []);

    const handleTypeSelect = useCallback((documentType: string) => {
        setTablePage(1);
        setAppliedFilters((prev) => ({ ...prev, documentType }));
    }, []);


    // Status is a single choice: the donut reports one slice at a time, and picking
    // both statuses would be indistinguishable from picking none.
    const handleStatusSelect = useCallback((status: string | null) => {
        setTablePage(1);
        setAppliedFilters((prev) => ({ ...prev, status: status ? [status] : [] }));
    }, []);

    const clearAllFilters = useCallback(() => {
        handleFilterClear();
    }, [handleFilterClear]);


    const hasFilters = useMemo(() => {
        return (
            (Array.isArray(appliedFilters.status) && appliedFilters.status.length > 0) ||
            !!appliedFilters.documentType ||
            !!appliedFilters.category
        );
    }, [appliedFilters]);

    // ── Dashboard content ──
    const dashboardContent = (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Mobile App Header */}
            {isMobile && <MobileTopBar title={t('nav.dashboard', 'Dashboard')} />}

            {/* ── Header ─────────────────────────────────── */}
            <div className="px-4 pt-5 pb-3 md:px-8 md:pt-8 md:pb-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        {!isMobile && (
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold text-foreground">
                                    {t('dashboard.title')}
                                </h1>
                                <p className="text-sm mt-1 text-muted-foreground">
                                    {t('dashboard.subtitle')}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleManualRefresh}
                            disabled={isRefetching}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors bg-background border border-border text-primary hover:text-primary-hover cursor-pointer"
                            title={t('common.refresh', 'Refresh')}
                        >
                            <RefreshCw size={12} className={isRefetching ? 'animate-spin' : ''} />
                            {t('common.refresh', 'Refresh')}
                        </Button>
                        {hasFilters && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={clearAllFilters}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors bg-error-bg text-destructive border border-destructive hover:bg-destructive/10 cursor-pointer"
                            >
                                <X size={12} />
                                {t('dashboard.clearFilters')}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Loading State ────────────────────────────── */}
            {isLoading ? (
                <DashboardSkeleton />
            ) : isError ? (
                <div className="flex items-center justify-center py-32">
                    <div className="flex flex-col items-center gap-3 text-center px-6">
                        <AlertCircle size={32} className="text-destructive" />
                        <p className="text-sm font-semibold text-foreground">{t('dashboard.failedToLoad')}</p>
                        <p className="text-xs text-muted-foreground">{t('dashboard.tryRefreshing')}</p>
                    </div>
                </div>
            ) : (
                /* ── Content ────────────────────────────────── */
                <div className="px-4 pb-[var(--mobile-bottom-nav-clearance)] md:px-8 md:pb-8 space-y-6">

                    {/* ── Active filter pills ────────────────── */}
                    {hasFilters && (
                        <div className="flex items-center gap-2 flex-wrap min-h-8 px-1">
                            <ListFilter size={14} className="text-muted-foreground" />
                            {Array.isArray(appliedFilters.status) && appliedFilters.status.map(status => (
                                <span key={status} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                                    style={{
                                        backgroundColor: `${STATUS_COLORS[status]}15`,
                                        color: STATUS_COLORS[status],
                                        border: `1px solid ${STATUS_COLORS[status]}30`,
                                    }}>
                                    {status}
                                    <X size={10} className="cursor-pointer ml-0.5" onClick={() => handleStatusSelect(null)} />
                                </span>
                            ))}
                            {appliedFilters.category && (
                                <span className={cn(
                                    'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                                    CATEGORY_PILL_CLASS[appliedFilters.category as CategoryType]
                                )}>
                                    {CATEGORY_COLORS[appliedFilters.category as CategoryType].name}
                                    <X size={10} className="cursor-pointer ml-0.5" onClick={() => handleCategorySelect('')} />
                                </span>
                            )}
                            {appliedFilters.documentType && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-info-bg text-info border border-info-bg">
                                    {documentTypeOptions.find(o => o.value === appliedFilters.documentType)?.label || appliedFilters.documentType}
                                    <X size={10} className="cursor-pointer ml-0.5" onClick={() => handleTypeSelect('')} />
                                </span>
                            )}
                        </div>
                    )}

                    {/* ── Tasks by status ────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                        className="relative rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6"
                    >
                        {isManualRefresh && isRefetching && <RefetchOverlay />}
                        <StatusDonutCard
                            segments={donutSegments}
                            counts={kpiMetrics}
                            total={kpiMetrics.total}
                            activeStatus={appliedFilters.status?.[0] ?? null}
                            onSelectStatus={handleStatusSelect}
                        />
                    </motion.div>

                    {/* ── Categories overview ────────────────── */}
                    <CategoryOverviewCards
                        selectedCategory={(appliedFilters.category || '') as CategoryType | ''}
                        onSelectCategory={handleCategorySelect}
                        selectedType={appliedFilters.documentType || ''}
                        onSelectType={handleTypeSelect}
                        activeStatus={appliedFilters.status?.[0] ?? null}
                        typesData={typesData}
                        counts={categoryCounts}
                        pendingCounts={pendingCounts}
                        completedCounts={completedCounts}
                    />

                    {/* Detail rows and status splits still come from the capped task sample. */}
                    {isTruncated && (
                        <p className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
                            <AlertCircle size={12} />
                            {t('dashboard.truncatedNotice', 'Detail rows and status splits cover the 1000 most recent tasks; category and type totals use the full SAP aggregates.')}
                        </p>
                    )}


                    {/* ── Chart 3: Task Details Table ────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.2 }}
                        className="overflow-hidden relative rounded-2xl border border-border bg-card shadow-sm"
                    >
                        {isRefetching && <RefetchOverlay />}
                        <div className="px-5 pt-5 pb-3 md:px-6 md:pt-6 flex items-center justify-between gap-4 flex-wrap">
                            <div>
                                <h3 className="text-xs md:text-sm font-bold tracking-widest text-foreground uppercase">
                                    {t('dashboard.charts.taskDetails')}
                                </h3>
                                <p className="text-xs md:text-sm mt-1 text-muted-foreground">
                                    {appliedFilters.documentType
                                        ? t('dashboard.charts.filteredBy', { filter: documentTypeOptions.find(o => o.value === appliedFilters.documentType)?.label || appliedFilters.documentType })
                                        : appliedFilters.status?.length
                                            ? t('dashboard.charts.filteredBy', { filter: appliedFilters.status.join(', ') })
                                            : t('dashboard.charts.allTasks')}
                                    {tableTotal > 0 && ` — ${t('dashboard.itemsCount', { count: tableTotal })}`}
                                </p>
                            </div>
                        </div>

                        <div className="overflow-y-auto overscroll-y-contain touch-pan-y [webkit-overflow-scrolling:touch] rounded-b-2xl max-h-96">
                            {tableRows.length === 0 ? (
                                <div className="text-center py-10 text-sm text-muted-foreground border-t border-border">
                                    {t('dashboard.charts.noTasksFound', 'No tasks found')}
                                </div>
                            ) : isMobile ? (
                                <div className="flex flex-col border-t border-border divide-y divide-border bg-white">
                                    {paginatedTableRows.map((row, idx) => (
                                        <div key={`${row.docNumber}-${idx}`} className="flex relative items-center p-4 hover:bg-muted/50 transition-colors">
                                            {/* Left - Index */}
                                            <div className="w-8 text-xs font-bold text-muted-foreground shrink-0 mt-0.5">
                                                {(currentTablePage - 1) * tablePageSize + idx + 1}
                                            </div>

                                            {/* Middle - Doc Number & Type */}
                                            <div className="flex-1 min-w-0 pr-4">
                                                <p className="text-sm font-bold text-foreground truncate">
                                                    {row.docNumber}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1 truncate">
                                                    {row.documentTypeDesc}
                                                </p>
                                            </div>

                                            {/* Right - Amount & Status */}
                                            <div className="flex flex-col items-end pr-5 shrink-0 space-y-1.5">
                                                {row.totalNetAmount != null ? (
                                                    <p className="text-sm font-bold truncate tabular-nums text-foreground">
                                                        {row.totalNetAmount.toLocaleString(undefined, { minimumFractionDigits: row.displayCurrency?.toUpperCase() === 'VND' ? 0 : 2, maximumFractionDigits: row.displayCurrency?.toUpperCase() === 'VND' ? 0 : 2 })} {row.displayCurrency}
                                                    </p>
                                                ) : (
                                                    <p className="text-sm font-bold truncate text-muted-foreground">—</p>
                                                )}
                                                <div>
                                                    <StatusBadge status={row.status} />
                                                </div>
                                            </div>

                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur-xs">
                                        <TableRow className="hover:bg-muted border-b bg-transparent">
                                            <TableHead className="px-5 py-3 text-xs font-bold tracking-wider text-muted-foreground w-16 bg-muted/90 h-11 uppercase">
                                                {t('dashboard.table.rowNumber')}
                                            </TableHead>
                                            <TableHead className="px-5 py-3 text-xs font-bold tracking-wider text-muted-foreground bg-muted/90 h-11 uppercase">
                                                {t('dashboard.table.docNumber')}
                                            </TableHead>
                                            <TableHead className="px-5 py-3 text-xs font-bold tracking-wider text-muted-foreground bg-muted/90 h-11 uppercase">
                                                {t('dashboard.table.type')}
                                            </TableHead>
                                            <TableHead className="px-5 py-3 text-xs font-bold tracking-wider text-muted-foreground bg-muted/90 h-11 uppercase">
                                                {t('dashboard.table.status')}
                                            </TableHead>
                                            <TableHead className="px-5 py-3 text-xs font-bold tracking-wider text-muted-foreground text-right bg-muted/90 h-11 uppercase">
                                                {t('dashboard.table.amount')}
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedTableRows.map((row, idx) => (
                                            <TableRow key={`${row.docNumber}-${idx}`} className="bg-white">
                                                <TableCell className="px-5 py-3.5 text-xs md:text-sm font-semibold text-muted-foreground">
                                                    {(currentTablePage - 1) * tablePageSize + idx + 1}
                                                </TableCell>
                                                <TableCell className="px-5 py-3.5 text-xs md:text-sm font-bold text-primary">
                                                    {row.docNumber}
                                                </TableCell>
                                                <TableCell className="px-5 py-3.5 text-xs md:text-sm font-semibold text-muted-foreground">
                                                    {row.documentTypeDesc}
                                                </TableCell>
                                                <TableCell className="px-5 py-3.5">
                                                    <StatusBadge status={row.status} />
                                                </TableCell>
                                                <TableCell className="px-5 py-3.5 text-xs md:text-sm font-bold text-right tabular-nums text-foreground">
                                                    {row.totalNetAmount != null
                                                        ? `${row.totalNetAmount.toLocaleString(undefined, { minimumFractionDigits: row.displayCurrency?.toUpperCase() === 'VND' ? 0 : 2, maximumFractionDigits: row.displayCurrency?.toUpperCase() === 'VND' ? 0 : 2 })} ${row.displayCurrency}`
                                                        : '—'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                        {tableTotal > 0 && (
                            <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3 text-xs text-muted-foreground">
                                <span>
                                    {t('dashboard.pagination.showing', {
                                        start: (currentTablePage - 1) * tablePageSize + 1,
                                        end: Math.min(currentTablePage * tablePageSize, tableTotal),
                                        total: tableTotal,
                                        defaultValue: `Showing ${(currentTablePage - 1) * tablePageSize + 1} to ${Math.min(currentTablePage * tablePageSize, tableTotal)} of ${tableTotal}`,
                                    })}
                                </span>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        className="h-7 min-w-0 px-2 text-[11px]"
                                        disabled={currentTablePage === 1}
                                        onClick={() => setTablePage(Math.max(1, currentTablePage - 1))}
                                    >
                                        {t('common.previous', 'Previous')}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-7 min-w-0 px-2 text-[11px]"
                                        disabled={currentTablePage === tablePageCount}
                                        onClick={() => setTablePage(Math.min(tablePageCount, currentTablePage + 1))}
                                    >
                                        {t('common.next', 'Next')}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </div>
    );

    // Layout Sync wrapper
    if (isMobile) {
        return (
            <div className="relative h-full overflow-y-auto overscroll-y-contain touch-pan-y [webkit-overflow-scrolling:touch] bg-background">
                {dashboardContent}
            </div>
        );
    }

    return (
        <div className="flex h-full w-full overflow-hidden bg-muted/10">
            <main className="relative min-w-0 flex-1 overflow-auto bg-muted/30">
                {dashboardContent}
            </main>
        </div>
    );
}
