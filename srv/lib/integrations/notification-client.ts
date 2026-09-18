import { getDestination } from '@sap-cloud-sdk/connectivity';
import { executeHttpRequest, HttpResponse } from '@sap-cloud-sdk/http-client';
import { Logger } from '../utils/logger';

export interface NotificationTestResult {
    success: boolean;
    message: string;
    url?: string;
    authentication?: string;
    details?: string;
}

export interface SendNotificationOptions {
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
    properties?: Array<{ Key: string; Value: string; Type?: string; IsSensitive?: boolean }>;
    navigationTargetObject?: string;
    navigationTargetAction?: string;
    // Aliases
    eventType?: string;
    subject?: string;
    body?: string;
    customPayload?: any;
    jwt?: string;
}

export class NotificationClient {
    private logger = new Logger('NotificationClient');
    private readonly destinationName = 'SAP_Notifications';

    /**
     * Checks if the SAP_Notifications destination exists and retrieves its configuration.
     */
    async testDestination(jwt?: string): Promise<NotificationTestResult> {
        this.logger.info(`Testing destination lookup for: ${this.destinationName}`);

        try {
            let destination = null;
            try {
                if (jwt) {
                    destination = await getDestination({ destinationName: this.destinationName, jwt });
                } else {
                    destination = await getDestination({ destinationName: this.destinationName });
                }
            } catch (destErr: any) {
                // If destination lookup with JWT failed, retry without JWT as fallback
                if (jwt) {
                    this.logger.warn(`Destination lookup with JWT failed (${destErr.message}), retrying without JWT...`);
                    destination = await getDestination({ destinationName: this.destinationName });
                } else {
                    throw destErr;
                }
            }

            if (!destination) {
                this.logger.warn(`Destination ${this.destinationName} was not found.`);
                return {
                    success: false,
                    message: `Destination ${this.destinationName} not found in environment or BTP destination service.`
                };
            }

            this.logger.info(`Destination ${this.destinationName} found. URL: ${destination.url}, Auth: ${destination.authentication}`);

            const safeDetails = {
                name: destination.name,
                url: destination.url,
                type: destination.type,
                authentication: destination.authentication,
                proxyType: destination.proxyType,
                isHttpProxy: Boolean((destination as any).isHttpProxy),
                originalProperties: destination.originalProperties ? Object.keys(destination.originalProperties) : []
            };

            return {
                success: true,
                message: `Destination ${this.destinationName} resolved successfully.`,
                url: destination.url,
                authentication: destination.authentication,
                details: JSON.stringify(safeDetails, null, 2)
            };
        } catch (error: any) {
            this.logger.error(`Error resolving destination ${this.destinationName}:`, error);
            return {
                success: false,
                message: error.message || `Failed to resolve destination ${this.destinationName}`,
                details: JSON.stringify({
                    error: error.message,
                    stack: error.stack,
                    response: error.response?.data
                }, null, 2)
            };
        }
    }

    /**
     * Fetches registered Notification Types from SAP BTP Notification Service (/v2/NotificationType.svc/NotificationTypes)
     */
    async getNotificationTypes(): Promise<NotificationTestResult> {
        this.logger.info(`Fetching registered Notification Types from ${this.destinationName}`);
        try {
            const destCheck = await this.testDestination();
            if (!destCheck.success || !destCheck.url) return destCheck;

            const baseUrl = destCheck.url.replace(/\/+$/, '');
            let urlPath = '/v2/NotificationType.svc/NotificationTypes';
            if (baseUrl.endsWith('/v2/Notification.svc')) {
                urlPath = '../NotificationType.svc/NotificationTypes';
            }

            const response: HttpResponse = await executeHttpRequest(
                { destinationName: this.destinationName },
                {
                    method: 'GET',
                    url: urlPath,
                    headers: { 'Accept': 'application/json' }
                }
            );

            return {
                success: response.status >= 200 && response.status < 300,
                message: `Retrieved Notification Types from service (${response.status})`,
                url: destCheck.url,
                authentication: destCheck.authentication,
                details: JSON.stringify(response.data, null, 2)
            };
        } catch (error: any) {
            this.logger.error('Failed to fetch notification types:', error);
            const responseData = error.response?.data || error.cause?.response?.data;
            return {
                success: false,
                message: error.message || 'Failed to fetch registered notification types',
                details: JSON.stringify(responseData || error.message, null, 2)
            };
        }
    }

    /**
     * Registers a Notification Type in SAP BTP Notification Service (/v2/NotificationType.svc/NotificationTypes)
     */
    async createNotificationType(options?: { key?: string; version?: string }): Promise<NotificationTestResult> {
        this.logger.info(`Registering Notification Type in ${this.destinationName}`);
        try {
            const destCheck = await this.testDestination();
            if (!destCheck.success || !destCheck.url) return destCheck;

            const key = options?.key || 'CNMA_TASK_NOTIFICATION';
            const version = options?.version || '1.0';

            const baseUrl = destCheck.url.replace(/\/+$/, '');
            let urlPath = '/v2/NotificationType.svc/NotificationTypes';
            if (baseUrl.endsWith('/v2/Notification.svc')) {
                urlPath = '../NotificationType.svc/NotificationTypes';
            }

            const payload = {
                NotificationTypeKey: key,
                NotificationTypeVersion: version,
                Templates: [
                    {
                        Language: 'en',
                        TemplatePublic: 'CNMA Approval Task',
                        TemplateSensitive: '{{Title}}',
                        TemplateGrouped: 'Approval Tasks',
                        TemplateLanguage: 'Mustache',
                        Subtitle: '{{Description}}'
                    }
                ]
            };

            const response: HttpResponse = await executeHttpRequest(
                { destinationName: this.destinationName },
                {
                    method: 'POST',
                    url: urlPath,
                    data: payload,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }
            );

            return {
                success: response.status >= 200 && response.status < 300,
                message: `Notification Type '${key}' v${version} registered successfully (${response.status})`,
                url: destCheck.url,
                authentication: destCheck.authentication,
                details: JSON.stringify(response.data, null, 2)
            };
        } catch (error: any) {
            this.logger.error('Failed to register notification type:', error);
            const responseData = error.response?.data || error.cause?.response?.data;
            return {
                success: false,
                message: error.message || 'Failed to register notification type',
                details: JSON.stringify(responseData || error.message, null, 2)
            };
        }
    }

    /**
     * Deletes a Notification Type from SAP BTP Notification Service.
     * Supports passing a raw GUID, formatted guid'...', or Key/Version key pair.
     */
    async deleteNotificationType(typeIdOrKey: string, version: string = '1.0'): Promise<NotificationTestResult> {
        this.logger.info(`Deleting Notification Type: ${typeIdOrKey}`);
        try {
            const destCheck = await this.testDestination();
            if (!destCheck.success || !destCheck.url) return destCheck;

            const baseUrl = destCheck.url.replace(/\/+$/, '');
            let basePath = '/v2/NotificationType.svc/NotificationTypes';
            if (baseUrl.endsWith('/v2/Notification.svc')) {
                basePath = '../NotificationType.svc/NotificationTypes';
            }

            const cleanId = typeIdOrKey.trim();
            let deletePath = '';

            if (cleanId.startsWith('guid\'') || cleanId.startsWith('NotificationTypes(')) {
                deletePath = cleanId.startsWith('NotificationTypes(')
                    ? `${basePath.replace(/\/NotificationTypes$/, '')}/${cleanId}`
                    : `${basePath}(${cleanId})`;
            } else if (cleanId.includes('-') && cleanId.length >= 32) {
                // Raw UUID / GUID
                deletePath = `${basePath}(guid'${cleanId}')`;
            } else {
                // Key and Version composite key: NotificationTypeKey='...',NotificationTypeVersion='...'
                deletePath = `${basePath}(NotificationTypeKey='${cleanId}',NotificationTypeVersion='${version}')`;
            }

            this.logger.info(`Executing DELETE request to: ${deletePath}`);

            const response: HttpResponse = await executeHttpRequest(
                { destinationName: this.destinationName },
                {
                    method: 'DELETE',
                    url: deletePath,
                    headers: {
                        'Accept': 'application/json'
                    }
                }
            );

            return {
                success: response.status >= 200 && response.status < 300,
                message: `Notification Type '${typeIdOrKey}' deleted successfully (${response.status})`,
                url: destCheck.url,
                authentication: destCheck.authentication,
                details: JSON.stringify(response.data || { status: response.status, statusText: response.statusText }, null, 2)
            };
        } catch (error: any) {
            this.logger.error(`Failed to delete notification type '${typeIdOrKey}':`, error);
            const responseData = error.response?.data || error.cause?.response?.data;
            return {
                success: false,
                message: error.message || `Failed to delete notification type '${typeIdOrKey}'`,
                details: JSON.stringify(responseData || error.message, null, 2)
            };
        }
    }

    /**
     * Sends a test push notification to SAP BTP Notification Service via SAP_Notifications destination.
     */
    async sendNotification(options?: SendNotificationOptions): Promise<NotificationTestResult> {
        this.logger.info(`Triggering notification event via: ${this.destinationName}`);

        try {
            // First verify destination existence
            const destCheck = await this.testDestination(options?.jwt);
            if (!destCheck.success || !destCheck.url) {
                return destCheck;
            }

            const title = options?.title || options?.subject || 'Test Push Notification from CNMA Approval App';
            const description = options?.description || options?.body || 'Test notification sent to verify SAP_Notifications destination.';
            const notifTypeKey = options?.notificationTypeKey || options?.notificationTypeId || options?.eventType || 'CNMA_TASK_NOTIFICATION';
            const recipientId = options?.recipientId || 'CURRENT_USER';

            // Standard SAP BTP Notification Service Entity (OData V2)
            // Note: Title and Description are NOT root properties; they are passed inside Properties!
            const eventPayload = options?.customPayload || {
                OriginId: options?.originId || 'CNMA_APPROVAL',
                NotificationTypeKey: notifTypeKey,
                NotificationTypeVersion: options?.notificationTypeVersion || '1.0',
                Priority: options?.priority || 'High',
                Properties: options?.properties || [
                    { Key: 'Title', Value: title, Type: 'String', IsSensitive: false },
                    { Key: 'Description', Value: description, Type: 'String', IsSensitive: false }
                ],
                Recipients: [
                    { RecipientId: recipientId }
                ]
            };

            // Calculate endpoint path (default: /v2/Notification.svc/Notifications)
            const endpoint = (options?.endpoint || '/v2/Notification.svc/Notifications').trim();
            const baseUrl = destCheck.url.replace(/\/+$/, '');

            let urlPath = endpoint;
            if (baseUrl.endsWith('/v2/Notification.svc/Notifications')) {
                urlPath = '';
            } else if (baseUrl.endsWith('/v2/Notification.svc')) {
                urlPath = endpoint.startsWith('/v2/Notification.svc')
                    ? endpoint.replace('/v2/Notification.svc', '')
                    : endpoint;
            }

            this.logger.info(`Sending notification to destination: ${this.destinationName} (path: '${urlPath}')`);

            const startTime = Date.now();
            const response: HttpResponse = await executeHttpRequest(
                { destinationName: this.destinationName },
                {
                    method: 'POST',
                    url: urlPath,
                    data: eventPayload,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }
            );

            const latencyMs = Date.now() - startTime;
            this.logger.info(`Notification sent. Status: ${response.status} in ${latencyMs}ms`);

            return {
                success: response.status >= 200 && response.status < 300,
                message: `Notification Service responded with HTTP ${response.status} (${latencyMs}ms)`,
                url: destCheck.url,
                authentication: destCheck.authentication,
                details: JSON.stringify({
                    status: response.status,
                    statusText: response.statusText,
                    latencyMs,
                    targetPath: urlPath,
                    sentPayload: eventPayload,
                    responseData: response.data
                }, null, 2)
            };
        } catch (error: any) {
            this.logger.error('Failed to send notification:', error);
            const responseData = error.response?.data || error.cause?.response?.data || error.rootCause?.response?.data;
            const status = error.response?.status || error.cause?.response?.status || error.rootCause?.response?.status;
            const statusText = error.response?.statusText || error.cause?.response?.statusText;

            return {
                success: false,
                message: responseData?.message || error.message || 'Failed to dispatch alert notification',
                details: JSON.stringify({
                    error: error.message,
                    status,
                    statusText,
                    responseData
                }, null, 2)
            };
        }
    }
}
