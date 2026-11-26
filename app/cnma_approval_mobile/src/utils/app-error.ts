/**
 * Turns any failure (BFF ApiError, network failure, render crash) into copy a business user understands,
 * plus a short reference they can pass to IT. Raw messages, stack traces and bare HTTP codes are never
 * shown as the main text; they only go into the "details for IT" report.
 */
import type { SymbolViewProps } from 'expo-symbols';
import { TOKEN_EXCHANGE_FAILED } from '@/lib/api/bff-api';
import { ApiError } from '@/lib/api/http-client';

export type AppErrorKind = 'offline' | 'timeout' | 'unreachable' | 'sapLink' | 'session' | 'forbidden' | 'notFound' | 'server' | 'unknown';

export interface AppErrorInfo {
    kind: AppErrorKind;
    title: string;
    message: string;
    icon: SymbolViewProps['name'];
    /** Worth retrying as is (network blips, server errors). */
    retryable: boolean;
    /** The user must sign in again. */
    needsSignIn: boolean;
    /** Short code shown to the user and quoted to IT, e.g. "HTTP-503" or "NET-OFFLINE". */
    code: string;
    /** Multi-line technical report for IT (code, time, endpoint, server message). */
    report: string;
}

const COPY: Record<AppErrorKind, Omit<AppErrorInfo, 'kind' | 'code' | 'report'>> = {
    offline: {
        title: 'No connection',
        message: 'We could not reach the approval service. Check that you are online (Wi-Fi or mobile data, VPN if your company requires it), then try again.',
        icon: { ios: 'wifi.slash', android: 'wifi_off' },
        retryable: true,
        needsSignIn: false,
    },
    timeout: {
        title: 'This is taking too long',
        message: 'The approval service did not answer in time. Your connection may be slow, or the service is busy. Please try again in a moment.',
        icon: { ios: 'hourglass', android: 'hourglass_empty' },
        retryable: true,
        needsSignIn: false,
    },
    unreachable: {
        title: 'Service temporarily unavailable',
        message: 'The approval service or SAP is not available right now, possibly due to maintenance. Please try again later. If it keeps happening, contact IT.',
        icon: { ios: 'server.rack', android: 'dns' },
        retryable: true,
        needsSignIn: false,
    },
    sapLink: {
        title: 'Could not connect to SAP',
        message: 'You are signed in, but SAP did not accept your account right now. This is usually a setup issue on our side: please try again later, or report it to IT.',
        icon: { ios: 'link.badge.plus', android: 'link_off' },
        retryable: true,
        needsSignIn: false,
    },
    session: {
        title: 'Your session has expired',
        message: 'For your security you were signed out. Sign in again to continue where you left off.',
        icon: { ios: 'lock.rotation', android: 'lock_reset' },
        retryable: false,
        needsSignIn: true,
    },
    forbidden: {
        title: 'No access',
        message: 'Your account is not allowed to see this. If you think you should have access, contact IT with the details below.',
        icon: { ios: 'hand.raised', android: 'block' },
        retryable: false,
        needsSignIn: false,
    },
    notFound: {
        title: 'Not found',
        message: 'This item is no longer available. It may have been completed, withdrawn or moved to someone else.',
        icon: { ios: 'doc.questionmark', android: 'search_off' },
        retryable: false,
        needsSignIn: false,
    },
    server: {
        title: 'Something went wrong on our side',
        message: 'The approval service ran into a problem. Please try again. If it keeps happening, report it to IT with the details below.',
        icon: { ios: 'exclamationmark.triangle', android: 'report' },
        retryable: true,
        needsSignIn: false,
    },
    unknown: {
        title: 'Something went wrong',
        message: 'An unexpected problem occurred. Please try again. If it keeps happening, report it to IT with the details below.',
        icon: { ios: 'exclamationmark.circle', android: 'error' },
        retryable: true,
        needsSignIn: false,
    },
};

function classify(error: unknown): { kind: AppErrorKind; code: string } {
    if (error instanceof ApiError) {
        switch (error.code) {
            case 'NETWORK_ERROR':
                return { kind: 'offline', code: 'NET-OFFLINE' };
            case 'TIMEOUT':
                return { kind: 'timeout', code: 'NET-TIMEOUT' };
            case 'UNAUTHORIZED':
                return error.serverCode === TOKEN_EXCHANGE_FAILED ? { kind: 'sapLink', code: 'SAP-LINK' } : { kind: 'session', code: 'HTTP-401' };
        }
        const status = error.status;
        const code = `HTTP-${status}`;
        if (status === 403) return { kind: 'forbidden', code };
        if (status === 404 || status === 410) return { kind: 'notFound', code };
        if (status === 408) return { kind: 'timeout', code };
        if (status === 502 || status === 503 || status === 504) return { kind: 'unreachable', code };
        if (status >= 500) return { kind: 'server', code };
        return { kind: 'unknown', code };
    }
    const text = error instanceof Error ? `${error.name} ${error.message}` : String(error);
    if (/network request failed|failed to fetch|network error/i.test(text)) return { kind: 'offline', code: 'NET-OFFLINE' };
    return { kind: 'unknown', code: 'APP-ERROR' };
}

function technicalMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return typeof error === 'string' ? error : JSON.stringify(error);
}

/** Friendly description of a failure. `context` names what was being done ("Loading the task"). */
export function describeError(error: unknown, context?: string): AppErrorInfo {
    const { kind, code } = classify(error);
    const copy = COPY[kind];
    const when = new Date();
    const report = [
        'My Approval – error report',
        `Code: ${code}`,
        context ? `While: ${context}` : null,
        `Time: ${when.toLocaleString()} (${when.toISOString()})`,
        error instanceof ApiError && error.path ? `Endpoint: ${error.path}` : null,
        `Detail: ${technicalMessage(error).slice(0, 400)}`,
    ]
        .filter(Boolean)
        .join('\n');
    return { kind, code, report, ...copy };
}
