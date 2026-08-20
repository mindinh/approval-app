import * as React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    ClipboardCheck,
    ChevronLeft,
    ChevronRight,
    Inbox,
    LayoutDashboard,
    LogOut,
    Home
} from 'lucide-react';
import { cn } from '@/utils/cn';
import {
    Button,
    SidebarProvider,
    useSidebar,
    Sheet,
    SheetContent,
    SidebarHeader,
    SidebarContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@cnma/react-ui';
import { useCurrentUser } from '@/pages/Inbox/hooks/inboxQueries';

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
            return (
                <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
                    <SheetContent
                        data-sidebar="sidebar"
                        data-mobile="true"
                        className="w-[var(--sidebar-width)] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden border-r border-sidebar-border h-[100dvh] pt-safe pb-safe"
                        side={side}
                    >
                        <div className="flex h-full w-full flex-col">{children}</div>
                    </SheetContent>
                </Sheet>
            );
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
    const location = useLocation();
    const { t, i18n } = useTranslation();
    const { state, toggleSidebar, isMobile, setOpenMobile } = useSidebar();
    const { data: userInfo } = useCurrentUser();
    const isInWorkZone = typeof window !== 'undefined' && window.parent !== window;
    const [isProfileOpen, setIsProfileOpen] = React.useState(false);

    const currentLang = i18n.language || 'en';
    const handleLanguageChange = (lang: string) => {
        i18n.changeLanguage(lang);
    };

    const rawFullName = userInfo?.firstName && userInfo?.lastName
        ? `${userInfo.firstName} ${userInfo.lastName}`
        : (userInfo?.displayName || 'User');
    const fullName = import.meta.env.DEV ? 'Local Development' : rawFullName;
    const roleName = userInfo?.role || 'Approver';

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

    const [localActiveTab, setLocalActiveTab] = React.useState<string | null>(null);

    React.useEffect(() => {
        setLocalActiveTab(null);
    }, [location.pathname]);

    const isDashboard = location.pathname === '/dashboard';
    const isHome = location.pathname === '/' || location.pathname === '/home';
    const isInbox = location.pathname.startsWith('/inbox') || location.pathname.startsWith('/tasks');
    const isApproved = location.pathname.startsWith('/approved');

    // Determine active navigation state
    let activeValue = localActiveTab || 'my';
    if (!localActiveTab) {
        if (isDashboard) {
            activeValue = 'dashboard';
        } else if (isHome) {
            activeValue = 'home';
        } else if (isApproved) {
            activeValue = 'approved';
        } else if (isInbox) {
            activeValue = 'my';
        }
    }

    const items = [
        { value: 'home', label: t('nav.home', 'Home'), icon: Home, route: '/home', mobileOnly: true },
        { value: 'my', label: t('nav.myTasks', 'My Tasks'), icon: Inbox, route: '/inbox' },
        { value: 'approved', label: t('nav.approvedTasks', 'Approved Tasks'), icon: ClipboardCheck, route: '/approved' },
        { value: 'dashboard', label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard, route: '/dashboard' },
    ];

    // Filter items based on viewport type
    const filteredItems = items.filter(item => !item.mobileOnly || isMobile);

    const handleNavItemClick = (item: typeof items[0]) => {
        setLocalActiveTab(item.value);
        if (isMobile) {
            setOpenMobile(false);
        }
        navigate(item.route);
    };

    return (
        <Sidebar className="transition-all duration-300">
            {/* Header — hidden in WorkZone */}
            {!isInWorkZone && (
                <SidebarHeader className="p-4 flex-shrink-0 flex items-center justify-between border-b border-sidebar-border h-14">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                        <img src="./RESOURCE_FAVICON.png" alt="Logo" className="w-6 h-6 shrink-0 rounded-sm" />
                        {(state === "expanded" || isMobile) && (
                            <span className="text-sm font-bold tracking-wide text-sidebar-foreground truncate">prorequest</span>
                        )}
                    </div>
                </SidebarHeader>
            )}

            {/* Content */}
            <SidebarContent className={cn("flex-1 overflow-y-auto", (state === "collapsed" && !isMobile) ? "p-2" : "p-3")}>
                <SidebarMenu className="space-y-1">
                    {filteredItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeValue === item.value;

                        return (
                            <SidebarMenuItem key={item.value}>
                                <SidebarMenuButton
                                    isActive={isActive}
                                    onClick={() => handleNavItemClick(item)}
                                    className={cn(
                                        "w-full flex items-center rounded-lg py-2 text-sm transition-all duration-200 h-auto cursor-pointer",
                                        (state === "collapsed" && !isMobile) ? "justify-center p-2" : "gap-2.5 px-3",
                                        isActive
                                            ? "data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground shadow-sm data-[active=true]:hover:bg-sidebar-primary data-[active=true]:hover:text-sidebar-primary-foreground"
                                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                    )}
                                    title={(state === "collapsed" && !isMobile) ? item.label : undefined}
                                >
                                    <Icon className={cn(
                                        "size-4 shrink-0",
                                        isActive
                                            ? "text-sidebar-primary-foreground"
                                            : "text-sidebar-foreground"
                                    )} />
                                    {(state === "expanded" || isMobile) && (
                                        <span className="truncate font-medium">{item.label}</span>
                                    )}
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarContent>

            {/* Footer User Profile — hidden in WorkZone */}
            {!isInWorkZone && (
                <>
                    <SidebarFooter className={cn(
                        "border-t border-sidebar-border flex-shrink-0",
                        (state === "collapsed" && !isMobile) ? "p-3 flex items-center justify-center" : "p-2"
                    )}>
                        <Button
                            variant="ghost"
                            onClick={() => setIsProfileOpen(true)}
                            className={cn(
                                "group/profile flex items-center gap-3 transition-all duration-200 text-left cursor-pointer hover:bg-transparent hover:text-sidebar-foreground",
                                (state === "collapsed" && !isMobile)
                                    ? "justify-center p-0 w-10 h-10"
                                    : "w-full p-1.5 h-auto"
                            )}
                        >
                            <div className="w-8 h-8 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center font-bold text-xs shrink-0 border border-sidebar-border group-hover/profile:ring-2 group-hover/profile:ring-primary/40 group-hover/profile:scale-105 transition-all duration-200">
                                {initials}
                            </div>
                            {(state === "expanded" || isMobile) && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                                        {fullName}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {roleName}
                                    </p>
                                </div>
                            )}
                        </Button>
                    </SidebarFooter>

                    <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                        <DialogContent className="max-w-sm rounded-lg overflow-hidden p-0 border border-sidebar-border bg-sidebar text-sidebar-foreground">
                            <DialogHeader className="p-6 border-b border-sidebar-border bg-sidebar-accent/10">
                                <DialogTitle className="text-base font-semibold">{t('profile.title', 'User Profile')}</DialogTitle>
                            </DialogHeader>

                            <div className="flex flex-col items-center justify-center p-6 border-b border-sidebar-border bg-sidebar-accent/20">
                                <div className="w-16 h-16 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center font-bold text-2xl border border-sidebar-border shadow-sm mb-3">
                                    {initials}
                                </div>
                                <h3 className="text-lg font-semibold text-sidebar-foreground">{fullName}</h3>
                                <p className="text-xs text-muted-foreground font-medium bg-sidebar-primary/10 text-sidebar-primary px-3 py-1 rounded-full mt-2">{roleName}</p>
                            </div>

                            <div className="space-y-4 p-6">
                                <div className="grid grid-cols-3 gap-2 items-center">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('profile.email', 'Email')}</span>
                                    <span className="col-span-2 text-sm text-sidebar-foreground truncate" title={userInfo?.email}>{userInfo?.email || 'N/A'}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 items-center">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('profile.sapUser', 'SAP User')}</span>
                                    <span className="col-span-2 text-sm text-sidebar-foreground font-mono truncate">{userInfo?.sapUser || userInfo?.id || 'N/A'}</span>
                                </div>
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

            {/* Floating Collapse toggle button */}
            {!isMobile && (
                <Button
                    onClick={toggleSidebar}
                    variant="ghost"
                    size="icon"
                    className="absolute right-[-12px] top-6 z-30 hidden h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm hover:bg-sidebar-accent md:flex cursor-pointer p-0"
                    title={state === "collapsed" ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {state === "collapsed" ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
                </Button>
            )}
        </Sidebar>
    );
}

// ── MainLayout ─────────────────────────────────────────────────────────
export function MainLayout() {
    return (
        <SidebarProvider defaultOpen={false}>
            <div className="h-[100dvh] w-screen overflow-hidden flex bg-background">
                {/* Global Unified App Sidebar */}
                <AppSidebar />

                {/* Main Routing Container */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                    <main className="flex-1 min-h-0 overflow-hidden bg-background flex flex-col w-full">
                        <div className="flex-1 min-h-0 w-full">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}
