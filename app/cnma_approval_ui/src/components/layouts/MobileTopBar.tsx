import React from 'react';
import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@cnma/react-ui';
import { useCurrentUser } from '@/pages/Inbox/hooks/inboxQueries';
import { cn } from '@/lib/utils';

interface MobileTopBarProps {
    title?: string;
    className?: string;
    /** If true, renders without outer background / safe-area padding (e.g. inside HomePage gradient banner) */
    embedded?: boolean;
}

export function MobileTopBar({ title, className, embedded = false }: MobileTopBarProps) {
    const { t } = useTranslation();
    const { data: userInfo } = useCurrentUser();

    const userEmail = userInfo?.email || (userInfo?.sapUser ? `${userInfo.sapUser}` : (userInfo?.displayName || 'user@company.com'));

    const initials = React.useMemo(() => {
        if (userInfo?.firstName && userInfo?.lastName) {
            return `${userInfo.firstName.charAt(0)}${userInfo.lastName.charAt(0)}`.toUpperCase();
        }
        if (userInfo?.displayName) {
            const parts = userInfo.displayName.trim().split(/\s+/);
            if (parts.length > 1) {
                return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
            }
            return userInfo.displayName.charAt(0).toUpperCase();
        }
        if (userInfo?.email) {
            return userInfo.email.charAt(0).toUpperCase();
        }
        return 'U';
    }, [userInfo]);

    const handleLogout = () => {
        window.location.href = '/do/logout';
    };

    if (embedded) {
        return (
            <div className={cn("flex items-center justify-between gap-2 mb-3", className)}>
                <div className="flex items-center gap-2 min-w-0 flex-1 max-w-[70%]">
                    <div className="size-7 rounded-full bg-white/20 text-white font-bold text-xs flex items-center justify-center shrink-0 border border-white/30 shadow-2xs">
                        {initials}
                    </div>
                    <span className="text-xs font-medium text-white/90 truncate tracking-tight" title={userEmail}>
                        {userEmail}
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-white hover:bg-white/15 active:bg-white/25 text-xs font-semibold gap-1.5 h-8 px-2.5 rounded-lg shrink-0 transition-colors cursor-pointer"
                    title={t('nav.logOut', 'Log out')}
                >
                    <LogOut className="size-3.5" />
                    <span>{t('nav.logOut', 'Log out')}</span>
                </Button>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 flex items-center justify-between shadow-xs relative z-20 shrink-0 min-h-[52px]",
                className
            )}
            style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)' }}
        >
            <div className="flex items-center gap-2 min-w-0 flex-1 max-w-[70%]">
                <div className="size-7 rounded-full bg-white/20 text-white font-bold text-xs flex items-center justify-center shrink-0 border border-white/30 shadow-2xs">
                    {initials}
                </div>
                <div className="flex flex-col min-w-0">
                    {title && (
                        <span className="text-xs font-bold text-white leading-tight truncate">
                            {title}
                        </span>
                    )}
                    <span
                        className={cn(
                            "text-xs font-medium text-white/90 truncate tracking-tight",
                            title && "text-[11px] text-white/75"
                        )}
                        title={userEmail}
                    >
                        {userEmail}
                    </span>
                </div>
            </div>

            <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-white hover:bg-white/15 active:bg-white/25 text-xs font-semibold gap-1.5 h-8 px-2.5 rounded-lg shrink-0 transition-colors cursor-pointer"
                title={t('nav.logOut', 'Log out')}
            >
                <LogOut className="size-3.5" />
                <span>{t('nav.logOut', 'Log out')}</span>
            </Button>
        </div>
    );
}
