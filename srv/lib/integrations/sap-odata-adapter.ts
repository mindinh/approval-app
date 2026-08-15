import { SapClient } from './sap-client';
import { Detail } from './detail';
import { PrDetail } from './pr';
import { PoDetail } from './po';
import { ReDetail } from './re';
import { ClaimDetail } from './claim';
import { ODATA_SERVICES } from '../processors/odata-config';
import { getMockInstances, getMockDocTypeCounts, getMockStatusCounts, getMockBusUsers } from './mock-data-provider';
import { MetadataService } from '../metadata-service';
import { CnmaTaskByStatusEntity, CnmaTaskByDocTypeEntity } from '../types/sap-odata.types';
import { resolveTaskTotalAmount } from '../processors/inbox-utils';

export function clearDetailCache(_objectType: string, _objectId: string) {
    // No-op function preserved for test suite compatibility
}

export class SapOdataAdapter {
    private readonly sapClient = new SapClient();
    private readonly metadataService = new MetadataService(this.sapClient);
    private readonly strategies = new Map<string, Detail>();

    constructor() {
        this.register(new PrDetail(this.sapClient, this.metadataService));
        this.register(new PoDetail(this.sapClient, this.metadataService));
        this.register(new ReDetail(this.sapClient, this.metadataService));
        this.register(new ClaimDetail(this.sapClient, this.metadataService));
    }

    private register(strategy: Detail) {
        this.strategies.set(strategy.objectType, strategy);
    }

    private getStrategy(objectType: string): Detail {
        const strategy = this.strategies.get(objectType);
        if (!strategy) {
            throw new Error(`Integration Strategy not implemented for: ${objectType}`);
        }
        return strategy;
    }

    // ─── WORKLIST FETCHING (from InstanceListAdapter) ───
    async getInstances(
        sapUser: string,
        status?: string | string[],
        userJwt?: string,
        targetInstanceId?: string,
        pagination?: { top?: number; skip?: number },
        selectFields?: string
    ): Promise<any[]> {
        const isMockMode = process.env.USE_MOCK_SAP !== 'false';
        if (isMockMode) {
            const mockItems = getMockInstances(status);
            const total = mockItems.length;
            let result = mockItems;
            if (pagination?.skip !== undefined || pagination?.top !== undefined) {
                const skip = pagination.skip ?? 0;
                const top = pagination.top ?? result.length;
                result = result.slice(skip, skip + top);
            }
            (result as any).totalCount = total;
            return result;
        }

        const path = ODATA_SERVICES.INSTANCE_LIST.servicePath;
        const entitySet = ODATA_SERVICES.INSTANCE_LIST.entitySet;

        const params: Record<string, string> = {
            $format: 'json',
            $orderby: 'WorkflowTaskInternalID desc',
            $count: 'true',
            $top: String(pagination?.top ?? 1000)
        };

        if (pagination?.skip !== undefined) {
            params.$skip = String(pagination.skip);
        }

        if (selectFields) {
            params.$select = selectFields;
        }

        const filterConditions: string[] = [];

        if (status) {
            const statusList = Array.isArray(status) ? status : [status];
            filterConditions.push(`(${statusList.map(s => `WorkflowTaskStatus eq '${s}'`).join(' or ')})`);
        }

        if (targetInstanceId) {
            const cleanId = String(targetInstanceId).replace(/^0+/, '');
            const paddedId = String(cleanId).padStart(12, '0');
            filterConditions.push(`(WorkflowTaskInternalID eq '${paddedId}' or WorkflowTaskInternalID eq '${cleanId}')`);
        }

        if (filterConditions.length > 0) {
            params.$filter = filterConditions.join(' and ');
        }

        const response: any = await this.sapClient.get(
            path,
            `/${entitySet}`,
            params,
            sapUser,
            userJwt
        );

        console.log(`[SapOdataAdapter] raw response status: ${response ? 'object' : 'null'}, keys: ${response ? Object.keys(response).join(', ') : 'none'}, value length: ${response?.value?.length ?? 'undefined'}`);

        // Map V4 service properties back to the internal model
        const rawItems = response?.value || response?.d?.results || response?.d || [];
        const totalCount = Number(response?.['@odata.count'] ?? response?.d?.__count ?? rawItems.length);

        const items = rawItems.map((item: any) => ({
            instanceID: item.WorkflowTaskInternalID,
            status: item.WorkflowTaskStatus,
            typeid: item.TechnicalWrkflwObjectType,
            instid: item.DocumentNumber || item.TechnicalWrkflwObject,
            documentNumber: item.DocumentNumber || item.TechnicalWrkflwObject,
            doctyp: item.DocumentType,
            doctyp_desc: item.DocumentTypeText,
            normalTask: item.NormalTask !== false,
            total: resolveTaskTotalAmount(item),
            TotalOrderValue: item.TotalOrderValue !== undefined && item.TotalOrderValue !== null ? Number(item.TotalOrderValue) : undefined,
            TotalNetAmountLocalCrcy: item.TotalNetAmountLocalCrcy !== undefined && item.TotalNetAmountLocalCrcy !== null ? Number(item.TotalNetAmountLocalCrcy) : undefined,
            curr_vnd: item.LocalCurrency,
            total_doc_curr: item.TotalNetAmountDocCrcy !== undefined && item.TotalNetAmountDocCrcy !== null ? Number(item.TotalNetAmountDocCrcy) : undefined,
            doc_curr: item.DocumentCurrency,
            taskCreationDateTime: item.TaskCreationDateTime,
            createdByUser: item.CreatedByUser,
            creationDate: item.CreationDate,
            creationTime: item.CreationTime,
            companyCode: item.CompanyCode || item.companyCode,
            companyCodeName: item.CompanyCodeName || item.companyCodeName
        }));

        // Local sort fallback by instance ID descending
        items.sort((a: any, b: any) => {
            const idA = a.instanceID || '';
            const idB = b.instanceID || '';
            return idB.localeCompare(idA);
        });

        (items as any).totalCount = totalCount;

        return items;
    }

    async getDetail(objectType: string, objectId: string, sapUser: string, userJwt?: string, headerOnly = false): Promise<any> {
        const strategy = this.getStrategy(objectType);
        return await strategy.getDetail(objectId, sapUser, userJwt, headerOnly);
    }

    async getDetailBatch(
        itemsToFetch: Array<{ objectType: string; objectId: string }>,
        sapUser: string,
        userJwt?: string
    ): Promise<Record<string, any>> {
        const results: Record<string, any> = {};

        // Group items by strategy
        const groupedItems = new Map<string, Array<{ objectType: string; objectId: string }>>();
        for (const item of itemsToFetch) {
            const list = groupedItems.get(item.objectType) || [];
            list.push(item);
            groupedItems.set(item.objectType, list);
        }

        // Invoke each strategy in parallel directly without caching
        await Promise.all(
            Array.from(groupedItems.entries()).map(async ([objectType, group]) => {
                try {
                    const strategy = this.getStrategy(objectType);
                    if (strategy.getDetailBatch) {
                        const batchResults = await strategy.getDetailBatch(group, sapUser, userJwt);
                        for (const key of Object.keys(batchResults)) {
                            results[key] = batchResults[key];
                        }
                    } else {
                        // Fallback to sequential calls if batch not supported by strategy
                        for (const item of group) {
                            try {
                                const single = await strategy.getDetail(item.objectId, sapUser, userJwt, true);
                                results[`${objectType}:${item.objectId}`] = single;
                            } catch (singleErr) {
                                // ignore single error
                            }
                        }
                    }
                } catch (groupErr) {
                    // ignore strategy failure
                }
            })
        );

        return results;
    }

    private resolveObjectType(objectId: string, explicitType?: string): string {
        let type = (explicitType || '').toUpperCase().trim();
        if (type && this.strategies.has(type)) {
            return type;
        }
        const cleanId = objectId.replace(/^0+/, '');
        if (cleanId.startsWith('4')) return 'PO';
        if (cleanId.startsWith('1')) return 'PR';
        if (cleanId.startsWith('5')) return 'RE';
        if (cleanId.startsWith('9')) return 'CLAIM';

        const instances = getMockInstances();
        const inst = instances.find(i => i.instid === objectId || i.instid === cleanId || i.instanceID === objectId);
        if (inst) {
            if (inst.typeid === 'BUS2012') return 'PO';
            if (inst.typeid === 'BUS2105') return 'PR';
            if (inst.typeid === 'BUS2093' || inst.typeid === 'ZBUS2093') return 'RE';
            if (inst.typeid === 'ZCLAIM') return 'CLAIM';
        }

        return 'PR';
    }

    async addComment(objectId: string, text: string, sapUser: string, userJwt?: string, type = 'NORM', decision = '', objectType?: string): Promise<void> {
        const targetType = this.resolveObjectType(objectId, objectType);
        const strategy = this.getStrategy(targetType);
        if (strategy.addComment) {
            await strategy.addComment(objectId, text, sapUser, userJwt, type, decision);
        } else {
            throw new Error(`addComment not supported for strategy: ${strategy.objectType}`);
        }
    }

    async uploadAttachment(objectId: string, fileName: string, mimeType: string, buffer: Buffer, sapUser: string, userJwt?: string, objectType?: string): Promise<void> {
        const targetType = this.resolveObjectType(objectId, objectType);
        const strategy = this.getStrategy(targetType);
        if (strategy.uploadAttachment) {
            await strategy.uploadAttachment(objectId, fileName, mimeType, buffer, sapUser, userJwt);
        } else {
            throw new Error(`uploadAttachment not supported for strategy: ${strategy.objectType}`);
        }
    }

    async fetchAttachmentContent(objectId: string, attachId: string, sapUser: string, userJwt?: string, objectType?: string): Promise<{ data: Buffer; contentType: string; fileName: string } | null> {
        const targetType = this.resolveObjectType(objectId, objectType);
        const strategy = this.getStrategy(targetType);
        if (strategy.fetchAttachmentContent) {
            return await strategy.fetchAttachmentContent(objectId, attachId, sapUser, userJwt);
        } else {
            throw new Error(`fetchAttachmentContent not supported for strategy: ${strategy.objectType}`);
        }
    }

    async getDocTypeCounts(sapUser: string, userJwt?: string): Promise<CnmaTaskByDocTypeEntity[]> {
        const isMockMode = process.env.USE_MOCK_SAP !== 'false';
        if (isMockMode) {
            return getMockDocTypeCounts();
        }

        try {
            const path = ODATA_SERVICES.INSTANCE_LIST.servicePath;
            const response: any = await this.sapClient.get(
                path,
                '/CNMA_TASKBYDOCTYPE',
                { $format: 'json' },
                sapUser,
                userJwt
            );
            const value = response?.value || response?.d?.results || response?.d || response;
            return Array.isArray(value) ? value : [];
        } catch (err: any) {
            console.error(`[SapOdataAdapter] Failed to fetch CNMA_TASKBYDOCTYPE:`, err.message);
            return getMockDocTypeCounts();
        }
    }

    async getStatusCounts(sapUser: string, userJwt?: string): Promise<CnmaTaskByStatusEntity[]> {
        const isMockMode = process.env.USE_MOCK_SAP !== 'false';
        if (isMockMode) {
            return getMockStatusCounts();
        }

        try {
            const path = ODATA_SERVICES.INSTANCE_LIST.servicePath;
            const response: any = await this.sapClient.get(
                path,
                '/CNMA_TASKBYSTATUS',
                { $format: 'json' },
                sapUser,
                userJwt
            );
            const value = response?.value || response?.d?.results || response?.d || response;
            return Array.isArray(value) ? value : [];
        } catch (err: any) {
            console.error(`[SapOdataAdapter] Failed to fetch CNMA_TASKBYSTATUS:`, err.message);
            return getMockStatusCounts();
        }
    }

    async searchBusUsers(searchPattern: string, sapUser: string, userJwt?: string): Promise<any[]> {
        const forceMock = process.env.USE_MOCK_DATA === 'true';
        if (forceMock) {
            return getMockBusUsers(searchPattern);
        }

        try {
            const path = ODATA_SERVICES.INSTANCE_LIST.servicePath;
            const params: Record<string, string> = { $format: 'json', $top: '500' };

            const response: any = await this.sapClient.get(
                path,
                '/CNMA_BUSUSER',
                params,
                sapUser,
                userJwt
            );
            const value = response?.value || response?.d?.results || response?.d || response;
            const list = Array.isArray(value) ? value : [];

            if (!searchPattern || !searchPattern.trim()) {
                return list;
            }

            const term = searchPattern.trim().toLowerCase();
            return list.filter((u: any) => {
                const sapUserName = (u.SAPUserName || u.sapUserName || '').toLowerCase();
                const firstName = (u.FirstName || u.firstName || '').toLowerCase();
                const lastName = (u.LastName || u.lastName || '').toLowerCase();
                const fullName = (u.FullName || u.fullName || '').toLowerCase();
                const email = (u.EmailAddress || u.emailAddress || u.Email || '').toLowerCase();

                return (
                    sapUserName.includes(term) ||
                    firstName.includes(term) ||
                    lastName.includes(term) ||
                    fullName.includes(term) ||
                    email.includes(term)
                );
            });
        } catch (err: any) {
            console.error(`[SapOdataAdapter] Failed to fetch CNMA_BUSUSER from SAP backend:`, err.message);
            return getMockBusUsers(searchPattern);
        }
    }
}


