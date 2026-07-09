import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    Clock,
    CheckCircle2,
    Menu,
    BarChart3,
    Inbox,
    CheckCheck,
    ChevronRight,
    Layers,
} from 'lucide-react';
import { useIsMobile, useSidebar, Button, Skeleton } from '@cnma/react-ui';
import { useDashboardQuery, normalizeDashboardStatus } from '@/pages/Dashboard/use-dashboard-data';
import type { DashboardTask, InboxTask } from '@/services/inbox/inbox.types';
import { TaskCard } from '@/pages/Inbox/components/TaskCard';
import { useTasks, useApprovedTasks, useCurrentUser } from '@/pages/Inbox/hooks/inboxQueries';

/**
 * HomePage — Mobile-only landing page.
 * On desktop, redirects to /inbox automatically.
 * Shows: gradient header, stat cards (Total/New/Approved), top-5 newest tasks, quick access grid.
 */
export default function HomePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const { setOpenMobile } = useSidebar();
    const { data: userInfo } = useCurrentUser();

    // Redirect desktop users to inbox — home page is mobile-only
    useEffect(() => {
        const isMobileViewport = window.innerWidth < 768;
        if (!isMobileViewport) {
            navigate('/inbox', { replace: true });
        }
    }, [navigate]);

    // Reuse the dashboard query for real stats and task data
    const { data: dashboardData, isLoading } = useDashboardQuery();
    const tasks: DashboardTask[] = dashboardData?.items ?? [];

    // Query approved/completed tasks to get the count of completed tasks from the instance list
    const { data: approvedTasksData, isLoading: isApprovedLoading } = useApprovedTasks();
    const approvedCount = approvedTasksData?.total ?? 0;

    // Compute stats
    const stats = useMemo(() => {
        const newTasks = tasks.filter(
            (t) => normalizeDashboardStatus(t.status) === 'In Approving'
        ).length;
        const approved = approvedCount;
        const totalTasks = newTasks + approved;
        return { totalTasks, newTasks, approved };
    }, [tasks, approvedCount]);

    // Real My Inbox Task data for Newest Tasks feed
    const { data: inboxData, isLoading: isInboxLoading } = useTasks();
    const newestTasks: InboxTask[] = useMemo(() => {
        const rawItems = inboxData?.items || [];
        return [...rawItems]
            .sort((a, b) => {
                const dateA = a.createdOn ? new Date(a.createdOn).getTime() : 0;
                const dateB = b.createdOn ? new Date(b.createdOn).getTime() : 0;
                return dateB - dateA;
            })
            .slice(0, 5);
    }, [inboxData?.items]);

    const quickAccessItems = [
        {
            icon: <Inbox className="w-6 h-6" />,
            iconClass: 'text-warning bg-warning-bg',
            label: t('nav.myTasks', 'My Tasks'),
            to: '/inbox',
            state: { scope: 'my' },
        },
        {
            icon: <CheckCheck className="w-6 h-6" />,
            iconClass: 'text-success bg-success-bg',
            label: t('nav.approvedTasks', 'Approved Tasks'),
            to: '/inbox',
            state: { scope: 'approved' },
        },
        {
            icon: <BarChart3 className="w-6 h-6" />,
            iconClass: 'text-info bg-info-bg',
            label: t('nav.dashboard', 'Dashboard'),
            to: '/dashboard',
            state: undefined,
        },
    ];

    // Desktop: don't render (redirect in effect handles it)
    if (!isMobile) return null;

    return (
        <div className="min-h-screen bg-background">
                {/* ── Gradient Header ────────────────────────── */}
                <div
                    className="relative px-5 pt-5 pb-16 bg-gradient-to-br from-primary to-primary-hover"
                >
                    {/* Hamburger */}
                    <div className="flex items-center justify-between mb-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setOpenMobile(true)}
                            className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors hover:bg-white/10 active:bg-white/20 p-0"
                            aria-label="Open navigation menu"
                        >
                            <Menu size={22} className="text-white" />
                        </Button>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <p className="text-white/80 text-base font-medium">
                            {t('home.welcomeBack', 'Welcome back')},{' '}
                            <span className="text-white font-bold text-lg">{userInfo?.displayName || 'User'}</span>
                        </p>
                        <p className="text-white/60 text-xs mt-1">
                            {stats.newTasks > 0
                                ? t('home.pendingApprovals', { count: stats.newTasks, defaultValue: `${stats.newTasks} pending approvals` })
                                : t('home.allCaughtUp', 'All caught up! No pending approvals')}
                        </p>
                    </motion.div>
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
                        <div
                            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-marketing-info-blue-border"
                        >
                            <Layers className="w-6 h-6 text-marketing-info-blue" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-marketing-info-blue">
                                {t('home.totalTasks', 'Total Tasks')}
                            </p>
                            <p className="text-3xl font-extrabold leading-tight text-marketing-info-blue">
                                {isLoading || isApprovedLoading ? (
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
                            onClick={() => navigate('/inbox', { state: { scope: 'my' } })}
                        >
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-marketing-attention-border"
                            >
                                <Clock className="w-5 h-5 text-marketing-attention" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold leading-tight text-marketing-attention">
                                    {t('dashboard.statCards.inApproving', 'In Approving')}
                                </p>
                                <p className="text-2xl font-extrabold leading-tight text-marketing-attention">
                                    {isLoading ? (
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
                            onClick={() => navigate('/inbox', { state: { scope: 'approved' } })}
                        >
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-marketing-positive-border"
                            >
                                <CheckCircle2 className="w-5 h-5 text-marketing-positive" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold leading-tight text-marketing-positive">
                                    {t('dashboard.statCards.approved', 'Approved')}
                                </p>
                                <p className="text-2xl font-extrabold leading-tight text-marketing-positive">
                                    {isLoading || isApprovedLoading ? (
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
                            onClick={() => navigate('/inbox', { state: { scope: 'my' } })}
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
                        <div
                            className="rounded-xl p-8 border text-center bg-card border-border shadow-md"
                        >
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
                                        onClick={() => navigate(`/tasks/${task.instanceId}`, { state: { scope: 'my' } })}
                                        variant="mobile"
                                    />
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Quick Access ───────────────────────────── */}
                <div className="px-4 mt-6 pb-8">
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
                                onClick={() => navigate(item.to, item.state ? { state: item.state } : undefined)}
                                className="rounded-xl p-4 border text-center hover:shadow-lg active:scale-[0.97] transition-all bg-card border-border shadow-md"
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
        );
}
