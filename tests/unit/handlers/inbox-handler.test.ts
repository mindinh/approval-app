import { describe, it, expect } from 'vitest';
import { createInboxRouter } from '../../../srv/handlers/inbox-handler';

describe('Inbox Handler Router', () => {
    it('should create an express router with mounted clean routes without redundant /tasks prefix', () => {
        const router = createInboxRouter();
        expect(router).toBeDefined();

        const routes = router.stack.map((layer: any) => layer.route?.path).filter(Boolean);
        
        expect(routes).toContain('/');
        expect(routes).toContain('/approved');
        expect(routes).toContain('/:id');
        expect(routes).toContain('/:id/overview');
        expect(routes).toContain('/:id/information');
        expect(routes).toContain('/:id/workflow-approval-tree');
        expect(routes).toContain('/:id/comments');
        expect(routes).toContain('/:id/decision');
        
        // Verify no routes inside router start with redundant /tasks
        const redundantPrefixRoutes = routes.filter((r: string) => r.startsWith('/tasks'));
        expect(redundantPrefixRoutes).toEqual([]);
    });
});
