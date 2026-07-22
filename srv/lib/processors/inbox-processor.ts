import { TaskprocessingAdapter } from '../integrations/taskprocessing-adapter';
import { SapOdataAdapter } from '../integrations/sap-odata-adapter';
import { getObjectConfig, mapCardChips } from './object-config';
import { resolveObjectTypeFromTypeId } from './odata-config';
import { Logger } from '../utils/logger';
import { AppError } from '../utils/error-handler';
import { ConfigRegistry } from '../mapping/config-registry';
import { MappingEngine } from '../mapping/mapping-engine';
import { FieldRequirementResolver } from '../mapping/resolver';
import { CanonicalProjector } from '../mapping/canonical-projector';

function normalizePriority(priority: string): string {
    const map: Record<string, string> = {
        '1': 'VERY_HIGH',
        '2': 'HIGH',
        '3': 'MEDIUM',
        '4': 'LOW',
        VERY_HIGH: 'VERY_HIGH',
        HIGH: 'HIGH',
        MEDIUM: 'MEDIUM',
        LOW: 'LOW',
    };
    return map[(priority || '').toUpperCase()] || priority || 'MEDIUM';
}

function normalizeDate(dateValue: string | undefined | null): string | undefined {
    if (!dateValue) return undefined;
    const msMatch = dateValue.match(/\/Date\((\d+)\)\//);
    if (msMatch) {
        return new Date(parseInt(msMatch[1], 10)).toISOString();
    }
    try {
        return new Date(dateValue).toISOString();
    } catch {
        return dateValue;
    }
}

export class InboxProcessor {
    private taskAdapter = new TaskprocessingAdapter();
    private sapOdataAdapter = new SapOdataAdapter();
    private logger = new Logger('InboxProcessor');

    async getTasks(sapUser: string, userJwt?: string, pagination?: { top?: number; skip?: number }) {
        this.logger.info(`Fetching tasks for user: ${sapUser}`);
        try {
            const customInstances = await this.sapOdataAdapter.getInstances(sapUser, ['IN PROCESSING', 'IN_PROCESSING'], userJwt);
            if (!customInstances || customInstances.length === 0) {
                return { items: [], total: 0 };
            }

            const total = customInstances.length;

            // Apply pagination
            let paginatedInstances = customInstances;
            const skip = pagination?.skip ?? 0;
            const top = pagination?.top ?? paginatedInstances.length;
            paginatedInstances = paginatedInstances.slice(skip, skip + top);

            if (paginatedInstances.length === 0) {
                return { items: [], total };
            }

            const rawTasks = await this.taskAdapter.getTasks(sapUser, userJwt);

            // Pre-fetch details in batch to resolve N+1 query issue
            const itemsToFetch = paginatedInstances
                .filter((inst: any) => inst.instid)
                .map((inst: any) => {
                    const matchingTask = rawTasks.find((t: any) => {
                        const rawId = t.InstanceID ? String(t.InstanceID).replace(/^0+/, '') : '';
                        const instId = inst.instanceID ? String(inst.instanceID).replace(/^0+/, '') : '';
                        return rawId === instId;
                    });
                    const objectType = resolveObjectTypeFromTypeId(inst.typeid || matchingTask?.TaskDefinitionID || '');
                    return { objectType, objectId: inst.instid };
                });

            const batchedDetails = await this.sapOdataAdapter.getDetailBatch(itemsToFetch, sapUser, userJwt);

            const items = await Promise.all(paginatedInstances.map(async (inst: any) => {
                const matchingTask = rawTasks.find((t: any) => {
                    const rawId = t.InstanceID ? String(t.InstanceID).replace(/^0+/, '') : '';
                    const instId = inst.instanceID ? String(inst.instanceID).replace(/^0+/, '') : '';
                    return rawId === instId;
                });
                const objectType = resolveObjectTypeFromTypeId(inst.typeid || matchingTask?.TaskDefinitionID || '');
                
                let businessObject: any = null;
                try {
                    if (inst.instid) {
                        const cachedObj = batchedDetails[`${objectType}:${inst.instid}`];
                        if (cachedObj) {
                            businessObject = JSON.parse(JSON.stringify(cachedObj));
                        } else {
                            businessObject = await this.sapOdataAdapter.getDetail(objectType, inst.instid, sapUser, userJwt, true);
                        }
                    }
                } catch (err: any) {
                    this.logger.warn(`Failed to retrieve task detail ${inst.instanceID}: ${err.message}`);
                }

                return this._buildTaskCard(inst, matchingTask, businessObject, objectType);
            }));

            return { items, total };
        } catch (error: any) {
            this.logger.error(`Error in getTasks: ${error.message}`);
            throw new AppError(`Failed to fetch tasks: ${error.message}`, 500);
        }
    }

    async getApprovedTasks(sapUser: string, userJwt?: string, pagination?: { top?: number; skip?: number }) {
        this.logger.info(`Fetching approved/completed tasks for user: ${sapUser}`);
        try {
            const customInstances = await this.sapOdataAdapter.getInstances(sapUser, 'COMPLETED', userJwt);
            if (!customInstances || customInstances.length === 0) {
                return { items: [], total: 0 };
            }

            const total = customInstances.length;

            // Apply pagination
            let paginatedInstances = customInstances;
            const skip = pagination?.skip ?? 0;
            const top = pagination?.top ?? paginatedInstances.length;
            paginatedInstances = paginatedInstances.slice(skip, skip + top);

            if (paginatedInstances.length === 0) {
                return { items: [], total };
            }

            // Build filter string for only the paginated instances to prevent HTTP 414 URI Too Long errors
            const filterParts = paginatedInstances.map((inst: any) => {
                const paddedId = String(inst.instanceID).padStart(12, '0');
                return `InstanceID eq '${paddedId}'`;
            });
            const filterStr = filterParts.join(' or ');

            const rawTasks = await this.taskAdapter.getTasks(sapUser, userJwt, filterStr);

            // Pre-fetch details in batch to resolve N+1 query issue
            const itemsToFetch = paginatedInstances
                .filter((inst: any) => inst.instid)
                .map((inst: any) => {
                    const matchingTask = rawTasks.find((t: any) => {
                        const rawId = t.InstanceID ? String(t.InstanceID).replace(/^0+/, '') : '';
                        const instId = inst.instanceID ? String(inst.instanceID).replace(/^0+/, '') : '';
                        return rawId === instId;
                    });
                    const objectType = resolveObjectTypeFromTypeId(inst.typeid || matchingTask?.TaskDefinitionID || '');
                    return { objectType, objectId: inst.instid };
                });

            const batchedDetails = await this.sapOdataAdapter.getDetailBatch(itemsToFetch, sapUser, userJwt);

            const items = await Promise.all(paginatedInstances.map(async (inst: any) => {
                const matchingTask = rawTasks.find((t: any) => {
                    const rawId = t.InstanceID ? String(t.InstanceID).replace(/^0+/, '') : '';
                    const instId = inst.instanceID ? String(inst.instanceID).replace(/^0+/, '') : '';
                    return rawId === instId;
                });
                const objectType = resolveObjectTypeFromTypeId(inst.typeid || matchingTask?.TaskDefinitionID || '');
                
                let businessObject: any = null;
                try {
                    if (inst.instid) {
                        const cachedObj = batchedDetails[`${objectType}:${inst.instid}`];
                        if (cachedObj) {
                            businessObject = JSON.parse(JSON.stringify(cachedObj));
                        } else {
                            businessObject = await this.sapOdataAdapter.getDetail(objectType, inst.instid, sapUser, userJwt, true);
                        }
                    }
                } catch (err: any) {
                    this.logger.warn(`Failed to retrieve task detail ${inst.instanceID}: ${err.message}`);
                }

                return this._buildTaskCard(inst, matchingTask, businessObject, objectType, 'COMPLETED');
            }));

            return { items, total };
        } catch (error: any) {
            this.logger.error(`Error in getApprovedTasks: ${error.message}`);
            throw new AppError(`Failed to fetch approved tasks: ${error.message}`, 500);
        }
    }

    async getTaskDetail(
        instanceId: string,
        sapUser: string,
        hints?: {
            typeid?: string;
            instid?: string;
            businessObjectType?: string;
            documentId?: string;
        },
        userJwt?: string
    ) {
        this.logger.info(`Fetching task detail for ${instanceId}`);
        try {
            let inst: any = null;
            let normalTask = true;
            try {
                const customInstances = await this.sapOdataAdapter.getInstances(sapUser, undefined, userJwt).catch(() => []);
                inst = customInstances.find((i: any) => {
                    const rawId = i.instanceID ? String(i.instanceID).replace(/^0+/, '') : '';
                    const instId = instanceId ? String(instanceId).replace(/^0+/, '') : '';
                    return rawId === instId;
                });
                if (inst && inst.normalTask === false) {
                    normalTask = false;
                }
            } catch (e: any) {
                this.logger.warn(`Failed to retrieve custom instances for task ${instanceId}: ${e.message}`);
            }

            let taskRuntime: any;
            const isMockMode = process.env.USE_MOCK_SAP !== 'false';
            if (isMockMode || normalTask) {
                taskRuntime = await this.taskAdapter.getTaskRuntime(instanceId, sapUser, userJwt, normalTask);
            } else {
                this.logger.info(`Omitting TASKPROCESSING API calls for comment-only tagged task ${instanceId}`);
                const objectType = inst ? (resolveObjectTypeFromTypeId(inst.typeid) || 'PR') : 'PR';
                taskRuntime = {
                    InstanceID: instanceId,
                    SAP__Origin: 'LOCAL',
                    TaskTitle: inst ? `${inst.normalTask === false ? 'Review' : 'Approve'} ${objectType} ${inst.instid}` : '',
                    Status: inst ? inst.status : 'READY',
                    Priority: 'MEDIUM',
                    CreatedOn: undefined,
                    CreatedByName: undefined,
                    TaskDefinitionID: inst ? (inst.typeid || '') : '',
                    SupportsForward: false,
                    SupportsComments: true,
                    decisions: []
                };
            }
            const objectType = await this._resolveObjectType(instanceId, sapUser, userJwt, hints?.businessObjectType, taskRuntime);

            const configRegistry = ConfigRegistry.getInstance();
            const mappingEngine = MappingEngine.getInstance();
            const resolver = FieldRequirementResolver.getInstance();
            const projector = CanonicalProjector.getInstance();

            const config = configRegistry.get(objectType);
            if (!config) {
                throw new Error(`Configuration not found for objectType: ${objectType}`);
            }

            let instid = hints?.documentId || hints?.instid;
            if (!instid) {
                instid = taskRuntime.TaskTitle?.match(/\d+/)?.[0] || '';
            }

            if (!instid) {
                throw new AppError(`Could not resolve business document ID for task ${instanceId}`, 400);
            }

            let businessObject = await this.sapOdataAdapter.getDetail(objectType, instid, sapUser, userJwt);

            const mergedPayload = inst ? { ...inst, ...businessObject, header: { ...inst, ...businessObject.header } } : businessObject;

            // Map to Canonical Model using Config mappings
            const canonicalObject = mappingEngine.map(mergedPayload, config, { documentId: instid });

            // Resolve field requirements & Project / Prune
            const fieldPlan = resolver.resolve('detail', config);
            const projectedObject = projector.project(canonicalObject, fieldPlan.canonicalPaths);

            const documentType = businessObject.documentType || 'DEFAULT';
            const subtypeConfig = config.documentTypes?.[documentType];
            const activeUiSchema = subtypeConfig?.uiSchema || config.uiSchema;
            const activeCardChips = subtypeConfig?.cardChips || config.cardChips;

            // Merge SAP available decisions with configured action decorations
            const actions = (taskRuntime.decisions || []).map((sapDec: any) => {
                const configAct = config.actions.find(a => a.sapDecisionKey === sapDec.DecisionKey);
                
                let nature: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' = 'NEUTRAL';
                if (configAct?.variant === 'PRIMARY') {
                    nature = 'POSITIVE';
                } else if (configAct?.variant === 'DANGER') {
                    nature = 'NEGATIVE';
                }

                return {
                    key: sapDec.DecisionKey,
                    text: sapDec.DecisionText,
                    label: sapDec.DecisionText,
                    nature,
                    variant: configAct?.variant || 'SECONDARY',
                    requiresComment: configAct?.requiresComment || false,
                    confirmRequired: configAct?.confirmRequired || false,
                    confirmMessage: configAct?.confirmMessage || undefined,
                    sapDecisionKey: sapDec.DecisionKey,
                    commentMandatory: configAct?.requiresComment || false,
                    commentSupported: process.env.USE_MOCK_SAP !== 'false'
                };
            });

            // Legacy comments mapping for compatibility
            const comments = (projectedObject.workflow?.comments || []).map((c: any, idx: number) => ({
                id: `comment-${idx}`,
                createdBy: c.author || 'SAP User',
                createdByName: c.author || 'SAP User',
                text: c.text,
                createdAt: normalizeDate(c.postedOn && c.postedTime ? `${c.postedOn}T${c.postedTime}` : undefined) || new Date().toISOString()
            }));

            // Legacy attachments mapping for compatibility
            const attachments = (projectedObject.attachments || []).map((a: any, idx: number) => {
                const attId = a.id || `attach-${idx}`;
                return {
                    id: attId,
                    fileName: a.fileName || a.name || attId,
                    fileDisplayName: a.fileName || a.name || attId,
                    mimeType: a.mimeType || 'application/pdf',
                    fileSize: a.fileSize || 0,
                    createdBy: a.createdBy || 'SAP User',
                    createdByName: a.createdBy || 'SAP User',
                    createdAt: normalizeDate(a.createdAt),
                    link: `/api/cnma/APPROVAL_SRV/tasks/tasks/${instanceId}/attachments/${attId}/content?documentId=${projectedObject.objectId || instid}`
                };
            });

            const businessChips: any[] = [];
            if (activeCardChips) {
                for (const chip of activeCardChips) {
                    const rawVal = mappingEngine['getNestedValue'](projectedObject, chip.dataPath);
                    if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
                        businessChips.push({
                            label: chip.label,
                            value: rawVal,
                            dataType: chip.dataType,
                            isPrimary: chip.isPrimary,
                            currency: projectedObject.header?.displayCurrency || projectedObject.header?.documentCurrency || ''
                        });
                    }
                }
            }

            // Dynamically construct fieldSchema in the key-value structure expected by the React dynamic renderer
            const dynamicFieldSchema: Record<string, any> = {};
            for (const m of config.mappings.root) {
                const parts = m.targetPath.split('.');
                const key = parts[parts.length - 1];
                const label = m.label || key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase());

                dynamicFieldSchema[key] = {
                    key,
                    label,
                    dataPath: `$.${m.targetPath}`,
                    dataType: m.type === 'string' ? 'TEXT' : m.transform === 'number' ? 'AMOUNT' : m.transform === 'sapDateToIso' ? 'DATE' : 'TEXT'
                };
            }

            for (const colKey of Object.keys(config.mappings.collections)) {
                const col = config.mappings.collections[colKey];
                for (const f of col.fields) {
                    const parts = f.targetPath.split('.');
                    const key = parts[parts.length - 1];
                    const label = f.label || key
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, str => str.toUpperCase());

                    dynamicFieldSchema[key] = {
                        key,
                        label,
                        dataPath: `$.${f.targetPath}`,
                        dataType: f.type === 'string' ? 'TEXT' : f.transform === 'number' ? 'QUANTITY' : f.transform === 'sapDateToIso' ? 'DATE' : 'TEXT'
                    };
                }
            }

            const businessContext: Record<string, any> = {
                type: objectType,
                documentId: instid,
                [objectType.toLowerCase()]: canonicalObject
            };

            return {
                task: {
                    instanceId: instanceId,
                    sapOrigin: taskRuntime.SAP__Origin || hints?.typeid || 'LOCAL',
                    title: taskRuntime.TaskTitle || '',
                    status: taskRuntime.Status,
                    priority: normalizePriority(taskRuntime.Priority),
                    createdOn: normalizeDate(taskRuntime.CreatedOn || inst?.taskCreationDateTime),
                    createdByName: taskRuntime.CreatedByName || undefined,
                    requestorName: projectedObject.header?.userFullName || projectedObject.header?.createdByUser || taskRuntime.CreatedByName || undefined,
                    taskDefinitionId: hints?.typeid || taskRuntime.TaskDefinitionID || '',
                    supports: {
                        forward: taskRuntime.SupportsForward ?? true,
                        comments: taskRuntime.SupportsComments ?? true
                    },
                    businessContext: businessContext,
                    total: inst?.total !== undefined && inst?.total !== null ? Number(inst.total) : undefined,
                    curr_vnd: inst?.curr_vnd || undefined,
                    total_doc_curr: inst?.total_doc_curr !== undefined && inst?.total_doc_curr !== null ? Number(inst.total_doc_curr) : undefined,
                    doc_curr: inst?.doc_curr || undefined,
                    businessChips: businessChips && businessChips.length > 0 ? businessChips : undefined,
                    normalTask: normalTask
                },
                object: projectedObject,
                decisions: actions,
                customAttributes: [],
                taskObjects: [],
                comments,
                processingLogs: [],
                workflowLogs: [],
                attachments,
                businessContext: businessContext,
                fieldSchema: dynamicFieldSchema,
                uiSchema: activeUiSchema,
                actions
            };
        } catch (error: any) {
            this.logger.error(`Error in getTaskDetail: ${error.message}`);
            throw new AppError(`Failed to load task detail: ${error.message}`, 500);
        }
    }


    async executeDecision(
        instanceId: string,
        decisionKey: string,
        sapDecisionKey: string,
        comment: string,
        sapUser: string,
        userJwt?: string,
        context?: { documentId?: string; businessObjectType?: string }
    ) {
        this.logger.info(`Executing decision ${decisionKey} on task ${instanceId}`);
        try {
            // Push decision comment to custom PR comment table if document context is PR
            if (comment && comment.trim() && context?.documentId && context?.businessObjectType === 'PR') {
                try {
                    await this.addComment(context.documentId, comment, sapUser, userJwt, 'APPR');
                    this.logger.info(`Successfully pushed decision comment to PR ${context.documentId}`);
                } catch (e: any) {
                    this.logger.warn(`Failed to push decision comment to PR ${context.documentId}: ${e.message}`);
                }
            }

            return await this.taskAdapter.executeDecision(instanceId, sapDecisionKey, comment, sapUser, userJwt);
        } catch (error: any) {
            this.logger.error(`Error in executeDecision: ${error.message}`);
            throw new AppError(`Decision execution failed: ${error.message}`, 500);
        }
    }

    private async _resolveObjectType(
        instanceId: string | undefined,
        sapUser: string,
        userJwt?: string,
        businessObjectTypeHint?: string,
        taskRuntimeHint?: any
    ): Promise<string> {
        if (businessObjectTypeHint && businessObjectTypeHint !== 'UNKNOWN') {
            return businessObjectTypeHint;
        }
        if (taskRuntimeHint) {
            const typeid = taskRuntimeHint.TaskDefinitionID || '';
            return resolveObjectTypeFromTypeId(typeid) || 'PR';
        }
        if (!instanceId) {
            return 'PR';
        }
        try {
            const taskRuntime = await this.taskAdapter.getTaskRuntime(instanceId, sapUser, userJwt);
            const typeid = taskRuntime.TaskDefinitionID || '';
            return resolveObjectTypeFromTypeId(typeid) || 'PR';
        } catch (e: any) {
            this.logger.warn(`Failed to resolve objectType from task ${instanceId}: ${e.message}`);
            return 'PR';
        }
    }

    async getWorkflowApprovalTree(
        documentId: string, 
        sapUser: string, 
        userJwt?: string, 
        instanceId?: string, 
        businessObjectType?: string
    ) {
        this.logger.info(`Fetching approval tree for document ${documentId} (type: ${businessObjectType || 'unknown'}, task: ${instanceId || 'unknown'})`);
        try {
            const objectType = await this._resolveObjectType(instanceId, sapUser, userJwt, businessObjectType);

            const detail = await this.sapOdataAdapter.getDetail(objectType, documentId, sapUser, userJwt);
            const comments = (detail.comments || []).map((c: any) => ({
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

    async addComment(documentId: string, text: string, sapUser: string, userJwt?: string, type: string = 'NORM') {
        this.logger.info(`Adding comment to document ${documentId} of type ${type}`);
        try {
            await this.sapOdataAdapter.addComment(documentId, text, sapUser, userJwt, type);
        } catch (error: any) {
            this.logger.error(`Error in addComment: ${error.message}`);
            throw new AppError(`Failed to add comment: ${error.message}`, 500);
        }
    }

    async uploadAttachment(documentId: string, fileName: string, mimeType: string, buffer: Buffer, sapUser: string, userJwt?: string) {
        this.logger.info(`Uploading attachment ${fileName} to document ${documentId}`);
        try {
            await this.sapOdataAdapter.uploadAttachment(documentId, fileName, mimeType, buffer, sapUser, userJwt);
        } catch (error: any) {
            this.logger.error(`Error in uploadAttachment: ${error.message}`);
            throw new AppError(`Failed to upload attachment: ${error.message}`, 500);
        }
    }

    async getAttachmentContent(documentId: string, attachId: string, sapUser: string, userJwt?: string) {
        this.logger.info(`Fetching attachment content for ${attachId} in document ${documentId}`);
        try {
            return await this.sapOdataAdapter.fetchAttachmentContent(documentId, attachId, sapUser, userJwt);
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
        const result = await this.getTasks(sapUser, userJwt);
        const items = result.items.map((t: any) => {
            const header = t.businessContext?.pr?.header || t.businessContext?.po?.header || t.businessContext?.re?.header || t.businessContext?.claim?.header;
            const netAmount = Number(header?.totalNetAmount || header?.purchaseOrderNetAmount || 0);
            const currency = header?.displayCurrency || header?.documentCurrency || 'VND';
            const docTypeDesc = header?.purchaseRequisitionType || header?.purchaseOrderType || 'Standard';

            return {
                taskId: t.instanceId,
                documentNumber: t.instid,
                taskType: t.objectType,
                documentType: docTypeDesc,
                documentTypeDesc: docTypeDesc,
                status: t.status,
                currency: currency,
                totalNetAmount: netAmount,
                displayCurrency: currency,
                createdAt: t.createdOn
            };
        });
        return { items, total: items.length };
    }

    private _buildTaskCard(inst: any, matchingTask: any, rawBusinessObject: any, objectType: string, overrideStatus?: string) {
        const configRegistry = ConfigRegistry.getInstance();
        const mappingEngine = MappingEngine.getInstance();
        const objConfig = configRegistry.get(objectType);
        
        const mergedPayload = (rawBusinessObject || inst) ? { ...inst, ...rawBusinessObject, header: { ...inst, ...rawBusinessObject?.header } } : null;
        const businessObject = (mergedPayload && objConfig) ? mappingEngine.map(mergedPayload, objConfig, { documentId: inst?.instid }) : rawBusinessObject;

        const requesterName = businessObject?.header?.userFullName || businessObject?.header?.createdByUser || inst?.createdByUser || matchingTask?.CreatedByName || undefined;
        const documentType = businessObject?.documentType || 'DEFAULT';
        const config = getObjectConfig(objectType, documentType);
        const businessChips = mapCardChips(config, businessObject);

        return {
            instanceId: inst.instanceID,
            sapOrigin: matchingTask?.SAP__Origin || 'LOCAL',
            title: matchingTask?.TaskTitle || this._formatTaskTitle(inst, matchingTask, objectType, overrideStatus),
            status: overrideStatus || (inst.status || matchingTask?.Status || 'READY').replace(/\s+/g, '_'),
            priority: normalizePriority(matchingTask?.Priority),
            createdOn: normalizeDate(matchingTask?.CreatedOn || inst.taskCreationDateTime),
            createdByName: matchingTask?.CreatedByName || undefined,
            requestorName: requesterName,
            taskDefinitionId: inst.typeid || matchingTask?.TaskDefinitionID,
            instid: inst.instid,
            objectType: objectType,
            businessContext: {
                type: objectType,
                documentId: inst.instid,
                [objectType.toLowerCase()]: businessObject
            },
            supports: {
                forward: overrideStatus === 'COMPLETED' ? false : (matchingTask?.SupportsForward ?? true),
                comments: process.env.USE_MOCK_SAP !== 'false' ? (matchingTask?.SupportsComments ?? true) : false
            },
            total: inst.total !== undefined && inst.total !== null ? Number(inst.total) : undefined,
            curr_vnd: inst.curr_vnd || undefined,
            total_doc_curr: inst.total_doc_curr !== undefined && inst.total_doc_curr !== null ? Number(inst.total_doc_curr) : undefined,
            doc_curr: inst.doc_curr || undefined,
            businessChips: businessChips && businessChips.length > 0 ? businessChips : undefined,
            normalTask: inst.normalTask
        };
    }

    private _formatTaskTitle(inst: any, matchingTask: any, objectType: string, overrideStatus?: string): string {
        if (matchingTask?.TaskTitle) return matchingTask.TaskTitle;
        const isCompleted = overrideStatus === 'COMPLETED';
        const actionPrefix = inst.normalTask === false 
            ? (isCompleted ? 'Reviewed' : 'Review') 
            : (isCompleted ? 'Approved' : 'Approve');
        return `${actionPrefix} ${objectType} ${inst.instid}`;
    }
}
