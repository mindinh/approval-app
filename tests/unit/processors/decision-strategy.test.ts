import { describe, it, expect, vi } from 'vitest';
import {
    ClaimDecisionStrategy,
    DecisionStrategyRegistry,
    TaskprocessingDecisionStrategy,
} from '../../../srv/lib/processors/decision-strategy';
import { AppError } from '../../../srv/lib/utils/error-handler';
import { Logger } from '../../../srv/lib/utils/logger';

function makeDeps(overrides: any = {}) {
    return {
        sapOdataAdapter: {
            approveOnHeader: vi.fn().mockResolvedValue(undefined),
            rejectOnHeader: vi.fn().mockResolvedValue(undefined),
            addComment: vi.fn(),
            ...overrides.sapOdataAdapter,
        },
        taskAdapter: {
            executeDecision: vi.fn().mockResolvedValue({ success: true }),
            ...overrides.taskAdapter,
        },
        addComment: overrides.addComment ?? vi.fn().mockResolvedValue(undefined),
        logger: new Logger('test'),
    };
}

describe('TaskprocessingDecisionStrategy (default)', () => {
    const strategy = new TaskprocessingDecisionStrategy();

    it('supports PR/PO/RE', () => {
        expect(strategy.supports('PR')).toBe(true);
        expect(strategy.supports('PO')).toBe(true);
        expect(strategy.supports('RE')).toBe(true);
        expect(strategy.supports('CLAIM')).toBe(false);
        expect(strategy.supports('po')).toBe(true);
    });

    it('posts audit note then calls TASKPROCESSING /Decision for approve', async () => {
        const deps = makeDeps();
        const outcome = await strategy.execute(
            {
                instanceId: 'task-pr-01',
                decisionKey: '0001',
                sapDecisionKey: '0001',
                comment: 'Looks good',
                sapUser: 'MOCK_USER',
                documentId: '10001234',
                objectType: 'PR',
            },
            deps
        );

        expect(deps.addComment).toHaveBeenCalledWith(
            '10001234',
            'Looks good',
            'MOCK_USER',
            expect.objectContaining({ decision: 'A', objectType: 'PR', taskId: 'task-pr-01' })
        );
        expect(deps.taskAdapter.executeDecision).toHaveBeenCalledWith('task-pr-01', '0001', 'Looks good', 'MOCK_USER', undefined);
        expect(outcome.status).toBe('SUCCESS');
    });

    it('uses default "Rejected by <user>" text on reject when comment is empty', async () => {
        const deps = makeDeps();
        await strategy.execute(
            {
                instanceId: 'task-po-01',
                decisionKey: '0002',
                sapDecisionKey: '0002',
                comment: '',
                sapUser: 'MOCK_USER',
                documentId: '45000001',
                objectType: 'PO',
            },
            deps
        );
        expect(deps.addComment).toHaveBeenCalledWith('45000001', 'Rejected by MOCK_USER', 'MOCK_USER', expect.objectContaining({ decision: 'R' }));
    });

    it('does not throw when comment posting fails (best-effort, task still completes)', async () => {
        const deps = makeDeps({ addComment: vi.fn().mockRejectedValue(new Error('comment failed')) });
        const outcome = await strategy.execute(
            {
                instanceId: 'task-pr-02',
                decisionKey: '0001',
                sapDecisionKey: '0001',
                comment: 'ok',
                sapUser: 'MOCK_USER',
                documentId: '10001235',
                objectType: 'PR',
            },
            deps
        );
        expect(outcome.status).toBe('SUCCESS');
        expect(deps.taskAdapter.executeDecision).toHaveBeenCalledTimes(1);
    });

    it('falls through with warning when documentId is missing', async () => {
        const deps = makeDeps();
        const outcome = await strategy.execute(
            {
                instanceId: 'task-pr-03',
                decisionKey: '0001',
                sapDecisionKey: '0001',
                comment: 'ok',
                sapUser: 'MOCK_USER',
                objectType: 'PR',
            },
            deps
        );
        expect(deps.addComment).not.toHaveBeenCalled();
        expect(outcome.status).toBe('SUCCESS');
    });
});

describe('ClaimDecisionStrategy', () => {
    const strategy = new ClaimDecisionStrategy();

    it('supports only CLAIM', () => {
        expect(strategy.supports('CLAIM')).toBe(true);
        expect(strategy.supports('claim')).toBe(true);
        expect(strategy.supports('PR')).toBe(false);
    });

    it('throws AppError(400) when documentId is missing', async () => {
        const deps = makeDeps();
        await expect(
            strategy.execute(
                {
                    instanceId: '212',
                    decisionKey: '0001',
                    sapDecisionKey: '0001',
                    comment: 'approve',
                    sapUser: 'MOCK_USER',
                    objectType: 'CLAIM',
                },
                deps
            )
        ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('calls approveOnHeader + addComment in parallel for approve', async () => {
        const deps = makeDeps();
        const outcome = await strategy.execute(
            {
                instanceId: '212',
                decisionKey: '0001',
                sapDecisionKey: '0001',
                comment: 'approve claim 212',
                sapUser: 'MOCK_USER',
                documentId: '212',
                objectType: 'CLAIM',
            },
            deps
        );

        expect(deps.sapOdataAdapter.approveOnHeader).toHaveBeenCalledWith(
            'CLAIM',
            '212',
            { decision: 'A', comment: 'approve claim 212' },
            'MOCK_USER',
            undefined
        );
        expect(deps.addComment).toHaveBeenCalledWith(
            '212',
            '',
            'MOCK_USER',
            expect.objectContaining({ decision: 'A', objectType: 'CLAIM', taskId: '212' })
        );
        expect(outcome.status).toBe('SUCCESS');
        expect(outcome.partialSuccess).toBe(false);
    });

    it('calls rejectOnHeader (not approveOnHeader) for reject decisions', async () => {
        const deps = makeDeps();
        await strategy.execute(
            {
                instanceId: '212',
                decisionKey: '0002',
                sapDecisionKey: '0002',
                comment: 'reject claim 212',
                sapUser: 'MOCK_USER',
                documentId: '212',
                objectType: 'CLAIM',
            },
            deps
        );
        expect(deps.sapOdataAdapter.rejectOnHeader).toHaveBeenCalledWith(
            'CLAIM',
            '212',
            { decision: 'R', comment: 'reject claim 212' },
            'MOCK_USER',
            undefined
        );
        // Critical: approveOnHeader MUST NOT be called when the user is rejecting.
        expect(deps.sapOdataAdapter.approveOnHeader).not.toHaveBeenCalled();
    });

    it('falls back to "Rejected by <user>" zcomment when no user comment is provided for reject', async () => {
        const deps = makeDeps();
        await strategy.execute(
            {
                instanceId: '212',
                decisionKey: '0002',
                sapDecisionKey: '0002',
                comment: '',
                sapUser: 'MOCK_USER',
                documentId: '212',
                objectType: 'CLAIM',
            },
            deps
        );
        expect(deps.sapOdataAdapter.rejectOnHeader).toHaveBeenCalledWith(
            'CLAIM', '212',
            { decision: 'R', comment: 'Rejected by MOCK_USER' },
            'MOCK_USER', undefined
        );
        expect(deps.sapOdataAdapter.approveOnHeader).not.toHaveBeenCalled();
    });

    it('falls back to "Approved by <user>" zcomment when no user comment provided', async () => {
        const deps = makeDeps();
        await strategy.execute(
            {
                instanceId: '212',
                decisionKey: '0001',
                sapDecisionKey: '0001',
                comment: '',
                sapUser: 'MOCK_USER',
                documentId: '212',
                objectType: 'CLAIM',
            },
            deps
        );
        expect(deps.sapOdataAdapter.approveOnHeader).toHaveBeenCalledWith(
            'CLAIM', '212',
            { decision: 'A', comment: 'Approved by MOCK_USER' },
            'MOCK_USER', undefined
        );
    });

    it('reports PARTIAL_SUCCESS when approve fails', async () => {
        const deps = makeDeps({
            sapOdataAdapter: { approveOnHeader: vi.fn().mockRejectedValue(new Error('500')) },
        });
        const outcome = await strategy.execute(
            {
                instanceId: '212',
                decisionKey: '0001',
                sapDecisionKey: '0001',
                comment: 'approve',
                sapUser: 'MOCK_USER',
                documentId: '212',
                objectType: 'CLAIM',
            },
            deps
        );
        expect(outcome.status).toBe('PARTIAL_SUCCESS');
        expect(outcome.partialSuccess).toBe(true);
        expect(outcome.approve).toBe('rejected');
        expect(outcome.comment).toBe('fulfilled');
    });

    it('reports PARTIAL_SUCCESS when rejectOnHeader fails', async () => {
        const deps = makeDeps({
            sapOdataAdapter: { rejectOnHeader: vi.fn().mockRejectedValue(new Error('500')) },
        });
        const outcome = await strategy.execute(
            {
                instanceId: '212',
                decisionKey: '0002',
                sapDecisionKey: '0002',
                comment: 'reject',
                sapUser: 'MOCK_USER',
                documentId: '212',
                objectType: 'CLAIM',
            },
            deps
        );
        expect(outcome.status).toBe('PARTIAL_SUCCESS');
        expect(outcome.partialSuccess).toBe(true);
        expect(outcome.approve).toBe('rejected');
        expect(outcome.comment).toBe('fulfilled');
        expect(deps.sapOdataAdapter.rejectOnHeader).toHaveBeenCalled();
        expect(deps.sapOdataAdapter.approveOnHeader).not.toHaveBeenCalled();
    });

    it('reports PARTIAL_SUCCESS when comment fails', async () => {
        const deps = makeDeps({
            addComment: vi.fn().mockRejectedValue(new Error('500')),
        });
        const outcome = await strategy.execute(
            {
                instanceId: '212',
                decisionKey: '0001',
                sapDecisionKey: '0001',
                comment: 'approve',
                sapUser: 'MOCK_USER',
                documentId: '212',
                objectType: 'CLAIM',
            },
            deps
        );
        expect(outcome.status).toBe('PARTIAL_SUCCESS');
        expect(outcome.partialSuccess).toBe(true);
        expect(outcome.approve).toBe('fulfilled');
        expect(outcome.comment).toBe('rejected');
    });
});

describe('DecisionStrategyRegistry', () => {
    it('resolves Claim strategy for CLAIM', () => {
        const reg = new DecisionStrategyRegistry([new ClaimDecisionStrategy()]);
        expect(reg.resolve('CLAIM')).toBeInstanceOf(ClaimDecisionStrategy);
    });

    it('falls back to TaskprocessingDecisionStrategy when nothing matches', () => {
        const reg = new DecisionStrategyRegistry([new ClaimDecisionStrategy()]);
        expect(reg.resolve('PR')).toBeInstanceOf(TaskprocessingDecisionStrategy);
        expect(reg.resolve('')).toBeInstanceOf(TaskprocessingDecisionStrategy);
    });

    it('respects custom fallback when provided', () => {
        const custom = { supports: () => true, execute: () => Promise.resolve({ status: 'SUCCESS' as const, message: '' }) };
        const reg = new DecisionStrategyRegistry([], custom as any);
        expect(reg.resolve('PR')).toBe(custom);
    });
});
