import { BaseDetail, toCamelCaseKeys } from './base';
import { ObjectTypeCode } from '../processors/object-config';
import { ODATA_SERVICES } from '../processors/odata-config';
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
        const servicePath = ODATA_SERVICES.INSTANCE_LIST.servicePath;

        // Retrieve expanded collections from rawHeader (provided by $expand on the main request)
        const rawItems = rawHeader._Item || [];
        const rawSteps = rawHeader._ApprovalStep || [];
        const rawTexts = rawHeader._HeaderText || [];

        // Normalize raw items using metadata service
        const normalizedRawItems = await Promise.all(rawItems.map((item: any) => 
            this.metadataService.normalizeDetail(item, servicePath, sapUser, userJwt)
        ));

        const normalizedItems = normalizedRawItems;

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

        // Normalize attachments from _Attachment navigation property
        const rawAttachments = rawHeader._Attachment || [];
        const normalizedAttachments = rawAttachments.map((att: any) => {
            const ext = att.FileExtension || '';
            const mimeType = ext.toLowerCase() === 'pdf' ? 'application/pdf' : 
                             ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext.toLowerCase()) ? `image/${ext.toLowerCase()}` : 
                             'application/octet-stream';
            return {
                id: att.DocId,
                fileName: att.FileExtension ? `${att.FileName}.${att.FileExtension}` : att.FileName,
                fileDisplayName: att.FileName,
                mimeType,
                fileSize: 0,
                createdBy: att.CreatedBy || '',
                createdAt: att.CreatedOnDate && att.CreatedOnTime ? `${att.CreatedOnDate}T${att.CreatedOnTime}` : new Date().toISOString()
            };
        });

        // Derive PR description from first text element or join them
        const prDescription = rawTexts.map((t: any) => t.LongText || '').join('\n').replace(/\n{3,}/g, '\n\n').trim();

        // Normalize comments from _Comment navigation property
        const rawComments = rawHeader._Comment || [];
        const normalizedRawComments = await Promise.all(rawComments.map((c: any) =>
            this.metadataService.normalizeDetail(c, servicePath, sapUser, userJwt)
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

        const servicePath = ODATA_SERVICES.INSTANCE_LIST.servicePath;
        const relativePath = `/ZI_DOC_ATTACH_CONTENT('${encodeURIComponent(attachId)}')/Content`;
        const res = await this.sapClient.getBinary(servicePath, relativePath, sapUser, userJwt);
        return {
            data: res.data,
            contentType: res.contentType,
            fileName: res.fileName || `attachment_${attachId}`
        };
    }
}
