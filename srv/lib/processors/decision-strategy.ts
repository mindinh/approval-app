import { AddCommentOptions } from '../integrations/comment.types';
import { SapOdataAdapter } from '../integrations/sap-odata-adapter';
import { TaskprocessingAdapter } from '../integrations/taskprocessing-adapter';
import { ApproveOnHeaderParams } from '../integrations/detail';
import { AppError } from '../utils/error-handler';
import { Logger } from '../utils/logger';

/**
 * Inputs every decision strategy receives. Encapsulates the data the inbox processor
 * has already resolved so strategies don't need to re-derive anything.
 */
export interface DecisionContext {
    instanceId: string;
    decisionKey: string;
    sapDecisionKey: string;
    comment: string;
    sapUser: string;
    userJwt?: string;
    documentId?: string;
    objectType?: string;
}

/**
 * Normalised result returned by every strategy. The inbox processor passes this through
 * to the controller / frontend. `status` is intentionally machine-friendly so the FE
 * can branch on it without parsing free-text messages.
 */
export interface DecisionOutcome {
    status: 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILED';
    message: string;
    /** Per-endpoint result for best-effort flows (Claim dual-API). */
    approve?: 'fulfilled' | 'rejected';
    comment?: 'fulfilled' | 'rejected';
    /** True when at least one best-effort leg failed but the workflow still advanced. */
    partialSuccess?: boolean;
    /** Adapter-level return (e.g. TASKPROCESSING `/Decision` envelope) when applicable. */
    adapterResult?: any;
}

/**
 * Pluggable strategy for executing an approval/rejection decision on a document.
 *
 * Default strategy (used by PR / PO / RE) calls the TASKPROCESSING top-level
 * `/Decision` endpoint, with a best-effort `/SAP__self.comment` audit note.
 *
 * Strategies can opt-in to alternative flows (e.g. Claim dual-API) by registering
 * here. The inbox processor delegates via `execute()` and never branches on
 * object type directly.
 */
export interface DecisionStrategy {
    /** Object type(s) this strategy serves, e.g. ['CLAIM'] or ['PR', 'PO', 'RE']. */
    readonly objectTypes: readonly string[];
    /** True if the strategy serves the given (already-normalised) type. */
    supports(objectType: string): boolean;
    /** Execute the decision. Implementations are responsible for error wrapping. */
    execute(ctx: DecisionContext, deps: StrategyDeps): Promise<DecisionOutcome>;
}

/**
 * Dependencies passed to every strategy. Mirrors what the inbox processor already has.
 * Injecting these (rather than letting strategies grab singletons) keeps each
 * strategy unit-testable in isolation.
 */
export interface StrategyDeps {
    sapOdataAdapter: SapOdataAdapter;
    taskAdapter: TaskprocessingAdapter;
    addComment: (documentId: string, text: string, sapUser: string, options?: AddCommentOptions) => Promise<void>;
    logger: Logger;
}

/**
 * Default strategy used by PR / PO / RE: TASKPROCESSING top-level `/Decision`
 * plus a best-effort audit comment via the entity-bound `/SAP__self.comment`.
 */
export class TaskprocessingDecisionStrategy implements DecisionStrategy {
    readonly objectTypes = ['PR', 'PO', 'RE'];

    supports(objectType: string): boolean {
        return this.objectTypes.includes(objectType.toUpperCase());
    }

    async execute(ctx: DecisionContext, deps: StrategyDeps): Promise<DecisionOutcome> {
        deps.logger.info(`Executing decision ${ctx.decisionKey} on task ${ctx.instanceId} (default strategy)`);

        const decisionCode: 'A' | 'R' = this.detectDecisionCode(ctx);

        if (ctx.documentId) {
            try {
                const defaultText = decisionCode === 'R'
                    ? `Rejected by ${ctx.sapUser || 'user'}`
                    : `Approved by ${ctx.sapUser || 'user'}`;
                const noteText = ctx.comment && ctx.comment.trim() ? ctx.comment.trim() : defaultText;
                await deps.addComment(ctx.documentId, noteText, ctx.sapUser || '', {
                    userJwt: ctx.userJwt,
                    decision: decisionCode,
                    objectType: ctx.objectType,
                    taskId: ctx.instanceId,
                });
                deps.logger.info(`Successfully pushed OData decision comment (${decisionCode}) to ${ctx.objectType || 'document'} ${ctx.documentId}`);
            } catch (e: any) {
                deps.logger.warn(`Failed to push decision comment to document ${ctx.documentId}: ${e.message}`);
            }
        } else {
            deps.logger.warn(`Audit Warning: Decision executed but could not push OData comment because documentId is unknown for task ${ctx.instanceId}`);
        }

        const adapterResult = await deps.taskAdapter.executeDecision(
            ctx.instanceId,
            ctx.sapDecisionKey,
            ctx.comment,
            ctx.sapUser,
            ctx.userJwt,
        );

        return {
            status: 'SUCCESS',
            message: `${ctx.objectType || 'Task'} ${decisionCode === 'A' ? 'approved' : 'rejected'}.`,
            adapterResult,
        };
    }

    private detectDecisionCode(ctx: DecisionContext): 'A' | 'R' {
        const isReject =
            ctx.sapDecisionKey === '0002' || ctx.decisionKey === '0002' ||
            String(ctx.sapDecisionKey).toLowerCase().includes('reject') ||
            String(ctx.decisionKey).toLowerCase().includes('reject');
        return isReject ? 'R' : 'A';
    }
}

/**
 * Claim-specific strategy: invokes the entity-bound `/SAP__self.approve` OR
 * `/SAP__self.reject` action (depending on the user's decision) plus
 * `/SAP__self.comment` in parallel — both best-effort — and reports partial
 * success when any leg fails. SAP exposes these as two distinct bound actions
 * on `CNMA_CLAIMHEADER` per METADATA.xml, so callers must dispatch to the
 * correct one.
 */
export class ClaimDecisionStrategy implements DecisionStrategy {
    readonly objectTypes = ['CLAIM'];

    supports(objectType: string): boolean {
        return objectType.toUpperCase() === 'CLAIM';
    }

    async execute(ctx: DecisionContext, deps: StrategyDeps): Promise<DecisionOutcome> {
        if (!ctx.documentId) {
            throw new AppError('Missing documentId for Claim decision', 400);
        }

        const decisionCode: 'A' | 'R' = ctx.sapDecisionKey === '0002' || ctx.decisionKey === '0002'
            || String(ctx.sapDecisionKey).toLowerCase().includes('reject')
            || String(ctx.decisionKey).toLowerCase().includes('reject') ? 'R' : 'A';

        const trimmedComment = (ctx.comment || '').trim();
        const zcomment = trimmedComment
            || (decisionCode === 'R' ? `Rejected by ${ctx.sapUser || 'user'}` : `Approved by ${ctx.sapUser || 'user'}`);

        deps.logger.info(`Claim ${decisionCode} dual-API call type=CLAIM docId=${ctx.documentId} taskId=${ctx.instanceId}`);

        // Dispatch to the correct SAP bound action based on the user's decision.
        // `/SAP__self.approve` and `/SAP__self.reject` are two distinct endpoints
        // per METADATA.xml — never call `.approve` for a Reject decision.
        const actionMethod = decisionCode === 'R'
            ? (objectType: string, objectId: string, p: ApproveOnHeaderParams, u: string, jwt?: string) =>
                deps.sapOdataAdapter.rejectOnHeader!(objectType, objectId, p, u, jwt)
            : (objectType: string, objectId: string, p: ApproveOnHeaderParams, u: string, jwt?: string) =>
                deps.sapOdataAdapter.approveOnHeader!(objectType, objectId, p, u, jwt);

        const [actionResult, commentResult] = await Promise.allSettled([
            actionMethod(
                ctx.objectType || 'CLAIM',
                ctx.documentId,
                { decision: decisionCode, comment: zcomment },
                ctx.sapUser || '',
                ctx.userJwt,
            ),
            deps.addComment(ctx.documentId, '', ctx.sapUser || '', {
                userJwt: ctx.userJwt,
                decision: decisionCode,
                objectType: ctx.objectType || 'CLAIM',
                taskId: ctx.instanceId,
            }),
        ]);

        if (actionResult.status === 'rejected') {
            deps.logger.warn(`Non-fatal: Claim entity-bound ${decisionCode === 'R' ? 'reject' : 'approve'} failed for ${ctx.documentId}: ${(actionResult as PromiseRejectedResult).reason?.message || (actionResult as PromiseRejectedResult).reason}`);
        }
        if (commentResult.status === 'rejected') {
            deps.logger.warn(`Non-fatal: Claim entity-bound comment failed for ${ctx.documentId}: ${(commentResult as PromiseRejectedResult).reason?.message || (commentResult as PromiseRejectedResult).reason}`);
        }

        const approve = actionResult.status === 'fulfilled' ? 'fulfilled' : 'rejected';
        const comment = commentResult.status === 'fulfilled' ? 'fulfilled' : 'rejected';
        const partialSuccess = approve === 'rejected' || comment === 'rejected';

        return {
            status: partialSuccess ? 'PARTIAL_SUCCESS' : 'SUCCESS',
            message: partialSuccess
                ? `Claim ${decisionCode === 'A' ? 'approved' : 'rejected'}, but one endpoint failed. See server logs.`
                : `Claim ${decisionCode === 'A' ? 'approved' : 'rejected'}.`,
            approve,
            comment,
            partialSuccess,
        };
    }
}

/**
 * Resolves the appropriate strategy for a (normalised) object type.
 * Defaults to the TASKPROCESSING strategy when no Claim-specific override applies.
 */
export class DecisionStrategyRegistry {
    private readonly strategies: DecisionStrategy[];
    private readonly fallback: DecisionStrategy;

    constructor(strategies: DecisionStrategy[], fallback?: DecisionStrategy) {
        this.strategies = strategies;
        this.fallback = fallback ?? new TaskprocessingDecisionStrategy();
    }

    resolve(objectType: string): DecisionStrategy {
        const upper = (objectType || '').toUpperCase();
        return this.strategies.find((s) => s.supports(upper)) ?? this.fallback;
    }
}
