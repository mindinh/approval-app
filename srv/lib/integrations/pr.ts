import { BaseDetail, toCamelCaseKeys } from './base';
import { ObjectTypeCode } from '../processors/object-config';
import { ODATA_DETAIL_CONFIGS } from '../processors/odata-config';
import { RawODataEntity } from '../types/sap-odata.types';
import { addMockComment, addMockAttachment, getMockAttachmentContent } from './mock-data-provider';
import { AppError } from '../utils/error-handler';

export class PrDetail extends BaseDetail {
    readonly objectType: ObjectTypeCode = 'PR';

    protected async fetchSubEntities(
        objectId: string,
        paddedId: string,
        rawHeader: RawODataEntity,
        normalizedHeader: any,
        sapUser: string,
        userJwt?: string
    ): Promise<Record<string, any>> {
        const config = ODATA_DETAIL_CONFIGS[this.objectType];

        // Retrieve expanded collections from rawHeader (provided by $expand on the main request)
        const rawItems = rawHeader._Item || [];
        const rawSteps = rawHeader._ApprovalStep || [];
        const rawTexts = rawHeader._HeaderText || [];

        // Normalize raw items using metadata service
        const normalizedRawItems = await Promise.all(rawItems.map((item: any) => 
            this.metadataService.normalizeDetail(item, config.servicePath, sapUser, userJwt)
        ));

        // Map item properties using config's itemMapper
        const normalizedItems = normalizedRawItems.map((item: any) => 
            this.mapItemProperties(item, config.itemMapper!)
        );

        // Normalize workflow approval steps
        const normalizedSteps = rawSteps.map((s: any) => ({
            documentId: s.ObjectKey || objectId,
            level: Number(s.ApprovalLevel ?? 0),
            releaseCode: s.ReleaseCode || '',
            approver: s.ApproverName || '',
            approverUserId: s.ApproverUserId || '',
            status: s.ApprovalStatus || '',
            noteText: s.CommentText || '',
            postedOn: s.CommentDate || '',
            postedTime: s.CommentTime || ''
        }));

        // ZC_PRHEADER does not have attachments exposed in the current schema
        const normalizedAttachments: any[] = [];

        // Derive PR description from first text element or join them
        const prDescription = rawTexts.map((t: any) => t.LongText).join('\n') || '';

        // Normalize comments from _Comment navigation property
        const rawComments = rawHeader._Comment || [];
        const normalizedRawComments = await Promise.all(rawComments.map((c: any) =>
            this.metadataService.normalizeDetail(c, config.servicePath, sapUser, userJwt)
        ));

        const normalizedComments = normalizedRawComments.map((c: any) => ({
            author: c.UserComment || '',
            text: c.NoteText || '',
            postedOn: c.PostedOn || '',
            postedTime: c.PostedTime || ''
        }));

        const finalHeader = {
            ...toCamelCaseKeys(normalizedHeader),
            purchaseRequisition: objectId,
            purchaseRequisitionText: prDescription
        };

        return {
            header: finalHeader,
            items: toCamelCaseKeys(normalizedItems),
            budget: { status: 'OK' },
            asset: { assetClass: 'IT Equipment' },
            approvalTree: normalizedSteps,
            comments: normalizedComments,
            attachments: normalizedAttachments,
            costCenter: normalizedItems[0]?.costCenter || '',
            wbsElement: ''
        };
    }

    async addComment(objectId: string, text: string, sapUser: string, userJwt?: string, type = 'NORM'): Promise<void> {
        const isMockMode = process.env.USE_MOCK_SAP !== 'false';
        if (isMockMode) {
            addMockComment(objectId, text, sapUser);
            return;
        }
        throw new AppError('Comments posting is disabled for this service.', 405);
    }

    async uploadAttachment(objectId: string, fileName: string, mimeType: string, buffer: Buffer, sapUser: string, userJwt?: string): Promise<void> {
        const isMockMode = process.env.USE_MOCK_SAP !== 'false';
        if (isMockMode) {
            addMockAttachment(objectId, fileName, mimeType, buffer, sapUser);
            return;
        }
        throw new AppError('Attachment upload is disabled for this service.', 405);
    }

    async fetchAttachmentContent(objectId: string, attachId: string, sapUser: string, userJwt?: string): Promise<{ data: Buffer; contentType: string; fileName: string } | null> {
        const isMockMode = process.env.USE_MOCK_SAP !== 'false';
        if (isMockMode) {
            return getMockAttachmentContent(objectId, attachId);
        }
        return null; // Not supported in this OData V4 service
    }
}
