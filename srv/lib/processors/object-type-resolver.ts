import { SapOdataAdapter } from '../integrations/sap-odata-adapter';
import { TaskprocessingAdapter } from '../integrations/taskprocessing-adapter';
import { resolveObjectTypeFromTypeId, resolveObjectTypeFromInstance } from './odata-config';

import { Logger } from '../utils/logger';
import { AppError } from '../utils/error-handler';

export class ObjectTypeResolver {
    private logger = new Logger('ObjectTypeResolver');

    constructor(
        private sapOdataAdapter: SapOdataAdapter,
        private taskAdapter: TaskprocessingAdapter
    ) { }

    async resolve(
        instanceId: string,
        sapUser: string,
        hints?: any,
        userJwt?: string
    ): Promise<{
        objectType: string;
        instid: string;
        inst: any | undefined;
        taskRuntime: any;
        businessObject: any;
        normalTask: boolean;
    }> {
        this.logger.info(`Resolving details for task ${instanceId}`);

        // 1. Resolve objectType and documentId directly from hints or instanceId
        let resolvedObjectType = hints?.businessObjectType
            ? resolveObjectTypeFromTypeId(hints.businessObjectType) || (hints.businessObjectType as any)
            : (hints?.typeid ? resolveObjectTypeFromTypeId(hints.typeid) : undefined);

        let resolvedInstid = hints?.documentId || hints?.instid;

        let inst: any = undefined;

        // Fallback: search task list instance ONLY if objectType or documentId was not supplied in hints
        if (!resolvedObjectType || !resolvedInstid) {
            const instancesResult = await Promise.resolve(
                this.sapOdataAdapter.getInstances(sapUser, undefined, userJwt, instanceId)
            ).catch(() => []);

            const targetId = instanceId ? String(instanceId).replace(/^0+/, '') : '';
            inst = instancesResult.find((i: any) => {
                const rawId = String(i.WorkflowTaskInternalID || i.instanceID || i.InstanceID || i.instanceId || '').replace(/^0+/, '');
                const rawDocNum = String(i.DocumentNumber || i.TechnicalWrkflwObject || i.instid || '').replace(/^0+/, '');
                return rawId === targetId || rawDocNum === targetId;
            });

            if (inst) {
                resolvedObjectType = resolvedObjectType || resolveObjectTypeFromInstance(inst, 'PR');
                resolvedInstid = resolvedInstid || inst.DocumentNumber || inst.TechnicalWrkflwObject || inst.instid;
            }
        }

        resolvedObjectType = resolvedObjectType || 'PR';
        resolvedInstid = resolvedInstid || (/^\d+$/.test(instanceId) ? instanceId.padStart(10, '0') : instanceId);

        if (!resolvedInstid) {
            throw new AppError(`Could not resolve business document ID for task ${instanceId}`, 400);
        }

        // 2. Fetch S/4 Business Object details directly for this document type (CNMA_PRHEADER, CNMA_POHEADER, CNMA_RESVHEADER, CNMA_CLAIMHEADER)
        const businessObject = await this.sapOdataAdapter.getDetail(resolvedObjectType, resolvedInstid, sapUser, userJwt);
        const finalObjectType = businessObject?.DocCategory ? (resolveObjectTypeFromTypeId(businessObject.DocCategory) || businessObject.DocCategory) : resolvedObjectType;

        const normalTask = inst?.normalTask !== false;
        const isTaskCompleted = inst?.status === 'COMPLETED' || hints?.status === 'COMPLETED';
        let taskRuntime: any = null;

        // 2. Fetch taskRuntime & decision options from TASKPROCESSING ONLY for non-Claim document types (PO, PR, RE...)
        if (finalObjectType !== 'CLAIM' && !isTaskCompleted) {
            try {
                taskRuntime = await this.taskAdapter.getTaskRuntime(instanceId, sapUser, userJwt, normalTask);
            } catch (e: any) {
                this.logger.warn(`Failed to fetch TASKPROCESSING runtime for ${instanceId}: ${e.message}`);
            }
        }

        if (!taskRuntime) {
            taskRuntime = buildFallbackTaskRuntime({
                instanceId,
                inst,
                businessObject,
                finalObjectType,
                resolvedInstid,
                isTaskCompleted,
                normalTask,
            });
        }

        if (finalObjectType === 'CLAIM' && String(businessObject?.ActionButton || '').trim().toUpperCase() === 'X' && !isTaskCompleted) {
            taskRuntime.decisions = [
                { DecisionKey: '0001', DecisionText: 'Approve' },
                { DecisionKey: '0002', DecisionText: 'Reject' }
            ];
        }


        return {
            objectType: finalObjectType,
            instid: resolvedInstid,

            inst,
            taskRuntime,
            businessObject,
            normalTask
        };
    }
}

/**
 * Builds a synthetic taskRuntime when TASKPROCESSING / DecisionOptions lookup fails.
 * Centralised so the title/status template is consistent across all fallback paths.
 */
export function buildFallbackTaskRuntime(input: {
    instanceId: string;
    inst?: any;
    businessObject?: any;
    finalObjectType: string;
    resolvedInstid: string;
    isTaskCompleted: boolean;
    normalTask: boolean;
}): any {
    const { instanceId, inst, businessObject, finalObjectType, resolvedInstid, isTaskCompleted, normalTask } = input;

    const rawTitle = inst?.TaskTitle || inst?.taskTitle || businessObject?.TaskTitle || '';
    const typeText = inst?.DocumentTypeText || inst?.doctyp_desc
        || (finalObjectType === 'RE' ? 'Reservation'
            : (finalObjectType === 'CLAIM' ? 'Claim' : finalObjectType));
    const actionPrefix = normalTask === false
        ? (isTaskCompleted ? 'Reviewed' : 'Review')
        : (isTaskCompleted ? 'Approved' : 'Approve');

    return {
        InstanceID: instanceId,
        SAP__Origin: 'LOCAL',
        TaskTitle: rawTitle || (inst ? `${actionPrefix} ${typeText} ${resolvedInstid}` : ''),
        Status: inst ? inst.status : (isTaskCompleted ? 'COMPLETED' : 'READY'),
        Priority: 'MEDIUM',
        CreatedOn: undefined,
        CreatedByName: undefined,
        TaskDefinitionID: inst ? (inst.typeid || '') : '',
        SupportsForward: (isTaskCompleted || normalTask === false || finalObjectType === 'CLAIM') ? false : true,
        SupportsComments: true,
        decisions: [],
    };
}


