import axiosInstance from '../core/axiosInstance';

export interface NotificationTestResponse {
    success: boolean;
    message: string;
    url?: string;
    authentication?: string;
    details?: string;
}

export interface SendNotificationPayload {
    endpoint?: string;
    originId?: string;
    notificationTypeKey?: string;
    notificationTypeId?: string;
    notificationTypeVersion?: string;
    priority?: 'Low' | 'Medium' | 'High' | 'VeryHigh' | 'Neutral';
    title?: string;
    subTitle?: string;
    description?: string;
    recipientId?: string;
    customPayload?: any;
    eventType?: string;
    subject?: string;
    body?: string;
}

const BASE_URL = 'api/cnma/APPROVAL_SRV/tasks/notification';

export const notificationApi = {
    /**
     * Test connection to destination SAP_Notifications
     */
    testDestination: async (): Promise<NotificationTestResponse> => {
        const { data } = await axiosInstance.post<NotificationTestResponse>(`${BASE_URL}/test-destination`);
        return data;
    },

    /**
     * Fetch registered notification types from BTP Notification Service
     */
    getNotificationTypes: async (): Promise<NotificationTestResponse> => {
        const { data } = await axiosInstance.get<NotificationTestResponse>(`${BASE_URL}/types`);
        return data;
    },

    /**
     * Send a test push notification via SAP_Notifications destination
     */
    sendTestNotification: async (payload?: SendNotificationPayload): Promise<NotificationTestResponse> => {
        const { data } = await axiosInstance.post<NotificationTestResponse>(`${BASE_URL}/send-test`, payload || {});
        return data;
    },

    /**
     * Register a notification type in SAP BTP Notification Service
     */
    createNotificationType: async (key?: string, version?: string): Promise<NotificationTestResponse> => {
        const { data } = await axiosInstance.post<NotificationTestResponse>(`${BASE_URL}/create-type`, {
            key,
            version
        });
        return data;
    },

    /**
     * Delete a notification type from SAP BTP Notification Service
     */
    deleteNotificationType: async (id: string, version: string = '1.0'): Promise<NotificationTestResponse> => {
        const { data } = await axiosInstance.delete<NotificationTestResponse>(`${BASE_URL}/type`, {
            params: { id, version }
        });
        return data;
    },
};
