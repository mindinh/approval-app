import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    notificationApi,
    type NotificationTestResponse,
    type SendNotificationPayload,
} from '@/services/notification/notification.api';
import { inboxKeys } from '@/pages/Inbox/hooks/inboxKeys';
import { toast } from '@cnma/react-ui';

export interface ParsedNotificationType {
    id: string;
    key: string;
    version: string;
    rawUri?: string;
    templatesCount?: number;
    actionsCount?: number;
    raw: any;
}

export function parseNotificationTypes(data?: NotificationTestResponse): ParsedNotificationType[] {
    if (!data?.details) return [];
    try {
        const parsed = JSON.parse(data.details);
        const results = parsed?.d?.results || parsed?.d || (Array.isArray(parsed) ? parsed : []);
        if (!Array.isArray(results)) return [];

        return results.map((item: any) => {
            const id = item.NotificationTypeId || item.Id || item.id || item.NotificationTypeKey;
            const key = item.NotificationTypeKey || item.NotificationTypeId || 'Unknown';
            const version = item.NotificationTypeVersion || item.Version || '1.0';
            const rawUri = item.__metadata?.uri;
            const templatesCount = item.Templates?.results?.length || (Array.isArray(item.Templates) ? item.Templates.length : 0);
            const actionsCount = item.Actions?.results?.length || (Array.isArray(item.Actions) ? item.Actions.length : 0);

            return {
                id,
                key,
                version,
                rawUri,
                templatesCount,
                actionsCount,
                raw: item,
            };
        });
    } catch {
        return [];
    }
}

export function useNotificationTester() {
    const queryClient = useQueryClient();
    const [lastResult, setLastResult] = useState<NotificationTestResponse | null>(null);

    // Query: Registered Types
    const typesQuery = useQuery({
        queryKey: inboxKeys.notificationTypes(),
        queryFn: async () => {
            const data = await notificationApi.getNotificationTypes();
            setLastResult(data);
            return data;
        },
        staleTime: 30_000,
        gcTime: 60_000,
    });

    const registeredTypes = parseNotificationTypes(typesQuery.data);

    // Mutation: Ping / Check Destination
    const pingMutation = useMutation({
        mutationFn: () => notificationApi.testDestination(),
        onSuccess: (data) => {
            setLastResult(data);
            if (data.success) {
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.message || err?.message || 'Ping failed';
            const fallback: NotificationTestResponse = {
                success: false,
                message: msg,
                details: JSON.stringify(err?.response?.data || err?.message, null, 2),
            };
            setLastResult(fallback);
            toast.error(msg);
        },
    });

    // Mutation: Register Notification Type
    const createTypeMutation = useMutation({
        mutationFn: (variables: { key: string; version: string }) =>
            notificationApi.createNotificationType(variables.key, variables.version),
        onSuccess: (data) => {
            setLastResult(data);
            if (data.success) {
                toast.success(data.message);
                void queryClient.invalidateQueries({ queryKey: inboxKeys.notificationTypes() });
            } else {
                toast.error(data.message);
            }
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.message || err?.message || 'Registration failed';
            const fallback: NotificationTestResponse = {
                success: false,
                message: msg,
                details: JSON.stringify(err?.response?.data || err?.message, null, 2),
            };
            setLastResult(fallback);
            toast.error(msg);
        },
    });

    // Mutation: Delete Notification Type
    const deleteTypeMutation = useMutation({
        mutationFn: (variables: { id: string; version: string }) =>
            notificationApi.deleteNotificationType(variables.id, variables.version),
        onSuccess: (data) => {
            setLastResult(data);
            if (data.success) {
                toast.success(data.message);
                void queryClient.invalidateQueries({ queryKey: inboxKeys.notificationTypes() });
            } else {
                toast.error(data.message);
            }
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.message || err?.message || 'Deletion failed';
            const fallback: NotificationTestResponse = {
                success: false,
                message: msg,
                details: JSON.stringify(err?.response?.data || err?.message, null, 2),
            };
            setLastResult(fallback);
            toast.error(msg);
        },
    });

    // Mutation: Send Push Notification
    const sendMutation = useMutation({
        mutationFn: (payload: SendNotificationPayload) =>
            notificationApi.sendTestNotification(payload),
        onSuccess: (data) => {
            setLastResult(data);
            if (data.success) {
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.message || err?.message || 'Push dispatch failed';
            const fallback: NotificationTestResponse = {
                success: false,
                message: msg,
                details: JSON.stringify(err?.response?.data || err?.message, null, 2),
            };
            setLastResult(fallback);
            toast.error(msg);
        },
    });

    const isAnyPending =
        typesQuery.isFetching ||
        pingMutation.isPending ||
        createTypeMutation.isPending ||
        deleteTypeMutation.isPending ||
        sendMutation.isPending;

    return {
        typesQuery,
        registeredTypes,
        lastResult,
        setLastResult,
        pingMutation,
        createTypeMutation,
        deleteTypeMutation,
        sendMutation,
        isAnyPending,
    };
}
