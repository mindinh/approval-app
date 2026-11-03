import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    Clock,
    CheckCircle2,
    ChevronRight,
    Layers,
    ArrowRight,
    type LucideIcon,
} from 'lucide-react';
import { Button, Skeleton } from '@cnma/react-ui';
import { TaskCard } from '@/pages/Inbox/components/TaskCard';
import { cn } from '@/lib/utils';
import { prefetchRouteData } from '@/utils/routePrefetch';
import { HomeErrorState } from './HomeErrorState';
import { STAT_TONES, TASK_SKELETON_ROWS, type StatTone } from './homeTones';
import type { HomeViewProps, QuickAccessItem } from './homePage.types';

const KPI_INTERACTIVE_CLASSES = 'hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 cursor-pointer ';

interface DesktopKpiCardProps {
    tone: StatTone;
    icon: LucideIcon;
    label: string;
    value: number;
    isLoading: boolean;
    /** Width class of the loading skeleton, e.g. `w-10`. */
    skeletonWidthClass: string;
    /** Entrance animation delay in seconds; omitted for the first card. */
    delay?: number;
    /** Route the card links to; the card is static when omitted. */
    to?: string;
}

/** Executive KPI card overlapping the hero banner. */
function DesktopKpiCard({ tone, icon: Icon, label, value, isLoading, skeletonWidthClass, delay, to }: DesktopKpiCardProps) {
    const navigate = useNavigate();

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={delay === undefined ? { duration: 0.3 } : { duration: 0.3, delay }}
            onMouseEnter={to ? () => prefetchRouteData(to) : undefined}
            onClick={to ? () => navigate(to) : undefined}
            className={`${tone.card} rounded-xl p-3.5 lg:p-4 shadow-xs ${to ? KPI_INTERACTIVE_CLASSES : ''}group flex items-center justify-between gap-3`}
        >
            <div className="min-w-0">
                <span className={`text-[11px] lg:text-xs font-bold uppercase tracking-wider ${tone.text} truncate block`}>
                    {label}
                </span>
                <p className={`text-2xl lg:text-3xl font-extrabold ${tone.text} tracking-tight tabular-nums mt-0.5`}>
                    {isLoading ? (
                        <Skeleton className={`h-7 ${skeletonWidthClass} bg-current/20 inline-block rounded-md`} />
                    ) : (
                        value
                    )}
                </p>
            </div>
            <div className={`w-9 h-9 lg:w-10 lg:h-10 rounded-xl ${tone.iconBg} ${tone.text} flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-2xs`}>
                <Icon className="size-4.5 lg:size-5" />
            </div>
        </motion.div>
    );
}

/** Count badge on a quick access card; rendered twice with different breakpoint visibility. */
function QuickAccessBadge({ item, visibilityClass }: { item: QuickAccessItem; visibilityClass: string }) {
    if (!item.badge) return null;
    return (
        <span className={cn(
            `${visibilityClass} px-2 py-0.5 rounded-full text-xs font-bold border`,
            item.badgeVariant === 'warning'
                ? "bg-warning-bg text-warning border-warning/30"
                : "bg-success-bg text-success border-success/30"
        )}>
            {item.badge}
        </span>
    );
}

/**
 * TABLET & DESKTOP VIEW (>= 768px)
 * Executive KPI Cards, balanced multi-column layout, no role badge or system overview.
 */
export function HomeDesktopView({
    displayName,
    pendingSubtitle,
    stats,
    isCountLoading,
    newestTasks,
    isInboxLoading,
    homeError,
    isRefreshing,
    onRetry,
    quickAccessItems,
}: HomeViewProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="hidden md:block">
            {/* ── Hero Banner ────────────────────────────── */}
            <div
                className="relative text-white shadow-sm overflow-hidden"
                style={{ background: 'linear-gradient(to right, var(--primary) 0%, var(--primary-hover) 20%, var(--primary-hover) 100%)' }}
            >
                <div className="pointer-events-none absolute -right-24 -top-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
                <div className="pointer-events-none absolute right-1/4 -bottom-32 w-80 h-80 rounded-full bg-primary-hover/40 blur-2xl" />

                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 lg:py-8 pb-14 lg:pb-16">
                    <div className="flex items-center justify-between gap-6">
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-1"
                        >
                            <h1 className="text-xl lg:text-2xl font-extrabold tracking-tight text-white">
                                {t('home.welcomeBack', 'Welcome back')},{' '}
                                <span className="text-white drop-shadow-xs">{displayName || 'User'}</span>
                            </h1>
                            <p className="text-white/80 text-xs sm:text-sm font-medium">
                                {pendingSubtitle}
                            </p>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* ── KPI Cards Section ──────────────────────── */}
            <div className="max-w-7xl mx-auto px-6 lg:px-8 -mt-7 lg:-mt-8 relative z-10">
                <div className="grid grid-cols-3 gap-3.5 lg:gap-4">
                    {/* KPI 1: Total Tasks */}
                    <DesktopKpiCard
                        tone={STAT_TONES.total}
                        icon={Layers}
                        label={t('home.totalTasks', 'Total Tasks')}
                        value={stats.totalTasks}
                        isLoading={isCountLoading}
                        skeletonWidthClass="w-12"
                    />

                    {/* KPI 2: In Approving */}
                    <DesktopKpiCard
                        tone={STAT_TONES.inApproving}
                        icon={Clock}
                        label={t('dashboard.statCards.inApproving', 'In Approving')}
                        value={stats.newTasks}
                        isLoading={isCountLoading}
                        skeletonWidthClass="w-10"
                        delay={0.05}
                        to="/inbox"
                    />

                    {/* KPI 3: Approved */}
                    <DesktopKpiCard
                        tone={STAT_TONES.completed}
                        icon={CheckCircle2}
                        label={t('dashboard.status.completed', 'Completed')}
                        value={stats.approved}
                        isLoading={isCountLoading}
                        skeletonWidthClass="w-10"
                        delay={0.1}
                        to="/approved"
                    />
                </div>
            </div>

            {/* ── Content Area: Tablet (Stacked) / Desktop (2-Column Grid) ── */}
            <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-8 pb-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Newest Tasks Feed (8 cols on lg, second on tablet, first on desktop) */}
                    <div className="order-2 lg:order-1 lg:col-span-8 space-y-4">
                        <div className="flex items-center justify-between pb-1 border-b border-border/60">
                            <div className="flex items-center gap-2.5">
                                <h2 className="text-lg font-bold text-foreground tracking-tight">
                                    {t('home.newestTasks', 'Newest Tasks')}
                                </h2>
                            </div>
                            <Button
                                variant="link"
                                onMouseEnter={() => prefetchRouteData('/inbox')}
                                onClick={() => navigate('/inbox')}
                                className="text-sm font-semibold hover:underline text-primary p-0 h-auto gap-1 cursor-pointer"
                            >
                                <span>{t('home.viewAll', 'View All')}</span>
                                <ArrowRight className="size-3.5" />
                            </Button>
                        </div>

                        {isInboxLoading ? (
                            <div className="space-y-3">
                                {Array.from({ length: TASK_SKELETON_ROWS }).map((_, i) => (
                                    <div key={i} className="rounded-2xl p-5 border border-border bg-card space-y-3">
                                        <div className="flex justify-between">
                                            <Skeleton className="h-4 w-1/3" />
                                            <Skeleton className="h-4 w-20 rounded-full" />
                                        </div>
                                        <Skeleton className="h-4 w-3/4" />
                                        <div className="flex gap-2 pt-1">
                                            <Skeleton className="h-5 w-24 rounded-full" />
                                            <Skeleton className="h-5 w-20 rounded-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : homeError && newestTasks.length === 0 ? (
                            <HomeErrorState error={homeError} onRetry={onRetry} isRefreshing={isRefreshing} />
                        ) : newestTasks.length === 0 ? (
                            <div className="rounded-2xl p-12 border text-center bg-card border-border shadow-xs space-y-3">
                                <div className="w-14 h-14 rounded-2xl bg-success-bg border border-success/20 flex items-center justify-center mx-auto text-success">
                                    <CheckCircle2 className="w-7 h-7" />
                                </div>
                                <h3 className="text-base font-bold text-foreground">
                                    {t('home.allCaughtUp', 'All caught up!')}
                                </h3>
                                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                    {t('home.noTasks', "No pending tasks. You're all caught up!")}
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onMouseEnter={() => prefetchRouteData('/approved')}
                                    onClick={() => navigate('/approved')}
                                    className="mt-2 text-xs font-semibold rounded-xl cursor-pointer"
                                >
                                    {t('nav.approvedTasks', 'View Approved Tasks')}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3.5">
                                {newestTasks.map((task, i) => (
                                    <motion.div
                                        key={`${task.instanceId}-${i}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2, delay: i * 0.03 }}
                                        onMouseEnter={() => prefetchRouteData(`/inbox/${task.instanceId}`)}
                                    >
                                        <TaskCard
                                            task={task}
                                            isSelected={false}
                                            onClick={() => navigate(`/inbox/${task.instanceId}`)}
                                            variant="desktop"
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Access Cards (4 cols on lg, first on tablet, second on desktop) */}
                    <div className="order-1 lg:order-2 lg:col-span-4 space-y-3">
                        <h2 className="text-base lg:text-lg font-bold text-foreground tracking-tight pb-1 lg:border-b lg:border-border/60">
                            {t('home.quickAccess', 'Quick Access')}
                        </h2>

                        <div className="grid grid-cols-3 lg:flex lg:flex-col gap-3 lg:gap-3">
                            {quickAccessItems.map((item, i) => (
                                <motion.div
                                    key={item.label}
                                    initial={{ opacity: 0, x: 8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.2, delay: i * 0.04 }}
                                    onMouseEnter={() => prefetchRouteData(item.to)}
                                    onClick={() => navigate(item.to)}
                                    className="group rounded-2xl p-4 border bg-card border-border/80 shadow-2xs hover:shadow-md hover:border-primary/50 hover:bg-accent/30 transition-all duration-200 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between lg:justify-start gap-3 lg:gap-3.5"
                                >
                                    <div className="flex items-center justify-between lg:justify-start">
                                        <div className={cn("w-10 h-10 lg:w-11 lg:h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105", item.iconClass)}>
                                            {item.icon}
                                        </div>
                                        <QuickAccessBadge item={item} visibilityClass="lg:hidden" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                                                {item.label}
                                            </p>
                                            <QuickAccessBadge item={item} visibilityClass="hidden lg:inline-block" />
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                            {item.description}
                                        </p>
                                    </div>
                                    <ChevronRight className="hidden lg:block size-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
