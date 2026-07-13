import { BaseDetail, toCamelCaseKeys } from './base';
import { ObjectTypeCode } from '../processors/object-config';
import { ODATA_DETAIL_CONFIGS } from '../processors/odata-config';
import { ODataListResult, RawODataEntity } from '../types/sap-odata.types';

export class PoDetail extends BaseDetail {
    readonly objectType: ObjectTypeCode = 'PO';

    protected async fetchSubEntities(
        objectId: string,
        paddedId: string,
        rawHeader: RawODataEntity,
        normalizedHeader: any,
        sapUser: string,
        userJwt?: string
    ): Promise<Record<string, any>> {
        const config = ODATA_DETAIL_CONFIGS[this.objectType];
        const filter = `PurchaseOrder eq '${encodeURIComponent(paddedId)}'`;

        const [itemsRes, accountsRes, schedulesRes] = await Promise.all([
            this.sapClient.get<ODataListResult>(config.servicePath, config.itemsEntity!, { $format: 'json', $filter: filter }, sapUser, userJwt).catch((err) => {
                console.error(`[PoDetail] Failed to fetch PO items from ${config.itemsEntity}:`, err.message);
                return { d: { results: [] } };
            }),
            this.sapClient.get<ODataListResult>(config.servicePath, config.accountAssignmentsEntity!, { $format: 'json', $filter: filter }, sapUser, userJwt).catch((err) => {
                console.error(`[PoDetail] Failed to fetch PO account assignments from ${config.accountAssignmentsEntity}:`, err.message);
                return { d: { results: [] } };
            }),
            this.sapClient.get<ODataListResult>(config.servicePath, config.scheduleLinesEntity!, { $format: 'json', $filter: filter }, sapUser, userJwt).catch((err) => {
                console.error(`[PoDetail] Failed to fetch PO schedule lines from ${config.scheduleLinesEntity}:`, err.message);
                return { d: { results: [] } };
            })
        ]);

        const rawItems = itemsRes?.d?.results || [];
        const rawAccounts = accountsRes?.d?.results || [];
        const rawSchedules = schedulesRes?.d?.results || [];

        const normalizedItems = await Promise.all(rawItems.map((i) => this.metadataService.normalizeDetail(i, config.servicePath, sapUser, userJwt)));
        const normalizedAccounts = await Promise.all(rawAccounts.map((a) => this.metadataService.normalizeDetail(a, config.servicePath, sapUser, userJwt)));
        const normalizedSchedules = await Promise.all(rawSchedules.map((s) => this.metadataService.normalizeDetail(s, config.servicePath, sapUser, userJwt)));

        return {
            items: toCamelCaseKeys(normalizedItems),
            accountAssignments: toCamelCaseKeys(normalizedAccounts),
            scheduleLines: toCamelCaseKeys(normalizedSchedules)
        };
    }
}
