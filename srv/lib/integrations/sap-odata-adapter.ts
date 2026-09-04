import { SapClient } from './sap-client';
import { Detail, ForwardOnHeaderParams, ApproveOnHeaderParams } from './detail';
import { AddCommentOptions } from './comment.types';
import { PrDetail } from './pr';
import { PoDetail } from './po';
import { ReDetail } from './re';
import { ClaimDetail } from './claim';
import { ODATA_SERVICES, resolveObjectTypeFromTypeId, resolveObjectTypeFromInstance } from '../processors/odata-config';
import { MetadataService } from '../metadata-service';
import { CnmaTaskByStatusEntity, CnmaTaskByDocTypeEntity } from '../types/sap-odata.types';
import { Logger } from '../utils/logger';
import { resolveTaskTotalAmount } from '../processors/inbox-utils';


export function clearDetailCache(_objectType: string, _objectId: string) {
    // No-op function preserved for test suite compatibility
}

export class SapOdataAdapter {
    private readonly sapClient = new SapClient();
    private readonly metadataService = new MetadataService(this.sapClient);
    private readonly strategies = new Map<string, Detail>();
    private readonly logger = new Logger('SapOdataAdapter');

    constructor() {
        this.strategies.set('PR', new PrDetail(this.sapClient, this.metadataService));
        this.strategies.set('PO', new PoDetail(this.sapClient, this.metadataService));
        this.strategies.set('RE', new ReDetail(this.sapClient, this.metadataService));
        this.strategies.set('CLAIM', new ClaimDetail(this.sapClient, this.metadataService));
    }

    getStrategy(objectType: string): Detail {
        const strategy = this.strategies.get(objectType.toUpperCase());
        if (!strategy) {
            throw new Error(`Unsupported object type strategy: ${objectType}`);
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
        const path = ODATA_SERVICES.INSTANCE_LIST.servicePath;
        const entitySet = ODATA_SERVICES.INSTANCE_LIST.entitySet;

        const params: Record<string, string> = {
            $format: 'json',
            $orderby: 'TaskCreationDateTime desc',
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
            const padded10 = String(cleanId).padStart(10, '0');
            const padded12 = String(cleanId).padStart(12, '0');
            filterConditions.push(`(DocumentNumber eq '${padded10}' or TechnicalWrkflwObject eq '${padded10}' or WorkflowTaskInternalID eq '${cleanId}' or WorkflowTaskInternalID eq '${padded10}' or WorkflowTaskInternalID eq '${padded12}')`);
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

        const items = rawItems.map((item: any) => {
            const objectType = resolveObjectTypeFromInstance(item, 'PR');
            const total = resolveTaskTotalAmount(item, undefined, objectType);

            return {
                WorkflowTaskInternalID: item.WorkflowTaskInternalID,
                instanceID: item.WorkflowTaskInternalID,
                WorkflowTaskStatus: item.WorkflowTaskStatus,
                status: item.WorkflowTaskStatus,
                TechnicalWrkflwObjectType: item.TechnicalWrkflwObjectType,
                typeid: item.TechnicalWrkflwObjectType,
                TechnicalWrkflwObject: item.TechnicalWrkflwObject,
                DocumentNumber: item.DocumentNumber || item.TechnicalWrkflwObject,
                documentNumber: item.DocumentNumber || item.TechnicalWrkflwObject,
                instid: item.DocumentNumber || item.TechnicalWrkflwObject,
                doctyp: item.DocumentType,
                doctyp_desc: item.DocumentTypeText,
                DocumentType: item.DocumentType,
                DocumentTypeText: item.DocumentTypeText,
                normalTask: item.NormalTask !== false,
                total: total,
                TotalOrderValue: item.TotalOrderValue !== undefined && item.TotalOrderValue !== null ? Number(item.TotalOrderValue) : undefined,
                TotalNetAmountLocalCrcy: item.TotalNetAmountLocalCrcy !== undefined && item.TotalNetAmountLocalCrcy !== null ? Number(item.TotalNetAmountLocalCrcy) : undefined,
                PaymentAmountLocalCrcy: item.PaymentAmountLocalCrcy !== undefined && item.PaymentAmountLocalCrcy !== null ? Number(item.PaymentAmountLocalCrcy) : undefined,
                PaymentAmount: item.PaymentAmount !== undefined && item.PaymentAmount !== null ? Number(item.PaymentAmount) : undefined,
                DocCategory: item.DocCategory || item.TechnicalWrkflwObjectType,
                LocalCurrency: item.LocalCurrency,
                DocumentCurrency: item.DocumentCurrency,
                taskCreationDateTime: item.TaskCreationDateTime,
                createdByUser: item.CreatedByUser,
                CreatedByUser: item.CreatedByUser,
                creationDate: item.CreationDate,
                creationTime: item.CreationTime,
                companyCode: item.CompanyCode || item.companyCode,
                companyCodeName: item.CompanyCodeName || item.companyCodeName,
                ApproverNumber: item.ApproverNumber || item.approverNumber || (item.DocCategory === 'CLAIM' || item.TechnicalWrkflwObjectType === 'CLAIM' ? '1' : undefined),
                approverNumber: item.ApproverNumber || item.approverNumber || (item.DocCategory === 'CLAIM' || item.TechnicalWrkflwObjectType === 'CLAIM' ? '1' : undefined),
            };
        });

        // Local sort by TaskCreationDateTime descending (fallback to instance ID desc when date is missing/equal)
        items.sort((a: any, b: any) => {
            const dateA = a.taskCreationDateTime ? new Date(a.taskCreationDateTime).getTime() : 0;
            const dateB = b.taskCreationDateTime ? new Date(b.taskCreationDateTime).getTime() : 0;
            if (dateB !== dateA) return dateB - dateA;
            const idA = Number(a.instanceID) || 0;
            const idB = Number(b.instanceID) || 0;
            return idB - idA;
        });

        (items as any).totalCount = totalCount;

        return items;
    }

    async getDetail(
        objectType: string,
        objectId: string,
        sapUser: string,
        userJwt?: string,
        headerOnly = false,
        options?: { approverNumber?: string }
    ): Promise<any> {
        const strategy = this.getStrategy(objectType);
        return await strategy.getDetail(objectId, sapUser, userJwt, headerOnly, options);
    }

    async getDetailBatch(
        itemsToFetch: Array<{ objectType: string; objectId: string; approverNumber?: string }>,
        sapUser: string,
        userJwt?: string
    ): Promise<Record<string, any>> {
        const results: Record<string, any> = {};

        // Group items by strategy
        const groupedItems = new Map<string, Array<{ objectType: string; objectId: string; approverNumber?: string }>>();
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
                                const single = await strategy.getDetail(item.objectId, sapUser, userJwt, true, { approverNumber: item.approverNumber });
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

    private resolveObjectType(_objectId: string, explicitType?: string): string {
        const type = (explicitType || '').toUpperCase().trim();
        if (type && this.strategies.has(type)) {
            return type;
        }

        if (type) {
            const mappedType = resolveObjectTypeFromTypeId(type);
            if (mappedType && this.strategies.has(mappedType)) {
                return mappedType;
            }
        }

        return 'PR';
    }


    async addComment(objectId: string, text: string, sapUser: string, options?: AddCommentOptions): Promise<void> {
        const targetType = this.resolveObjectType(objectId, options?.objectType);
        const strategy = this.getStrategy(targetType);
        if (strategy.addComment) {
            await strategy.addComment(objectId, text, sapUser, options);
        } else {
            throw new Error(`addComment not supported for strategy: ${strategy.objectType}`);
        }
    }

    /**
     * Dispatches the entity-bound `forward` action to the strategy registered for the given
     * object type. Only PR (BUS2105) and PO (BUS2012) implement forwardOnHeader per
     * METADATA.xml — Reservation/Claim strategies intentionally omit the method.
     */
    async forwardOnHeader(objectType: string, objectId: string, params: ForwardOnHeaderParams, sapUser: string, userJwt?: string): Promise<void> {
        const targetType = this.resolveObjectType(objectId, objectType);
        const normalized = targetType.toUpperCase();
        if (normalized !== 'PR' && normalized !== 'PO') {
            throw new Error(`Entity-bound forward action is only supported for PR and PO. Received: ${targetType}`);
        }

        const strategy = this.getStrategy(targetType);
        if (!strategy.forwardOnHeader) {
            throw new Error(`Strategy ${strategy.objectType} does not implement forwardOnHeader`);
        }

        await strategy.forwardOnHeader(objectId, params, sapUser, userJwt);
    }

    /**
     * Dispatches the entity-bound `approve` action to the strategy registered for the given
     * object type. Currently only Claim (CLAIM) implements approveOnHeader per METADATA.xml —
     * PR/PO/Re strategies intentionally omit it. SAP exposes `/SAP__self.approve` and
     * `/SAP__self.reject` as two distinct bound actions; this dispatcher routes the
     * `approve` action. The decision code is recorded separately via `/SAP__self.comment`.
     */
    async approveOnHeader(objectType: string, objectId: string, params: ApproveOnHeaderParams, sapUser: string, userJwt?: string): Promise<void> {
        const targetType = this.resolveObjectType(objectId, objectType);
        const normalized = targetType.toUpperCase();
        if (normalized !== 'CLAIM') {
            throw new Error(`Entity-bound approve action is only supported for Claim. Received: ${targetType}`);
        }

        const strategy = this.getStrategy(targetType);
        if (!strategy.approveOnHeader) {
            throw new Error(`Strategy ${strategy.objectType} does not implement approveOnHeader`);
        }

        await strategy.approveOnHeader(objectId, params, sapUser, userJwt);
    }

    /**
     * Dispatches the entity-bound `reject` action to the strategy registered for the given
     * object type. Currently only Claim (CLAIM) implements rejectOnHeader per METADATA.xml —
     * PR/PO/Re strategies intentionally omit it. Mirror of `approveOnHeader` but POSTs to
     * `/SAP__self.reject`. The decision code is recorded separately via `/SAP__self.comment`.
     */
    async rejectOnHeader(objectType: string, objectId: string, params: ApproveOnHeaderParams, sapUser: string, userJwt?: string): Promise<void> {
        const targetType = this.resolveObjectType(objectId, objectType);
        const normalized = targetType.toUpperCase();
        if (normalized !== 'CLAIM') {
            throw new Error(`Entity-bound reject action is only supported for Claim. Received: ${targetType}`);
        }

        const strategy = this.getStrategy(targetType);
        if (!strategy.rejectOnHeader) {
            throw new Error(`Strategy ${strategy.objectType} does not implement rejectOnHeader`);
        }

        await strategy.rejectOnHeader(objectId, params, sapUser, userJwt);
    }

    async fetchAttachmentContent(objectId: string, attachId: string, sapUser: string, userJwt?: string, objectType?: string): Promise<{ data: Buffer; contentType: string; fileName: string } | null> {
        const explicitType = (objectType || '').toUpperCase().trim();
        const resolvedType = explicitType ? (this.strategies.has(explicitType) ? explicitType : resolveObjectTypeFromTypeId(explicitType)) : undefined;

        if (resolvedType && this.strategies.has(resolvedType)) {
            const strategy = this.getStrategy(resolvedType);
            if (strategy.fetchAttachmentContent) {
                return await strategy.fetchAttachmentContent(objectId, attachId, sapUser, userJwt);
            }
        }

        // When objectType is unknown/unspecified, try CLAIM strategy first (CNMA_CLAIM_ATTA), then fallback to GOS (CNMA_ATTACH_CONTENT)
        try {
            const claimStrategy = this.getStrategy('CLAIM');
            if (claimStrategy.fetchAttachmentContent) {
                const res = await claimStrategy.fetchAttachmentContent(objectId, attachId, sapUser, userJwt);
                if (res && res.data && res.data.length > 0) {
                    return res;
                }
                this.logger.debug(`CLAIM attachment endpoint returned empty for ${attachId}; trying GOS fallback.`);
            }
        } catch (e: any) {
            // If CLAIM endpoint returns 400/404, fallback to GOS endpoint (CNMA_ATTACH_CONTENT)
            this.logger.debug(`CLAIM attachment endpoint failed for ${attachId}: ${e?.message || e}. Falling back to GOS.`);
        }

        const gosStrategy = this.getStrategy('RE');
        if (gosStrategy.fetchAttachmentContent) {
            const fallback = await gosStrategy.fetchAttachmentContent(objectId, attachId, sapUser, userJwt);
            if (fallback) return fallback;
        }

        this.logger.warn(`No attachment content returned for ${attachId} on ${objectId} after CLAIM+GOS fallback.`);
        return null;
    }

    async getDocTypeCounts(sapUser: string, userJwt?: string): Promise<CnmaTaskByDocTypeEntity[]> {
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
            return [];
        }
    }

    async getStatusCounts(sapUser: string, userJwt?: string): Promise<CnmaTaskByStatusEntity[]> {
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
            return [];
        }
    }

    async searchBusUsers(searchPattern: string, sapUser: string, userJwt?: string): Promise<any[]> {
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
            return [];
        }
    }
}


