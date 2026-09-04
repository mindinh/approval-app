import React, { createContext, useContext, useState, useMemo, useTransition } from 'react';
import { useLocation, matchPath } from 'react-router-dom';

interface MobileNavContextType {
    /** Whether the mobile bottom navigation bar should be visible */
    isBottomBarVisible: boolean;
    /** Allows child components (e.g. Mass Selection mode) to request hiding the bottom bar */
    setHideBottomBar: (hide: boolean) => void;
    /** Whether hide was explicitly requested by a component */
    hideBottomBarRequested: boolean;
    /** Current route category */
    currentTab: 'home' | 'my' | 'approved' | 'dashboard' | 'other';
}

const MobileNavContext = createContext<MobileNavContextType | undefined>(undefined);

export function isTaskDetailPath(pathname: string): boolean {
    return Boolean(
        matchPath({ path: '/inbox/:taskId', end: true }, pathname) ||
        matchPath({ path: '/approved/:taskId', end: true }, pathname) ||
        matchPath({ path: '/tasks/:taskId', end: true }, pathname) ||
        matchPath({ path: '/inbox/:taskId/*', end: false }, pathname) ||
        matchPath({ path: '/approved/:taskId/*', end: false }, pathname) ||
        matchPath({ path: '/tasks/:taskId/*', end: false }, pathname)
    );
}

export function resolveNavTab(pathname: string): 'home' | 'my' | 'approved' | 'dashboard' | 'other' {
    if (pathname === '/' || pathname === '/home') return 'home';
    if (pathname.startsWith('/inbox') || pathname.startsWith('/tasks')) return 'my';
    if (pathname.startsWith('/approved')) return 'approved';
    if (pathname.startsWith('/dashboard')) return 'dashboard';
    return 'other';
}

export function MobileNavProvider({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const [hideBottomBarRequested, setHideBottomBarRequested] = useState(false);
    const [, startTransition] = useTransition();

    const setHideBottomBar = React.useCallback((hide: boolean) => {
        startTransition(() => {
            setHideBottomBarRequested(hide);
        });
    }, []);

    // Check if current route is a task detail drill-down (e.g. /inbox/:taskId, /approved/:taskId, /tasks/:taskId)
    const isTaskDetailRoute = useMemo(() => isTaskDetailPath(location.pathname), [location.pathname]);

    // Determine current active navigation tab
    const currentTab = useMemo<'home' | 'my' | 'approved' | 'dashboard' | 'other'>(
        () => resolveNavTab(location.pathname),
        [location.pathname]
    );

    // Mutual Exclusivity: Hide bottom navigation if we are inside task detail OR if requested (mass selection)
    const isBottomBarVisible = !isTaskDetailRoute && !hideBottomBarRequested;

    const value = useMemo(
        () => ({
            isBottomBarVisible,
            setHideBottomBar,
            hideBottomBarRequested,
            currentTab,
        }),
        [isBottomBarVisible, setHideBottomBar, hideBottomBarRequested, currentTab]
    );

    return <MobileNavContext.Provider value={value}>{children}</MobileNavContext.Provider>;
}

export function useMobileNav(): MobileNavContextType {
    const context = useContext(MobileNavContext);
    if (!context) {
        throw new Error('useMobileNav must be used within a MobileNavProvider');
    }
    return context;
}
