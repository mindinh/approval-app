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
    'IN PROCESSING'
];

/** Status list for processed/historic tasks ("Approved Tasks") */
export const APPROVED_TASK_STATUSES = [
    'COMPLETED'
];

const TASK_CATEGORY_FILTERS = [
    "DocCategory eq 'BUS2105'",
    "DocCategory eq 'BUS2012'",
    "(DocCategory eq 'ZBUS2093' or DocCategory eq 'BUS2093')",
    "DocCategory eq 'CLAIM'",
];

type TaskCategory = 'PR' | 'PO' | 'RESERVATION' | 'CLAIM';

const TASK_CATEGORY_FILTER_BY_KEY: Record<TaskCategory, string> = {
    PR: TASK_CATEGORY_FILTERS[0],
    PO: TASK_CATEGORY_FILTERS[1],
    RESERVATION: TASK_CATEGORY_FILTERS[2],
    CLAIM: TASK_CATEGORY_FILTERS[3],
};

interface CachedInstance {
    normalTask: boolean;
    inst?: any;
    cachedAt: number;
}

interface CachedAggregate<T> {
    data: T;
    cachedAt: number;
}

export class InboxProcessor {
    private static readonly INSTANCE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
    private static readonly AGGREGATE_CACHE_TTL_MS = 60 * 1000; // 60 seconds
    private readonly instanceCache = new Map<string, CachedInstance>();
    private readonly statusCountsCache = new Map<string, CachedAggregate<any[]>>();
    private readonly docTypeCountsCache = new Map<string, CachedAggregate<any[]>>();

    private readonly sapClient = new SapClient();
    private readonly taskAdapter = new TaskprocessingAdapter();
    private readonly sapOdataAdapter = new SapOdataAdapter();
    private readonly objectTypeResolver = new ObjectTypeResolver(this.sapOdataAdapter, this.taskAdapter);
    private readonly decisionStrategies = new DecisionStrategyRegistry([
        new ClaimDecisionStrategy(),
        new TaskprocessingDecisionStrategy(),
    ]);
    private readonly logger = new Logger('InboxProcessor');

    private normInstanceId(id?: string | null): string {
        return id ? String(id).trim().replace(/^0+/, '') : '';
    }

    private setCachedInstance(sapUser: string, instanceId: string, entry: CachedInstance) {
        if (!instanceId) return;
        const normId = this.normInstanceId(instanceId);
        this.instanceCache.set(instanceId, entry);
        if (normId) {
            this.instanceCache.set(normId, entry);
            if (sapUser) {
                this.instanceCache.set(`${sapUser}:${normId}`, entry);
            }
        }
        if (sapUser) {
            this.instanceCache.set(`${sapUser}:${instanceId}`, entry);
        }
    }

    private getCachedInstance(sapUser: string, instanceId: string): CachedInstance | undefined {
        const now = Date.now();
        const normId = this.normInstanceId(instanceId);
        const candidates = [
            sapUser && normId ? `${sapUser}:${normId}` : '',
            sapUser ? `${sapUser}:${instanceId}` : '',
            normId,
            instanceId,
        ].filter(Boolean);

        for (const key of candidates) {
            const cached = this.instanceCache.get(key);
            if (cached && now - cached.cachedAt < InboxProcessor.INSTANCE_CACHE_TTL_MS) {
                return cached;
            }
        }
        return undefined;
    }

    private cacheInstancesList(sapUser: string, instances: any[]) {
        if (!Array.isArray(instances)) return;
        const now = Date.now();
        for (const inst of instances) {
            const rawId = inst?.WorkflowTaskInternalID || inst?.instanceID || inst?.instanceId;
            if (!rawId) continue;
            const normalTask = inst.NormalTask !== false && inst.normalTask !== false;
            this.setCachedInstance(sapUser, String(rawId), {
                normalTask,
                inst,
                cachedAt: now,
            });
        }
    }

    private invalidateUserAggregates(sapUser?: string) {
        if (sapUser) {
            this.statusCountsCache.delete(sapUser);
            this.docTypeCountsCache.delete(sapUser);
        } else {
            this.statusCountsCache.clear();
            this.docTypeCountsCache.clear();
        }
    }

    /**
     * Retrieves active/pending approval tasks for the specified user.
     */
    async getTasks(
        sapUser: string,
        userJwt?: string,
        pagination?: { top?: number; skip?: number },
        filters?: { category?: TaskCategory; search?: string }
    ) {
        this.logger.info(`Fetching tasks for user: ${sapUser}`);
        try {
            const customInstances = await this.sapOdataAdapter.getInstances(
                sapUser,
                ACTIVE_TASK_STATUSES,
                userJwt,
                undefined,
                pagination,
                undefined,
                this._buildTaskFilter(filters)
            );
            if (!customInstances || customInstances.length === 0) {
                return { items: [], total: (customInstances as any)?.totalCount ?? 0 };
            }

            this.cacheInstancesList(sapUser, customInstances);

            const total = (customInstances as any).totalCount ?? customInstances.length;
            const items = customInstances.map((inst: any) => {
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
    async getApprovedTasks(
        sapUser: string,
        userJwt?: string,
        pagination?: { top?: number; skip?: number },
        filters?: { category?: TaskCategory; search?: string }
    ) {
        this.logger.info(`Fetching approved/completed tasks for user: ${sapUser}`);
        try {
            const customInstances = await this.sapOdataAdapter.getInstances(
                sapUser,
                APPROVED_TASK_STATUSES,
                userJwt,
                undefined,
                pagination,
                undefined,
                this._buildTaskFilter(filters)
            );
            if (!customInstances || customInstances.length === 0) {
                return { items: [], total: (customInstances as any)?.totalCount ?? 0 };
            }

            this.cacheInstancesList(sapUser, customInstances);

            const total = (customInstances as any).totalCount ?? customInstances.length;
            const items = customInstances.map((inst: any) => {
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
            const cached = this.getCachedInstance(sapUser, instanceId);
            const resolved = cached?.inst
                ? await this.objectTypeResolver.resolve(instanceId, sapUser, userJwt, cached.inst)
                : await this.objectTypeResolver.resolve(instanceId, sapUser, userJwt);
            const { businessObject, taskRuntime, inst } = resolved;
            const isNormalTask = resolved.normalTask ?? inst?.normalTask ?? true;
            const isClaim = resolved.objectType === 'CLAIM';
            const isCompleted = inst?.status === 'COMPLETED' || inst?.WorkflowTaskStatus === 'COMPLETED';

            if (inst) {
                this.setCachedInstance(sapUser, instanceId, {
                    normalTask: isNormalTask,
                    inst,
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

            this.invalidateUserAggregates(sapUser);

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

    /**
     * Fetches detailed CNMA_PRHEADER entity with expands for a specific PR document number.
     */
    async getPrDetail(documentId: string, sapUser: string, userJwt?: string) {
        this.logger.info(`Fetching PR detail for document ${documentId}`);
        try {
            if (!documentId) {
                throw new AppError('Document ID is required', 400);
            }
            const cleanDocId = String(documentId).trim();
            const businessObject = await this.sapOdataAdapter.getDetail('PR', cleanDocId, sapUser, userJwt);
            return {
                instanceId: cleanDocId,
                taskId: cleanDocId,
                normalTask: false,
                objectType: 'PR',
                documentId: cleanDocId,
                supports: {
                    forward: false,
                    comments: false
                },
                businessObject: businessObject || {},
                taskprocessing: {
                    task: null,
                    decisionOptions: []
                }
            };
        } catch (error: any) {
            this.logger.error(`Error in getPrDetail: ${error.message}`);
            if (error instanceof AppError) throw error;
            throw new AppError(`Failed to load PR detail for ${documentId}: ${error.message}`, error.statusCode || 500);
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

    async getDashboardSummary(
        sapUser: string,
        userJwt?: string,
        options?: {
            top?: number;
            skip?: number;
            category?: TaskCategory;
            documentType?: string;
            status?: 'In Approving' | 'Completed';
        }
    ) {
        this.logger.info(`Generating dashboard summary for user: ${sapUser}`);
        const statusFilter = options?.status === 'Completed'
            ? APPROVED_TASK_STATUSES
            : options?.status === 'In Approving'
                ? ACTIVE_TASK_STATUSES
                : undefined;
        const detailFilters: string[] = [];
        if (options?.category) detailFilters.push(TASK_CATEGORY_FILTER_BY_KEY[options.category]);
        if (options?.documentType) {
            detailFilters.push(`DocumentType eq '${options.documentType.replace(/'/g, "''")}'`);
        }

        const now = Date.now();
        const cachedStatus = this.statusCountsCache.get(sapUser);
        const cachedDocTypes = this.docTypeCountsCache.get(sapUser);

        const statusCountsPromise = (cachedStatus && now - cachedStatus.cachedAt < InboxProcessor.AGGREGATE_CACHE_TTL_MS)
            ? Promise.resolve(cachedStatus.data)
            : this.sapOdataAdapter.getStatusCounts(sapUser, userJwt)
                .then((rows) => {
                    if (Array.isArray(rows) && rows.length > 0) {
                        this.statusCountsCache.set(sapUser, { data: rows, cachedAt: Date.now() });
                    }
                    return rows || [];
                })
                .catch(() => []);

        const docTypeCountsPromise = (cachedDocTypes && now - cachedDocTypes.cachedAt < InboxProcessor.AGGREGATE_CACHE_TTL_MS)
            ? Promise.resolve(cachedDocTypes.data)
            : this.sapOdataAdapter.getDocTypeCounts(sapUser, userJwt)
                .then((rows) => {
                    if (Array.isArray(rows) && rows.length > 0) {
                        this.docTypeCountsCache.set(sapUser, { data: rows, cachedAt: Date.now() });
                    }
                    return rows || [];
                })
                .catch(() => []);

        const [statusCountsRaw, docTypeCounts, customInstances] = await Promise.all([
            statusCountsPromise,
            docTypeCountsPromise,
            this.sapOdataAdapter.getInstances(
                sapUser,
                statusFilter,
                userJwt,
                undefined,
                { top: options?.top ?? 50, skip: options?.skip ?? 0 },
                undefined,
                detailFilters.length > 0 ? detailFilters.join(' and ') : undefined
            ).catch(() => [])
        ]);

        this.cacheInstancesList(sapUser, customInstances);
        const detailTotal = Number((customInstances as any).totalCount ?? customInstances.length);

        const statusCounts = statusCountsRaw.map((s: any) => {
            const rawStatus = (s.WorkflowTaskStatus || '').toUpperCase().trim();
            let statusLabel = 'In Approving';
            if (['APPROVED', 'COMPLETED', 'COMPLETE', 'REJECTED', 'CANCELLED', 'CANCELED'].includes(rawStatus)) {
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
            total: detailTotal
        };
    }

    private _buildTaskFilter(filters?: { category?: TaskCategory; search?: string }): string | undefined {
        const conditions: string[] = [];
        if (filters?.category) conditions.push(TASK_CATEGORY_FILTER_BY_KEY[filters.category]);
        const search = filters?.search?.trim().replace(/'/g, "''");
        if (search) {
            conditions.push(
                `(contains(DocumentNumber,'${search}') or contains(CreatedByUser,'${search}') or contains(DocumentTypeText,'${search}'))`
            );
        }
        return conditions.length > 0 ? conditions.join(' and ') : undefined;
    }

    async getStatusCounts(sapUser: string, userJwt?: string) {
        const rows = await this.sapOdataAdapter.getStatusCounts(sapUser, userJwt);
        if (Array.isArray(rows) && rows.length > 0) {
            this.statusCountsCache.set(sapUser, { data: rows, cachedAt: Date.now() });
        }
        let inApproval = 0;
        let completed = 0;
        for (const row of rows) {
            if (row.WorkflowTaskStatus === 'IN PROCESSING') inApproval += Number(row.RequestCount || 0);
            if (row.WorkflowTaskStatus === 'COMPLETED') completed += Number(row.RequestCount || 0);
        }
        return { total: inApproval + completed, inApproval, completed };
    }

    async getCategoryCounts(sapUser: string, scope: 'my' | 'approved' = 'my', userJwt?: string) {
        this.logger.info(`Fetching category counts for user: ${sapUser}, scope: ${scope}`);
        const statuses = scope === 'approved' ? APPROVED_TASK_STATUSES : ACTIVE_TASK_STATUSES;

        try {
            const rows = await this.sapOdataAdapter.getCategorySummary(sapUser, statuses, userJwt);
            const counts = { PR: 0, PO: 0, RESERVATION: 0, CLAIM: 0 };
            const categories: Record<string, TaskCategory> = {
                BUS2105: 'PR', BUS2012: 'PO', BUS2093: 'RESERVATION', ZBUS2093: 'RESERVATION', CLAIM: 'CLAIM',
            };
            for (const row of rows) {
                const category = categories[row.DocCategory];
                if (category) counts[category] += row.RequestCount;
            }
            return { ...counts, ALL: Object.values(counts).reduce((sum, count) => sum + count, 0), complete: true };
        } catch {
            this.logger.warn('Category summary unavailable; falling back to worklist counts');
        }

        // Query server count for each category in parallel via $top=0&$count=true
        const results = await Promise.allSettled(
            (Object.entries(TASK_CATEGORY_FILTER_BY_KEY) as [TaskCategory, string][]).map(async ([category, filter]) => ({
                category,
                count: await this.sapOdataAdapter.getCategoryCount(sapUser, statuses, filter, userJwt),
            }))
        );
        const counts: Record<TaskCategory, number | null> = { PR: null, PO: null, RESERVATION: null, CLAIM: null };
        for (const result of results) {
            if (result.status === 'fulfilled') counts[result.value.category] = result.value.count;
        }

        const availableCounts = Object.values(counts).filter((count): count is number => count !== null);
        const total = availableCounts.reduce((sum, count) => sum + count, 0);

        return {
            ...counts,
            ALL: total,
            complete: availableCounts.length === Object.keys(counts).length,
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

    async getCurrentSapUser(sapUser: string, userJwt?: string) {
        try {
            return await this.sapOdataAdapter.getCurrentSapUser(sapUser, userJwt);
        } catch (error: any) {
            this.logger.error(`Failed to resolve the current SAP session user: ${error.message}`);
            throw new AppError('Unable to resolve the current SAP user', 502);
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

            this.invalidateUserAggregates(sapUser);

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
        const cached = this.getCachedInstance(sapUser, instanceId);
        if (cached) {
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
            this.setCachedInstance(sapUser, instanceId, { normalTask, cachedAt: Date.now() });
            return normalTask;
        } catch (error: any) {
            this.logger.warn(`Failed to fetch NormalTask for instance ${instanceId}: ${error.message}`);
            return false;
        }
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
