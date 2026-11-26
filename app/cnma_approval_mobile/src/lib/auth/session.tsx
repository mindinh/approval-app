/**
 * Microsoft Entra ID session: Authorization Code + PKCE in the system browser.
 * The refresh token lives in SecureStore; the access token only in memory.
 */
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { exchangeCodeAsync, refreshAsync, useAuthRequest, type DiscoveryDocument, type TokenResponse } from 'expo-auth-session';
import { ApiError } from '@/lib/api/http-client';
import type { AppConfig } from '@/lib/config/env';
import { decodeJwtClaims, type TokenClaims } from './jwt';
import { resolveRedirectUri } from './redirect';
import { isRefreshTokenRejected } from './refresh-error';
import { tokenStore } from './token-store';

WebBrowser.maybeCompleteAuthSession();

/** Refresh when the access token has less than this left. */
const REFRESH_MARGIN_MS = 60_000;

export type SessionStatus = 'restoring' | 'signedOut' | 'signingIn' | 'signedIn';

interface SignedInState {
    accessToken: string;
    expiresAt: number;
    claims: TokenClaims | null;
}

export interface AccessTokenOptions {
    /** Get a new token even if the current one looks valid (after a 401). */
    forceRefresh?: boolean;
    /** The token the server rejected: if a refresh already replaced it, the new one is returned as is. */
    rejectedToken?: string;
}

export interface Session {
    status: SessionStatus;
    user: SignedInState | null;
    error: string | null;
    /** Redirect URI this build sends to Entra (must be registered on the app registration). */
    redirectUri: string;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
    /**
     * A valid access token, refreshed when it is about to expire; null when signed out. Throws a
     * NETWORK_ERROR ApiError when the refresh cannot reach Entra (the session is kept).
     */
    getAccessToken: (options?: AccessTokenOptions) => Promise<string | null>;
}

/** Outcome of a refresh: new tokens, the session ended (token rejected / none stored), or Entra unreachable. */
type RefreshResult = { kind: 'ok'; state: SignedInState } | { kind: 'signedOut' } | { kind: 'unreachable'; error: unknown };

const SessionContext = createContext<Session | null>(null);

/**
 * Entra v2.0 endpoints are fixed per tenant, so they are built locally instead of fetched from the
 * discovery document: the app can restore a session (or show the sign-in screen) while offline.
 */
function entraDiscovery(tenantId: string): DiscoveryDocument {
    const base = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0`;
    return { authorizationEndpoint: `${base}/authorize`, tokenEndpoint: `${base}/token`, endSessionEndpoint: `${base}/logout` };
}

function toSignedInState(tokens: TokenResponse): SignedInState {
    const issuedAtMs = (tokens.issuedAt ?? Math.floor(Date.now() / 1000)) * 1000;
    return { accessToken: tokens.accessToken, expiresAt: issuedAtMs + (tokens.expiresIn ?? 3600) * 1000, claims: decodeJwtClaims(tokens.accessToken) };
}

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

export function SessionProvider({ config, children }: { config: AppConfig; children: ReactNode }) {
    const { tenantId, clientId, apiScope } = config.entra;
    const scopes = useMemo(() => ['openid', 'profile', 'offline_access', apiScope], [apiScope]);
    const redirectUri = resolveRedirectUri();
    const discovery = useMemo(() => entraDiscovery(tenantId), [tenantId]);
    const [request, , promptAsync] = useAuthRequest({ clientId, scopes, redirectUri, usePKCE: true }, discovery);

    const [status, setStatus] = useState<SessionStatus>('restoring');
    const [user, setUser] = useState<SignedInState | null>(null);
    const [error, setError] = useState<string | null>(null);
    const refreshInFlight = useRef<Promise<RefreshResult> | null>(null);
    // In-flight requests hold an older getAccessToken: they read the current tokens from here.
    const userRef = useRef<SignedInState | null>(null);

    const applyTokens = useCallback(async (tokens: TokenResponse) => {
        if (tokens.refreshToken) await tokenStore.saveRefreshToken(tokens.refreshToken);
        const next = toSignedInState(tokens);
        userRef.current = next;
        setUser(next);
        setStatus('signedIn');
        setError(null);
        return next;
    }, []);

    const endSession = useCallback(async (message: string | null) => {
        await tokenStore.clear();
        userRef.current = null;
        setUser(null);
        setStatus('signedOut');
        setError(message);
    }, []);

    const refresh = useCallback((): Promise<RefreshResult> => {
        // Single-flight: concurrent callers share one refresh request.
        refreshInFlight.current ??= (async (): Promise<RefreshResult> => {
            try {
                const refreshToken = await tokenStore.readRefreshToken();
                if (!refreshToken) return { kind: 'signedOut' };
                return { kind: 'ok', state: await applyTokens(await refreshAsync({ clientId, refreshToken, scopes }, discovery)) };
            } catch (refreshError) {
                // Only a rejected refresh token ends the session; offline / Entra errors keep it for the next try.
                if (!isRefreshTokenRejected(refreshError)) return { kind: 'unreachable', error: refreshError };
                await endSession('Your session has expired. Please sign in again.');
                return { kind: 'signedOut' };
            } finally {
                refreshInFlight.current = null;
            }
        })();
        return refreshInFlight.current;
    }, [applyTokens, endSession, clientId, scopes, discovery]);

    // Restore the previous session at launch. Offline: show sign-in with a hint; the stored token is kept.
    useEffect(() => {
        let cancelled = false;
        void refresh().then((result) => {
            if (cancelled || result.kind === 'ok') return;
            setStatus((current) => (current === 'restoring' ? 'signedOut' : current));
            if (result.kind === 'unreachable') setError('Could not reach Microsoft sign-in. Check your connection, then tap Sign in to continue.');
        });
        return () => {
            cancelled = true;
        };
    }, [refresh]);

    const signIn = useCallback(async () => {
        if (!request) return;
        setStatus('signingIn');
        setError(null);
        try {
            // A stored session (kept after an offline launch) resumes without opening the browser.
            const resumed = await refresh();
            if (resumed.kind === 'ok') return;
            setStatus('signingIn');
            setError(null);
            const result = await promptAsync();
            if (result.type !== 'success') {
                setStatus('signedOut');
                if (result.type === 'error') setError(result.error?.message ?? 'Sign-in failed');
                return;
            }
            const tokens = await exchangeCodeAsync({ clientId, code: result.params.code, redirectUri, extraParams: { code_verifier: request.codeVerifier ?? '' } }, discovery);
            await applyTokens(tokens);
        } catch (signInError) {
            setStatus('signedOut');
            setError(errorMessage(signInError));
        }
    }, [request, refresh, discovery, promptAsync, clientId, redirectUri, applyTokens]);

    const signOut = useCallback(() => endSession(null), [endSession]);

    const getAccessToken = useCallback(
        async ({ forceRefresh = false, rejectedToken }: AccessTokenOptions = {}) => {
            const current = userRef.current;
            if (!current) return null;
            // Another request already replaced the rejected token: use the new one instead of refreshing again.
            if (rejectedToken && current.accessToken !== rejectedToken) return current.accessToken;
            const fresh = current.expiresAt - Date.now() > REFRESH_MARGIN_MS;
            if (fresh && !forceRefresh) return current.accessToken;
            const result = await refresh();
            if (result.kind === 'ok') return result.state.accessToken;
            if (result.kind === 'unreachable') throw new ApiError(`Session refresh failed: ${errorMessage(result.error)}`, 'NETWORK_ERROR', 0);
            return null;
        },
        [refresh]
    );

    const session: Session = { status, user, error, redirectUri, signIn, signOut, getAccessToken };
    return <SessionContext value={session}>{children}</SessionContext>;
}

/** The session, or null outside the provider (the root error boundary renders above it). */
export function useOptionalSession(): Session | null {
    return use(SessionContext);
}

export function useSession(): Session {
    const session = use(SessionContext);
    if (!session) throw new Error('useSession must be used inside <SessionProvider>');
    return session;
}
