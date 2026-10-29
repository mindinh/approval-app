import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { SessionTimeoutDialog } from './SessionTimeoutDialog';

// ─── Configuration ────────────────────────────────────────────────
// Match the 12-hour (720 min) Approuter sessionTimeout (warn at 11.5 hours of total inactivity)
const IDLE_TIMEOUT_MS = 11.5 * 60 * 60 * 1000;
const COUNTDOWN_SECONDS = 60;
const KEEP_ALIVE_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const REAUTH_COOLDOWN_MS = 30 * 1000; // 30s loop guard for automatic silent re-auth
const REAUTH_STORAGE_KEY = 'cnma_reauth_ts';
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const;

// ─── Context ──────────────────────────────────────────────────────
interface SessionTimeoutContextType {
    triggerSessionExpired: () => void;
}

const SessionTimeoutContext = createContext<SessionTimeoutContextType>({
    triggerSessionExpired: () => { },
});

export const useSessionTimeout = () => useContext(SessionTimeoutContext);

// ─── Silent SSO Re-authentication (Standalone + WorkZone) ─────────
/**
 * Re-authenticates the session by reloading the application / outer WorkZone shell
 * WITHOUT calling `/do/logout` (which would trigger Single Logout and destroy
 * the user's SSO session in SAP IAS and Azure Entra ID).
 *
 * @param force When true (user clicked "Sign In Again"), bypasses the 30s auto-reload cooldown.
 * @returns true if navigation/reload was triggered, false if blocked by cooldown guard.
 */
export function reauthenticateSession(force = false): boolean {
    try {
        const now = Date.now();
        const lastAttempt = Number(sessionStorage.getItem(REAUTH_STORAGE_KEY) || '0');
        if (!force && lastAttempt > 0 && now - lastAttempt < REAUTH_COOLDOWN_MS) {
            console.warn('[Session] Silent re-auth already attempted recently; falling back to expired dialog.');
            return false;
        }
        sessionStorage.setItem(REAUTH_STORAGE_KEY, String(now));
        sessionStorage.removeItem('session_active');
    } catch {
        // Ignore storage restrictions in private browsing
    }

    // In SAP Build WorkZone (iframe), OAuth redirects to IAS / Azure Entra ID cannot render
    // inside an iframe due to X-Frame-Options / frame-ancestors headers. Reload top window first.
    if (typeof window !== 'undefined' && window.parent !== window) {
        try {
            window.top?.location.reload();
            return true;
        } catch {
            try {
                if (window.top && document.referrer) {
                    window.top.location.href = document.referrer;
                    return true;
                }
            } catch {
                // Fallback to current frame reload below
            }
        }
    }

    window.location.reload();
    return true;
}

/**
 * Lightweight keep-alive ping through Approuter to extend JSESSIONID and trigger
 * silent OAuth2 refresh token exchange before the session expires.
 */
let lastKeepAliveAt = Date.now();
export async function pingSessionKeepAlive(force = false): Promise<void> {
    const now = Date.now();
    if (!force && now - lastKeepAliveAt < 5 * 60 * 1000) {
        return;
    }
    lastKeepAliveAt = now;
    try {
        await fetch('api/cnma/APPROVAL_SRV/health', {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
            },
        });
    } catch {
        // Ignore transient network errors during background keep-alive
    }
}

// ─── Global ref for axiosInstance (outside React tree) ────────────
let globalTrigger: (() => void) | null = null;

export function triggerSessionExpiredGlobal() {
    if (globalTrigger) {
        globalTrigger();
    } else {
        reauthenticateSession(false);
    }
}

// ─── Provider Component ───────────────────────────────────────────
type DialogState = 'hidden' | 'warning' | 'expired';

export function SessionTimeoutProvider({ children }: { children: React.ReactNode }) {
    const [dialogState, setDialogState] = useState<DialogState>('hidden');
    const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const lastActivityRef = useRef(Date.now());

    /** Explicit Sign Out: Only called when user deliberately clicks "Sign Out". */
    const handleLogout = useCallback(() => {
        try {
            sessionStorage.removeItem('session_active');
            sessionStorage.removeItem(REAUTH_STORAGE_KEY);
        } catch { /* ignore */ }
        window.location.href = '/do/logout';
    }, []);

    /** Re-authenticate without destroying IAS / Azure Entra SSO session. */
    const handleReauthenticate = useCallback(() => {
        reauthenticateSession(true);
    }, []);

    const clearAllTimers = useCallback(() => {
        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
            idleTimerRef.current = null;
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
    }, []);

    const startCountdown = useCallback(() => {
        console.log('[SessionTimeout] Idle timeout reached — showing warning dialog.');
        setDialogState('warning');
        setCountdown(COUNTDOWN_SECONDS);

        countdownIntervalRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearAllTimers();
                    // Transition to expired dialog instead of calling /do/logout!
                    // Calling /do/logout would trigger Single Logout on IAS & Azure Entra ID.
                    setDialogState('expired');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [clearAllTimers]);

    const startIdleTimer = useCallback(() => {
        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
        }
        idleTimerRef.current = setTimeout(() => {
            startCountdown();
        }, IDLE_TIMEOUT_MS);
    }, [startCountdown]);

    const handleContinueWorking = useCallback(() => {
        console.log('[SessionTimeout] User clicked Continue Working — refreshing session and resetting timer.');
        clearAllTimers();
        setDialogState('hidden');
        setCountdown(COUNTDOWN_SECONDS);
        lastActivityRef.current = Date.now();
        void pingSessionKeepAlive(true);
        startIdleTimer();
    }, [clearAllTimers, startIdleTimer]);

    const triggerSessionExpired = useCallback(() => {
        console.log('[SessionTimeout] Session expired (401) — showing expired dialog.');
        clearAllTimers();
        setDialogState('expired');
    }, [clearAllTimers]);

    useEffect(() => {
        globalTrigger = triggerSessionExpired;
        return () => { globalTrigger = null; };
    }, [triggerSessionExpired]);

    useEffect(() => {
        console.log('[SessionTimeout] Provider mounted. Idle timeout:', IDLE_TIMEOUT_MS / 1000, 'seconds');

        const handleActivity = () => {
            const now = Date.now();
            if (now - lastActivityRef.current > 30000) {
                lastActivityRef.current = now;
                if (dialogState === 'hidden') {
                    startIdleTimer();
                    void pingSessionKeepAlive(false);
                }
            }
        };

        const handleVisibilityOrFocus = () => {
            if (document.visibilityState === 'visible' && dialogState === 'hidden') {
                lastActivityRef.current = Date.now();
                startIdleTimer();
                void pingSessionKeepAlive(false);
            }
        };

        ACTIVITY_EVENTS.forEach(event => {
            document.addEventListener(event, handleActivity, { passive: true });
        });
        document.addEventListener('visibilitychange', handleVisibilityOrFocus);
        window.addEventListener('focus', handleVisibilityOrFocus);

        // Periodic keep-alive while the tab is visible and active
        const keepAliveTimer = setInterval(() => {
            if (
                document.visibilityState === 'visible' &&
                dialogState === 'hidden' &&
                Date.now() - lastActivityRef.current < IDLE_TIMEOUT_MS
            ) {
                void pingSessionKeepAlive(true);
            }
        }, KEEP_ALIVE_INTERVAL_MS);

        startIdleTimer();

        return () => {
            ACTIVITY_EVENTS.forEach(event => {
                document.removeEventListener(event, handleActivity);
            });
            document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
            window.removeEventListener('focus', handleVisibilityOrFocus);
            clearInterval(keepAliveTimer);
            clearAllTimers();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dialogState]);

    return (
        <SessionTimeoutContext.Provider value={{ triggerSessionExpired }}>
            {children}
            <SessionTimeoutDialog
                state={dialogState}
                countdown={countdown}
                onContinue={handleContinueWorking}
                onLogout={handleLogout}
                onReauthenticate={handleReauthenticate}
            />
        </SessionTimeoutContext.Provider>
    );
}
