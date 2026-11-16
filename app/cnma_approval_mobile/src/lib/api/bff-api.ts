/**
 * Typed BFF endpoints used by the app. Response contracts come from the web app's inbox types
 * (shared through the `@approval-core/*` alias) so both clients read the same shapes.
 */
import type {
    CategoryCountsResponse,
    DashboardResponse,
    DashboardTask,
    DocTypeCountItem,
    StatusCountItem,
    InboxTask,
    TaskDetailResponse,
    TaskListResponse,
    TaskStatusCountsResponse,
} from '@approval-core/inbox-types';
import type { MentionUser } from '@/utils/mentions';
import { ApiError, requestJson, WRITE_TIMEOUT_MS, type RequestOptions } from './http-client';

/** BFF error code: Entra token valid, but no SAP session could be derived from it (see entra-auth-middleware). */
export const TOKEN_EXCHANGE_FAILED = 'TOKEN_EXCHANGE_FAILED';

export type { CategoryCountsResponse, DashboardResponse, DashboardTask, DocTypeCountItem, StatusCountItem, InboxTask, TaskDetailResponse, TaskListResponse, TaskStatusCountsResponse };

/** Worklist categories the BFF filters on (same keys as the web Inbox). */
export type TaskCategory = 'PR' | 'PO' | 'CLAIM' | 'RESERVATION';

/** Which worklist: tasks waiting for the user, or tasks the user already approved. */
export type TaskScope = 'open' | 'approved';

export interface TaskListParams {
    top: number;
    skip?: number;
    category?: TaskCategory;
    search?: string;
}

/** GET /tasks/me — identity the BFF derived from the access token. */
export interface CurrentUser {
    id: string;
    displayName: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
    sapUser?: string;
    sapUsername?: string;
    /** Local mock sessions only: the configured SAP user comments are written as. */
    commentAuthorId?: string;
}

/** Supplies a valid access token; `forceRefresh` asks for a new one after a 401. */
export type AccessTokenProvider = (options?: { forceRefresh?: boolean; rejectedToken?: string }) => Promise<string | null>;

export interface BffApi {
    getCurrentUser(signal?: AbortSignal): Promise<CurrentUser>;
    getSapUser(signal?: AbortSignal): Promise<{ sapUsername: string }>;
    /** GET /tasks/bus-users — the people comments can tag (CNMA_BUSUSER, whole directory). */
    getBusUsers(signal?: AbortSignal): Promise<MentionUser[]>;
    getStatusCounts(signal?: AbortSignal): Promise<TaskStatusCountsResponse>;
    getCategoryCounts(scope: TaskScope, signal?: AbortSignal): Promise<CategoryCountsResponse>;
    getTasks(scope: TaskScope, params: TaskListParams, signal?: AbortSignal): Promise<TaskListResponse>;
    getTaskDetail(instanceId: string, signal?: AbortSignal): Promise<TaskDetailResponse>;
    getDashboard(params: DashboardParams, signal?: AbortSignal): Promise<DashboardResponse>;
    /** POST /tasks/:id/decision. Not idempotent: never retried automatically (see hooks/mutations). */
    decideTask(instanceId: string, input: DecisionInput): Promise<WriteResult>;
    /** POST /tasks/:id/comments. */
    addComment(instanceId: string, input: CommentInput): Promise<WriteResult>;
}

/** Sent with every write so the BFF can skip a SAP lookup (web: `_context`). Taken from the task detail, never from user input. */
export interface WriteContext {
    sapOrigin: string;
    documentId: string;
    businessObjectType: string;
    approverNumber?: string;
}

export interface DecisionInput {
    decisionKey: string;
    comment: string;
    context: WriteContext;
}

export interface CommentInput {
    /** Already serialized: mentions as `<tag>@Full Name</tag>`. */
    text: string;
    context: WriteContext;
    /** CC: the tagged people (SAP TAGGEDUSER). */
    taggedUsers?: readonly MentionUser[];
}

export interface WriteResult {
    success?: boolean;
    message?: string;
}

/** GET /tasks/dashboard filters (same as the web dashboard). Status: 'In Approving' | 'Completed'. */
export interface DashboardParams {
    top: number;
    skip?: number;
    category?: TaskCategory;
    status?: string;
    documentType?: string;
    /** Part of a document number (dashboard search). */
    documentNumber?: string;
}

/** CNMA_BUSUSER rows → people to tag; rows without a SAP user cannot be tagged and are dropped. */
function toMentionUsers(response: { value?: unknown[] } | null | undefined): MentionUser[] {
    const rows = Array.isArray(response?.value) ? (response.value as Record<string, unknown>[]) : [];
    const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
    return rows
        .map((row) => {
            const sapUser = text(row.SAPUserName);
            const fullName = text(row.FullName) || `${text(row.FirstName)} ${text(row.LastName)}`.trim() || sapUser;
            return { sapUser, fullName, email: text(row.EmailAddress) };
        })
        .filter((user) => user.sapUser !== '');
}

/** Builds `?a=1&b=x` without URLSearchParams (React Native's polyfill does not implement every method). */
function toQuery(params: Record<string, string | number | undefined>): string {
    const pairs = Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== '')
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    return pairs.length ? `?${pairs.join('&')}` : '';
}

export function createBffApi(baseUrl: string, getAccessToken: AccessTokenProvider): BffApi {
    /**
     * One retry with a refreshed token on 401 (a 401 means the request never ran, so this is safe for
     * writes too); a second 401 surfaces to the caller. A failed SAP token exchange is a backend problem
     * that a new Entra token cannot fix, so it is not retried.
     */
    async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
        const token = await getAccessToken();
        if (!token) throw new ApiError('Not signed in', 'UNAUTHORIZED', 401);
        try {
            return await requestJson<T>(`${baseUrl}${path}`, token, options);
        } catch (error) {
            if (!(error instanceof ApiError) || error.code !== 'UNAUTHORIZED' || error.serverCode === TOKEN_EXCHANGE_FAILED) throw error;
            const refreshed = await getAccessToken({ forceRefresh: true, rejectedToken: token });
            if (!refreshed) throw error;
            return requestJson<T>(`${baseUrl}${path}`, refreshed, options);
        }
    }
    const get = <T,>(path: string, signal?: AbortSignal) => request<T>(path, { signal });
    const post = <T,>(path: string, body: unknown) => request<T>(path, { method: 'POST', body, timeoutMs: WRITE_TIMEOUT_MS });

    return {
        getCurrentUser: (signal) => get('/tasks/me', signal),
        getSapUser: (signal) => get('/tasks/me/sap-user', signal),
        getStatusCounts: (signal) => get('/tasks/status-counts', signal),
        getCategoryCounts: (scope, signal) => get(`/tasks/category-counts${toQuery({ scope: scope === 'approved' ? 'approved' : 'my' })}`, signal),
        getTasks: (scope, { top, skip, category, search }, signal) => get(`/tasks${scope === 'approved' ? '/approved' : ''}${toQuery({ top, skip, category, search })}`, signal),
        getTaskDetail: (instanceId, signal) => get(`/tasks/${encodeURIComponent(instanceId)}`, signal),
        getDashboard: ({ top, skip, category, status, documentType, documentNumber }, signal) => get(`/tasks/dashboard${toQuery({ top, skip, category, status, documentType, documentNumber })}`, signal),
        decideTask: (instanceId, { decisionKey, comment, context }) => post(`/tasks/${encodeURIComponent(instanceId)}/decision`, { decisionKey, comment, _context: context }),
        getBusUsers: async (signal) => toMentionUsers(await get<{ value?: unknown[] }>('/tasks/bus-users', signal)),
        addComment: (instanceId, { text, context, taggedUsers = [] }) =>
            post(`/tasks/${encodeURIComponent(instanceId)}/comments`, { text, _context: context, taggedUsers: taggedUsers.map((user) => ({ USERNAME: user.sapUser, EMAIL: user.email })) }),
    };
}
