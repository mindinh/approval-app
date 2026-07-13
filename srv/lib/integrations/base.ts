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
    ) {}

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
        const headerUrl = `/${config.headerEntity}('${encodeURIComponent(paddedId)}')`;

        const headerRes = await this.sapClient.get<ODataSingleResult>(
            config.servicePath,
            headerUrl,
            { $format: 'json' },
            sapUser,
            userJwt
        ).catch((err) => {
            console.error(`[BaseDetail:${this.objectType}] Failed to fetch header for ${paddedId}:`, err.message);
            throw new Error(`Failed to fetch header for ${this.objectType} ${paddedId}: ${err.message}`);
        });

        if (!headerRes?.d) {
            throw new Error(`Failed to fetch header for ${this.objectType} ${paddedId}: Empty response received`);
        }

        const rawHeader = headerRes.d;
        const normalizedHeader = await this.metadataService.normalizeDetail(rawHeader, config.servicePath, sapUser, userJwt);
        const docType = rawHeader.PurchaseRequisitionType || rawHeader.PurchaseOrderType || 'ZASS';

        const result: any = {
            objectType: this.objectType,
            documentType: docType,
            objectId,
            header: toCamelCaseKeys(normalizedHeader)
        };

        if (headerOnly) {
            return result;
        }

        // Fetch sub-entities in parallel via the subclass hook
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
