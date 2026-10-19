import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { SessionTimeoutDialog } from './SessionTimeoutDialog';


// ─── Configuration ────────────────────────────────────────────────
const IDLE_TIMEOUT_MS = 25 * 60 * 1000; // 25 minutes
const COUNTDOWN_SECONDS = 60;
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const;

// ─── Context ──────────────────────────────────────────────────────
interface SessionTimeoutContextType {
    triggerSessionExpired: () => void;
}

const SessionTimeoutContext = createContext<SessionTimeoutContextType>({
    triggerSessionExpired: () => { },
});

export const useSessionTimeout = () => useContext(SessionTimeoutContext);

// ─── Global ref for axiosInstance (outside React tree) ────────────
let globalTrigger: (() => void) | null = null;

export function triggerSessionExpiredGlobal() {
    if (globalTrigger) {
        globalTrigger();
    } else {
        window.location.href = '/do/logout';
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

    const handleLogout = useCallback(() => {
        sessionStorage.removeItem('session_active');
        window.location.href = '/do/logout';
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
                    handleLogout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [clearAllTimers, handleLogout]);

    const startIdleTimer = useCallback(() => {
        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
        }
        idleTimerRef.current = setTimeout(() => {
            startCountdown();
        }, IDLE_TIMEOUT_MS);
    }, [startCountdown]);

    const handleContinueWorking = useCallback(() => {
        console.log('[SessionTimeout] User clicked Continue Working — resetting timer.');
        clearAllTimers();
        setDialogState('hidden');
        setCountdown(COUNTDOWN_SECONDS);
        lastActivityRef.current = Date.now();
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
                }
            }
        };

        ACTIVITY_EVENTS.forEach(event => {
            document.addEventListener(event, handleActivity, { passive: true });
        });

        startIdleTimer();

        return () => {
            ACTIVITY_EVENTS.forEach(event => {
                document.removeEventListener(event, handleActivity);
            });
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
            />
        </SessionTimeoutContext.Provider>
    );
}
