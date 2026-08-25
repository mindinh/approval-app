import axiosInstance from '../core/axiosInstance';
import type {
    TaskListResponse,
    TaskDetailResponse,
    TaskActionResponse,
    TaskAttachment,
    DecisionRequest,
    ForwardRequest,
    UserSearchResult,
    BusUser,
    TaggedUser,
    WorkflowApprovalTreeResponse,
    DashboardResponse,
    ReferencePrDetailResponse,
} from './inbox.types';


// Keep API paths relative so Work Zone managed approuter can resolve app-local routes.
const BASE_URL = 'api/cnma/APPROVAL_SRV/tasks';

/** Shape returned by GET /api/inbox/me */
export interface UserInfo {
    id: string;
    sapUser?: string;
    displayName: string;
    firstName?: string;
    lastName?: string;
    email?: string;
}


/**
 * Inbox API — All backend calls for the inbox feature.
 */
export const inboxApi = {
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
    getDashboard: async (): Promise<DashboardResponse> => {
        const { data } = await axiosInstance.get<DashboardResponse>(
            `${BASE_URL}/dashboard`
        );
        return data;
    },

    /**
     * Get tasks for the current user (with optional pagination).
     */
    getTasks: async (params?: { top?: number; skip?: number }): Promise<TaskListResponse> => {
        const query = new URLSearchParams();
        if (params?.top != null) query.set('top', String(params.top));
        if (params?.skip != null) query.set('skip', String(params.skip));
        const qs = query.toString();
        const { data } = await axiosInstance.get<TaskListResponse>(
            `${BASE_URL}${qs ? `?${qs}` : ''}`
        );
        return data;
    },

    /**
     * Get approved tasks for the current user (with optional pagination).
     */
    getApprovedTasks: async (params?: { top?: number; skip?: number }): Promise<TaskListResponse> => {
        const query = new URLSearchParams();
        if (params?.top != null) query.set('top', String(params.top));
        if (params?.skip != null) query.set('skip', String(params.skip));
        const qs = query.toString();
        const { data } = await axiosInstance.get<TaskListResponse>(
            `${BASE_URL}/approved${qs ? `?${qs}` : ''}`
        );
        return data;
    },

    /**
     * Get full detail for a single task.
     */
    getTaskDetail: async (instanceId: string): Promise<TaskDetailResponse> => {
        const { data } = await axiosInstance.get<TaskDetailResponse>(
            `${BASE_URL}/${encodeURIComponent(instanceId)}`
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
            const match = disposition.match(/filename="?([^";]+)"?/i);
            if (match) {
                fileName = decodeURIComponent(match[1]);
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


    /**
     * Get details for a Reference PR from SAP API_PURCHASEREQ_PROCESS_SRV.
     */
    getReferencePrDetail: async (prNumber: string): Promise<ReferencePrDetailResponse> => {
        const { data } = await axiosInstance.get<ReferencePrDetailResponse>(
            `${BASE_URL}/reference-pr/${encodeURIComponent(prNumber)}`
        );
        return data;
    },
};
