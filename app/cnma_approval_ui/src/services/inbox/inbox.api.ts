import axiosInstance from '../core/axiosInstance';
import { cleanFileName } from '@/pages/Inbox/utils/shared';
import type {
    TaskListResponse,
    TaskDetailResponse,
    TaskActionResponse,
    TaskAttachment,
    DecisionRequest,
    ForwardRequest,
    MassDecisionPayload,
    MassDecisionResponse,
    UserSearchResult,
    BusUser,
    TaggedUser,
    WorkflowApprovalTreeResponse,
    DashboardResponse,
    CategoryCountsResponse,
    TaskStatusCountsResponse,
} from './inbox.types';


// Keep API paths relative so Work Zone managed approuter can resolve app-local routes.
const BASE_URL = 'api/cnma/APPROVAL_SRV/tasks';

/** Shape returned by GET /api/inbox/me */
export interface UserInfo {
    id: string;
    sapUser?: string;
    sapUsername?: string;
    commentAuthorId?: string;
    displayName: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
}


/**
 * Inbox API — All backend calls for the inbox feature.
 */
export const inboxApi = {
    getCurrentSapUser: async (): Promise<{ sapUsername: string }> => {
        const { data } = await axiosInstance.get<{ sapUsername: string }>(`${BASE_URL}/me/sap-user`);
        return data;
    },
    getStatusCounts: async (signal?: AbortSignal): Promise<TaskStatusCountsResponse> => {
        const { data } = await axiosInstance.get<TaskStatusCountsResponse>(`${BASE_URL}/status-counts`, { signal });
        return data;
    },
    /**
     * Get real-time task counts grouped by business object category.
     */
    getCategoryCounts: async (scope: 'my' | 'approved' = 'my', signal?: AbortSignal): Promise<CategoryCountsResponse> => {
        const { data } = await axiosInstance.get<CategoryCountsResponse>(
            `${BASE_URL}/category-counts?scope=${scope}`, { signal }
        );
        return data;
    },

    /**
     * Get current user display info (name, email) from JWT claims.
     */
    getCurrentUser: async (): Promise<UserInfo> => {
        const { data } = await axiosInstance.get<UserInfo>(`${BASE_URL}/me`);
        if (data && data.id) {
            sessionStorage.setItem('session_active', 'true');
        }
        return data;
    },

    /**
     * Get dashboard data for the current user.
     * Returns all task records from the ZI_PR_DASH_BOARD entity.
     */
    getDashboard: async (params?: {
        top?: number;
        skip?: number;
        category?: string;
        documentType?: string;
        status?: string;
    }): Promise<DashboardResponse> => {
        const query = new URLSearchParams();
        if (params?.top != null) query.set('top', String(params.top));
        if (params?.skip != null) query.set('skip', String(params.skip));
        if (params?.category) query.set('category', params.category);
        if (params?.documentType) query.set('documentType', params.documentType);
        if (params?.status) query.set('status', params.status);
        const qs = query.toString();
        const { data } = await axiosInstance.get<DashboardResponse>(
            `${BASE_URL}/dashboard${qs ? `?${qs}` : ''}`
        );
        return data;
    },

    /**
     * Get tasks for the current user (with optional pagination).
     */
    getTasks: async (params?: { top?: number; skip?: number; category?: string; search?: string }, signal?: AbortSignal): Promise<TaskListResponse> => {
        const query = new URLSearchParams();
        if (params?.top != null) query.set('top', String(params.top));
        if (params?.skip != null) query.set('skip', String(params.skip));
        if (params?.category) query.set('category', params.category);
        if (params?.search) query.set('search', params.search);
        const qs = query.toString();
        const { data } = await axiosInstance.get<TaskListResponse>(
            `${BASE_URL}${qs ? `?${qs}` : ''}`, { signal }
        );
        return data;
    },

    /**
     * Get approved tasks for the current user (with optional pagination).
     */
    getApprovedTasks: async (params?: { top?: number; skip?: number; category?: string; search?: string }, signal?: AbortSignal): Promise<TaskListResponse> => {
        const query = new URLSearchParams();
        if (params?.top != null) query.set('top', String(params.top));
        if (params?.skip != null) query.set('skip', String(params.skip));
        if (params?.category) query.set('category', params.category);
        if (params?.search) query.set('search', params.search);
        const qs = query.toString();
        const { data } = await axiosInstance.get<TaskListResponse>(
            `${BASE_URL}/approved${qs ? `?${qs}` : ''}`, { signal }
        );
        return data;
    },

    /**
     * Get full detail for a single task.
     */
    getTaskDetail: async (instanceId: string, signal?: AbortSignal): Promise<TaskDetailResponse> => {
        const { data } = await axiosInstance.get<TaskDetailResponse>(
            `${BASE_URL}/${encodeURIComponent(instanceId)}`, { signal }
        );
        return data;
    },

    /**
     * Get reference PR detail directly by PR document number (CNMA_PRHEADER with expands).
     */
    getPrDetail: async (prNumber: string): Promise<TaskDetailResponse> => {
        const { data } = await axiosInstance.get<TaskDetailResponse>(
            `${BASE_URL}/pr/${encodeURIComponent(prNumber)}`
        );
        return data;
    },





    /**
     * Get approval workflow tree for PR tasks.
     */
    getWorkflowApprovalTree: async (
        instanceId: string, 
        documentId?: string, 
        sapOrigin?: string,
        businessObjectType?: string
    ): Promise<WorkflowApprovalTreeResponse> => {
        let url = `${BASE_URL}/${encodeURIComponent(instanceId)}/workflow-approval-tree`;
        const params = new URLSearchParams();
        if (documentId) params.append('documentId', documentId);
        if (sapOrigin) params.append('sapOrigin', sapOrigin);
        if (businessObjectType) params.append('businessObjectType', businessObjectType);
        const query = params.toString();
        if (query) url += `?${query}`;

        const { data } = await axiosInstance.get<WorkflowApprovalTreeResponse>(url);
        return data;
    },

    /**
     * Execute a decision on a task (approve, reject, etc.)
     */
    executeDecision: async (
        instanceId: string,
        request: DecisionRequest
    ): Promise<TaskActionResponse> => {
        const { data } = await axiosInstance.post<TaskActionResponse>(
            `${BASE_URL}/${encodeURIComponent(instanceId)}/decision`,
            request
        );
        return data;
    },

    /**
     * Execute bulk decisions across multiple tasks in a single request.
     */
    executeMassDecision: async (
        payload: MassDecisionPayload
    ): Promise<MassDecisionResponse> => {
        const { data } = await axiosInstance.post<MassDecisionResponse>(
            `${BASE_URL}/mass-decision`,
            payload
        );
        return data;
    },

    /**
     * Forward a task to another user.
     */
    forwardTask: async (
        instanceId: string,
        request: ForwardRequest
    ): Promise<TaskActionResponse> => {
        const { data } = await axiosInstance.post<TaskActionResponse>(
            `${BASE_URL}/${encodeURIComponent(instanceId)}/forward`,
            request
        );
        return data;
    },

    /**
     * Search users for task forwarding.
     */
    searchUsers: async (pattern: string): Promise<UserSearchResult[]> => {
        const { data } = await axiosInstance.get<{ value: UserSearchResult[] }>(
            `${BASE_URL}/search-users?SearchPattern=${encodeURIComponent(pattern)}`
        );
        return data?.value || [];
    },

    /**
     * Search CNMA_BUSUSER for CC tagging.
     */
    getBusUsers: async (pattern: string): Promise<BusUser[]> => {
        const { data } = await axiosInstance.get<{ value: BusUser[] }>(
            `${BASE_URL}/bus-users?q=${encodeURIComponent(pattern)}`
        );
        return data?.value || [];
    },



    /**
     * Add a comment to a task.
     */
    addComment: async (
        instanceId: string,
        text: string,
        context?: { sapOrigin?: string; documentId?: string; businessObjectType?: string },
        taggedUsers?: TaggedUser[]
    ): Promise<TaskActionResponse> => {
        const { data } = await axiosInstance.post<TaskActionResponse>(
            `${BASE_URL}/${encodeURIComponent(instanceId)}/comments`,
            { text, _context: context, taggedUsers: taggedUsers || [] }
        );
        return data;
    },

    /**
     * Upload an attachment to a task.
     * Sends the raw file binary with the filename in the Slug header.
     */
    addAttachment: async (
        instanceId: string,
        file: File,
        sapOrigin?: string
    ): Promise<TaskActionResponse> => {
        const buffer = await file.arrayBuffer();
        const headers: Record<string, string> = {
            'Content-Type': file.type || 'application/octet-stream',
            Slug: encodeURIComponent(file.name),
        };
        if (sapOrigin) {
            headers['x-sap-origin'] = sapOrigin;
        }

        const { data } = await axiosInstance.post<TaskActionResponse>(
            `${BASE_URL}/${encodeURIComponent(instanceId)}/attachments`,
            buffer,
            { headers }
        );
        return data;
    },

    /**
     * Get the URL for previewing or downloading an attachment's binary content.
     * Uses the unified attachment endpoint.
     */
    getAttachmentContentUrl: (
        attachmentId: string,
        documentId?: string,
        sapOrigin?: string,
        disposition: 'inline' | 'attachment' = 'inline',
        fileName?: string
    ): string => {
        const query = new URLSearchParams();
        query.set('disposition', disposition);
        if (documentId) query.set('documentId', documentId);
        if (sapOrigin) query.set('sapOrigin', sapOrigin);

        const cleanFileName = fileName ? encodeURIComponent(fileName) : '';
        const basePath = cleanFileName
            ? `${BASE_URL}/attachments/${encodeURIComponent(attachmentId)}/content/${cleanFileName}`
            : `${BASE_URL}/attachments/${encodeURIComponent(attachmentId)}/content`;

        return `${basePath}?${query.toString()}`;
    },

    /**
     * Download the attachment content as a binary Blob via Axios.
     * This allows tracking download progress and managing UI loading states precisely.
     */
    downloadAttachment: async (
        attachmentId: string,
        documentId?: string,
        sapOrigin?: string
    ): Promise<{ data: Blob; fileName: string }> => {
        const query = new URLSearchParams();
        query.set('disposition', 'attachment');
        if (documentId) query.set('documentId', documentId);
        if (sapOrigin) query.set('sapOrigin', sapOrigin);

        const response = await axiosInstance.get<Blob>(
            `${BASE_URL}/attachments/${encodeURIComponent(attachmentId)}/content`,
            {
                params: Object.fromEntries(query.entries()),
                responseType: 'blob'
            }
        );

        let fileName = '';
        const disposition = response.headers['content-disposition'] || response.headers['Content-Disposition'];
        if (disposition) {
            const match = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
            const raw = match ? (match[1] ? decodeURIComponent(match[1]) : match[2]) : '';
            if (raw) {
                fileName = cleanFileName(raw) || raw;
            }
        }

        return {
            data: response.data,
            fileName
        };
    },

    // ─── PR Attachment API (Standalone) ─────────────────────

    /**
     * Get PR attachment metadata list from the standalone ZI_PR_ATTACH_TAB API.
     */
    getPrAttachments: async (
        documentNumber: string,
        sapOrigin?: string
    ): Promise<{ attachments: TaskAttachment[]; count: number }> => {
        const query = new URLSearchParams();
        if (sapOrigin) query.set('sapOrigin', sapOrigin);
        const qs = query.toString();
        const { data } = await axiosInstance.get<{ attachments: TaskAttachment[]; count: number }>(
            `${BASE_URL}/pr/${encodeURIComponent(documentNumber)}/attachments${qs ? `?${qs}` : ''}`
        );
        return data;
    },

    /**
     * Get the URL for downloading a PR attachment's binary content.
     * Deprecated: use getAttachmentContentUrl instead.
     */
    getPrAttachmentContentUrl: (
        documentNumber: string,
        attachId: string,
        sapOrigin?: string,
        disposition: 'inline' | 'attachment' = 'attachment'
    ): string => {
        return inboxApi.getAttachmentContentUrl(attachId, documentNumber, sapOrigin, disposition);
    },
};
