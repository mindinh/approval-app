import { AccountMenu } from './AccountMenu';
import { AppSidebarNavigation } from './AppSidebarNavigation';
import { UserAvatar } from '@/components/common/UserAvatar';
import * as React from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    LogOut,
    Bell,
} from 'lucide-react';
import { NotificationTestModal } from '@/components/modals/NotificationTestModal';
import { cn } from '@/utils/cn';
import {
    Button,
    SidebarProvider,
    useSidebar,
    SidebarHeader,
    SidebarFooter,
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Field,
    FieldLabel,
    FieldDescription,
} from '@cnma/react-ui';
import { useUserIdentity } from '@/pages/Inbox/hooks/useUserIdentity';
import { MobileNavProvider } from '@/contexts/MobileNavContext';
import { MobileBottomBar } from './MobileBottomBar';
import { isWorkZone } from '@/utils/launchpad';

// ── Reconstructed primitive Sidebar container with Style Bug Fix ───────────────────
interface SidebarWrapperProps extends React.ComponentProps<"div"> {
    side?: "left" | "right";
    variant?: "sidebar" | "floating" | "inset";
    collapsible?: "offcanvas" | "icon" | "none";
}

export const Sidebar = React.forwardRef<HTMLDivElement, SidebarWrapperProps>(
    (
        {
            side = "left",
            variant = "sidebar",
            collapsible = "icon",
            className,
            children,
            style,
            ...props
        },
        ref
    ) => {
        const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

        if (collapsible === "none") {
            return (
                <div
                    className={cn(
                        "flex h-full w-[var(--sidebar-width)] flex-col bg-sidebar text-sidebar-foreground",
                        className
                    )}
                    ref={ref}
                    style={style}
                    {...props}
                >
                    {children}
                </div>
            );
        }

        if (isMobile) {
            return null;
        }

        return (
            <div
                ref={ref}
                className="group peer hidden md:block text-sidebar-foreground"
                data-state={state}
                data-collapsible={state === "collapsed" ? collapsible : ""}
                data-variant={variant}
                data-side={side}
                style={style} // Critical Fix: Spreading/defining style on the outer div so spacer resolves w-[var(--sidebar-width)]
            >
                {/* Spacer element for Flex grid calculation */}
                <div
                    className={cn(
                        "duration-200 relative h-full w-[var(--sidebar-width)] bg-transparent transition-all ease-in-out",
                        "group-data-[collapsible=icon]:w-[var(--sidebar-width-icon)]",
                        "group-data-[side=right]:rotate-180",
                        variant === "floating" || variant === "inset"
                            ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+calc(var(--sidebar-gap)*2))]"
                            : ""
                    )}
                />
                {/* Actual Fixed Sidebar element */}
                <div
                    className={cn(
                        "duration-200 fixed inset-y-0 z-10 hidden h-full w-[var(--sidebar-width)] flex-col bg-sidebar transition-all ease-in-out md:flex",
                        side === "left"
                            ? "left-0 border-r border-sidebar-border"
                            : "right-0 border-l border-sidebar-border",
                        "group-data-[collapsible=icon]:w-[var(--sidebar-width-icon)]",
                        variant === "floating"
                            ? "m-2 h-[calc(100%-1rem)] rounded-xl border border-sidebar-border shadow"
                            : "",
                        className
                    )}
                    {...props}
                >
                    <div
                        data-sidebar="sidebar"
                        className="flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-xl"
                    >
                        {children}
                    </div>
                </div>
            </div>
        );
    }
);
Sidebar.displayName = "Sidebar";

// ── AppSidebar: Nav Menu and Profile Footer ───────────────────────────
function AppSidebar() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const { state, toggleSidebar, isMobile, setOpenMobile } = useSidebar();
    const isInWorkZone = isWorkZone();
    const [isProfileOpen, setIsProfileOpen] = React.useState(false);
    const { currentUser: userInfo, isResolving, error: identityError, retry: retryIdentity } = useUserIdentity({ resolveProfile: isProfileOpen });
    const sapUsernameLabelId = React.useId();
    const [isNotificationModalOpen, setIsNotificationModalOpen] = React.useState(false);

    const currentLang = i18n.language || 'en';
    const handleLanguageChange = (lang: string) => {
        i18n.changeLanguage(lang);
    };

    const rawFullName = userInfo?.firstName && userInfo?.lastName
        ? `${userInfo.firstName} ${userInfo.lastName}`
        : (userInfo?.displayName || 'User');
    const fullName = import.meta.env.DEV ? 'Local Development' : rawFullName;
    const roleName = userInfo?.role || 'Approver';
    const isAdmin = userInfo?.role === 'Admin' || import.meta.env.DEV;

    const initials = React.useMemo(() => {
        if (import.meta.env.DEV) {
            return 'LD';
        }
        if (userInfo?.firstName && userInfo?.lastName) {
            const firstInitial = userInfo.firstName.trim().charAt(0).toUpperCase();
            const lastInitial = userInfo.lastName.trim().charAt(0).toUpperCase();
            return `${firstInitial}${lastInitial}`;
        }
        if (userInfo?.displayName) {
            const names = userInfo.displayName.trim().split(/\s+/);
            if (names.length > 1) {
                const firstInitial = names[0].charAt(0).toUpperCase();
                const lastInitial = names[names.length - 1].charAt(0).toUpperCase();
                return `${firstInitial}${lastInitial}`;
            }
            return userInfo.displayName.trim().charAt(0).toUpperCase();
        }
        return 'U';
    }, [userInfo]);

    return (
        <Sidebar className="transition-[width] duration-200">
            {/* Header — hidden in WorkZone */}
            {!isInWorkZone && (
                <SidebarHeader className={cn('app-sidebar__header', state === 'collapsed' && !isMobile && 'app-sidebar__header--collapsed')}>
                    <div className="flex min-w-0 items-center gap-3">
                        <img src="./RESOURCE_FAVICON.png" alt={t('nav.applicationName')} className="app-sidebar__logo" />
                        {(state === "expanded" || isMobile) && (
                            <span className="app-sidebar__brand">{t('nav.applicationName')}</span>
                        )}
                    </div>
                </SidebarHeader>
            )}

            <AppSidebarNavigation isAdmin={isAdmin} />

            {!isMobile && (
                    <Button onClick={toggleSidebar} variant="ghost" size="icon"
                        className="app-sidebar__toggle"
                        aria-label={t(state === 'collapsed' ? 'nav.expandSidebar' : 'nav.collapseSidebar')}
                        title={t(state === 'collapsed' ? 'nav.expandSidebar' : 'nav.collapseSidebar')}
                        aria-expanded={state === 'expanded'}>
                        {state === 'collapsed' ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
                    </Button>
            )}

            {/* Footer User Profile — hidden in WorkZone */}
            {!isInWorkZone && (
                <>
                    <SidebarFooter className={cn(
                        "app-sidebar__footer",
                        (state === "collapsed" && !isMobile) && "app-sidebar__footer--collapsed"
                    )}>
                        <AccountMenu onViewProfile={() => setIsProfileOpen(true)}>
                        <Button
                            variant="ghost"
                            aria-label={t('nav.account')}
                            className={cn(
                                "app-sidebar__account",
                                state === "collapsed" && !isMobile && "app-sidebar__account--collapsed"
                            )}
                        >
                            <UserAvatar>
                                {initials}
                            </UserAvatar>
                            {(state === "expanded" || isMobile) && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-sidebar-foreground truncate">
                                        {fullName}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {roleName}
                                    </p>
                                </div>
                            )}
                            {(state === 'expanded' || isMobile) && <MoreHorizontal className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
                        </Button>
                        </AccountMenu>
                    </SidebarFooter>

                    <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                        <DialogContent className="max-w-sm rounded-lg overflow-hidden p-0 border border-sidebar-border bg-sidebar text-sidebar-foreground font-sans">
                            <DialogHeader className="p-6 border-b border-sidebar-border bg-sidebar-accent/10">
                                <DialogTitle className="text-base font-semibold">{t('profile.title', 'User Profile')}</DialogTitle>
                            </DialogHeader>

                            <div className="flex flex-col items-center justify-center p-6 border-b border-sidebar-border bg-sidebar-accent/20">
                                <UserAvatar className="size-16 text-2xl shadow-sm mb-3">
                                    {initials}
                                </UserAvatar>
                                <h3 className="text-lg font-semibold text-sidebar-foreground">{fullName}</h3>
                                <p className="text-xs text-muted-foreground font-medium bg-sidebar-primary/10 text-sidebar-primary px-3 py-1 rounded-full mt-2">{roleName}</p>
                            </div>

                            <div className="space-y-4 p-6">
                                <div className="grid grid-cols-3 gap-2 items-center">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('profile.email', 'Email')}</span>
                                    <span className="col-span-2 text-sm text-sidebar-foreground truncate" title={userInfo?.email}>{userInfo?.email || 'N/A'}</span>
                                </div>
                                <Field orientation="horizontal" className="grid grid-cols-3 gap-2 items-center">
                                    <FieldLabel id={sapUsernameLabelId} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('profile.sapUser')}</FieldLabel>
                                    <FieldDescription aria-labelledby={sapUsernameLabelId} aria-live="polite" className="col-span-2 min-w-0 break-words text-sm text-sidebar-foreground font-sans">
                                        {userInfo?.sapUsername || t(isResolving ? 'common.loading' : 'profile.sapUserUnavailable')}
                                    </FieldDescription>
                                </Field>
                                {identityError && !userInfo?.sapUsername && <Button variant="outline" size="sm" onClick={() => void retryIdentity()} disabled={isResolving}>
                                    {t('common.refresh')}
                                </Button>}
                                {/* <div className="grid grid-cols-3 gap-2 items-center pt-2 border-t border-sidebar-border/50">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('profile.language', 'Language')}</span>
                                    <div className="col-span-2 flex gap-2">
                                        <Button 
                                            variant={currentLang.startsWith('en') ? 'default' : 'outline'} 
                                            size="sm"
                                            onClick={() => handleLanguageChange('en')}
                                            className="px-3 h-8 text-xs font-medium cursor-pointer"
                                        >
                                            English
                                        </Button>
                                        <Button 
                                            variant={currentLang.startsWith('vi') ? 'default' : 'outline'} 
                                            size="sm"
                                            onClick={() => handleLanguageChange('vi')}
                                            className="px-3 h-8 text-xs font-medium cursor-pointer"
                                        >
                                            Tiếng Việt
                                        </Button>
                                    </div>
                                </div> */}
                                {!isMobile && isAdmin && (
                                    <div className="pt-2 border-t border-sidebar-border/50">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                 setIsProfileOpen(false);
                                                 navigate('/notification-tester');
                                            }}
                                            className="w-full flex items-center justify-center gap-2 text-xs font-medium cursor-pointer"
                                        >
                                            <Bell className="size-3.5 text-primary" />
                                            <span>Notification Console (Admin)</span>
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="p-4 border-t border-sidebar-border bg-sidebar-accent/10 flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsProfileOpen(false)}
                                    className="cursor-pointer"
                                >
                                    {t('common.close', 'Close')}
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => { window.location.href = '/do/logout'; }}
                                    className="cursor-pointer flex items-center gap-1.5"
                                >
                                    <LogOut className="h-3.5 w-3.5" />
                                    <span>{t('nav.logOut', 'Log out')}</span>
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </>
            )}

            {/* Notification Test Modal - Web & Admin only */}
            {!isMobile && isAdmin && (
                <NotificationTestModal
                    open={isNotificationModalOpen}
                    onOpenChange={setIsNotificationModalOpen}
                />
            )}
        </Sidebar>
    );
}

// ── MainLayout ─────────────────────────────────────────────────────────
export function MainLayout() {
    return (
        <SidebarProvider defaultOpen={false}>
            <MobileNavProvider>
                <div className="app-shell h-[100dvh] w-screen overflow-hidden flex bg-background">
                    {/* Global Unified App Sidebar */}
                    <AppSidebar />

                    {/* Main Routing Container */}
                    <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                        <main className="flex-1 min-h-0 overflow-hidden bg-background flex flex-col w-full">
                            <div className="flex-1 min-h-0 w-full h-full">
                                <Outlet />
                            </div>
                        </main>
                        {/* Mobile Persistent Bottom Navigation Bar */}
                        <MobileBottomBar />
                    </div>
                </div>
            </MobileNavProvider>
        </SidebarProvider>
    );
}
