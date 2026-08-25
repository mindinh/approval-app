import { TaskprocessingAdapter } from '../integrations/taskprocessing-adapter';
import { SapOdataAdapter } from '../integrations/sap-odata-adapter';
import { AddCommentOptions } from '../integrations/comment.types';
import { resolveObjectTypeFromTypeId, resolveObjectTypeFromInstance } from './odata-config';

import { Logger } from '../utils/logger';
import { AppError } from '../utils/error-handler';
import { ObjectTypeResolver } from './object-type-resolver';
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

export class InboxProcessor {
    private readonly taskAdapter = new TaskprocessingAdapter();
    private readonly sapOdataAdapter = new SapOdataAdapter();
    private readonly objectTypeResolver = new ObjectTypeResolver(this.sapOdataAdapter, this.taskAdapter);
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
        hints?: {
            typeid?: string;
            instid?: string;
            businessObjectType?: string;
            documentId?: string;
            status?: string;
        },
        userJwt?: string
    ) {
        this.logger.info(`Fetching raw task detail for ${instanceId}`);
        try {
            const resolved = await this.objectTypeResolver.resolve(instanceId, sapUser, hints, userJwt);
            const { businessObject, taskRuntime } = resolved;

            let task: any = null;
            let decisionOptions: any[] = [];

            if (taskRuntime) {
                const { decisions, ...rawTaskFields } = taskRuntime;
                task = rawTaskFields && Object.keys(rawTaskFields).length > 0 ? rawTaskFields : null;
                decisionOptions = Array.isArray(decisions) ? decisions : [];
            }

            return {
                businessObject: businessObject || {},
                taskprocessing: {
                    task,
                    decisionOptions
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
     */
    async executeDecision(
        instanceId: string,
        decisionKey: string,
        sapDecisionKey: string,
        comment: string,
        sapUser: string,
        userJwt?: string,
        context?: { documentId?: string; businessObjectType?: string; objectType?: string; type?: string }
    ) {
        this.logger.info(`Executing decision ${decisionKey} on task ${instanceId}`);
        try {
            const docId = context?.documentId;
            const ctxType = context?.businessObjectType || context?.objectType || context?.type;
            const isClaim = String(ctxType || '').toUpperCase() === 'CLAIM';

            if (isClaim) {
                this.logger.info(`Claim decision actions are currently disabled. Skipping all actions for Claim ${docId || instanceId}`);
                return { status: 'SUCCESS', message: 'Claim decision action skipped.' };
            }

            const isReject = sapDecisionKey === '0002' || decisionKey === '0002' ||
                String(sapDecisionKey).toLowerCase().includes('reject') ||
                String(decisionKey).toLowerCase().includes('reject');
            const decisionCode = isReject ? 'R' : 'A';


            // 1. Post decision note via OData service (/SAP__self.comment)
            if (docId) {
                try {
                    const defaultText = isReject ? `Rejected by ${sapUser || 'user'}` : `Approved by ${sapUser || 'user'}`;
                    const noteText = comment && comment.trim() ? comment.trim() : defaultText;
                    await this.addComment(docId, noteText, sapUser || '', { userJwt, decision: decisionCode, objectType: ctxType, taskId: instanceId });
                    this.logger.info(`Successfully pushed OData decision comment (${decisionCode}) to ${ctxType || 'document'} ${docId}`);
                } catch (e: any) {
                    this.logger.warn(`Failed to push decision comment to document ${docId}: ${e.message}`);
                }
            } else {
                this.logger.warn(`Audit Warning: Decision executed but could not push OData comment because documentId is unknown for task ${instanceId}`);
            }

            // 2. Execute decision via TASKPROCESSING API
            return await this.taskAdapter.executeDecision(instanceId, sapDecisionKey, comment, sapUser, userJwt);
        } catch (error: any) {

            this.logger.error(`Error in executeDecision: ${error.message}`);
            throw new AppError(`Decision execution failed: ${error.message}`, 500);
        }
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
            const objectType = resolveObjectTypeFromTypeId(t.typeid || '');
            const netAmount = t.total !== undefined && t.total !== null ? Number(t.total) : null;
            const currency = t.curr_vnd || t.doc_curr || 'VND';
            const docTypeDesc = t.doctyp_desc || t.doctyp || objectType;

            return {
                taskId: t.instanceID,
                documentNumber: t.instid,
                taskType: objectType,
                documentType: t.doctyp || objectType,
                documentTypeDesc: docTypeDesc,
                status: (t.status || 'READY').replace(/\s+/g, '_'),
                currency: currency,
                totalNetAmount: netAmount,
                displayCurrency: currency,
                createdAt: t.taskCreationDateTime || t.creationDate
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

            const result = await this.taskAdapter.forwardTask(instanceId, forwardTo.trim(), comment || '', sapUser || '', userJwt);

            const docId = context?.documentId;
            const ctxType = context?.businessObjectType || context?.objectType || context?.type;


            if (comment && comment.trim()) {
                if (docId) {
                    try {
                        await this.addComment(docId, `[Forwarded to ${forwardTo}] ${comment}`, sapUser || '', { userJwt, objectType: ctxType, taskId: instanceId });
                    } catch (e: any) {
                        this.logger.warn(`Non-fatal: Failed to record forward comment on document ${docId}: ${e.message}`);
                    }
                } else {
                    this.logger.warn(`Audit Warning: Forward comment was provided but could not record to document audit history because documentId is unknown for task ${instanceId}`);
                }
            }

            return result;
        } catch (error: any) {
            this.logger.error(`Error in forwardTask: ${error.message}`);
            if (error instanceof AppError) throw error;
            throw new AppError(`Failed to forward task: ${error.message}`, 500);
        }
    }

    // ─── Private Helper Methods ────────────────────────────────

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

