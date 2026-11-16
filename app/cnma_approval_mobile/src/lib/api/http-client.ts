import { fetch } from 'expo/fetch';

/** Reads give up after this; the UI then offers Try again. */
const READ_TIMEOUT_MS = 20_000;
/** Writes (decisions, comments) wait longer: SAP may take a while, and a write is never retried automatically. */
export const WRITE_TIMEOUT_MS = 60_000;

export type ApiErrorCode = 'HTTP_ERROR' | 'UNAUTHORIZED' | 'NETWORK_ERROR' | 'TIMEOUT';

/** Typed failure of a BFF call. `status` is 0 when no response arrived. */
export class ApiError extends Error {
    constructor(
        message: string,
        readonly code: ApiErrorCode,
        readonly status: number,
        readonly body?: unknown,
        /** BFF path that failed (no host, no query), for error reports to IT. */
        readonly path?: string
    ) {
        super(message);
        this.name = 'ApiError';
    }

    /** Machine-readable code the BFF puts in `{ error: { code } }` (e.g. TOKEN_EXCHANGE_FAILED). */
    get serverCode(): string | undefined {
        if (!this.body || typeof this.body !== 'object') return undefined;
        const { error, code } = this.body as { error?: { code?: unknown }; code?: unknown };
        const value = typeof error === 'object' && error !== null ? error.code : code;
        return typeof value === 'string' ? value : undefined;
    }
}

async function readBody(response: { text(): Promise<string> }): Promise<unknown> {
    const text = await response.text();
    if (!text) return undefined;
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

function errorFromBody(body: unknown, status: number): string {
    if (body && typeof body === 'object') {
        const { error, message } = body as { error?: unknown; message?: unknown };
        const detail = typeof error === 'string' ? error : ((error as { message?: unknown } | undefined)?.message ?? message);
        if (typeof detail === 'string' && detail.trim()) return detail;
    }
    if (typeof body === 'string' && body.trim()) return body.slice(0, 300);
    return `HTTP ${status}`;
}

/** `/tasks/123` from a full URL: the part IT needs, without host or query values. */
export function pathOf(url: string): string {
    const schemeEnd = url.indexOf('://');
    const pathStart = schemeEnd >= 0 ? url.indexOf('/', schemeEnd + 3) : 0;
    const withoutHost = pathStart >= 0 ? url.slice(pathStart) : '/';
    return withoutHost.split('?')[0] || '/';
}

export interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    /** Sent as JSON. */
    body?: unknown;
    signal?: AbortSignal;
    timeoutMs?: number;
}

/**
 * JSON request with a Bearer token. Throws ApiError; honours the caller's AbortSignal plus a timeout
 * (20 s for reads, pass WRITE_TIMEOUT_MS for writes).
 */
export async function requestJson<T>(url: string, accessToken: string, { method = 'GET', body, signal, timeoutMs = READ_TIMEOUT_MS }: RequestOptions = {}): Promise<T> {
    const controller = new AbortController();
    const onAbort = () => controller.abort();
    signal?.addEventListener('abort', onAbort);
    let timedOut = false;
    const timeout = setTimeout(() => {
        timedOut = true;
        controller.abort();
    }, timeoutMs);

    const headers: Record<string, string> = { Accept: 'application/json', Authorization: `Bearer ${accessToken}` };
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    try {
        // No cookies: auth is the Bearer token only (a stray approuter session cookie must not change who we are).
        const response = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: controller.signal, credentials: 'omit' });
        const responseBody = await readBody(response);
        if (!response.ok) {
            const code = response.status === 401 ? 'UNAUTHORIZED' : 'HTTP_ERROR';
            throw new ApiError(errorFromBody(responseBody, response.status), code, response.status, responseBody, pathOf(url));
        }
        return responseBody as T;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        if (timedOut) throw new ApiError(`No response after ${timeoutMs / 1000}s`, 'TIMEOUT', 0, undefined, pathOf(url));
        if (signal?.aborted) throw error; // cancelled by the caller (e.g. TanStack Query): rethrow as-is
        throw new ApiError(`Network error: ${error instanceof Error ? error.message : String(error)}`, 'NETWORK_ERROR', 0, undefined, pathOf(url));
    } finally {
        clearTimeout(timeout);
        signal?.removeEventListener('abort', onAbort);
    }
}

/** GET JSON with a Bearer token (see requestJson). */
export function fetchJson<T>(url: string, accessToken: string, signal?: AbortSignal): Promise<T> {
    return requestJson<T>(url, accessToken, { signal });
}

/** Outcome of one BFF call, shaped for display in the connection diagnostics. */
export interface ApiResult {
    url: string;
    ok: boolean;
    /** HTTP status, or 0 when the request never got a response (network error, timeout). */
    status: number;
    durationMs: number;
    data?: unknown;
    error?: string;
}

/** Diagnostics variant of fetchJson: never throws, reports status and timing instead. */
export async function getJson(baseUrl: string, path: string, accessToken: string): Promise<ApiResult> {
    const url = `${baseUrl}${path}`;
    const startedAt = Date.now();
    try {
        const data = await fetchJson<unknown>(url, accessToken);
        return { url, ok: true, status: 200, durationMs: Date.now() - startedAt, data };
    } catch (error) {
        const apiError = error instanceof ApiError ? error : new ApiError(String(error), 'NETWORK_ERROR', 0);
        return { url, ok: false, status: apiError.status, durationMs: Date.now() - startedAt, data: apiError.body, error: apiError.message };
    }
}
