import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, Layers, type LucideIcon } from 'lucide-react';
import { Button, Skeleton } from '@cnma/react-ui';
import { AccountMenu } from '@/components/layouts/AccountMenu';
import { TaskCard } from '@/pages/Inbox/components/TaskCard';
import { HomeErrorState } from './HomeErrorState';
import { STAT_TONES, TASK_SKELETON_ROWS, type StatTone } from './homeTones';
import type { HomeViewProps } from './homePage.types';

interface MobileStatCardProps {
    tone: StatTone;
    icon: LucideIcon;
    label: string;
    value: number;
    isLoading: boolean;
    delay: number;
    onClick: () => void;
}

/** Half-width, tappable status card shown below the full-width Total Tasks card. */
function MobileStatCard({ tone, icon: Icon, label, value, isLoading, delay, onClick }: MobileStatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay }}
            className={`rounded-2xl px-4 py-4 flex items-center gap-3 cursor-pointer active:scale-[0.97] transition-transform ${tone.card} shadow-sm`}
            onClick={onClick}
        >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tone.iconBg}`}>
                <Icon className={`w-5 h-5 ${tone.text}`} />
            </div>
            <div className="min-w-0">
                <p className={`text-xs font-semibold leading-tight ${tone.text}`}>
                    {label}
                </p>
                <p className={`text-2xl font-extrabold leading-tight ${tone.text}`}>
                    {isLoading ? (
                        <Skeleton className="h-6 w-8 bg-current/20 inline-block rounded" />
                    ) : (
                        value
                    )}
                </p>
            </div>
        </motion.div>
    );
}

/**
 * MOBILE VIEW (< 768px)
 * Strictly retains original mobile styles, layout, structure, and cards.
 */
export function HomeMobileView({
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
                            <span className="text-lg font-bold text-primary-foreground">{displayName || ''}</span>
                        </p>
                        <p className="text-primary-foreground/70 text-xs mt-1">
                            {pendingSubtitle}
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
                    <MobileStatCard
                        tone={STAT_TONES.inApproving}
                        icon={Clock}
                        label={t('dashboard.statCards.inApproving', 'In Approving')}
                        value={stats.newTasks}
                        isLoading={isCountLoading}
                        delay={0.08}
                        onClick={() => navigate('/inbox')}
                    />

                    {/* Approved → Positive Green */}
                    <MobileStatCard
                        tone={STAT_TONES.completed}
                        icon={CheckCircle2}
                        label={t('dashboard.status.completed', 'Completed')}
                        value={stats.approved}
                        isLoading={isCountLoading}
                        delay={0.16}
                        onClick={() => navigate('/approved')}
                    />
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
                        {Array.from({ length: TASK_SKELETON_ROWS }).map((_, i) => (
                            <div
                                key={`skeleton-${i}`}
                                className="rounded-xl p-4 border border-border bg-card space-y-2"
                            >
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : homeError && newestTasks.length === 0 ? (
                    <HomeErrorState error={homeError} onRetry={onRetry} isRefreshing={isRefreshing} />
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
    );
}
