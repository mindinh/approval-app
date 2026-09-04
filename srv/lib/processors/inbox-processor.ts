import { TaskprocessingAdapter } from '../integrations/taskprocessing-adapter';
import { SapOdataAdapter } from '../integrations/sap-odata-adapter';
import { SapClient } from '../integrations/sap-client';
import { AddCommentOptions } from '../integrations/comment.types';
import { resolveObjectTypeFromTypeId, resolveObjectTypeFromInstance, ODATA_SERVICES } from './odata-config';

import { Logger } from '../utils/logger';
import { AppError } from '../utils/error-handler';
import {
    MassDecisionItemContext,
    MassDecisionItemResult,
    MassDecisionResponse,
} from '../types/sap-odata.types';
import { ObjectTypeResolver } from './object-type-resolver';
import {
    ClaimDecisionStrategy,
    DecisionStrategyRegistry,
    TaskprocessingDecisionStrategy,
} from './decision-strategy';
import {
    normalizePriority,
    normalizeDate,
    cleanBusinessObjectForList,
    formatTaskTitle,
    resolveTaskTotalAmount
} from './inbox-utils';

/** Status list for active pending tasks ("My Tasks") */
export const ACTIVE_TASK_STATUSES = [
    'IN PROCESSING',
    'IN_PROCESSING',
    'Pending approval',
    'Partially approved',
    'Pending Approval',
    'Partially Approved',
    'PENDING APPROVAL',
    'PARTIALLY APPROVED'
];

/** Status list for processed/historic tasks ("Approved Tasks") */
export const APPROVED_TASK_STATUSES = [
    'COMPLETED',
    'Approved',
    'Rejected',
    'Cancelled',
    'APPROVED',
    'REJECTED',
    'CANCELLED'
];

interface CachedInstance {
    normalTask: boolean;
    cachedAt: number;
}

export class InboxProcessor {
    private static readonly INSTANCE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
    private readonly instanceCache = new Map<string, CachedInstance>();

    private readonly sapClient = new SapClient();
    private readonly taskAdapter = new TaskprocessingAdapter();
    private readonly sapOdataAdapter = new SapOdataAdapter();
    private readonly objectTypeResolver = new ObjectTypeResolver(this.sapOdataAdapter, this.taskAdapter);
    private readonly decisionStrategies = new DecisionStrategyRegistry([
        new ClaimDecisionStrategy(),
        new TaskprocessingDecisionStrategy(),
    ]);
    private readonly logger = new Logger('InboxProcessor');

    /**
     * Retrieves active/pending approval tasks for the specified user.
     */
    async getTasks(sapUser: string, userJwt?: string, pagination?: { top?: number; skip?: number }) {
        this.logger.info(`Fetching tasks for user: ${sapUser}`);
        try {
            const customInstances = await this.sapOdataAdapter.getInstances(
                sapUser,
                ACTIVE_TASK_STATUSES,
                userJwt,
                undefined,
                pagination
            );
            if (!customInstances || customInstances.length === 0) {
                return { items: [], total: 0 };
            }

            const total = (customInstances as any).totalCount ?? customInstances.length;
            const paginatedInstances = this._paginate(customInstances, pagination);

            const items = paginatedInstances.map((inst: any) => {
                return this._buildTaskCard(inst);
            });

            return { items, total };
        } catch (error: any) {
            this.logger.error(`Error in getTasks: ${error.message}`);
            throw new AppError(`Failed to fetch tasks: ${error.message}`, 500);
        }
    }

    /**
     * Retrieves completed/historic tasks for the specified user.
     */
    async getApprovedTasks(sapUser: string, userJwt?: string, pagination?: { top?: number; skip?: number }) {
        this.logger.info(`Fetching approved/completed tasks for user: ${sapUser}`);
        try {
            const customInstances = await this.sapOdataAdapter.getInstances(
                sapUser,
                APPROVED_TASK_STATUSES,
                userJwt,
                undefined,
                pagination
            );
            if (!customInstances || customInstances.length === 0) {
                return { items: [], total: 0 };
            }

            const total = (customInstances as any).totalCount ?? customInstances.length;
            const paginatedInstances = this._paginate(customInstances, pagination);

            const items = paginatedInstances.map((inst: any) => {
                const overrideStatus = inst.status === 'COMPLETED' ? 'COMPLETED' : undefined;
                return this._buildTaskCard(inst, overrideStatus);
            });


            return { items, total };
        } catch (error: any) {
            this.logger.error(`Error in getApprovedTasks: ${error.message}`);
            throw new AppError(`Failed to fetch approved tasks: ${error.message}`, 500);
        }
    }


    /**
     * Fetches detailed header and task metadata for a single task instance.
     */
    async getTaskDetail(
        instanceId: string,
        sapUser: string,
        userJwt?: string
    ) {
        this.logger.info(`Fetching raw task detail for ${instanceId}`);
        try {
            const resolved = await this.objectTypeResolver.resolve(instanceId, sapUser, userJwt);
            const { businessObject, taskRuntime, inst } = resolved;
            const isNormalTask = resolved.normalTask ?? inst?.normalTask ?? true;
            const isClaim = resolved.objectType === 'CLAIM';
            const isCompleted = inst?.status === 'COMPLETED' || inst?.WorkflowTaskStatus === 'COMPLETED';

            if (inst?.normalTask !== undefined) {
                this.instanceCache.set(instanceId, {
                    normalTask: isNormalTask,
                    cachedAt: Date.now()
                });
            }

            let task: any = null;
            let decisionOptions: any[] = [];

            if (taskRuntime) {
                const { decisions, ...rawTaskFields } = taskRuntime;
                task = rawTaskFields && Object.keys(rawTaskFields).length > 0 ? rawTaskFields : null;
                decisionOptions = Array.isArray(decisions) ? decisions : [];
            }

            return {
                instanceId,
                taskId: instanceId,
                normalTask: isNormalTask,
                objectType: resolved.objectType,
                documentId: resolved.instid,
                supports: {
                    forward: (isNormalTask === false || isClaim || isCompleted) ? false : (inst?.SupportsForward ?? true),
                    comments: inst?.SupportsComments ?? true
                },
                businessObject: businessObject || {},
                taskprocessing: {
                    task,
                    decisionOptions: (isNormalTask === false || isCompleted) ? [] : decisionOptions
                }
            };
        } catch (error: any) {
            this.logger.error(`Error in getTaskDetail: ${error.message}`);
            if (error instanceof AppError) throw error;
            const isForbidden = error.message?.toLowerCase().includes('no access') || error.message?.toLowerCase().includes('not authorized');
            const statusCode = isForbidden ? 403 : (error.statusCode || 500);
            throw new AppError(`Failed to load task detail: ${error.message}`, statusCode);
        }
    }

    /**
     * Executes an approval or rejection decision on a task and syncs comment to SAP.
     *
     * Dispatches to a `DecisionStrategy` (see decision-strategy.ts) based on the
     * normalised object type. New flows (e.g. another entity-bound dual-API
     * pattern) plug in by registering another strategy — no edit to this method.
     *
     * Default flow (PR / PO / RE): TASKPROCESSING top-level `/Decision` plus a
     * best-effort `/SAP__self.comment` audit note.
     *
     * Claim flow: entity-bound `/SAP__self.approve` + `/SAP__self.comment` in
     * parallel, both best-effort; reports `PARTIAL_SUCCESS` when one leg fails.
     */
    async executeDecision(
        instanceId: string,
        decisionKey: string,
        sapDecisionKey: string,
        comment: string,
        sapUser: string,
        userJwt?: string,
        context?: { documentId?: string; businessObjectType?: string; objectType?: string; type?: string; sapOrigin?: string; approverNumber?: string }
    ) {
        this.logger.info(`Executing decision ${decisionKey} on task ${instanceId}`);
        try {
            const normalTask = await this.getInstanceNormalTask(instanceId, sapUser || '', userJwt);
            if (normalTask === false) {
                throw new AppError('Decisions (Approve/Reject) are not allowed for tagged/CC tasks', 403);
            }

            const ctxType = context?.businessObjectType || context?.objectType || context?.type;
            // Normalize DocCategory (e.g. 'BUS2105') → object type ('PR') using the same
            // resolver the adapter uses, so strategy dispatch works regardless of whether
            // the frontend sent the human type or the DocCategory value.
            const normalizedType = resolveObjectTypeFromTypeId(ctxType) || (ctxType || '').toUpperCase();

            const strategy = this.decisionStrategies.resolve(normalizedType);
            const outcome = await strategy.execute(
                {
                    instanceId,
                    decisionKey,
                    sapDecisionKey,
                    comment,
                    sapUser,
                    userJwt,
                    documentId: context?.documentId,
                    objectType: normalizedType,
                    sapOrigin: context?.sapOrigin,
                    approverNumber: context?.approverNumber || (context as any)?.ApproverNumber,
                },
                {
                    sapOdataAdapter: this.sapOdataAdapter,
                    taskAdapter: this.taskAdapter,
                    addComment: (documentId, text, user, options) => this.addComment(documentId, text, user, options),
                    logger: this.logger,
                }
            );

            // Preserve the historical shape so the FE keeps working.
            return outcome.adapterResult !== undefined
                ? outcome.adapterResult
                : {
                    status: outcome.status,
                    message: outcome.message,
                    approve: outcome.approve,
                    comment: outcome.comment,
                    partialSuccess: outcome.partialSuccess,
                };
        } catch (error: any) {
            this.logger.error(`Error in executeDecision: ${error.message}`);
            // Preserve explicit AppError status codes (e.g., 400 for missing documentId);
            // only wrap unknown errors as 500.
            if (error instanceof AppError) throw error;
            throw new AppError(`Decision execution failed: ${error.message}`, 500);
        }
    }

    /**
     * Executes mass approval or rejection across multiple tasks with bounded concurrency.
     */
    async executeMassDecision(
        items: MassDecisionItemContext[],
        decisionKey: string,
        sapDecisionKey: string,
        comment: string,
        sapUser: string,
        userJwt?: string
    ): Promise<MassDecisionResponse> {
        this.logger.info(`Executing mass decision (${decisionKey}) on ${items.length} tasks for user ${sapUser}`);

        const results: MassDecisionItemResult[] = [];
        const concurrencyLimit = 4;

        for (let i = 0; i < items.length; i += concurrencyLimit) {
            const chunk = items.slice(i, i + concurrencyLimit);
            const chunkPromises = chunk.map(async (item) => {
                const docId = item.documentId || item.documentNumber;
                try {
                    const outcome = await this.executeDecision(
                        item.instanceId,
                        decisionKey,
                        sapDecisionKey || decisionKey,
                        comment,
                        sapUser,
                        userJwt,
                        {
                            documentId: docId,
                            businessObjectType: item.businessObjectType || item.objectType || item.type,
                            sapOrigin: item.sapOrigin,
                        }
                    );
                    return {
                        instanceId: item.instanceId,
                        documentNumber: docId || item.documentNumber,
                        documentId: docId,
                        status: 'SUCCESS' as const,
                        message: outcome?.message || 'Decision processed successfully.',
                    };
                } catch (error: any) {
                    this.logger.warn(`Mass decision error on task ${item.instanceId} (${docId || 'unknown doc'}): ${error.message}`);
                    return {
                        instanceId: item.instanceId,
                        documentNumber: docId || item.documentNumber,
                        documentId: docId,
                        status: 'FAILED' as const,
                        error: error.message || 'Decision failed',
                    };
                }
            });

            const settled = await Promise.allSettled(chunkPromises);
            for (const itemResult of settled) {
                if (itemResult.status === 'fulfilled') {
                    results.push(itemResult.value);
                } else {
                    results.push({
                        instanceId: 'unknown',
                        status: 'FAILED',
                        error: (itemResult as PromiseRejectedResult).reason?.message || 'Unknown processing error',
                    });
                }
            }
        }

        const succeededCount = results.filter((r) => r.status === 'SUCCESS' || r.status === 'PARTIAL_SUCCESS').length;
        const failedCount = results.filter((r) => r.status === 'FAILED').length;

        return {
            total: items.length,
            succeededCount,
            failedCount,
            results,
        };
    }



    /**
     * Retrieves approval workflow tree and historical comments for a document.
     */
    async getWorkflowApprovalTree(
        documentId: string,
        sapUser: string,
        userJwt?: string,
        instanceId?: string,
        businessObjectType?: string
    ) {
        this.logger.info(`Fetching approval tree for document ${documentId} (type: ${businessObjectType || 'unknown'}, task: ${instanceId || 'unknown'})`);
        try {
            let objectType = businessObjectType;
            if (!objectType || objectType === 'UNKNOWN') {
                if (instanceId) {
                    try {
                        const taskRuntime = await this.taskAdapter.getTaskRuntime(instanceId, sapUser, userJwt);
                        const typeid = taskRuntime.TaskDefinitionID || '';
                        objectType = resolveObjectTypeFromTypeId(typeid) || 'PR';
                    } catch (e: any) {
                        this.logger.warn(`Failed to resolve objectType from task ${instanceId}: ${e.message}`);
                        objectType = 'PR';
                    }
                } else {
                    objectType = 'PR';
                }
            }

            const targetObjectType = objectType || 'PR';
            const detail = await this.sapOdataAdapter.getDetail(targetObjectType, documentId, sapUser, userJwt);
            const rawComments = detail.comments || [];
            const comments = rawComments.map((c: any) => ({
                docNum: documentId,
                postedOn: c.postedOn,
                postedTime: c.postedTime,
                noteText: c.text,
                userComment: c.author,
                type: 'NORM'
            }));
            return {
                documentId: documentId,
                releaseStrategyName: detail.header?.releaseStrategyName,
                steps: detail.approvalTree || [],
                comments
            };
        } catch (error: any) {
            this.logger.error(`Error in getWorkflowApprovalTree: ${error.message}`);
            throw new AppError(`Failed to load approval tree: ${error.message}`, 500);
        }
    }

    async addComment(documentId: string, text: string, sapUser: string, options?: AddCommentOptions) {
        this.logger.info(`Adding comment to document ${documentId} (objectType: ${options?.objectType || 'auto'}) (decision: ${options?.decision || 'none'})`);
        try {
            await this.sapOdataAdapter.addComment(documentId, text, sapUser, options);
        } catch (error: any) {
            this.logger.error(`Error in addComment: ${error.message}`);
            throw new AppError(`Failed to add comment: ${error.message}`, 500);
        }
    }

    async getAttachmentContent(documentId: string, attachId: string, sapUser: string, userJwt?: string, objectType?: string) {
        this.logger.info(`Fetching attachment content for ${attachId} in document ${documentId}`);
        try {
            return await this.sapOdataAdapter.fetchAttachmentContent(documentId, attachId, sapUser, userJwt, objectType);
        } catch (error: any) {
            this.logger.error(`Error in getAttachmentContent: ${error.message}`);
            throw new AppError(`Failed to load attachment content: ${error.message}`, 500);
        }
    }

    async getPrAttachments(documentId: string, sapUser: string, userJwt?: string) {
        this.logger.info(`Fetching PR attachments for document ${documentId}`);
        try {
            if (!documentId) {
                return [];
            }
            const detail = await this.sapOdataAdapter.getDetail('PR', documentId, sapUser, userJwt);
            return detail.attachments || [];
        } catch (error: any) {
            this.logger.error(`Error in getPrAttachments: ${error.message}`);
            throw new AppError(`Failed to load PR attachments: ${error.message}`, 500);
        }
    }

    async getDashboardSummary(sapUser: string, userJwt?: string) {
        this.logger.info(`Generating dashboard summary for user: ${sapUser}`);
        const [statusCountsRaw, docTypeCounts, customInstances] = await Promise.all([
            this.sapOdataAdapter.getStatusCounts(sapUser, userJwt).catch(() => []),
            this.sapOdataAdapter.getDocTypeCounts(sapUser, userJwt).catch(() => []),
            this.sapOdataAdapter.getInstances(sapUser, undefined, userJwt).catch(() => [])
        ]);

        const statusCounts = statusCountsRaw.map((s: any) => {
            const rawStatus = (s.WorkflowTaskStatus || '').toUpperCase().trim();
            let statusLabel = 'In Approving';
            if (rawStatus === 'COMPLETED' || rawStatus === 'COMPLETE') {
                statusLabel = 'Completed';
            }
            return {
                ...s,
                statusLabel
            };
        });

        const items = customInstances.map((t: any) => {
            const objectType = resolveObjectTypeFromInstance(t, 'PR');
            const docCat = (t.DocCategory || t.typeid || '').toUpperCase();

            let netAmount: number | null = null;
            if (objectType === 'PO' || docCat === 'BUS2012') {
                const val = t.TotalOrderValue ?? t.total;
                netAmount = val !== undefined && val !== null ? Number(val) : null;
            } else if (objectType === 'CLAIM' || docCat === 'CLAIM') {
                const val = t.PaymentAmountLocalCrcy ?? t.PaymentAmount ?? t.total;
                netAmount = val !== undefined && val !== null ? Number(val) : null;
            } else {
                // PR (BUS2105), RE / RESV (ZBUS2093 / BUS2093)
                const val = t.TotalNetAmountLocalCrcy ?? t.total;
                netAmount = val !== undefined && val !== null ? Number(val) : null;
            }

            const currency = t.LocalCurrency || t.curr_vnd || t.doc_curr || 'VND';
            const docTypeDesc = t.DocumentTypeText || t.doctyp_desc || t.doctyp || objectType;

            return {
                taskId: t.WorkflowTaskInternalID || t.instanceID,
                documentNumber: t.DocumentNumber || t.instid,
                taskType: objectType,
                documentType: t.DocumentType || t.doctyp || objectType,
                documentTypeDesc: docTypeDesc,
                docCategory: t.DocCategory || '',
                status: (t.WorkflowTaskStatus || t.status || 'READY').replace(/\s+/g, '_'),
                currency: currency,
                totalNetAmount: netAmount,
                TotalOrderValue: t.TotalOrderValue !== undefined && t.TotalOrderValue !== null ? Number(t.TotalOrderValue) : undefined,
                TotalNetAmountLocalCrcy: t.TotalNetAmountLocalCrcy !== undefined && t.TotalNetAmountLocalCrcy !== null ? Number(t.TotalNetAmountLocalCrcy) : undefined,
                PaymentAmountLocalCrcy: t.PaymentAmountLocalCrcy !== undefined && t.PaymentAmountLocalCrcy !== null ? Number(t.PaymentAmountLocalCrcy) : undefined,
                displayCurrency: currency,
                createdAt: t.TaskCreationDateTime || t.taskCreationDateTime || t.creationDate
            };
        });

        return {
            statusCounts,
            docTypeCounts,
            items,
            total: items.length
        };
    }

    async searchUsers(searchPattern: string, sapUser: string, userJwt?: string) {
        this.logger.info(`Searching users with pattern: "${searchPattern}" for user: ${sapUser}`);
        try {
            const rawUsers = await this.taskAdapter.searchUsers(searchPattern, sapUser, userJwt);
            if (!Array.isArray(rawUsers)) return [];

            return rawUsers.map((u: any) => ({
                userId: u.UniqueName || u.UserId || u.id || '',
                uniqueName: u.UniqueName || u.UserId || '',
                displayName: u.DisplayName || `${u.FirstName || ''} ${u.LastName || ''}`.trim() || u.UniqueName || '',
                firstName: u.FirstName || undefined,
                lastName: u.LastName || undefined,
                email: u.Email || undefined,
                department: u.Department || undefined,
                company: u.Company || undefined
            }));
        } catch (error: any) {
            this.logger.error(`Error in searchUsers: ${error.message}`);
            throw new AppError(`Failed to search users: ${error.message}`, 500);
        }
    }

    async searchBusUsers(searchPattern: string, sapUser: string, userJwt?: string) {
        this.logger.info(`Searching bus users with pattern: "${searchPattern}" for user: ${sapUser}`);
        try {
            const rawUsers = await this.sapOdataAdapter.searchBusUsers(searchPattern, sapUser, userJwt);
            if (!Array.isArray(rawUsers)) return [];

            return rawUsers.map((u: any) => ({
                SAPUserName: u.SAPUserName || u.sapUserName || u.id || '',
                FirstName: u.FirstName || u.firstName || '',
                LastName: u.LastName || u.lastName || '',
                FullName: u.FullName || u.fullName || `${u.FirstName || ''} ${u.LastName || ''}`.trim() || u.SAPUserName || '',
                EmailAddress: u.EmailAddress || u.emailAddress || u.Email || u.email || ''
            }));
        } catch (error: any) {
            this.logger.error(`Error in searchBusUsers: ${error.message}`);
            throw new AppError(`Failed to search business users: ${error.message}`, 500);
        }
    }

    async forwardTask(
        instanceId: string,
        forwardTo: string,
        comment?: string,
        sapUser?: string,
        userJwt?: string,
        context?: { documentId?: string; businessObjectType?: string; objectType?: string; type?: string }
    ) {
        this.logger.info(`Forwarding task ${instanceId} to user ${forwardTo}`);
        try {
            if (!forwardTo || !forwardTo.trim()) {
                throw new AppError('Target user (forwardTo) is required', 400);
            }

            const normalTask = await this.getInstanceNormalTask(instanceId, sapUser || '', userJwt);
            if (normalTask === false) {
                throw new AppError('Forward is not allowed for tagged/CC tasks', 403);
            }

            const docId = context?.documentId;
            const ctxType = context?.businessObjectType || context?.objectType || context?.type;
            // Normalize DocCategory (e.g. 'BUS2105') → object type ('PR') using the same
            // resolver the adapter uses, so entity-bound forward works regardless of
            // whether the frontend sent the object type or the DocCategory value.
            const normalizedType = resolveObjectTypeFromTypeId(ctxType) || (ctxType || '').toUpperCase();
            const supportsEntityForward = (normalizedType === 'PR' || normalizedType === 'PO') && Boolean(docId);
            this.logger.info(
                `forwardTask type=${normalizedType} docId=${docId || '(none)'} supportsEntityForward=${supportsEntityForward}`
            );

            // Sequential API call: 1. Call standard TASKPROCESSING /Forward first
            const taskProcResult = await this.taskAdapter.forwardTask(
                instanceId,
                forwardTo.trim(),
                comment || '',
                sapUser || '',
                userJwt
            );

            // 2. Only after TASKPROCESSING succeeds, call entity-bound forward (PR/PO only) as best-effort
            if (supportsEntityForward) {
                try {
                    await this.sapOdataAdapter.forwardOnHeader(
                        normalizedType,
                        docId!,
                        { taskId: instanceId, notetext: comment || '', toUser: forwardTo.trim() },
                        sapUser || '',
                        userJwt
                    );
                } catch (entityForwardErr: any) {
                    this.logger.warn(
                        `Non-fatal: Entity-bound forward failed for ${normalizedType || 'unknown'} ${docId || ''}: ${entityForwardErr.message || entityForwardErr}`
                    );
                }
            }

            return taskProcResult;
        } catch (error: any) {
            this.logger.error(`Error in forwardTask: ${error.message}`);
            if (error instanceof AppError) throw error;
            throw new AppError(`Failed to forward task: ${error.message}`, 500);
        }
    }

    // ─── Private Helper Methods ────────────────────────────────

    private async getInstanceNormalTask(
        instanceId: string,
        sapUser: string,
        userJwt?: string
    ): Promise<boolean> {
        const cached = this.instanceCache.get(instanceId);
        if (cached && Date.now() - cached.cachedAt < InboxProcessor.INSTANCE_CACHE_TTL_MS) {
            return cached.normalTask;
        }

        try {
            const path = ODATA_SERVICES.INSTANCE_LIST.servicePath;
            const response: any = await this.sapClient.get(
                path,
                '/CNMA_WFTASK',
                {
                    $format: 'json',
                    $select: 'NormalTask',
                    $filter: `WorkflowTaskInternalID eq '${instanceId}'`,
                    $top: '1',
                },
                sapUser,
                userJwt
            );
            const items = response?.value || response?.d?.results || response?.d || [];
            const item = items[0];
            const normalTask = item ? item.NormalTask !== false : true;
            this.instanceCache.set(instanceId, { normalTask, cachedAt: Date.now() });
            return normalTask;
        } catch (error: any) {
            this.logger.warn(`Failed to fetch NormalTask for instance ${instanceId}: ${error.message}`);
            return cached ? cached.normalTask : false;
        }
    }

    /**
     * Slice instance array according to top/skip pagination params.
     */
    private _paginate<T>(instances: T[], pagination?: { top?: number; skip?: number }): T[] {
        if (pagination?.top === undefined && pagination?.skip === undefined) {
            return instances;
        }
        const skip = pagination.skip ?? 0;
        const top = pagination.top ?? instances.length;
        return instances.length > top ? instances.slice(skip, skip + top) : instances;
    }


    private _buildTaskCard(inst: any, overrideStatus?: string) {
        const objectType = resolveObjectTypeFromInstance(inst, 'PR');
        const requesterName = inst?.CreatedByUser || inst?.CreatedByName || inst?.createdByUser || inst?.UserName || inst?.UserFullName || undefined;
        const calcTotal = resolveTaskTotalAmount(inst, undefined, objectType);
        const docTypeDisplay = inst?.doctyp_desc || inst?.DocumentTypeText || inst?.DocumentTypeDisplay || inst?.doctyp || objectType;
        const currency = inst?.LocalCurrency || inst?.curr_vnd || inst?.Currency || inst?.DocumentCurrency || 'VND';
        const createdOn = normalizeDate(inst?.taskCreationDateTime || inst?.CreatedOn || inst?.CreationDate);

        const card: any = {
            ...inst,
            instanceId: inst.instanceID || inst.instanceId,
            sapOrigin: inst.SAP__Origin || 'LOCAL',
            title: inst.TaskTitle || formatTaskTitle(inst, undefined, objectType, overrideStatus),
            status: overrideStatus || (inst.status || 'READY').replace(/\s+/g, '_'),
            priority: normalizePriority(inst.Priority || inst.priority),
            createdOn: createdOn,
            createdByName: requesterName,
            requestorName: requesterName,
            taskDefinitionId: inst.typeid || inst.TaskDefinitionID,
            instid: inst.instid,
            documentId: inst.instid,
            objectType: objectType,
            DocCategory: inst.DocCategory || inst.TechnicalWrkflwObjectType || objectType,
            DocumentType: inst.DocumentType || inst.doctyp || undefined,
            DocumentTypeText: docTypeDisplay,
            documentTypeDisplay: docTypeDisplay,
            businessContext: {
                type: objectType,
                documentId: inst.instid
            },
            supports: {
                forward: (inst.normalTask === false || overrideStatus === 'COMPLETED') ? false : (inst.SupportsForward ?? inst.supports?.forward ?? true),
                comments: inst.SupportsComments ?? inst.supports?.comments ?? true
            },
            total: calcTotal !== undefined ? Number(calcTotal) : undefined,
            curr_vnd: currency,
            LocalCurrency: currency,
            DocumentCurrency: currency,
            TotalNetAmountLocalCrcy: inst.TotalNetAmountLocalCrcy ?? calcTotal,
            normalTask: inst.normalTask ?? true
        };

        return cleanBusinessObjectForList(card);
    }


}

