import { TaskprocessingAdapter } from '../integrations/taskprocessing-adapter';
import { SapOdataAdapter } from '../integrations/sap-odata-adapter';
import { getObjectConfig, mapCardChips } from './object-config';
import { resolveObjectTypeFromTypeId } from './odata-config';
import { Logger } from '../utils/logger';
import { AppError } from '../utils/error-handler';

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
                        enrichBusinessObjectForSchema(businessObject, objectType, inst, matchingTask);
                    }
                } catch (err: any) {
                    this.logger.warn(`Failed to enrich active task ${inst.instanceID}: ${err.message}`);
                }

                const businessContext = {
                    type: objectType,
                    documentId: inst.instid,
                    pr: objectType === 'PR' ? businessObject : undefined,
                    po: objectType === 'PO' ? businessObject : undefined
                };

                const requesterName = businessObject?.header?.userFullName || matchingTask?.CreatedByName || undefined;
                const documentType = businessObject?.documentType || 'DEFAULT';
                const config = getObjectConfig(objectType, documentType);
                const businessChips = mapCardChips(config, businessObject);

                return {
                    instanceId: inst.instanceID,
                    sapOrigin: matchingTask?.SAP__Origin || 'LOCAL',
                    title: matchingTask?.TaskTitle || `Approve ${objectType} ${inst.instid}`,
                    status: (inst.status || matchingTask?.Status || 'READY').replace(/\s+/g, '_'),
                    priority: normalizePriority(matchingTask?.Priority),
                    createdOn: normalizeDate(matchingTask?.CreatedOn),
                    createdByName: matchingTask?.CreatedByName || undefined,
                    requestorName: requesterName,
                    taskDefinitionId: inst.typeid || matchingTask?.TaskDefinitionID,
                    instid: inst.instid,
                    objectType: objectType,
                    businessContext: businessContext,
                    supports: {
                        forward: matchingTask?.SupportsForward ?? true,
                        comments: matchingTask?.SupportsComments ?? true
                    },
                    total: inst.total !== undefined && inst.total !== null ? Number(inst.total) : undefined,
                    curr_vnd: inst.curr_vnd || undefined,
                    total_doc_curr: inst.total_doc_curr !== undefined && inst.total_doc_curr !== null ? Number(inst.total_doc_curr) : undefined,
                    doc_curr: inst.doc_curr || undefined,
                    businessChips: businessChips && businessChips.length > 0 ? businessChips : undefined
                };
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
                        enrichBusinessObjectForSchema(businessObject, objectType, inst, matchingTask);
                    }
                } catch (err: any) {
                    this.logger.warn(`Failed to enrich approved task ${inst.instanceID}: ${err.message}`);
                }

                const businessContext = {
                    type: objectType,
                    documentId: inst.instid,
                    pr: objectType === 'PR' ? businessObject : undefined,
                    po: objectType === 'PO' ? businessObject : undefined
                };

                const requesterName = businessObject?.header?.userFullName || matchingTask?.CreatedByName || undefined;
                const documentType = businessObject?.documentType || 'DEFAULT';
                const config = getObjectConfig(objectType, documentType);
                const businessChips = mapCardChips(config, businessObject);

                return {
                    instanceId: inst.instanceID,
                    sapOrigin: matchingTask?.SAP__Origin || 'LOCAL',
                    title: matchingTask?.TaskTitle || `Approved ${objectType} ${inst.instid}`,
                    status: 'COMPLETED',
                    priority: normalizePriority(matchingTask?.Priority || 'MEDIUM'),
                    createdOn: normalizeDate(matchingTask?.CreatedOn),
                    createdByName: matchingTask?.CreatedByName || undefined,
                    requestorName: requesterName,
                    taskDefinitionId: inst.typeid || matchingTask?.TaskDefinitionID,
                    instid: inst.instid,
                    objectType: objectType,
                    businessContext: businessContext,
                    supports: {
                        forward: false,
                        comments: true
                    },
                    total: inst.total !== undefined && inst.total !== null ? Number(inst.total) : undefined,
                    curr_vnd: inst.curr_vnd || undefined,
                    total_doc_curr: inst.total_doc_curr !== undefined && inst.total_doc_curr !== null ? Number(inst.total_doc_curr) : undefined,
                    doc_curr: inst.doc_curr || undefined,
                    businessChips: businessChips && businessChips.length > 0 ? businessChips : undefined
                };
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
            const taskRuntime = await this.taskAdapter.getTaskRuntime(instanceId, sapUser, userJwt);

            let objectType: string = 'PR';
            if (hints?.businessObjectType && hints.businessObjectType !== 'UNKNOWN') {
                objectType = hints.businessObjectType;
            } else {
                const typeid = hints?.typeid || taskRuntime.TaskDefinitionID || '';
                objectType = resolveObjectTypeFromTypeId(typeid) || 'PR';
            }

            let instid = hints?.documentId || hints?.instid;
            if (!instid) {
                instid = taskRuntime.TaskTitle?.match(/\d+/)?.[0] || '';
            }

            const businessObject = await this.sapOdataAdapter.getDetail(objectType, instid || '', sapUser, userJwt);

            let inst: any = null;
            try {
                const customInstances = await this.sapOdataAdapter.getInstances(sapUser, undefined, userJwt).catch(() => []);
                inst = customInstances.find((i: any) => {
                    const rawId = i.instanceID ? String(i.instanceID).replace(/^0+/, '') : '';
                    const instId = instanceId ? String(instanceId).replace(/^0+/, '') : '';
                    return rawId === instId;
                });
                enrichBusinessObjectForSchema(businessObject, objectType, inst, taskRuntime);
            } catch (e: any) {
                this.logger.warn(`Failed to inject doctyp details for task ${instanceId}: ${e.message}`);
            }
            const documentType = businessObject.documentType || 'DEFAULT';
            const config = getObjectConfig(objectType, documentType);

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
                    commentSupported: true
                };
            });

            // Construct frontend businessContext structure
            const businessContext = {
                type: objectType,
                documentId: instid,
                pr: objectType === 'PR' ? businessObject : undefined,
                po: objectType === 'PO' ? businessObject : undefined
            };

            const comments = (businessObject.comments || []).map((c: any, idx: number) => ({
                id: `comment-${idx}`,
                createdBy: c.author || 'SAP User',
                createdByName: c.author || 'SAP User',
                text: c.text,
                createdAt: normalizeDate(c.postedOn && c.postedTime ? `${c.postedOn}T${c.postedTime}` : undefined) || new Date().toISOString()
            }));

            const attachments = (businessObject.attachments || []).map((a: any, idx: number) => {
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
                    link: `/api/cnma/APPROVAL_SRV/tasks/tasks/${instanceId}/attachments/${attId}/content?documentId=${instid}`
                };
            });

            const businessChips = mapCardChips(config, businessObject);

            return {
                task: {
                    instanceId: instanceId,
                    sapOrigin: taskRuntime.SAP__Origin || hints?.typeid || 'LOCAL',
                    title: taskRuntime.TaskTitle || '',
                    status: taskRuntime.Status,
                    priority: normalizePriority(taskRuntime.Priority),
                    createdOn: normalizeDate(taskRuntime.CreatedOn),
                    createdByName: taskRuntime.CreatedByName || undefined,
                    requestorName: taskRuntime.CreatedByName || undefined,
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
                    businessChips: businessChips && businessChips.length > 0 ? businessChips : undefined
                },
                decisions: actions,
                customAttributes: [],
                taskObjects: [],
                comments,
                processingLogs: [],
                workflowLogs: [],
                attachments,
                businessContext: businessContext,
                fieldSchema: config.fieldSchema,
                uiSchema: config.uiSchema,
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

    async getWorkflowApprovalTree(documentId: string, sapUser: string, userJwt?: string) {
        this.logger.info(`Fetching approval tree for document ${documentId}`);
        try {
            const detail = await this.sapOdataAdapter.getDetail('PR', documentId, sapUser, userJwt);
            const comments = (detail.comments || []).map((c: any) => ({
                docNum: documentId,
                postedOn: c.postedOn,
                postedTime: c.postedTime,
                noteText: c.text,
                userComment: c.author,
                type: 'NORM'
            }));
            return {
                prNumber: documentId,
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
            const header = t.businessContext?.pr?.header || t.businessContext?.po?.header;
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
}

function enrichBusinessObjectForSchema(businessObject: any, objectType: string, inst: any, taskRuntime: any) {
    if (!businessObject || !businessObject.header) return;
    
    // Inject custom instance doctyp details and total amounts/currencies
    if (objectType === 'PR') {
        businessObject.header.purchaseRequisitionType = inst?.doctyp || businessObject.header.purchaseRequisitionType;
        businessObject.header.purchaseRequisitionTypeText = inst?.doctyp_desc || businessObject.header.purchaseRequisitionTypeText;
        if (inst?.total !== undefined && inst?.total !== null) {
            businessObject.header.totalNetAmount = inst.total;
        }
        if (inst?.curr_vnd !== undefined && inst?.curr_vnd !== null) {
            businessObject.header.displayCurrency = inst.curr_vnd;
        }
        if (inst?.total_doc_curr !== undefined && inst?.total_doc_curr !== null) {
            businessObject.header.totalDocNetAmount = inst.total_doc_curr;
        }
        if (inst?.doc_curr !== undefined && inst?.doc_curr !== null) {
            businessObject.header.docCurrency = inst.doc_curr;
        }
    } else if (objectType === 'PO') {
        businessObject.header.purchaseOrderType = inst?.doctyp || businessObject.header.purchaseOrderType;
        businessObject.header.purchaseOrderTypeText = inst?.doctyp_desc || businessObject.header.purchaseOrderTypeText;
        if (inst?.total !== undefined && inst?.total !== null) {
            businessObject.header.purchaseOrderNetAmount = inst.total;
        }
        if (inst?.curr_vnd !== undefined && inst?.curr_vnd !== null) {
            businessObject.header.documentCurrency = inst.curr_vnd;
        }
        if (inst?.total_doc_curr !== undefined && inst?.total_doc_curr !== null) {
            businessObject.header.totalDocNetAmount = inst.total_doc_curr;
        }
        if (inst?.doc_curr !== undefined && inst?.doc_curr !== null) {
            businessObject.header.docCurrency = inst.doc_curr;
        }
    }

    // Inject task metadata
    if (taskRuntime) {
        businessObject.header.priority = taskRuntime.Priority || taskRuntime.priority || businessObject.header.priority;
        businessObject.header.createdOn = taskRuntime.CreatedOn || taskRuntime.createdOn || businessObject.header.createdOn;
    }

    // Pre-merge display fields for dynamic schema
    if (objectType === 'PR') {
        const typeCode = businessObject.header.purchaseRequisitionType;
        const typeText = businessObject.header.purchaseRequisitionTypeText;
        businessObject.header.purchaseRequisitionTypeDisplay = typeCode && typeText && typeCode !== typeText ? `${typeCode} (${typeText})` : typeCode || typeText || '-';
        
        businessObject.header.departmentDisplay = '1001201000 - IT department';
        businessObject.header.expenseTypeDisplay = '6105 - IT Equipment & Software Cost';

        // Pre-merge for items
        if (Array.isArray(businessObject.items)) {
            businessObject.items.forEach((item: any) => {
                item.materialGroupDisplay = item.materialGroup && item.materialGroupText ? `${item.materialGroup} (${item.materialGroupText})` : item.materialGroup || item.materialGroupText || '-';
            });
        }
    } else if (objectType === 'PO') {
        const typeCode = businessObject.header.purchaseOrderType;
        const typeText = businessObject.header.purchaseOrderTypeText;
        businessObject.header.purchaseOrderTypeDisplay = typeCode && typeText && typeCode !== typeText ? `${typeCode} (${typeText})` : typeCode || typeText || '-';
        
        const compCode = businessObject.header.companyCode;
        const compName = businessObject.header.companyCodeName;
        businessObject.header.companyCodeDisplay = compCode && compName ? `${compCode} (${compName})` : compCode || compName || '-';

        const orgCode = businessObject.header.purchasingOrganization;
        const orgName = businessObject.header.purchasingOrganizationName;
        businessObject.header.purchasingOrganizationDisplay = orgCode && orgName ? `${orgCode} (${orgName})` : orgCode || orgName || '-';

        // Pre-merge for items
        if (Array.isArray(businessObject.items)) {
            businessObject.items.forEach((item: any) => {
                item.materialGroupDisplay = item.materialGroup && item.materialGroupText ? `${item.materialGroup} (${item.materialGroupText})` : item.materialGroup || item.materialGroupText || '-';
            });
        }

        // Pre-merge for account assignments
        if (Array.isArray(businessObject.accountAssignments)) {
            businessObject.accountAssignments.forEach((aa: any) => {
                aa.glAccountDisplay = aa.glAccount && aa.glAccountText ? `${aa.glAccount} (${aa.glAccountText})` : aa.glAccount || aa.glAccountText || '-';
                aa.costCenterDisplay = aa.costCenter && aa.costCenterText ? `${aa.costCenter} (${aa.costCenterText})` : aa.costCenter || aa.costCenterText || '-';
                aa.profitCenterDisplay = aa.profitCenter && aa.profitCenterText ? `${aa.profitCenter} (${aa.profitCenterText})` : aa.profitCenter || aa.profitCenterText || '-';
            });
        }
    }
}
