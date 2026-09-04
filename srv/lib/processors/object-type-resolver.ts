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
        userJwt?: string
    ): Promise<{
        objectType: string;
        instid: string;
        inst: any;
        taskRuntime: any;
        businessObject: any;
        normalTask: boolean;
    }> {
        this.logger.info(`Resolving details for task ${instanceId}`);

        // 1. Find the task in the user's worklist (CNMA_WFTASK)
        const targetId = instanceId ? String(instanceId).replace(/^0+/, '') : '';
        const instances = await this.sapOdataAdapter.getInstances(sapUser, undefined, userJwt, instanceId).catch(() => []);

        let inst = instances.find((i: any) => {
            const rawId = String(i.WorkflowTaskInternalID || i.instanceID || '').replace(/^0+/, '');
            const rawDocNum = String(i.DocumentNumber || i.TechnicalWrkflwObject || '').replace(/^0+/, '');
            return rawId === targetId || rawDocNum === targetId;
        });

        if (!inst) {
            // Fallback to full worklist if filtered query did not match
            const allInstances = await this.sapOdataAdapter.getInstances(sapUser, undefined, userJwt).catch(() => []);
            inst = allInstances.find((i: any) => {
                const rawId = String(i.WorkflowTaskInternalID || i.instanceID || '').replace(/^0+/, '');
                const rawDocNum = String(i.DocumentNumber || i.TechnicalWrkflwObject || '').replace(/^0+/, '');
                return rawId === targetId || rawDocNum === targetId;
            });
        }

        if (!inst) {
            throw new AppError(`Task ${instanceId} not found in worklist`, 404);
        }

        const objectType = resolveObjectTypeFromInstance(inst, 'PR');
        const documentNumber = inst.DocumentNumber || inst.documentNumber || inst.TechnicalWrkflwObject || inst.instid;
        if (!documentNumber) {
            throw new AppError(`Document number not found for task ${instanceId}`, 404);
        }
        const approverNumber = inst.ApproverNumber || inst.approverNumber || '1';
        const normalTask = inst.NormalTask !== false && inst.normalTask !== false;
        const isTaskCompleted = inst.WorkflowTaskStatus === 'COMPLETED' || inst.status === 'COMPLETED';

        // 2. Fetch business object details directly (e.g. CNMA_CLAIMHEADER, CNMA_PRHEADER, etc.)
        const businessObject = await this.sapOdataAdapter.getDetail(
            objectType,
            documentNumber,
            sapUser,
            userJwt,
            false,
            { approverNumber }
        );

        // 3. Build task runtime & decision options
        let taskRuntime: any = null;
        if (objectType !== 'CLAIM' && !isTaskCompleted) {
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
                finalObjectType: objectType,
                resolvedInstid: documentNumber,
                isTaskCompleted,
                normalTask,
            });
        }

        if (objectType === 'CLAIM' && String(businessObject?.ActionButton || '').trim().toUpperCase() === 'X' && !isTaskCompleted && normalTask !== false) {
            taskRuntime.decisions = [
                { DecisionKey: '0001', DecisionText: 'Approve' },
                { DecisionKey: '0002', DecisionText: 'Reject' }
            ];
        }

        return {
            objectType,
            instid: documentNumber,
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


