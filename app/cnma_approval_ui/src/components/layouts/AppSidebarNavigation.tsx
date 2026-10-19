import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, ClipboardCheck, Home, Inbox, LayoutDashboard } from 'lucide-react';
import { SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from '@cnma/react-ui';
import { cn } from '@/lib/utils';

export function AppSidebarNavigation({ isAdmin }: { isAdmin: boolean }) {
    const { t } = useTranslation();
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const { state, isMobile, setOpenMobile } = useSidebar();
    const collapsed = state === 'collapsed' && !isMobile;
    const items = [
        { label: t('nav.home'), icon: Home, route: '/home', active: pathname === '/' || pathname === '/home' },
        { label: t('nav.myTasks'), icon: Inbox, route: '/inbox', active: pathname.startsWith('/inbox') || pathname.startsWith('/tasks') },
        { label: t('nav.approvedTasks'), icon: ClipboardCheck, route: '/approved', active: pathname.startsWith('/approved') },
        { label: t('nav.dashboard'), icon: LayoutDashboard, route: '/dashboard', active: pathname === '/dashboard' },
        ...(!isMobile && isAdmin ? [{ label: t('nav.notificationConsole'), icon: Bell, route: '/notification-tester', active: pathname.startsWith('/notification-tester') }] : []),
    ];

    return (
        <SidebarContent className={cn('app-sidebar__content', collapsed && 'app-sidebar__content--collapsed')}>
            <nav aria-label={t('nav.navigation')}>
                <SidebarMenu className="app-sidebar__menu">
                    {items.map(({ label, icon: Icon, route, active }) => (
                        <SidebarMenuItem key={route} className={cn(route === '/notification-tester' && 'app-sidebar__admin-item')}>
                            <SidebarMenuButton
                                isActive={active}
                                aria-current={active ? 'page' : undefined}
                                aria-label={label}
                                tooltip={label}
                                onClick={() => { if (isMobile) setOpenMobile(false); navigate(route); }}
                                className={cn('app-sidebar__link', collapsed && 'app-sidebar__link--collapsed')}
                            >
                                <Icon className="app-sidebar__icon" aria-hidden="true" />
                                {!collapsed && <span className="truncate">{label}</span>}
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </nav>
        </SidebarContent>
    );
}
