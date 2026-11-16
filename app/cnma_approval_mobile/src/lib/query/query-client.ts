import NetInfo from '@react-native-community/netinfo';
import { QueryClient, focusManager, onlineManager } from '@tanstack/react-query';
import { AppState } from 'react-native';
import { ApiError } from '@/lib/api/http-client';

const MAX_RETRIES = 1;
/** Client errors worth another try: request timeout and rate limiting. */
const RETRYABLE_4XX = new Set([408, 429]);

/**
 * Network errors are not retried here: the offline screen shows at once and TanStack refetches when the
 * connection returns (onlineManager). Other 4xx will not succeed on retry; timeouts and 5xx get one more try.
 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
    if (error instanceof ApiError) {
        if (error.code === 'NETWORK_ERROR' || error.code === 'UNAUTHORIZED') return false;
        if (error.status >= 400 && error.status < 500 && !RETRYABLE_4XX.has(error.status)) return false;
    }
    return failureCount < MAX_RETRIES;
}

/** 1 s, then 2 s … capped at 8 s. */
const retryDelay = (attempt: number) => Math.min(1000 * 2 ** attempt, 8000);

/**
 * In-memory only: business data is never persisted to disk (security decision, see the mobile guide §7.2).
 *
 * Queries run in `offlineFirst` mode: the first request always goes out, so an offline user gets the
 * friendly "No connection" state instead of an endless skeleton, and failed queries refetch on reconnect.
 * Mutations (decisions, comments) never retry and never wait for the network: a write must fail visibly.
 */
export function createQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: { retry: shouldRetry, retryDelay, staleTime: 30_000, networkMode: 'offlineFirst' },
            mutations: { retry: 0, networkMode: 'always' },
        },
    });
}

/** Refetch stale queries when the app returns to the foreground; pause them in the background. */
export function subscribeAppStateFocus(): () => void {
    const subscription = AppState.addEventListener('change', (state) => focusManager.setFocused(state === 'active'));
    return () => subscription.remove();
}

/** React Native has no `online` event: feed TanStack's onlineManager from NetInfo (refetch on reconnect). */
export function subscribeNetworkStatus(): () => void {
    onlineManager.setEventListener((setOnline) => NetInfo.addEventListener((state) => setOnline(state.isConnected !== false)));
    return () => onlineManager.setEventListener(() => undefined);
}
