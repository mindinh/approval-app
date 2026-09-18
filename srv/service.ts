import cds from '@sap/cds';
import { NotificationClient } from './lib/integrations/notification-client';

const client = new NotificationClient();

function extractJwtFromReq(req: any): string | undefined {
    if (req.user?.jwt) return req.user.jwt;
    const auth = req.headers?.authorization || req._?.req?.headers?.authorization;
    if (typeof auth === 'string' && auth.toLowerCase().startsWith('bearer ')) {
        return auth.substring(7).trim();
    }
    return undefined;
}

export class ApprovalService extends cds.ApplicationService {
    async init() {
        this.on('testNotificationDestination', async (req: any) => {
            const jwt = extractJwtFromReq(req);
            return await client.testDestination(jwt);
        });

        this.on('sendTestNotification', async (req: any) => {
            const jwt = extractJwtFromReq(req);
            const { eventType, subject, body } = req.data || {};
            return await client.sendNotification({
                eventType,
                subject,
                body,
                jwt
            });
        });

        await super.init();
    }
}

export class NotificationService extends cds.ApplicationService {
    async init() {
        this.on('testNotificationDestination', async (req: any) => {
            const jwt = extractJwtFromReq(req);
            return await client.testDestination(jwt);
        });

        this.on('sendTestNotification', async (req: any) => {
            const jwt = extractJwtFromReq(req);
            const { eventType, subject, body } = req.data || {};
            return await client.sendNotification({
                eventType,
                subject,
                body,
                jwt
            });
        });

        await super.init();
    }
}

export default {
    ApprovalService,
    NotificationService
};
