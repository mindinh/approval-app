import { SapClient } from './sap-client';
import { ODATA_SERVICES } from '../processors/odata-config';
import { getMockTasks, getMockTaskRuntime } from './mock-data-provider';

export class TaskprocessingAdapter {
    private sapClient = new SapClient();

    async getTasks(sapUser: string, userJwt?: string, customFilter?: string): Promise<any[]> {
        const isMockMode = process.env.USE_MOCK_SAP !== 'false';
        console.log(`[DEBUG Adapter] isMockMode = ${isMockMode}, USE_MOCK_SAP = "${process.env.USE_MOCK_SAP}"`);
        if (isMockMode) {
            const tasks = getMockTasks();
            if (customFilter) {
                if (customFilter.includes("Status eq 'COMPLETED'")) {
                    return tasks.filter((t: any) => t.Status === 'COMPLETED');
                }
                if (customFilter.includes("InstanceID eq")) {
                    const matches = customFilter.match(/'([^']+)'/g);
                    if (matches) {
                        const ids = matches.map(m => m.replace(/'/g, ''));
                        return tasks.filter((t: any) => ids.includes(t.InstanceID));
                    }
                }
            }
            return tasks.filter((t: any) => t.Status !== 'COMPLETED');
        }

        const path = ODATA_SERVICES.TASKPROCESSING.servicePath;
        const filterVal = customFilter || "Status eq 'READY' or Status eq 'RESERVED' or Status eq 'IN_PROGRESS'";
        const response: any = await this.sapClient.get(
            path,
            '/TaskCollection',
            {
                $format: 'json',
                $filter: filterVal,
                $orderby: 'CreatedOn desc'
            },
            sapUser,
            userJwt
        );
        return response?.d?.results || [];
    }

    private padId(id: string): string {
        return /^\d+$/.test(id) ? id.padStart(12, '0') : id;
    }

    async getTaskRuntime(instanceId: string, sapUser: string, userJwt?: string, normalTask = true): Promise<any> {
        const isMockMode = process.env.USE_MOCK_SAP !== 'false';
        if (isMockMode) {
            const runtime = getMockTaskRuntime(instanceId);
            if (!normalTask) {
                runtime.decisions = [];
            }
            return runtime;
        }

        const path = ODATA_SERVICES.TASKPROCESSING.servicePath;
        const paddedId = this.padId(instanceId);
        const taskUrl = `/TaskCollection(InstanceID='${encodeURIComponent(paddedId)}')`;
        
        // 1. Fetch task runtime data first
        const taskRes: any = await this.sapClient.get<any>(path, taskUrl, { $format: 'json' }, sapUser, userJwt);
        const task = taskRes?.d || {};
        
        // 2. Fetch decision options using the correct SAP__Origin resolved from task
        const origin = task.SAP__Origin || 'LOCAL';
        let decisions: any[] = [];
        if (normalTask) {
            try {
                const decisionRes: any = await this.sapClient.get<any>(
                    path,
                    '/DecisionOptions',
                    {
                        $format: 'json',
                        SAP__Origin: `'${origin}'`,
                        InstanceID: `'${paddedId}'`
                    },
                    sapUser,
                    userJwt
                );
                decisions = decisionRes?.d?.results || [];
            } catch (error: any) {
                console.warn(`[Adapter] Non-fatal: Failed to fetch decision options for task ${paddedId}: ${error.message}`);
            }
        }

        return {
            ...task,
            decisions
        };
    }

    async executeDecision(instanceId: string, sapDecisionKey: string, comment: string, sapUser: string, userJwt?: string): Promise<any> {
        const isMockMode = process.env.USE_MOCK_SAP !== 'false';
        if (isMockMode) {
            return { success: true, message: `Mock decision ${sapDecisionKey} executed.` };
        }

        const path = ODATA_SERVICES.TASKPROCESSING.servicePath;
        const { token, cookie } = await this.sapClient.fetchCsrf(path, sapUser, userJwt);

        const paddedId = this.padId(instanceId);
        const url = `/Decision?InstanceID='${encodeURIComponent(paddedId)}'&DecisionKey='${encodeURIComponent(sapDecisionKey)}'`;
        
        const headers: Record<string, string> = {
            'x-csrf-token': token,
            'Accept': 'application/json'
        };
        if (cookie) {
            headers.Cookie = cookie;
        }

        const payload: Record<string, string> = {};
        if (comment) {
            payload.Comments = comment;
        }

        return await this.sapClient.post(path, url, payload, headers, sapUser, userJwt);
    }
}
