import { Router } from 'express';
import { InboxController } from '../controllers/inbox-controller';

export function createInboxRouter(): Router {
    const router = Router();
    const controller = new InboxController();

    // 1. Diagnostics / Debug routes
    router.get('/debug/current-user', controller.getDebugCurrentUser);
    router.get('/debug/jwt', controller.getDebugJwt);
    router.get('/debug/auth-summary', controller.getDebugAuthSummary);

    // 2. Identity profile
    router.get('/me', controller.getMe);

    // 3. Dashboard metrics aggregation
    router.get('/dashboard', controller.getDashboard);

    // 4. Main worklists
    router.get('/tasks', controller.getTasks);
    router.get('/tasks/approved', controller.getApprovedTasks);

    // 5. Task Detail & informational overlays
    router.get('/tasks/:id', controller.getTaskDetail);
    router.get('/tasks/:id/overview', controller.getTaskOverview);
    router.get('/tasks/:id/information', controller.getTaskInformation);
    router.get('/tasks/:id/workflow-approval-tree', controller.getWorkflowApprovalTree);

    // 6. Comments, decisions, and uploads
    router.post('/tasks/:id/comments', controller.postComment);
    router.post('/tasks/:id/attachments', controller.postAttachment);
    router.get('/tasks/:id/attachments/:attId/content', controller.streamAttachment);

    // 7. Purchase Requisition attachments metadata & streaming
    router.get('/pr/:docNum/attachments', controller.getPrAttachments);
    router.get('/pr/:docNum/attachments/:attachId/content', controller.streamPrAttachment);
    router.post('/pr/:docNum/attachments', controller.uploadPrAttachment);

    // 8. Decisions posting
    router.post('/tasks/:id/decision', controller.postDecision);

    // 9. Catch-all fallback list
    router.get('/', controller.getFallbackTasks);

    return router;
}
