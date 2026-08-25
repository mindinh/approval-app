import { SapClient } from './sap-client';
import { ODATA_SERVICES } from '../processors/odata-config';

export class TaskprocessingAdapter {
    private sapClient = new SapClient();

    private padId(id: string): string {
        return /^\d+$/.test(id) ? id.padStart(12, '0') : id;
    }

    async getTaskRuntime(instanceId: string, sapUser: string, userJwt?: string, normalTask = true): Promise<any> {
        const path = ODATA_SERVICES.TASKPROCESSING.servicePath;
        const paddedId = this.padId(instanceId);
        const taskUrl = `/TaskCollection(InstanceID='${encodeURIComponent(paddedId)}')`;
        
        let task: any = {};
        try {
            const taskRes: any = await this.sapClient.get<any>(path, taskUrl, { $format: 'json' }, sapUser, userJwt);
            task = taskRes?.d || {};
        } catch (e: any) {
            console.warn(`[Adapter] Non-fatal: Failed to fetch task runtime for task ${paddedId}: ${e.message}`);
        }
        
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

    private escapeODataLiteral(val: string): string {
        if (!val) return '';
        return val.replace(/'/g, "''");
    }

    async searchUsers(searchPattern: string, sapUser: string, userJwt?: string): Promise<any[]> {
        const path = ODATA_SERVICES.TASKPROCESSING.servicePath;
        const safePattern = encodeURIComponent(this.escapeODataLiteral(searchPattern));
        const response: any = await this.sapClient.get(
            path,
            '/SearchUsers',
            {
                $format: 'json',
                SearchPattern: `'${safePattern}'`,
                MaxResults: 100
            },
            sapUser,
            userJwt
        );
        return response?.d?.results || [];
    }

    async forwardTask(instanceId: string, forwardTo: string, comment: string, sapUser: string, userJwt?: string): Promise<any> {
        const path = ODATA_SERVICES.TASKPROCESSING.servicePath;
        const { token, cookie } = await this.sapClient.fetchCsrf(path, sapUser, userJwt);

        const paddedId = this.padId(instanceId);
        const safeId = encodeURIComponent(this.escapeODataLiteral(paddedId));
        const safeForwardTo = encodeURIComponent(this.escapeODataLiteral(forwardTo));
        let url = `/Forward?InstanceID='${safeId}'&ForwardTo='${safeForwardTo}'`;
        if (comment) {
            const safeComment = encodeURIComponent(this.escapeODataLiteral(comment));
            url += `&Comments='${safeComment}'`;
        }

        const headers: Record<string, string> = {
            'x-csrf-token': token,
            'Accept': 'application/json'
        };
        if (cookie) {
            headers.Cookie = cookie;
        }

        return await this.sapClient.post(path, url, {}, headers, sapUser, userJwt);
    }
}


