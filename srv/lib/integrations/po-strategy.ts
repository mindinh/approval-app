import { SapClient } from './sap-client';
import { MetadataService } from '../metadata-service';
import { DetailStrategy } from './detail-strategy';
import { ObjectTypeCode } from '../processors/object-config';
import { getMockDetail } from './mock-data-provider';
import { RawODataEntity, ODataSingleResult, ODataListResult } from '../types/sap-odata.types';

function toCamelCaseKeys(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
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

export class PoStrategy implements DetailStrategy {
    readonly objectType: ObjectTypeCode = 'PO';
    private readonly metadataService: MetadataService;

    constructor(private readonly sapClient: SapClient) {
        this.metadataService = new MetadataService(this.sapClient);
    }

    async getDetail(objectId: string, sapUser: string, userJwt?: string, headerOnly = false): Promise<any> {
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

        const path = '/sap/opu/odata/sap/C_PURCHASEORDER_FS_SRV';
        const paddedId = /^\d+$/.test(objectId) ? objectId.padStart(10, '0') : objectId;
        const headerUrl = `/C_PurchaseOrderFs('${encodeURIComponent(paddedId)}')`;
        const filter = `PurchaseOrder eq '${encodeURIComponent(paddedId)}'`;

        if (headerOnly) {
            const headerRes = await this.sapClient.get<ODataSingleResult>(path, headerUrl, { $format: 'json' }, sapUser, userJwt).catch(() => null);
            const rawHeader = headerRes?.d || {} as RawODataEntity;
            const normalizedHeader = await this.metadataService.normalizeDetail(rawHeader, path, sapUser, userJwt);
            return {
                objectType: 'PO',
                documentType: 'DEFAULT',
                objectId,
                header: toCamelCaseKeys(normalizedHeader)
            };
        }

        const [headerRes, itemsRes, accountsRes, schedulesRes] = await Promise.all([
            this.sapClient.get<ODataSingleResult>(path, headerUrl, { $format: 'json' }, sapUser, userJwt),
            this.sapClient.get<ODataListResult>(path, '/C_PurOrdItemEnh', { $format: 'json', $filter: filter }, sapUser, userJwt),
            this.sapClient.get<ODataListResult>(path, '/C_POAccountAssignmentFactSheet', { $format: 'json', $filter: filter }, sapUser, userJwt),
            this.sapClient.get<ODataListResult>(path, '/C_POScheduleLineFactSheet', { $format: 'json', $filter: filter }, sapUser, userJwt)
        ]);

        const rawHeader = headerRes?.d || {} as RawODataEntity;
        const rawItems = itemsRes?.d?.results || [];
        const rawAccounts = accountsRes?.d?.results || [];
        const rawSchedules = schedulesRes?.d?.results || [];

        const normalizedHeader = await this.metadataService.normalizeDetail(rawHeader, path, sapUser, userJwt);
        const normalizedItems = await Promise.all(rawItems.map((i) => this.metadataService.normalizeDetail(i, path, sapUser, userJwt)));
        const normalizedAccounts = await Promise.all(rawAccounts.map((a) => this.metadataService.normalizeDetail(a, path, sapUser, userJwt)));
        const normalizedSchedules = await Promise.all(rawSchedules.map((s) => this.metadataService.normalizeDetail(s, path, sapUser, userJwt)));

        return {
            objectType: 'PO',
            documentType: 'DEFAULT',
            objectId,
            header: toCamelCaseKeys(normalizedHeader),
            items: toCamelCaseKeys(normalizedItems),
            accountAssignments: toCamelCaseKeys(normalizedAccounts),
            scheduleLines: toCamelCaseKeys(normalizedSchedules)
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

        const path = '/sap/opu/odata/sap/C_PURCHASEORDER_FS_SRV';
        const batchRequests = itemsToFetch.map(item => {
            const paddedId = /^\d+$/.test(item.objectId) ? item.objectId.padStart(10, '0') : item.objectId;
            return {
                relativePath: `/C_PurchaseOrderFs('${encodeURIComponent(paddedId)}')`,
                params: {}
            };
        });

        try {
            const batchResponses = await this.sapClient.batchGet(path, batchRequests, sapUser, userJwt);
            for (let idx = 0; idx < itemsToFetch.length; idx++) {
                const item = itemsToFetch[idx];
                const responsePart = batchResponses[idx];
                
                let normalizedHeader = {};
                
                if (responsePart && !responsePart.error) {
                    const rawHeader = (responsePart.d || responsePart) as RawODataEntity;
                    normalizedHeader = await this.metadataService.normalizeDetail(rawHeader, path, sapUser, userJwt);
                }
                
                results[`PO:${item.objectId}`] = {
                    objectType: 'PO',
                    documentType: 'DEFAULT',
                    objectId: item.objectId,
                    header: toCamelCaseKeys(normalizedHeader)
                };
            }
        } catch (err: any) {
            console.error('[PoStrategy] Batch PO header fetch failed, falling back to sequential calls:', err.message);
            for (const item of itemsToFetch) {
                try {
                    const single = await this.getDetail(item.objectId, sapUser, userJwt, true);
                    results[`PO:${item.objectId}`] = single;
                } catch (singleErr) {
                    // ignore
                }
            }
        }

        return results;
    }
}
