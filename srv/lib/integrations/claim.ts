import { BaseDetail, toCamelCaseKeys } from './base';
import { ObjectTypeCode } from '../processors/object-config';
import { RawODataEntity } from '../types/sap-odata.types';

export class ClaimDetail extends BaseDetail {
    readonly objectType: ObjectTypeCode = 'CLAIM';

    protected async fetchSubEntities(
        objectId: string,
        paddedId: string,
        rawHeader: RawODataEntity,
        normalizedHeader: any,
        sapUser: string,
        userJwt?: string
    ): Promise<Record<string, any>> {
        // Claim Form OData integration placeholder
        // For actual SAP connection, map Claim entities from Gateway.
        return {
            header: {
                ...toCamelCaseKeys(normalizedHeader),
                claimNumber: objectId
            },
            items: []
        };
    }
}
