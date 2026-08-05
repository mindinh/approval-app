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

    // 4. Object type configurations
    router.get('/object-configs', controller.getObjectConfigs);

    // 5. Worklists & Reference Details
    router.get('/approved', controller.getApprovedTasks);
    router.get('/reference-pr/:prNumber', controller.getReferencePrDetail);
    router.get('/pr/:docNum/attachments', controller.getPrAttachments);
    router.get('/pr/:docNum/attachments/:attachId/content/:fileName?', controller.streamPrAttachment);
    router.get('/attachments/:attachId/content/:fileName?', controller.streamAttachment);

    // 6. Root tasks list (must be before /:id)
    router.get('/', controller.getTasks);

    // 7. Single Task Details & Sub-resources
    router.get('/:id', controller.getTaskDetail);
    router.get('/:id/overview', controller.getTaskOverview);
    router.get('/:id/information', controller.getTaskInformation);
    router.get('/:id/workflow-approval-tree', controller.getWorkflowApprovalTree);

    // 8. Actions on specific task
    router.post('/:id/comments', controller.postComment);
    router.get('/:id/attachments/:attId/content/:fileName?', controller.streamAttachment);
    router.post('/:id/decision', controller.postDecision);

    return router;
}
