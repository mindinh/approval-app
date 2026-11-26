import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    notificationApi,
    type NotificationTestResponse,
    type SendNotificationPayload,
} from '@/services/notification/notification.api';
import { inboxKeys } from '@/pages/Inbox/hooks/inboxKeys';
import { toast } from '@cnma/react-ui';

/** Shape of a notification type entry as returned by the BTP Notification Service (OData v2). */
interface RawNotificationType {
    NotificationTypeId?: string;
    NotificationTypeKey?: string;
    NotificationTypeVersion?: string;
    Id?: string;
    id?: string;
    Version?: string;
    __metadata?: { uri?: string };
    Templates?: { results?: unknown[] } | unknown[];
    Actions?: { results?: unknown[] } | unknown[];
}

/** Error shape surfaced by axios when the BFF rejects a notification request. */
interface NotificationRequestError {
    message?: string;
    response?: { data?: { message?: string } };
}

const TYPES_STALE_TIME_MS = 30_000;
const TYPES_GC_TIME_MS = 60_000;

/** Counts entries of an OData v2 `{ results: [] }` container or a plain array. */
function countEntries(collection: RawNotificationType['Templates']): number {
    if (!collection) return 0;
    if (Array.isArray(collection)) return collection.length;
    return collection.results?.length || 0;
}

export interface ParsedNotificationType {
    id: string;
    key: string;
    version: string;
    rawUri?: string;
    templatesCount?: number;
    actionsCount?: number;
    raw: RawNotificationType;
}

export function parseNotificationTypes(data?: NotificationTestResponse): ParsedNotificationType[] {
    if (!data?.details) return [];
    try {
        const parsed = JSON.parse(data.details);
        const results = parsed?.d?.results || parsed?.d || (Array.isArray(parsed) ? parsed : []);
        if (!Array.isArray(results)) return [];

        return results.map((item: RawNotificationType) => {
            const id = (item.NotificationTypeId || item.Id || item.id || item.NotificationTypeKey) as string;
            const key = item.NotificationTypeKey || item.NotificationTypeId || 'Unknown';
            const version = item.NotificationTypeVersion || item.Version || '1.0';
            const rawUri = item.__metadata?.uri;
            const templatesCount = countEntries(item.Templates);
            const actionsCount = countEntries(item.Actions);

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

    /** Records the BFF response and mirrors its outcome in a toast. */
    const handleResult = (data: NotificationTestResponse) => {
        setLastResult(data);
        if (data.success) {
            toast.success(data.message);
        } else {
            toast.error(data.message);
        }
    };

    /** Builds an onError handler that records a synthetic failed response and toasts it. */
    const handleRequestError = (fallbackMessage: string) => (err: NotificationRequestError) => {
        const msg = err?.response?.data?.message || err?.message || fallbackMessage;
        const fallback: NotificationTestResponse = {
            success: false,
            message: msg,
            details: JSON.stringify(err?.response?.data || err?.message, null, 2),
        };
        setLastResult(fallback);
        toast.error(msg);
    };

    /** Like handleResult, but refreshes the registered types list after a successful change. */
    const handleTypeChangeResult = (data: NotificationTestResponse) => {
        handleResult(data);
        if (data.success) {
            void queryClient.invalidateQueries({ queryKey: inboxKeys.notificationTypes() });
        }
    };

    // Query: Registered Types
    const typesQuery = useQuery({
        queryKey: inboxKeys.notificationTypes(),
        queryFn: async () => {
            const data = await notificationApi.getNotificationTypes();
            setLastResult(data);
            return data;
        },
        staleTime: TYPES_STALE_TIME_MS,
        gcTime: TYPES_GC_TIME_MS,
    });

    const registeredTypes = parseNotificationTypes(typesQuery.data);

    // Mutation: Ping / Check Destination
    const pingMutation = useMutation({
        mutationFn: () => notificationApi.testDestination(),
        onSuccess: handleResult,
        onError: handleRequestError('Ping failed'),
    });

    // Mutation: Register Notification Type
    const createTypeMutation = useMutation({
        mutationFn: (variables: { key: string; version: string }) =>
            notificationApi.createNotificationType(variables.key, variables.version),
        onSuccess: handleTypeChangeResult,
        onError: handleRequestError('Registration failed'),
    });

    // Mutation: Delete Notification Type
    const deleteTypeMutation = useMutation({
        mutationFn: (variables: { id: string; version: string }) =>
            notificationApi.deleteNotificationType(variables.id, variables.version),
        onSuccess: handleTypeChangeResult,
        onError: handleRequestError('Deletion failed'),
    });

    // Mutation: Send Push Notification
    const sendMutation = useMutation({
        mutationFn: (payload: SendNotificationPayload) =>
            notificationApi.sendTestNotification(payload),
        onSuccess: handleResult,
        onError: handleRequestError('Push dispatch failed'),
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
