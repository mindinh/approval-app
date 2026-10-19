import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    Clock,
    CheckCircle2,
    BarChart3,
    Inbox,
    CheckCheck,
    ChevronRight,
    Layers,
    ArrowRight,
} from 'lucide-react';
import { useIsMobile, Button, Skeleton } from '@cnma/react-ui';
import { AccountMenu } from '@/components/layouts/AccountMenu';
import type { InboxTask } from '@/services/inbox/inbox.types';
import { TaskCard } from '@/pages/Inbox/components/TaskCard';
import { useStatusCounts, useTasks, useCurrentUser } from '@/pages/Inbox/hooks/inboxQueries';
import { cn } from '@/lib/utils';

/**
 * HomePage — Clean & responsive landing page across all devices.
 * - Mobile: Exactly preserves original mobile layout, styles, and card behavior.
 * - Tablet & Desktop: Executive layout with high-end KPI metric cards, streamlined navigation,
 *   and no clutter (system overview and role badge removed).
 */
export default function HomePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const { data: userInfo } = useCurrentUser();

    const { data: taskCounts, isLoading: isCountLoading } = useStatusCounts();
    const stats = {
        totalTasks: taskCounts?.total ?? 0,
        newTasks: taskCounts?.inApproval ?? 0,
        approved: taskCounts?.completed ?? 0,
    };

    // SAP orders and limits the result; keep it fresh for quick return navigation.
    const { data: inboxData, isLoading: isInboxLoading } = useTasks({ top: 5, staleTime: 60_000 });
    const newestTasks: InboxTask[] = inboxData?.items ?? [];

    const quickAccessItems = [
        {
            icon: <Inbox className="w-5 h-5 sm:w-6 sm:h-6" />,
            iconClass: 'text-warning bg-warning-bg',
            label: t('nav.myTasks', 'My Tasks'),
            description: t('home.quickAccessMyTasksDesc', 'Pending items awaiting your review & approval'),
            badge: stats.newTasks > 0 ? `${stats.newTasks}` : undefined,
            badgeVariant: 'warning',
            to: '/inbox',
        },
        {
            icon: <CheckCheck className="w-5 h-5 sm:w-6 sm:h-6" />,
            iconClass: 'text-success bg-success-bg',
            label: t('nav.approvedTasks', 'Approved Tasks'),
            description: t('home.quickAccessApprovedDesc', 'History of requests you previously approved'),
            badge: stats.approved > 0 ? `${stats.approved}` : undefined,
            badgeVariant: 'success',
            to: '/approved',
        },
        {
            icon: <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />,
            iconClass: 'text-info bg-info-bg',
            label: t('nav.dashboard', 'Dashboard'),
            description: t('home.quickAccessDashboardDesc', 'Performance analytics, charts & approval metrics'),
            badge: undefined,
            badgeVariant: 'default',
            to: '/dashboard',
        },
    ];

    return (
        <div className="h-full overflow-y-auto bg-background">
            {/* =========================================================================
                MOBILE VIEW (< 768px / md:hidden)
                Strictly retains original mobile styles, layout, structure, and cards.
               ========================================================================= */}
            <div className="md:hidden">
                {/* ── Gradient Header ────────────────────────── */}
                <div className="mobile-home-header relative px-5 pb-16 bg-primary text-primary-foreground">
                    <div className="flex items-start justify-between gap-3">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <p className="text-base font-medium text-primary-foreground/80">
                            {t('home.welcomeBack', 'Welcome back')},{' '}
                            <span className="text-lg font-bold text-primary-foreground">{userInfo?.displayName || ''}</span>
                        </p>
                        <p className="text-primary-foreground/70 text-xs mt-1">
                            {stats.newTasks > 0
                                ? t('home.pendingApprovals', { count: stats.newTasks, defaultValue: `${stats.newTasks} pending approvals` })
                                : t('home.allCaughtUp', 'All caught up! No pending approvals')}
                        </p>
                    </motion.div>
                        <div className="shrink-0 rounded-full bg-card text-foreground">
                            <AccountMenu />
                        </div>
                    </div>
                </div>

                {/* ── Stat Cards (overlapping the gradient) ──── */}
                <div className="px-4 -mt-8 relative z-10 space-y-3">
                    {/* Total Tasks — full-width, Info Blue */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                        className="rounded-2xl px-5 py-4 flex items-center gap-4 bg-marketing-info-blue-bg border-2 border-marketing-info-blue-border shadow-sm"
                    >
                        <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-marketing-info-blue-border">
                            <Layers className="w-6 h-6 text-marketing-info-blue" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-marketing-info-blue">
                                {t('home.totalTasks', 'Total Tasks')}
                            </p>
                            <p className="text-3xl font-extrabold leading-tight text-marketing-info-blue">
                                {isCountLoading ? (
                                    <Skeleton className="h-8 w-12 bg-current/20 inline-block rounded" />
                                ) : (
                                    stats.totalTasks
                                )}
                            </p>
                        </div>
                    </motion.div>

                    {/* In Approving + Approved — two half-width cards */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* In Approving → Attention Orange */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: 0.08 }}
                            className="rounded-2xl px-4 py-4 flex items-center gap-3 cursor-pointer active:scale-[0.97] transition-transform bg-marketing-attention-bg border-2 border-marketing-attention-border shadow-sm"
                            onClick={() => navigate('/inbox')}
                        >
                            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-marketing-attention-border">
                                <Clock className="w-5 h-5 text-marketing-attention" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold leading-tight text-marketing-attention">
                                    {t('dashboard.statCards.inApproving', 'In Approving')}
                                </p>
                                <p className="text-2xl font-extrabold leading-tight text-marketing-attention">
                                    {isCountLoading ? (
                                        <Skeleton className="h-6 w-8 bg-current/20 inline-block rounded" />
                                    ) : (
                                        stats.newTasks
                                    )}
                                </p>
                            </div>
                        </motion.div>

                        {/* Approved → Positive Green */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: 0.16 }}
                            className="rounded-2xl px-4 py-4 flex items-center gap-3 cursor-pointer active:scale-[0.97] transition-transform bg-marketing-positive-bg border-2 border-marketing-positive-border shadow-sm"
                            onClick={() => navigate('/approved')}
                        >
                            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-marketing-positive-border">
                                <CheckCircle2 className="w-5 h-5 text-marketing-positive" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold leading-tight text-marketing-positive">
                                    {t('dashboard.status.completed', 'Completed')}
                                </p>
                                <p className="text-2xl font-extrabold leading-tight text-marketing-positive">
                                    {isCountLoading ? (
                                        <Skeleton className="h-6 w-8 bg-current/20 inline-block rounded" />
                                    ) : (
                                        stats.approved
                                    )}
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* ── Top 5 Newest Tasks ─────────────────────── */}
                <div className="px-4 mt-6">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-bold text-foreground">
                            {t('home.newestTasks', 'Newest Tasks')}
                        </h2>
                        <Button
                            variant="link"
                            onClick={() => navigate('/inbox')}
                            className="text-sm font-semibold hover:underline text-primary p-0 h-auto"
                        >
                            {t('home.viewAll', 'View All')}
                        </Button>
                    </div>

                    {isInboxLoading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div
                                    key={`skeleton-${i}`}
                                    className="rounded-xl p-4 border border-border bg-card space-y-2"
                                >
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : newestTasks.length === 0 ? (
                        <div className="rounded-xl p-8 border text-center bg-card border-border shadow-md">
                            <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">
                                {t('home.noTasks', "No pending tasks. You're all caught up!")}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {newestTasks.map((task, i) => (
                                <motion.div
                                    key={`${task.instanceId}-${i}`}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.25, delay: i * 0.05 }}
                                >
                                    <TaskCard
                                        task={task}
                                        isSelected={false}
                                        onClick={() => navigate(`/inbox/${task.instanceId}`)}
                                        variant="mobile"
                                    />
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Quick Access ───────────────────────────── */}
                <div className="px-4 mt-6 pb-[var(--mobile-bottom-nav-clearance)]">
                    <h2 className="text-lg font-bold mb-4 text-foreground">
                        {t('home.quickAccess', 'Quick Access')}
                    </h2>
                    <div className="grid grid-cols-3 gap-3">
                        {quickAccessItems.map((item, i) => (
                            <motion.button
                                key={item.label}
                                type="button"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: i * 0.06 }}
                                onClick={() => navigate(item.to)}
                                className="rounded-xl p-4 border text-center hover:shadow-lg active:scale-[0.97] transition-all bg-card border-border shadow-md cursor-pointer"
                            >
                                <div
                                    className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 mx-auto ${item.iconClass}`}
                                >
                                    {item.icon}
                                </div>
                                <p className="text-xs font-bold text-foreground">
                                    {item.label}
                                </p>
                            </motion.button>
                        ))}
                    </div>
                </div>
            </div>

            {/* =========================================================================
                TABLET & DESKTOP VIEW (>= 768px / hidden md:block)
                Executive KPI Cards, balanced multi-column layout, no role badge or system overview.
               ========================================================================= */}
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
                                    <span className="text-white drop-shadow-xs">{userInfo?.displayName || 'User'}</span>
                                </h1>
                                <p className="text-white/80 text-xs sm:text-sm font-medium">
                                    {stats.newTasks > 0
                                        ? t('home.pendingApprovals', { count: stats.newTasks, defaultValue: `${stats.newTasks} pending approvals` })
                                        : t('home.allCaughtUp', 'All caught up! No pending approvals')}
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* ── KPI Cards Section ──────────────────────── */}
                <div className="max-w-7xl mx-auto px-6 lg:px-8 -mt-7 lg:-mt-8 relative z-10">
                    <div className="grid grid-cols-3 gap-3.5 lg:gap-4">
                        {/* KPI 1: Total Tasks */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="bg-marketing-info-blue-bg border-2 border-marketing-info-blue-border rounded-xl p-3.5 lg:p-4 shadow-xs group flex items-center justify-between gap-3"
                        >
                            <div className="min-w-0">
                                <span className="text-[11px] lg:text-xs font-bold uppercase tracking-wider text-marketing-info-blue truncate block">
                                    {t('home.totalTasks', 'Total Tasks')}
                                </span>
                                <p className="text-2xl lg:text-3xl font-extrabold text-marketing-info-blue tracking-tight tabular-nums mt-0.5">
                                    {isCountLoading ? (
                                        <Skeleton className="h-7 w-12 bg-current/20 inline-block rounded-md" />
                                    ) : (
                                        stats.totalTasks
                                    )}
                                </p>
                            </div>
                            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-marketing-info-blue-border text-marketing-info-blue flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-2xs">
                                <Layers className="size-4.5 lg:size-5" />
                            </div>
                        </motion.div>

                        {/* KPI 2: In Approving */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.05 }}
                            onClick={() => navigate('/inbox')}
                            className="bg-marketing-attention-bg border-2 border-marketing-attention-border rounded-xl p-3.5 lg:p-4 shadow-xs hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex items-center justify-between gap-3"
                        >
                            <div className="min-w-0">
                                <span className="text-[11px] lg:text-xs font-bold uppercase tracking-wider text-marketing-attention truncate block">
                                    {t('dashboard.statCards.inApproving', 'In Approving')}
                                </span>
                                <p className="text-2xl lg:text-3xl font-extrabold text-marketing-attention tracking-tight tabular-nums mt-0.5">
                                    {isCountLoading ? (
                                        <Skeleton className="h-7 w-10 bg-current/20 inline-block rounded-md" />
                                    ) : (
                                        stats.newTasks
                                    )}
                                </p>
                            </div>
                            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-marketing-attention-border text-marketing-attention flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-2xs">
                                <Clock className="size-4.5 lg:size-5" />
                            </div>
                        </motion.div>

                        {/* KPI 3: Approved */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            onClick={() => navigate('/approved')}
                            className="bg-marketing-positive-bg border-2 border-marketing-positive-border rounded-xl p-3.5 lg:p-4 shadow-xs hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex items-center justify-between gap-3"
                        >
                            <div className="min-w-0">
                                <span className="text-[11px] lg:text-xs font-bold uppercase tracking-wider text-marketing-positive truncate block">
                                    {t('dashboard.status.completed', 'Completed')}
                                </span>
                                <p className="text-2xl lg:text-3xl font-extrabold text-marketing-positive tracking-tight tabular-nums mt-0.5">
                                    {isCountLoading ? (
                                        <Skeleton className="h-7 w-10 bg-current/20 inline-block rounded-md" />
                                    ) : (
                                        stats.approved
                                    )}
                                </p>
                            </div>
                            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-marketing-positive-border text-marketing-positive flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-2xs">
                                <CheckCircle2 className="size-4.5 lg:size-5" />
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* ── Content Area: Tablet (Stacked) / Desktop (2-Column Grid) ── */}
                <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-8 pb-16">
                    {/* TABLET VIEW: 768px <= width < 1024px */}
                    <div className="lg:hidden space-y-8">
                        {/* Quick Access Row */}
                        <div className="space-y-3">
                            <h2 className="text-base font-bold text-foreground tracking-tight">
                                {t('home.quickAccess', 'Quick Access')}
                            </h2>
                            <div className="grid grid-cols-3 gap-4">
                                {quickAccessItems.map((item) => (
                                    <div
                                        key={item.label}
                                        onClick={() => navigate(item.to)}
                                        className="group rounded-2xl p-4 border bg-card border-border/80 shadow-xs hover:shadow-md hover:border-primary/40 transition-all duration-200 cursor-pointer flex flex-col justify-between"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", item.iconClass)}>
                                                {item.icon}
                                            </div>
                                            {item.badge && (
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-full text-xs font-bold border",
                                                    item.badgeVariant === 'warning'
                                                        ? "bg-warning-bg text-warning border-warning/30"
                                                        : "bg-success-bg text-success border-success/30"
                                                )}>
                                                    {item.badge}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                                                {item.label}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Newest Tasks Feed on Tablet */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between pb-1 border-b border-border/60">
                                <div className="flex items-center gap-2.5">
                                    <h2 className="text-lg font-bold text-foreground tracking-tight">
                                        {t('home.newestTasks', 'Newest Tasks')}
                                    </h2>
                                </div>
                                <Button
                                    variant="link"
                                    onClick={() => navigate('/inbox')}
                                    className="text-sm font-semibold hover:underline text-primary p-0 h-auto gap-1 cursor-pointer"
                                >
                                    <span>{t('home.viewAll', 'View All')}</span>
                                    <ArrowRight className="size-3.5" />
                                </Button>
                            </div>

                            {isInboxLoading ? (
                                <div className="space-y-3">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="rounded-2xl p-5 border border-border bg-card space-y-3">
                                            <Skeleton className="h-4 w-1/3" />
                                            <Skeleton className="h-4 w-3/4" />
                                        </div>
                                    ))}
                                </div>
                            ) : newestTasks.length === 0 ? (
                                <div className="rounded-2xl p-10 border text-center bg-card border-border shadow-xs space-y-3">
                                    <div className="w-14 h-14 rounded-2xl bg-success-bg border border-success/20 flex items-center justify-center mx-auto text-success">
                                        <CheckCircle2 className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-base font-bold text-foreground">
                                        {t('home.allCaughtUp', 'All caught up!')}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {t('home.noTasks', "No pending tasks. You're all caught up!")}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3.5">
                                    {newestTasks.map((task) => (
                                        <TaskCard
                                            key={task.instanceId}
                                            task={task}
                                            isSelected={false}
                                            onClick={() => navigate(`/inbox/${task.instanceId}`)}
                                            variant="desktop"
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* DESKTOP VIEW: width >= 1024px (2-Column Balanced Grid) */}
                    <div className="hidden lg:grid lg:grid-cols-12 lg:gap-8 items-start">
                        {/* Left: Newest Tasks Feed (8 cols) */}
                        <div className="lg:col-span-8 space-y-4">
                            <div className="flex items-center justify-between pb-1 border-b border-border/60">
                                <div className="flex items-center gap-2.5">
                                    <h2 className="text-lg font-bold text-foreground tracking-tight">
                                        {t('home.newestTasks', 'Newest Tasks')}
                                    </h2>
                                </div>
                                <Button
                                    variant="link"
                                    onClick={() => navigate('/inbox')}
                                    className="text-sm font-semibold hover:underline text-primary p-0 h-auto gap-1 cursor-pointer"
                                >
                                    <span>{t('home.viewAll', 'View All')}</span>
                                    <ArrowRight className="size-3.5" />
                                </Button>
                            </div>

                            {isInboxLoading ? (
                                <div className="space-y-3">
                                    {Array.from({ length: 3 }).map((_, i) => (
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

                        {/* Right: Quick Access Cards (4 cols) */}
                        <div className="lg:col-span-4 space-y-3">
                            <h2 className="text-lg font-bold text-foreground tracking-tight pb-1 border-b border-border/60">
                                {t('home.quickAccess', 'Quick Access')}
                            </h2>

                            <div className="flex flex-col gap-3">
                                {quickAccessItems.map((item, i) => (
                                    <motion.div
                                        key={item.label}
                                        initial={{ opacity: 0, x: 8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.2, delay: i * 0.04 }}
                                        onClick={() => navigate(item.to)}
                                        className="group rounded-2xl p-4 border bg-card border-border/80 shadow-2xs hover:shadow-md hover:border-primary/50 hover:bg-accent/30 transition-all duration-200 cursor-pointer flex items-center gap-3.5"
                                    >
                                        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105", item.iconClass)}>
                                            {item.icon}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                                                    {item.label}
                                                </p>
                                                {item.badge && (
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-full text-xs font-bold border",
                                                        item.badgeVariant === 'warning'
                                                            ? "bg-warning-bg text-warning border-warning/30"
                                                            : "bg-success-bg text-success border-success/30"
                                                    )}>
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                                {item.description}
                                            </p>
                                        </div>
                                        <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
