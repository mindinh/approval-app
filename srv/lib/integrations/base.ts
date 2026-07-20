import { SapClient } from './sap-client';
import { MetadataService } from '../metadata-service';
import { Detail } from './detail';
import { ObjectTypeCode } from '../processors/object-config';
import { ODATA_DETAIL_CONFIGS } from '../processors/odata-config';
import { RawODataEntity, ODataSingleResult } from '../types/sap-odata.types';
import { getMockDetail } from './mock-data-provider';

export function toCamelCaseKeys(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (obj instanceof Date || obj instanceof RegExp || obj instanceof ArrayBuffer || ArrayBuffer.isView(obj)) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => toCamelCaseKeys(item));
    }
    const result: any = {};
    for (const key of Object.keys(obj)) {
        const normalizedKey = key.replace(/_Text$/, 'Text');
        const camelKey = normalizedKey.charAt(0).toLowerCase() + normalizedKey.slice(1);
        result[camelKey] = toCamelCaseKeys(obj[key]);
    }
    return result;
}

export abstract class BaseDetail implements Detail {
    abstract readonly objectType: ObjectTypeCode;

    constructor(
        protected readonly sapClient: SapClient,
        protected readonly metadataService: MetadataService
    ) { }

    async getDetail(
        objectId: string,
        sapUser: string,
        userJwt?: string,
        headerOnly = false
    ): Promise<any> {
        const isMockMode = process.env.USE_MOCK_SAP !== 'false';
        if (isMockMode) {
            const mock = getMockDetail(this.objectType, objectId);
            if (headerOnly) {
                return {
                    objectType: mock.objectType,
                    documentType: mock.documentType,
                    objectId: mock.objectId,
                    header: toCamelCaseKeys(mock.header)
                };
            }
            return {
                ...mock,
                header: toCamelCaseKeys(mock.header),
                items: toCamelCaseKeys(mock.items)
            };
        }

        const config = ODATA_DETAIL_CONFIGS[this.objectType];
        const paddedId = /^\d+$/.test(objectId) ? objectId.padStart(10, '0') : objectId;

        let headerUrl = '';
        const params: Record<string, string> = { $format: 'json' };

        if (config.headerEntity.startsWith('ZC_')) {
            // New V4 composite key
            const docCategory = config.docCategory || (this.objectType === 'PR' ? 'BUS2105' : 'BUS2012');
            headerUrl = `/${config.headerEntity}(DocCategory='${docCategory}',DocumentNumber='${encodeURIComponent(paddedId)}')`;
            // Request expanded sub-entities only if we are loading full details
            if (!headerOnly) {
                params.$expand = '_Item,_ApprovalStep,_HeaderText,_Comment';
            }
        } else {
            // Old V2 format
            headerUrl = `/${config.headerEntity}('${encodeURIComponent(paddedId)}')`;
        }

        const headerRes = await this.sapClient.get<any>(
            config.servicePath,
            headerUrl,
            params,
            sapUser,
            userJwt
        ).catch((err) => {
            console.error(`[BaseDetail:${this.objectType}] Failed to fetch header for ${paddedId}:`, err.message);
            throw new Error(`Failed to fetch header for ${this.objectType} ${paddedId}: ${err.message}`);
        });

        // OData V4 returns the object directly at the root, V2 wraps it in a `.d` property
        const rawHeader = headerRes?.d || headerRes;
        if (!rawHeader || Object.keys(rawHeader).length === 0) {
            throw new Error(`Failed to fetch header for ${this.objectType} ${paddedId}: Empty response received`);
        }

        const normalizedHeader = await this.metadataService.normalizeDetail(rawHeader, config.servicePath, sapUser, userJwt);
        const docType = rawHeader.DocumentType || rawHeader.PurchaseRequisitionType || rawHeader.PurchaseOrderType || 'ZASS';

        const header = toCamelCaseKeys(normalizedHeader);
        if (this.objectType === 'PR') {
            header.purchaseRequisition = objectId;
        } else if (this.objectType === 'PO') {
            header.purchaseOrder = objectId;
        }

        const result: any = {
            objectType: this.objectType,
            documentType: docType,
            objectId,
            header
        };

        if (headerOnly) {
            return result;
        }

        // Fetch sub-entities via the subclass hook (which reads them from rawHeader or makes parallel calls)
        const subEntities = await this.fetchSubEntities(objectId, paddedId, rawHeader, normalizedHeader, sapUser, userJwt);
        return {
            ...result,
            ...subEntities
        };
    }

    async getDetailBatch(
        itemsToFetch: Array<{ objectType: string; objectId: string }>,
        sapUser: string,
        userJwt?: string
    ): Promise<Record<string, any>> {
        const isMockMode = process.env.USE_MOCK_SAP !== 'false';
        const results: Record<string, any> = {};

        if (isMockMode) {
            for (const item of itemsToFetch) {
                const mock = getMockDetail(this.objectType, item.objectId);
                results[`${this.objectType}:${item.objectId}`] = {
                    objectType: mock.objectType,
                    documentType: mock.documentType,
                    objectId: item.objectId,
                    header: toCamelCaseKeys(mock.header)
                };
            }
            return results;
        }

        // Run all individual single GETs in parallel to bypass unsupported $batch operations
        await Promise.all(itemsToFetch.map(async (item) => {
            try {
                const single = await this.getDetail(item.objectId, sapUser, userJwt, true);
                results[`${this.objectType}:${item.objectId}`] = single;
            } catch (err: any) {
                console.error(`[BaseDetail:${this.objectType}] Failed to fetch parallel details for ${item.objectId}:`, err.message);
            }
        }));

        return results;
    }

    // Subclass hook to fetch subclass-specific items, tree, account assignments, schedule lines, etc.
    protected abstract fetchSubEntities(
        objectId: string,
        paddedId: string,
        rawHeader: RawODataEntity,
        normalizedHeader: any,
        sapUser: string,
        userJwt?: string
    ): Promise<Record<string, any>>;

    // Utility to declaratively map item properties using a configuration-driven itemMapper schema
    protected mapItemProperties(item: any, mapper: Record<string, string | ((item: any) => any)>): any {
        const result: any = {};
        for (const key of Object.keys(mapper)) {
            const rule = mapper[key];
            if (typeof rule === 'function') {
                result[key] = rule(item);
            } else {
                result[key] = item[rule] ?? '';
            }
        }
        return result;
    }
}
