import { SapOdataAdapter } from '../integrations/sap-odata-adapter';
import { TaskprocessingAdapter } from '../integrations/taskprocessing-adapter';
import { resolveObjectTypeFromTypeId } from './odata-config';
import { Logger } from '../utils/logger';
import { AppError } from '../utils/error-handler';

export class ObjectTypeResolver {
    private logger = new Logger('ObjectTypeResolver');

    constructor(
        private sapOdataAdapter: SapOdataAdapter,
        private taskAdapter: TaskprocessingAdapter
    ) {}

    async resolve(
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
    ): Promise<{
        objectType: string;
        instid: string;
        inst: any | undefined;
        taskRuntime: any;
        businessObject: any;
        normalTask: boolean;
    }> {
        let inst: any = null;
        let normalTask = true;
        let taskRuntime: any;
        let businessObject: any;

        const hintInstid = hints?.documentId || hints?.instid;
        const hintObjectType = hints?.businessObjectType;
        const hintStatus = hints?.status ? hints.status.toUpperCase() : undefined;
        const isKnownCompleted = hintStatus === 'COMPLETED';

        if (hintInstid && hintObjectType && hintObjectType !== 'UNKNOWN') {
            this.logger.info(`Parallel fetching details for task ${instanceId}: objectType=${hintObjectType}, instid=${hintInstid}`);

            // Fetch S/4HANA Detail and Instances. Only fetch TaskProcessing if task is NOT completed.
            const [instancesResult, runtimeResult, detailResult] = await Promise.all([
                Promise.resolve(this.sapOdataAdapter.getInstances(sapUser, undefined, userJwt, instanceId)).catch(() => []),
                !isKnownCompleted
                    ? Promise.resolve(this.taskAdapter.getTaskRuntime(instanceId, sapUser, userJwt, true)).catch((e) => {
                        this.logger.warn(`Failed to fetch task runtime: ${e.message}`);
                        return null;
                    })
                    : Promise.resolve(null),
                this.sapOdataAdapter.getDetail(hintObjectType, hintInstid, sapUser, userJwt)
            ]);

            inst = instancesResult.find((i: any) => {
                const rawId = i.instanceID ? String(i.instanceID).replace(/^0+/, '') : '';
                const targetId = instanceId ? String(instanceId).replace(/^0+/, '') : '';
                return rawId === targetId;
            });
            if (inst && inst.normalTask === false) {
                normalTask = false;
            }

            const isTaskCompleted = isKnownCompleted || (inst && inst.status === 'COMPLETED');

            if (runtimeResult && !isTaskCompleted) {
                taskRuntime = runtimeResult;
                if (!normalTask) {
                    taskRuntime.decisions = [];
                }
            } else {
                taskRuntime = {
                    InstanceID: instanceId,
                    SAP__Origin: 'LOCAL',
                    TaskTitle: inst ? `${inst.normalTask === false ? 'Review' : 'Approve'} ${hintObjectType} ${inst.instid}` : '',
                    Status: inst ? inst.status : (isTaskCompleted ? 'COMPLETED' : 'READY'),
                    Priority: 'MEDIUM',
                    CreatedOn: undefined,
                    CreatedByName: undefined,
                    TaskDefinitionID: inst ? (inst.typeid || '') : '',
                    SupportsForward: isTaskCompleted ? false : true,
                    SupportsComments: true,
                    decisions: []
                };
            }

            businessObject = detailResult;

            return {
                objectType: hintObjectType,
                instid: hintInstid,
                inst,
                taskRuntime,
                businessObject,
                normalTask
            };
        } else {
            this.logger.info(`Sequential fallback fetching details for task ${instanceId} (hints missing)`);
            const instancesResult = await Promise.resolve(this.sapOdataAdapter.getInstances(sapUser, undefined, userJwt, instanceId)).catch(() => []);
            inst = instancesResult.find((i: any) => {
                const rawId = i.instanceID ? String(i.instanceID).replace(/^0+/, '') : '';
                const targetId = instanceId ? String(instanceId).replace(/^0+/, '') : '';
                return rawId === targetId;
            });
            if (inst && inst.normalTask === false) {
                normalTask = false;
            }

            let runtimeResult = null;
            if (normalTask) {
                runtimeResult = await Promise.resolve(this.taskAdapter.getTaskRuntime(instanceId, sapUser, userJwt, normalTask)).catch((e) => {
                    this.logger.warn(`Failed to fetch task runtime: ${e.message}`);
                    return null;
                });
            }

            if (runtimeResult) {
                taskRuntime = runtimeResult;
                if (!normalTask) {
                    taskRuntime.decisions = [];
                }
            } else {
                const resolvedTypeFromInst = inst ? (resolveObjectTypeFromTypeId(inst.typeid) || 'PR') : 'PR';
                taskRuntime = {
                    InstanceID: instanceId,
                    SAP__Origin: 'LOCAL',
                    TaskTitle: inst ? `${inst.normalTask === false ? 'Review' : 'Approve'} ${resolvedTypeFromInst} ${inst.instid}` : '',
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

            const resolvedObjectType = hintObjectType || (inst ? (resolveObjectTypeFromTypeId(inst.typeid) || 'PR') : (resolveObjectTypeFromTypeId(taskRuntime.TaskDefinitionID) || 'PR'));
            let resolvedInstid = hintInstid || (inst ? inst.instid : undefined) || taskRuntime.TaskTitle?.match(/\d+/)?.[0] || '';

            if (!resolvedInstid) {
                throw new AppError(`Could not resolve business document ID for task ${instanceId}`, 400);
            }

            businessObject = await this.sapOdataAdapter.getDetail(resolvedObjectType, resolvedInstid, sapUser, userJwt);

            return {
                objectType: resolvedObjectType,
                instid: resolvedInstid,
                inst,
                taskRuntime,
                businessObject,
                normalTask
            };
        }
    }
}
