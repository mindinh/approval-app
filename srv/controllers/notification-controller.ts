import { Request, Response } from 'express';
import { NotificationClient } from '../lib/integrations/notification-client';
import { extractJwtFromRequest, decodeJwtPayload, resolveIdentity } from '../lib/utils/auth-helper';
import { Logger } from '../lib/utils/logger';

export class NotificationController {
    private readonly client = new NotificationClient();
    private readonly logger = new Logger('NotificationController');

    /**
     * Verifies if the request is executed by an authorized Administrator.
     * Checks JWT scopes ending in .admin, local development MOCK_USER, or dev environment.
     */
    private isAdmin(req: Request): boolean {
        // Allow in development/test environment if explicitly non-production
        if (process.env.NODE_ENV !== 'production' && !req.headers.authorization && !req.headers['x-approuter-authorization']) {
            return true;
        }

        const { sapUser, userJwt } = resolveIdentity(req);
        if (sapUser === 'MOCK_USER') {
            return true;
        }

        if (userJwt) {
            const payload = decodeJwtPayload(userJwt);
            if (payload) {
                const scopes = payload.scope as string[] | undefined;
                if (Array.isArray(scopes) && scopes.some(s => s.endsWith('.admin'))) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * @openapi
     * /tasks/notification/test-destination:
     *   post:
     *     summary: Resolve SAP_Notifications destination
     *     tags:
     *       - Notifications
     *     security:
     *       - BearerAuth: []
     *     responses:
     *       '200':
     *         description: Successful response
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               additionalProperties: true
     */
    testDestination = async (req: Request, res: Response): Promise<void> => {
        if (!this.isAdmin(req)) {
            res.status(403).json({
                success: false,
                message: 'Access denied: Notification test actions are restricted to administrators.'
            });
            return;
        }

        try {
            const jwtInfo = extractJwtFromRequest(req);
            this.logger.info(`Received test-destination request. Has JWT: ${Boolean(jwtInfo.token)}`);

            const result = await this.client.testDestination(jwtInfo.token);
            res.json(result);
        } catch (error: any) {
            this.logger.error('Error in testDestination endpoint:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Internal error checking notification destination'
            });
        }
    };

    /**
     * @openapi
     * /tasks/notification/types:
     *   get:
     *     summary: List notification types
     *     tags:
     *       - Notifications
     *     security:
     *       - BearerAuth: []
     *     responses:
     *       '200':
     *         description: Successful response
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               additionalProperties: true
     */
    getNotificationTypes = async (req: Request, res: Response): Promise<void> => {
        if (!this.isAdmin(req)) {
            res.status(403).json({
                success: false,
                message: 'Access denied: Notification test actions are restricted to administrators.'
            });
            return;
        }

        try {
            this.logger.info('Received get-notification-types request.');
            const result = await this.client.getNotificationTypes();
            res.json(result);
        } catch (error: any) {
            this.logger.error('Error in getNotificationTypes endpoint:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Internal error fetching notification types'
            });
        }
    };

    /**
     * @openapi
     * /tasks/notification/create-type:
     *   post:
     *     summary: Register notification type
     *     tags:
     *       - Notifications
     *     security:
     *       - BearerAuth: []
     *     requestBody:
     *       required: false
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               key:
     *                 type: string
     *               version:
     *                 type: string
     *     responses:
     *       '200':
     *         description: Successful response
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               additionalProperties: true
     */
    createNotificationType = async (req: Request, res: Response): Promise<void> => {
        if (!this.isAdmin(req)) {
            res.status(403).json({
                success: false,
                message: 'Access denied: Notification test actions are restricted to administrators.'
            });
            return;
        }

        try {
            const { key, version } = req.body || {};
            this.logger.info(`Received create-notification-type request for Key: ${key || 'CNMA_TASK_NOTIFICATION'}, Version: ${version || '1.0'}`);
            const result = await this.client.createNotificationType({ key, version });
            res.json(result);
        } catch (error: any) {
            this.logger.error('Error in createNotificationType endpoint:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Internal error registering notification type'
            });
        }
    };

    /**
     * @openapi
     * /tasks/notification/type:
     *   delete:
     *     summary: Delete notification type
     *     tags:
     *       - Notifications
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: query
     *         name: id
     *         schema:
     *           type: string
     *         description: Required unless body supplies id or key
     *       - in: query
     *         name: version
     *         schema:
     *           type: string
     *           default: '1.0'
     *     requestBody:
     *       required: false
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               id:
     *                 type: string
     *               key:
     *                 type: string
     *               version:
     *                 type: string
     *     responses:
     *       '200':
     *         description: Successful response
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               additionalProperties: true
     */
    deleteNotificationType = async (req: Request, res: Response): Promise<void> => {
        if (!this.isAdmin(req)) {
            res.status(403).json({
                success: false,
                message: 'Access denied: Notification test actions are restricted to administrators.'
            });
            return;
        }

        try {
            const id = (req.query.id as string) || (req.body?.id as string) || (req.body?.key as string);
            const version = (req.query.version as string) || (req.body?.version as string) || '1.0';

            if (!id) {
                res.status(400).json({
                    success: false,
                    message: 'Missing required parameter: id (GUID or NotificationTypeKey)'
                });
                return;
            }

            this.logger.info(`Received delete-notification-type request for: ${id} (version: ${version})`);
            const result = await this.client.deleteNotificationType(id, version);
            res.json(result);
        } catch (error: any) {
            this.logger.error('Error in deleteNotificationType endpoint:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Internal error deleting notification type'
            });
        }
    };

    /**
     * @openapi
     * /tasks/notification/send-test:
     *   post:
     *     summary: Send test notification
     *     tags:
     *       - Notifications
     *     security:
     *       - BearerAuth: []
     *     requestBody:
     *       required: false
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               endpoint:
     *                 type: string
     *               originId:
     *                 type: string
     *               notificationTypeId:
     *                 type: string
     *               notificationTypeKey:
     *                 type: string
     *               notificationTypeVersion:
     *                 type: string
     *               priority:
     *                 type: string
     *               title:
     *                 type: string
     *               subTitle:
     *                 type: string
     *               description:
     *                 type: string
     *               recipientId:
     *                 type: string
     *               eventType:
     *                 type: string
     *               subject:
     *                 type: string
     *               body:
     *                 type: string
     *               properties:
     *                 type: array
     *                 items:
     *                   type: object
     *                   properties:
     *                     Key:
     *                       type: string
     *                     Value:
     *                       type: string
     *                     Type:
     *                       type: string
     *                     IsSensitive:
     *                       type: boolean
     *               customPayload:
     *                 type: object
     *                 additionalProperties: true
     *     responses:
     *       '200':
     *         description: Successful response
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               additionalProperties: true
     */
    sendTestNotification = async (req: Request, res: Response): Promise<void> => {
        if (!this.isAdmin(req)) {
            res.status(403).json({
                success: false,
                message: 'Access denied: Notification test actions are restricted to administrators.'
            });
            return;
        }

        try {
            const {
                endpoint,
                originId,
                notificationTypeId,
                notificationTypeKey,
                notificationTypeVersion,
                priority,
                title,
                subTitle,
                description,
                recipientId,
                properties,
                customPayload,
                eventType,
                subject,
                body
            } = req.body || {};

            this.logger.info(`Received send-test notification request. Type: ${notificationTypeKey || notificationTypeId || eventType || 'CNMA_TASK_NOTIFICATION'}`);

            const result = await this.client.sendNotification({
                endpoint,
                originId,
                notificationTypeId,
                notificationTypeKey,
                notificationTypeVersion,
                priority,
                title,
                subTitle,
                description,
                recipientId,
                properties,
                customPayload,
                eventType,
                subject,
                body
            });

            res.json(result);
        } catch (error: any) {
            this.logger.error('Error in sendTestNotification endpoint:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Internal error sending test notification'
            });
        }
    };
}
