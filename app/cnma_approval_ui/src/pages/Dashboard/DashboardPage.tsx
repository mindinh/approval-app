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
    ChevronRight,
    RefreshCw,
    BarChart3,
    List,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

import { useDashboardQuery, useDashboardData, STATUS_COLORS, STATUS_LABELS, CATEGORY_COLORS, getDocTypeDescription } from './use-dashboard-data';
import type { DonutSegment, BarDataItem, CategoryType } from './use-dashboard-data';
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
                                    className="transition-all duration-300 ease-in-out"
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
// ═══════════════════════════════════════════════════════════
// Custom Clickable Y-Axis Tick Component
// ═══════════════════════════════════════════════════════════
function ClickableYAxisTick({ x, y, payload, onBarClick, selectedCategory, selectedType, data }: any) {
    const label = String(payload?.value || '');
    const item = data?.find((d: any) => d.label === label);

    const isActive = !selectedCategory && !selectedType
        ? true
        : selectedType
            ? selectedType === label || selectedType === item?.rawDocType
            : selectedCategory
                ? item?.category === selectedCategory
                : true;

    return (
        <g
            transform={`translate(${x},${y})`}
            className="cursor-pointer group"
            onClick={() => onBarClick(label)}
        >
            <text
                x={-10}
                y={4}
                textAnchor="end"
                fill={isActive ? 'var(--foreground)' : 'var(--muted-foreground)'}
                opacity={isActive ? 1 : 0.4}
                fontSize={11}
                fontWeight={isActive ? 600 : 400}
                className="group-hover:fill-primary group-hover:font-bold transition-all duration-200"
            >
                {label.length > 22 ? label.substring(0, 20) + '...' : label}
            </text>
        </g>
    );
}

// ═══════════════════════════════════════════════════════════
// Category-Colored Horizontal Bar Chart (Y = Document Types, X = Count)
// ═══════════════════════════════════════════════════════════
function StackedBarChart({
    data,
    selectedType,
    selectedCategory,
    onBarClick,
    noDataText = 'No data available'
}: {
    data: BarDataItem[];
    selectedType: string | null;
    selectedCategory: CategoryType | null;
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

    const itemHeight = 36;
    const chartHeight = Math.max(data.length * itemHeight + 20, 240);

    return (
        <div className="w-full" style={{ height: `${chartHeight}px` }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 5, right: 25, left: 10, bottom: 5 }}
                    barSize={14}
                >
                    <XAxis
                        type="number"
                        stroke="var(--muted-foreground)"
                        fontSize={10}
                        fontWeight={500}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                    />
                    <YAxis
                        type="category"
                        dataKey="label"
                        interval={0}
                        stroke="var(--foreground)"
                        tickLine={false}
                        axisLine={false}
                        width={160}
                        tick={(props) => (
                            <ClickableYAxisTick
                                {...props}
                                onBarClick={onBarClick}
                                selectedType={selectedType}
                                selectedCategory={selectedCategory}
                                data={data}
                            />
                        )}
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
                        radius={[0, 4, 4, 0]}
                        onClick={(entry) => {
                            if (entry && entry.payload && entry.payload.label) {
                                onBarClick(entry.payload.label);
                            }
                        }}
                        cursor="pointer"
                        className="transition-all duration-300 ease-in-out"
                    >
                        {data.map((entry, index) => {
                            const catConf = CATEGORY_COLORS[entry.category] || CATEGORY_COLORS.OTHER;
                            const isMatch = !selectedCategory && !selectedType
                                ? true
                                : selectedType
                                    ? selectedType === entry.label || selectedType === entry.rawDocType
                                    : selectedCategory
                                        ? entry.category === selectedCategory
                                        : true;

                            return (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={isMatch ? catConf.fill : '#d1d5db'}
                                    fillOpacity={isMatch ? 1 : 0.25}
                                    stroke={isMatch ? catConf.border : '#9ca3af'}
                                    strokeWidth={isMatch ? 1 : 0.5}
                                />
                            );
                        })}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// Category Legend Component with Interactive Filter Toggle
// ═══════════════════════════════════════════════════════════
function CategoryLegend({
    selectedCategory,
    onCategoryClick,
    categoryCounts
}: {
    selectedCategory: CategoryType | null;
    onCategoryClick: (category: CategoryType) => void;
    categoryCounts: Record<CategoryType, number>;
}) {
    const categories: CategoryType[] = ['PO', 'PR', 'RESV', 'CLAIM', 'OTHER'];

    return (
        <div className="flex items-center justify-center gap-2 md:gap-3 shrink-0 border-t border-border pt-3 mt-3 flex-wrap">
            {categories.map((cat) => {
                const conf = CATEGORY_COLORS[cat];
                const count = categoryCounts[cat] || 0;
                if (count === 0) return null;
                const isSelected = selectedCategory === cat;
                const isDimmed = selectedCategory !== null && !isSelected;

                return (
                    <Button
                        key={cat}
                        type="button"
                        variant="ghost"
                        onClick={() => onCategoryClick(cat)}
                        className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer",
                            isSelected
                                ? "ring-2 ring-offset-1 shadow-xs scale-105"
                                : isDimmed
                                    ? "opacity-35 grayscale"
                                    : "opacity-90 hover:opacity-100 hover:scale-102"
                        )}
                        style={{
                            backgroundColor: conf.bg,
                            borderColor: conf.border,
                            color: conf.text,
                            boxShadow: isSelected ? `0 0 0 2px ${conf.fill}` : undefined
                        }}
                    >
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: conf.fill }} />
                        <span>{cat}</span>
                        <span className="font-bold tabular-nums">({count})</span>
                    </Button>
                );
            })}
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
    }));
    const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
    const [typeViewMode, setTypeViewMode] = useState<'chart' | 'list'>('chart');

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

    // Compute category counts for the legend
    const categoryCounts = useMemo(() => {
        const counts: Record<CategoryType, number> = { PO: 0, PR: 0, RESV: 0, CLAIM: 0, OTHER: 0 };
        for (const item of barData) {
            const cat = item.category || 'OTHER';
            counts[cat] = (counts[cat] || 0) + Number(item['In Approving'] || 0);
        }
        return counts;
    }, [barData]);

    // ── Handlers ─────────────────────────────────────────
    const handleFilterClear = useCallback(() => {
        setAppliedFilters({
            status: [],
            documentType: '',
        });
        setSelectedCategory(null);
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

                        {/* Chart 2: Category-Colored Tasks by Type Chart */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: 0.1 }}
                            className="p-5 md:p-6 relative rounded-2xl border border-border bg-card shadow-sm flex flex-col min-h-96 h-auto"
                        >
                            {isRefetching && <RefetchOverlay />}
                            <div className="shrink-0 mb-4 flex items-center justify-between">
                                <h3 className="text-xs md:text-sm font-bold tracking-widest text-foreground uppercase">
                                    {t('dashboard.charts.tasksByType')}
                                </h3>
                                <div className="flex items-center gap-2">
                                    {barData.length > 0 && (
                                        <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                            {t('dashboard.itemsCount', { count: barData.length })}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 min-h-0">
                                <StackedBarChart
                                    data={barData}
                                    selectedType={appliedFilters.documentType || null}
                                    selectedCategory={selectedCategory}
                                    onBarClick={handleBarClick}
                                    onStatusClick={handleStatusClick}
                                    noDataText={t('common.noData', 'No data available')}
                                />
                            </div>
                            {/* Category Legend with Interactive Greying Filter */}
                            <CategoryLegend
                                selectedCategory={selectedCategory}
                                onCategoryClick={(cat) => setSelectedCategory(prev => prev === cat ? null : cat)}
                                categoryCounts={categoryCounts}
                            />
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

                        <div className="overflow-y-auto overscroll-y-contain touch-pan-y [webkit-overflow-scrolling:touch] rounded-b-2xl max-h-96">
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
