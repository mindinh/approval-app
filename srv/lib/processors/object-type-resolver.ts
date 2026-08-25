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
        _hints?: any,
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

        const instancesResult = await Promise.resolve(
            this.sapOdataAdapter.getInstances(sapUser, undefined, userJwt, instanceId)
        ).catch(() => []);

        const targetId = instanceId ? String(instanceId).replace(/^0+/, '') : '';
        const inst = instancesResult.find((i: any) => {
            const rawId = String(
                i.WorkflowTaskInternalID ||
                i.instanceID ||
                i.InstanceID ||
                i.instanceId ||
                ''
            ).replace(/^0+/, '');
            const rawDocNum = String(
                i.DocumentNumber ||
                i.TechnicalWrkflwObject ||
                i.instid ||
                ''
            ).replace(/^0+/, '');
            return rawId === targetId || rawDocNum === targetId;
        });

        const normalTask = inst?.normalTask !== false;
        const resolvedObjectType = resolveObjectTypeFromInstance(inst, 'PR');



        let resolvedInstid =
            inst?.DocumentNumber ||
            inst?.TechnicalWrkflwObject ||
            inst?.instid ||
            inst?.documentId;

        if (!resolvedInstid) {
            resolvedInstid = /^\d+$/.test(instanceId) ? instanceId.padStart(10, '0') : instanceId;
        }


        if (!resolvedInstid) {
            throw new AppError(`Could not resolve business document ID for task ${instanceId}`, 400);
        }

        // 1. Fetch S/4 Business Object details FIRST (e.g. CNMA_CLAIMHEADER for Claim)
        const businessObject = await this.sapOdataAdapter.getDetail(resolvedObjectType, resolvedInstid, sapUser, userJwt);
        const finalObjectType = businessObject?.DocCategory || resolvedObjectType;

        const isTaskCompleted = inst?.status === 'COMPLETED';
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
            taskRuntime = {
                InstanceID: instanceId,
                SAP__Origin: 'LOCAL',
                TaskTitle: inst ? `${normalTask === false ? 'Review' : 'Approve'} ${finalObjectType} ${resolvedInstid}` : '',
                Status: inst ? inst.status : (isTaskCompleted ? 'COMPLETED' : 'READY'),
                Priority: 'MEDIUM',
                CreatedOn: undefined,
                CreatedByName: undefined,
                TaskDefinitionID: inst ? (inst.typeid || '') : '',
                SupportsForward: (isTaskCompleted || normalTask === false || finalObjectType === 'CLAIM') ? false : true,

                SupportsComments: true,
                decisions: []
            };
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


