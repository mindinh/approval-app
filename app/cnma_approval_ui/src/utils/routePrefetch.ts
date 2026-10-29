import { queryClient } from '@/queryClient';
import { inboxApi } from '@/services/inbox/inbox.api';
import { inboxKeys } from '@/pages/Inbox/hooks/inboxKeys';
import { STALE } from '@/pages/Inbox/utils/constants';

/**
 * Normalizes a hash or pathname into a clean route path (e.g. "/inbox/43034").
 */
function normalizeRoute(rawRoute?: string | null): string {
    if (!rawRoute) return '/';
    const withoutHash = rawRoute.replace(/^#/, '').trim();
    if (!withoutHash) return '/';
    const pathOnly = withoutHash.split('?')[0] || '/';
    return pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
}

/**
 * Fires TanStack Query prefetches and Vite chunk preloads in parallel with
 * route transitions or initial app boot, eliminating the JS-bundle -> API waterfall.
 */
export function prefetchRouteData(rawRoute?: string | null): void {
    try {
        const route = normalizeRoute(rawRoute);

        // Always warm up current user profile once per session
        void queryClient.prefetchQuery({
            queryKey: inboxKeys.currentUser(),
            queryFn: () => inboxApi.getCurrentUser(),
            staleTime: Infinity,
        });

        if (route === '/' || route === '/home') {
            void import('../pages/Home/HomePage');
            void queryClient.prefetchQuery({
                queryKey: inboxKeys.statusCounts(),
                queryFn: ({ signal }) => inboxApi.getStatusCounts(signal),
                staleTime: 60_000,
            });
            void queryClient.prefetchQuery({
                queryKey: inboxKeys.tasks({ top: 5 }),
                queryFn: ({ signal }) => inboxApi.getTasks({ top: 5 }, signal),
                staleTime: 60_000,
            });
            return;
        }

        if (route.startsWith('/inbox') || route.startsWith('/tasks')) {
            void import('../pages/Inbox');
            void queryClient.prefetchQuery({
                queryKey: inboxKeys.categoryCounts('my'),
                queryFn: ({ signal }) => inboxApi.getCategoryCounts('my', signal),
                staleTime: 60_000,
            });
            const segments = route.split('/').filter(Boolean);
            const taskId = segments[1];
            if (taskId) {
                void queryClient.prefetchQuery({
                    queryKey: inboxKeys.taskDetail(taskId),
                    queryFn: ({ signal }) => inboxApi.getTaskDetail(taskId, signal),
                    staleTime: STALE.DETAIL,
                });
            }
            return;
        }

        if (route.startsWith('/approved')) {
            void import('../pages/Inbox');
            void queryClient.prefetchQuery({
                queryKey: inboxKeys.categoryCounts('approved'),
                queryFn: ({ signal }) => inboxApi.getCategoryCounts('approved', signal),
                staleTime: 60_000,
            });
            const segments = route.split('/').filter(Boolean);
            const taskId = segments[1];
            if (taskId) {
                void queryClient.prefetchQuery({
                    queryKey: inboxKeys.taskDetail(taskId),
                    queryFn: ({ signal }) => inboxApi.getTaskDetail(taskId, signal),
                    staleTime: STALE.DETAIL,
                });
            }
            return;
        }

        if (route.startsWith('/dashboard')) {
            void import('../pages/Dashboard/DashboardPage');
            const initialParams = {
                top: 50,
                skip: 0,
                category: undefined,
                documentType: undefined,
                status: undefined,
            };
            void queryClient.prefetchQuery({
                queryKey: [...inboxKeys.dashboard(), initialParams],
                queryFn: () => inboxApi.getDashboard(initialParams),
                staleTime: 5 * 60 * 1000,
            });
        }
    } catch {
        // Prefetch is strictly best-effort and must never interrupt rendering
    }
}
