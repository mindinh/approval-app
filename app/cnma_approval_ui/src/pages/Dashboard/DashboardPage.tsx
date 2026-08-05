import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useIsMobile, useSidebar, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@cnma/react-ui';
import {
    ListFilter,
    X,
    Loader2,
    AlertCircle,
    Menu,
    ChevronRight,
    RefreshCw,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

import { useDashboardQuery, useDashboardData, STATUS_COLORS, STATUS_LABELS, getDocTypeDescription } from './use-dashboard-data';
import type { DonutSegment, BarDataItem } from './use-dashboard-data';
import { StatusBadge } from '@/pages/Inbox/components/TaskBadges';
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton';
import type { FilterValues } from '@/components/filterbar/types';
import { cn } from '@/lib/utils';

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
// Recharts Donut Chart Component
// ═══════════════════════════════════════════════════════════
function DonutChart({
    segments,
    selectedLabel,
    onSegmentClick,
    centerLabel = 'TASKS'
}: {
    segments: DonutSegment[];
    selectedLabel: string | null;
    onSegmentClick: (label: string) => void;
    centerLabel?: string;
}) {
    const total = segments.reduce((s, seg) => s + seg.value, 0);
    const data = segments.filter(seg => seg.value > 0);

    return (
        <div className="relative w-full h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="label"
                        onClick={(entry) => onSegmentClick(entry.label)}
                        cursor="pointer"
                    >
                        {data.map((entry) => {
                            const isActive = selectedLabel === entry.label;
                            const isFiltered = selectedLabel != null && !isActive;
                            return (
                                <Cell
                                    key={`cell-${entry.label}`}
                                    fill={entry.color}
                                    opacity={isFiltered ? 0.35 : 1}
                                    style={{
                                        transition: 'all 0.3s ease',
                                    }}
                                />
                            );
                        })}
                    </Pie>
                    <Tooltip
                        formatter={(value: any) => [`${value} tasks`, 'Count']}
                        contentStyle={{
                            backgroundColor: 'var(--popover)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            color: 'var(--foreground)',
                            fontSize: '12px'
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-extrabold text-foreground tracking-tight">
                    {total}
                </span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
                    {centerLabel}
                </span>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// Custom Clickable Y-Axis Tick Component
// ═══════════════════════════════════════════════════════════
function ClickableYAxisTick({ x, y, payload, onBarClick }: any) {
    return (
        <g
            transform={`translate(${x},${y})`}
            className="cursor-pointer group"
            onClick={() => onBarClick(payload.value)}
        >
            <text
                x={-10}
                y={4}
                textAnchor="end"
                fill="var(--foreground)"
                fontSize={11}
                fontWeight={600}
                className="group-hover:fill-primary group-hover:font-bold transition-all duration-200"
            >
                {payload.value.length > 20 ? payload.value.substring(0, 18) + '...' : payload.value}
            </text>
        </g>
    );
}

// ═══════════════════════════════════════════════════════════
// Recharts Stacked Horizontal Bar Chart Component
// ═══════════════════════════════════════════════════════════
function StackedBarChart({
    data,
    selectedStatus,
    onBarClick,
    noDataText = 'No data available'
}: {
    data: BarDataItem[];
    selectedStatus: string | null;
    onBarClick: (label: string) => void;
    onStatusClick?: (label: string) => void;
    noDataText?: string;
}) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
                {noDataText}
            </div>
        );
    }

    const chartHeight = Math.max(data.length * 44, 180);

    return (
        <div className="min-w-80" style={{ height: `${chartHeight}px` }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                    barSize={14}
                >
                    <XAxis
                        type="number"
                        stroke="var(--muted-foreground)"
                        fontSize={10}
                        fontWeight={500}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => value}
                    />
                    <YAxis
                        type="category"
                        dataKey="label"
                        stroke="var(--foreground)"
                        fontSize={11}
                        fontWeight={600}
                        tickLine={false}
                        axisLine={false}
                        width={130}
                        tick={(props) => <ClickableYAxisTick {...props} onBarClick={onBarClick} />}
                    />
                    <Tooltip
                        cursor={{ fill: 'var(--muted)', opacity: 0.15 }}
                        formatter={(value: any, name: any) => [`${value} tasks`, name]}
                        contentStyle={{
                            backgroundColor: 'var(--popover)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            color: 'var(--foreground)',
                            fontSize: '12px'
                        }}
                    />
                    <Bar
                        key="In Approving"
                        dataKey="In Approving"
                        name="In Approving"
                        fill={STATUS_COLORS['In Approving']}
                        onClick={(entry) => {
                            if (entry && entry.payload && entry.payload.label) {
                                onBarClick(entry.payload.label);
                            }
                        }}
                        cursor="pointer"
                        style={{ transition: 'all 0.3s ease' }}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// Dashboard Page Component
// ═══════════════════════════════════════════════════════════
export default function DashboardPage() {
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    const { setOpenMobile } = useSidebar();

    // ── Filter States (Applied states for visual drilling) ──
    const [appliedFilters, setAppliedFilters] = useState<FilterValues>(() => ({
        status: [],
        documentType: '',
    }));

    // Fetch master tasks data
    const { data: dashboardData, isLoading, isError, refetch, isRefetching } = useDashboardQuery();
    const tasks = dashboardData?.items ?? [];

    // Derives filtered sets, KPI numbers, and charts data
    const {
        donutSegments,
        barData,
        documentTypeOptions,
        tableRows,
        kpiMetrics,
    } = useDashboardData(tasks, appliedFilters, dashboardData?.statusCounts, dashboardData?.docTypeCounts);

    // ── Handlers ─────────────────────────────────────────
    const handleFilterClear = useCallback(() => {
        setAppliedFilters({
            status: [],
            documentType: '',
        });
    }, []);

    const handleStatusClick = useCallback((status: string) => {
        setAppliedFilters((prev) => {
            const current = prev.status || [];
            const next = current.includes(status)
                ? current.filter((s: string) => s !== status)
                : [...current, status];
            return { ...prev, status: next };
        });
    }, []);

    const handleBarClick = useCallback((label: string) => {
        const found = tasks.find(t => getDocTypeDescription(t.documentType || t.taskType || 'Standard') === label);
        const typeVal = found?.documentType || found?.taskType || '';
        if (!typeVal) return;

        setAppliedFilters((prev) => {
            const nextType = prev.documentType === typeVal ? '' : typeVal;
            return { ...prev, documentType: nextType };
        });
    }, [tasks]);

    const clearAllFilters = useCallback(() => {
        handleFilterClear();
    }, [handleFilterClear]);


    const hasFilters = useMemo(() => {
        return (
            (Array.isArray(appliedFilters.status) && appliedFilters.status.length > 0) ||
            !!appliedFilters.documentType
        );
    }, [appliedFilters]);

    // ── Dashboard content ──
    const dashboardContent = (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Mobile App Header */}
            {isMobile && (
                <div className="px-4 py-3 flex items-center shadow-sm relative z-20 shrink-0 w-full min-h-16 bg-gradient-to-r from-primary to-primary-hover">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setOpenMobile(true)}
                        className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors hover:bg-white/10 active:bg-white/20 relative z-10 p-0"
                        aria-label={t('nav.openMenu', 'Open navigation menu')}
                    >
                        <Menu size={22} className="text-white" />
                    </Button>
                    <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-bold text-white tracking-wide pointer-events-none">
                        {t('nav.dashboard', 'Dashboard')}
                    </h1>
                </div>
            )}

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
                            onClick={() => refetch()}
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
                <div className="px-4 pb-8 md:px-8 space-y-6">

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
                                    <X size={10} className="cursor-pointer ml-0.5" onClick={() => handleStatusClick(status)} />
                                </span>
                            ))}
                            {appliedFilters.documentType && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-info-bg text-info border border-info-bg">
                                    {documentTypeOptions.find(o => o.value === appliedFilters.documentType)?.label || appliedFilters.documentType}
                                    <X size={10} className="cursor-pointer ml-0.5" onClick={() => setAppliedFilters(prev => ({ ...prev, documentType: '' }))} />
                                </span>
                            )}
                        </div>
                    )}

                    {/* ── Main Charts Grid ───────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
                        {/* Chart 1: Donut breakdown */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35 }}
                            className="p-5 md:p-6 relative rounded-2xl border border-border bg-card shadow-sm flex flex-col h-96"
                        >
                            {isRefetching && <RefetchOverlay />}
                            <h3 className="text-xs md:text-sm font-bold mb-4 tracking-widest text-foreground shrink-0 uppercase">
                                {t('dashboard.charts.tasksByStatus')}
                            </h3>
                            <div className="flex-1 flex flex-col justify-center min-h-0">
                                <DonutChart
                                    segments={donutSegments}
                                    selectedLabel={appliedFilters.status?.[0] || null}
                                    onSegmentClick={handleStatusClick}
                                    centerLabel={t('dashboard.charts.tasks')}
                                />
                            </div>
                            {/* Legend / Status Badges */}
                            <div className="mt-4 flex items-center justify-center gap-4 shrink-0 border-t border-border pt-4 flex-wrap">
                                {STATUS_LABELS.map((status) => {
                                    const value = kpiMetrics[status];
                                    const isSelected = appliedFilters.status?.includes(status);
                                    return (
                                        <div
                                            key={status}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => handleStatusClick(status)}
                                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleStatusClick(status); }}
                                            className={cn(
                                                "flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all duration-200",
                                                isSelected ? "opacity-100 scale-105" : "opacity-75 hover:opacity-100"
                                            )}
                                        >
                                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[status] }} />
                                            <span className="text-foreground">{status}</span>
                                            <span className="font-bold tabular-nums">
                                                ({value})
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>

                        {/* Chart 2: Stacked Bar Chart */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: 0.1 }}
                            className="p-5 md:p-6 relative rounded-2xl border border-border bg-card shadow-sm flex flex-col h-96"
                        >
                            {isRefetching && <RefetchOverlay />}
                            <div className="shrink-0 mb-4">
                                <h3 className="text-xs md:text-sm font-bold tracking-widest text-foreground uppercase">
                                    {t('dashboard.charts.tasksByType')}
                                </h3>
                            </div>
                            <div className="flex-1 overflow-y-auto pr-1 min-h-0">
                                <StackedBarChart
                                    data={barData}
                                    selectedStatus={appliedFilters.status?.[0] || null}
                                    onBarClick={handleBarClick}
                                    onStatusClick={handleStatusClick}
                                    noDataText={t('common.noData', 'No data available')}
                                />
                            </div>
                        </motion.div>
                    </div>

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
                                    {tableRows.length > 0 && ` — ${t('dashboard.itemsCount', { count: tableRows.length })}`}
                                </p>
                            </div>
                        </div>

                        <div className="overflow-auto rounded-b-2xl max-h-96">
                            {tableRows.length === 0 ? (
                                <div className="text-center py-10 text-sm text-muted-foreground border-t border-border">
                                    {t('dashboard.charts.noTasksFound', 'No tasks found')}
                                </div>
                            ) : isMobile ? (
                                <div className="flex flex-col border-t border-border divide-y divide-border bg-white">
                                    {tableRows.map((row, idx) => (
                                        <div key={`${row.docNumber}-${idx}`} className="flex relative items-center p-4 hover:bg-muted/50 transition-colors">
                                            {/* Left - Index */}
                                            <div className="w-8 text-xs font-bold text-muted-foreground shrink-0 mt-0.5">
                                                {idx + 1}
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

                                            {/* Chevron */}
                                            <ChevronRight className="absolute right-4 w-4 h-4 text-muted-foreground/30" />
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
                                        {tableRows.map((row, idx) => (
                                            <TableRow key={`${row.docNumber}-${idx}`} className="bg-white">
                                                <TableCell className="px-5 py-3.5 text-xs md:text-sm font-semibold text-muted-foreground">
                                                    {idx + 1}
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
                    </motion.div>
                </div>
            )}
        </div>
    );

    // Layout Sync wrapper
    if (isMobile) {
        return (
            <div className="relative h-full overflow-y-auto bg-background">
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
