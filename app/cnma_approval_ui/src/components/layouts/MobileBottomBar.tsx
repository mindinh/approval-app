import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Inbox, ClipboardCheck, LayoutDashboard } from 'lucide-react';
import { useIsMobile } from '@cnma/react-ui';
import { useMobileNav } from '@/contexts/MobileNavContext';
import { useTasks } from '@/pages/Inbox/hooks/inboxQueries';
import { cn } from '@/lib/utils';

export function MobileBottomBar() {
    const isMobile = useIsMobile();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { isBottomBarVisible, currentTab } = useMobileNav();

    // Query pending task count for the badge
    const { data: myTasksData } = useTasks({ enabled: isMobile });
    const pendingCount = myTasksData?.total ?? 0;

    if (!isMobile) return null;

    const navItems = [
        {
            key: 'home',
            label: t('nav.home', 'Home'),
            icon: Home,
            route: '/home',
            badge: null,
        },
        {
            key: 'my',
            label: t('nav.myTasks', 'My Tasks'),
            icon: Inbox,
            route: '/inbox',
            badge: pendingCount > 0 ? (pendingCount > 99 ? '99+' : pendingCount) : null,
        },
        {
            key: 'approved',
            label: t('nav.approvedTasks', 'Approved'),
            icon: ClipboardCheck,
            route: '/approved',
            badge: null,
        },
        {
            key: 'dashboard',
            label: t('nav.dashboard', 'Dashboard'),
            icon: LayoutDashboard,
            route: '/dashboard',
            badge: null,
        },
    ];

    return (
        <AnimatePresence>
            {isBottomBarVisible && (
                <motion.nav
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                    aria-label="Mobile Bottom Navigation"
                    className={cn(
                        "fixed bottom-0 inset-x-0 z-30",
                        "bg-card/95 backdrop-blur-xl border-t border-border/70 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]",
                        "h-[var(--mobile-bottom-nav-height)] pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] pt-1.5 px-3",
                        "flex items-center justify-around select-none"
                    )}
                >
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentTab === item.key;

                        return (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => navigate(item.route)}
                                className={cn(
                                    "relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl",
                                    "cursor-pointer active:scale-90 transition-transform duration-150 focus-visible:outline-none",
                                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <div className="relative flex items-center justify-center">
                                    {/* Active animated background pill */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="mobile-nav-pill"
                                            className="absolute -inset-x-3.5 -inset-y-1 bg-primary/10 rounded-full -z-10"
                                            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                                        />
                                    )}

                                    <Icon
                                        className={cn(
                                            "size-5 transition-transform duration-150",
                                            isActive && "scale-110 stroke-[2.25]"
                                        )}
                                    />

                                    {/* Notification Counter Badge */}
                                    {item.badge !== null && (
                                        <span className="absolute -top-1.5 -right-3 flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[10px] font-bold bg-primary text-primary-foreground shadow-xs ring-2 ring-card">
                                            {item.badge}
                                        </span>
                                    )}
                                </div>

                                <span
                                    className={cn(
                                        "text-[10px] font-semibold mt-1 tracking-tight leading-tight truncate",
                                        isActive ? "text-primary font-bold" : "text-muted-foreground"
                                    )}
                                >
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </motion.nav>
            )}
        </AnimatePresence>
    );
}
