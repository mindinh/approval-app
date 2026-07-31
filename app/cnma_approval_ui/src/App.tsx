import { Routes, Route, HashRouter, useNavigate } from 'react-router-dom';
import { useFLPSyncDirect, getInitialFLPRoute } from './hooks/useFLPSync';
import { useRef, useEffect, lazy, Suspense } from 'react';
import { MainLayout } from './components/layouts/MainLayout';
import { Toaster } from '@cnma/react-ui';
import { PwaInstallBanner } from './components/PwaInstallBanner';

// Lazy load pages for code-splitting
const HomePage = lazy(() => import('./pages/Home/HomePage'));
const InboxPage = lazy(() => import('./pages/Inbox'));
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage'));

import HomeSkeleton from './components/skeletons/HomeSkeleton';
import InboxSkeleton from './components/skeletons/InboxSkeleton';
import DashboardSkeleton from './components/skeletons/DashboardSkeleton';

// Component to sync React Router with FLP shell URL
function ShellSync() {
    useFLPSyncDirect();
    return null;
}

// Component to navigate to initial route from FLP hash on app load
function InitialRouteNavigator() {
    const navigate = useNavigate();
    const hasNavigated = useRef(false);

    useEffect(() => {
        if (hasNavigated.current) return;
        hasNavigated.current = true;

        const initialRoute = getInitialFLPRoute();
        console.log("[App] Initial FLP route:", initialRoute);

        if (initialRoute && initialRoute !== "/") {
            console.log("[App] Navigating to initial route:", initialRoute);
            navigate(initialRoute, { replace: true });
        }
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
                    </Route>
                </Routes>
                <Toaster position="top-left" closeButton />
            </div>
        </HashRouter>
    );
}
