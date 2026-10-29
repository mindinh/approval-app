import { UserRound, LogOut } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '@cnma/react-ui';
import { UserAvatar } from '@/components/common/UserAvatar';
import { useCurrentUser } from '@/pages/Inbox/hooks/inboxQueries';
import { isWorkZone } from '@/utils/launchpad';

/** Account details stay available without occupying a separate header row. */
export function AccountMenu({ children, onViewProfile }: { children?: ReactNode; onViewProfile?: () => void }) {
    const { t } = useTranslation();
    const { data: user } = useCurrentUser();
    if (isWorkZone()) return null;
    const name = user?.displayName || user?.sapUser || user?.email;
    const initials = name?.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {children || <Button variant="ghost" size="icon" className="size-11 shrink-0 rounded-full" aria-label={t('nav.account')}>
                    <UserAvatar>{initials || <UserRound className="size-4" />}</UserAvatar>
                </Button>}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 max-w-full">
                <DropdownMenuLabel className="break-words">{name || t('nav.account')}</DropdownMenuLabel>
                {user?.email && user.email !== name && <DropdownMenuLabel className="text-xs font-normal text-muted-foreground break-all">{user.email}</DropdownMenuLabel>}
                <DropdownMenuSeparator />
                {onViewProfile && <DropdownMenuItem className="min-h-11" onSelect={onViewProfile}>
                    <UserRound className="size-4" />{t('profile.title')}
                </DropdownMenuItem>}
                <DropdownMenuItem className="min-h-11" onSelect={() => { window.location.href = '/do/logout'; }}>
                    <LogOut className="size-4" />{t('nav.logOut')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
