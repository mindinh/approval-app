import { SapClient } from './sap-client';
import { Detail } from './detail';
import { PrDetail } from './pr';
import { PoDetail } from './po';
import { ReDetail } from './re';
import { ClaimDetail } from './claim';
import { ODATA_SERVICES } from '../processors/odata-config';
import { getMockInstances } from './mock-data-provider';
import { TtlLruCache } from '../utils/cache';
import { MetadataService } from '../metadata-service';

const detailCache = new TtlLruCache<string, any>(500, 5 * 60 * 1000); // 5 minutes TTL, 500 capacity

export function clearDetailCache(objectType: string, objectId: string) {
    const keyPrefix = `${objectType}:${objectId}:`;
    detailCache.delete(keyPrefix + 'true');
    detailCache.delete(keyPrefix + 'false');
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
    async getInstances(sapUser: string, status?: string | string[], userJwt?: string): Promise<any[]> {
        const isMockMode = process.env.USE_MOCK_SAP !== 'false';
        if (isMockMode) {
            return getMockInstances(status);
        }

        const path = ODATA_SERVICES.INSTANCE_LIST.servicePath;
        const entitySet = ODATA_SERVICES.INSTANCE_LIST.entitySet;

        const params: Record<string, string> = {
            $format: 'json',
            $orderby: 'WorkflowTaskInternalID desc'
        };

        if (status) {
            const statusList = Array.isArray(status) ? status : [status];
            params.$filter = statusList.map(s => `WorkflowTaskStatus eq '${s}'`).join(' or ');
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
        const rawItems = response?.value || [];
        const items = rawItems.map((item: any) => ({
            instanceID: item.WorkflowTaskInternalID,
            status: item.WorkflowTaskStatus,
            typeid: item.TechnicalWrkflwObjectType,
            instid: item.TechnicalWrkflwObject,
            doctyp: item.DocumentType,
            doctyp_desc: item.DocumentTypeText,
            normalTask: item.NormalTask !== false,
            total: item.TotalNetAmountLocalCrcy !== undefined && item.TotalNetAmountLocalCrcy !== null ? Number(item.TotalNetAmountLocalCrcy) : undefined,
            curr_vnd: item.LocalCurrency,
            total_doc_curr: item.TotalNetAmountDocCrcy !== undefined && item.TotalNetAmountDocCrcy !== null ? Number(item.TotalNetAmountDocCrcy) : undefined,
            doc_curr: item.DocumentCurrency,
            taskCreationDateTime: item.TaskCreationDateTime,
            createdByUser: item.CreatedByUser,
            creationDate: item.CreationDate,
            creationTime: item.CreationTime
        }));

        // Local sort fallback by instance ID descending
        items.sort((a: any, b: any) => {
            const idA = a.instanceID || '';
            const idB = b.instanceID || '';
            return idB.localeCompare(idA);
        });

        return items;
    }

    // ─── DETAIL RETRIEVAL (Delegated to Strategies with Cache) ───
    async getDetail(objectType: string, objectId: string, sapUser: string, userJwt?: string, headerOnly = false): Promise<any> {
        const cacheKey = `${objectType}:${objectId}:${headerOnly}`;
        if (detailCache.has(cacheKey)) {
            return detailCache.get(cacheKey);
        }

        const strategy = this.getStrategy(objectType);
        const result = await strategy.getDetail(objectId, sapUser, userJwt, headerOnly);
        detailCache.set(cacheKey, result);
        return result;
    }

    async getDetailBatch(
        itemsToFetch: Array<{ objectType: string; objectId: string }>,
        sapUser: string,
        userJwt?: string
    ): Promise<Record<string, any>> {
        const results: Record<string, any> = {};
        const missingItems: Array<{ objectType: string; objectId: string; cacheKey: string }> = [];

        // 1. Resolve from cache first
        for (const item of itemsToFetch) {
            const cacheKey = `${item.objectType}:${item.objectId}:true`;
            if (detailCache.has(cacheKey)) {
                results[`${item.objectType}:${item.objectId}`] = detailCache.get(cacheKey);
            } else {
                missingItems.push({ ...item, cacheKey });
            }
        }

        if (missingItems.length === 0) {
            return results;
        }

        // 2. Group missing items by strategy
        const groupedItems = new Map<string, Array<{ objectType: string; objectId: string; cacheKey: string }>>();
        for (const item of missingItems) {
            const list = groupedItems.get(item.objectType) || [];
            list.push(item);
            groupedItems.set(item.objectType, list);
        }

        // 3. Invoke each strategy in parallel
        await Promise.all(
            Array.from(groupedItems.entries()).map(async ([objectType, group]) => {
                try {
                    const strategy = this.getStrategy(objectType);
                    if (strategy.getDetailBatch) {
                        const batchResults = await strategy.getDetailBatch(group, sapUser, userJwt);
                        for (const key of Object.keys(batchResults)) {
                            const cacheKey = `${key}:true`;
                            detailCache.set(cacheKey, batchResults[key]);
                            results[key] = batchResults[key];
                        }
                    } else {
                        // Fallback to sequential calls if batch not supported by strategy
                        for (const item of group) {
                            try {
                                const single = await strategy.getDetail(item.objectId, sapUser, userJwt, true);
                                detailCache.set(item.cacheKey, single);
                                results[`${objectType}:${item.objectId}`] = single;
                            } catch (singleErr) {
                                // ignore single error
                            }
                        }
                    }
                } catch (err: any) {
                    console.error(`[SapOdataAdapter] Batch details failed for strategy ${objectType}:`, err.message);
                }
            })
        );

        return results;
    }

    async addComment(objectId: string, text: string, sapUser: string, userJwt?: string, type = 'NORM'): Promise<void> {
        clearDetailCache('PR', objectId);
        clearDetailCache('PO', objectId);

        const strategy = this.getStrategy('PR');
        if (strategy.addComment) {
            await strategy.addComment(objectId, text, sapUser, userJwt, type);
        } else {
            throw new Error(`addComment not supported for strategy: ${strategy.objectType}`);
        }
    }

    async uploadAttachment(objectId: string, fileName: string, mimeType: string, buffer: Buffer, sapUser: string, userJwt?: string): Promise<void> {
        clearDetailCache('PR', objectId);
        clearDetailCache('PO', objectId);

        const strategy = this.getStrategy('PR');
        if (strategy.uploadAttachment) {
            await strategy.uploadAttachment(objectId, fileName, mimeType, buffer, sapUser, userJwt);
        } else {
            throw new Error(`uploadAttachment not supported for strategy: ${strategy.objectType}`);
        }
    }

    async fetchAttachmentContent(objectId: string, attachId: string, sapUser: string, userJwt?: string): Promise<{ data: Buffer; contentType: string; fileName: string } | null> {
        const strategy = this.getStrategy('PR');
        if (strategy.fetchAttachmentContent) {
            return await strategy.fetchAttachmentContent(objectId, attachId, sapUser, userJwt);
        } else {
            throw new Error(`fetchAttachmentContent not supported for strategy: ${strategy.objectType}`);
        }
    }
}
