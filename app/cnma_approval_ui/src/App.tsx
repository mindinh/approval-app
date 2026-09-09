import { Routes, Route, HashRouter, useNavigate, useLocation } from 'react-router-dom';
import { useFLPSyncDirect, getInitialFLPRoute, subscribeFLPRoute } from './hooks/useFLPSync';
import { useRef, useEffect, lazy, Suspense } from 'react';
import { MainLayout } from './components/layouts/MainLayout';
import { Toaster } from '@cnma/react-ui';
import { PwaInstallBanner } from './components/PwaInstallBanner';

// Lazy load pages for code-splitting
const HomePage = lazy(() => import('./pages/Home/HomePage'));
const InboxPage = lazy(() => import('./pages/Inbox'));
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage'));
const NotFoundPage = lazy(() => import('./pages/NotFound/NotFoundPage'));

import HomeSkeleton from './components/skeletons/HomeSkeleton';
import InboxSkeleton from './components/skeletons/InboxSkeleton';
import DashboardSkeleton from './components/skeletons/DashboardSkeleton';

// Component to sync React Router with FLP shell URL
function ShellSync() {
    useFLPSyncDirect();
    return null;
}

// Component to navigate to initial route from FLP hash on app load and sync external address bar changes
function InitialRouteNavigator() {
    const navigate = useNavigate();
    const location = useLocation();
    const currentPathRef = useRef(location.pathname);
    currentPathRef.current = location.pathname;

    useEffect(() => {
        // 1. Immediate sync if available on startup (direct parent access or standalone)
        const initialRoute = getInitialFLPRoute();
        console.log('[App] Initial FLP route on mount:', initialRoute);
        if (initialRoute && initialRoute !== '/' && initialRoute !== currentPathRef.current) {
            navigate(initialRoute, { replace: true });
        }

        // 2. Subscribe to external FLP route updates (e.g. user edits browser address bar and hits Enter)
        const unsubscribe = subscribeFLPRoute((route) => {
            if (!route || route === '/' || route === currentPathRef.current) return;
            console.log('[App] External address bar or FLP route changed to:', route);
            navigate(route);
        });

        return unsubscribe;
    }, [navigate]);

    return null;
}



export default function App() {
    return (
        <HashRouter>
            <ShellSync />
            <InitialRouteNavigator />
            <div className="min-h-screen bg-background">
                <PwaInstallBanner />
                <Routes>
                    <Route element={<MainLayout />}>
                        {/* Home is the main landing page */}
                        <Route path="/" element={
                            <Suspense fallback={<HomeSkeleton />}>
                                <HomePage />
                            </Suspense>
                        } />
                        <Route path="/home" element={
                            <Suspense fallback={<HomeSkeleton />}>
                                <HomePage />
                            </Suspense>
                        } />
                        <Route path="/inbox" element={
                            <Suspense fallback={<InboxSkeleton />}>
                                <InboxPage />
                            </Suspense>
                        } />
                        <Route path="/inbox/:taskId" element={
                            <Suspense fallback={<InboxSkeleton />}>
                                <InboxPage />
                            </Suspense>
                        } />
                        <Route path="/approved" element={
                            <Suspense fallback={<InboxSkeleton />}>
                                <InboxPage />
                            </Suspense>
                        } />
                        <Route path="/approved/:taskId" element={
                            <Suspense fallback={<InboxSkeleton />}>
                                <InboxPage />
                            </Suspense>
                        } />
                        {/* Backward compatibility for direct task links */}
                        <Route path="/tasks/:taskId" element={
                            <Suspense fallback={<InboxSkeleton />}>
                                <InboxPage />
                            </Suspense>
                        } />
                        <Route path="/dashboard" element={
                            <Suspense fallback={<DashboardSkeleton />}>
                                <DashboardPage />
                            </Suspense>
                        } />
                        {/* Fallback 404 Not Found route */}
                        <Route path="*" element={
                            <Suspense fallback={<HomeSkeleton />}>
                                <NotFoundPage />
                            </Suspense>
                        } />
                    </Route>
                </Routes>
                <Toaster
                    position="top-left"
                    closeButton
                    richColors
                    expand={true}
                    gap={1}
                    toastOptions={{
                        style: {
                            border: 'none',
                            borderLeft: 'none',
                            borderRight: 'none',
                            borderTop: 'none',
                            borderBottom: 'none',
                            outline: 'none',
                            boxShadow: '0 4px 14px 0 rgba(0, 0, 0, 0.1)',
                        },
                    }}
                />
            </div>
        </HashRouter>
    );
}
