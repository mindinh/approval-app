import { BaseDetail, toCamelCaseKeys } from './base';
import { ObjectTypeCode } from '../processors/object-config';
import { ODATA_SERVICES } from '../processors/odata-config';
import { RawODataEntity } from '../types/sap-odata.types';
import { addMockComment, addMockAttachment, getMockAttachmentContent, getMockAttachmentContentById } from './mock-data-provider';
import { AppError } from '../utils/error-handler';
import { getMimeTypeFromExtension } from '../utils/mime';

export class ReDetail extends BaseDetail {
    readonly objectType: ObjectTypeCode = 'RE';

    protected async fetchSubEntities(
        objectId: string,
        paddedId: string,
        rawHeader: RawODataEntity,
        normalizedHeader: any,
        sapUser: string,
        userJwt?: string
    ): Promise<Record<string, any>> {
        const servicePath = ODATA_SERVICES.INSTANCE_LIST.servicePath;
        const docCategory = rawHeader.DocCategory || 'ZBUS2093';
        const docNum = paddedId.substring(0, 10);
        const headerKey = `/CNMA_RESVHEADER(DocCategory='${encodeURIComponent(docCategory)}',DocumentNumber='${encodeURIComponent(docNum)}')`;

        const fetchSubEntity = async (propName: string, subPath: string): Promise<any> => {
            if (rawHeader[propName] !== undefined && rawHeader[propName] !== null) {
                const val = rawHeader[propName];
                return Array.isArray(val) ? val : (val?.results || val?.d?.results || (typeof val === 'object' && Object.keys(val).length > 0 ? [val] : []));
            }
            try {
                const res: any = await this.sapClient.get(servicePath, `${headerKey}/${subPath}`, { $format: 'json' }, sapUser, userJwt);
                return res?.value || res?.d?.results || res?.d || [];
            } catch (e: any) {
                return [];
            }
        };

        const [
            rawItems,
            rawSteps,
            rawComments,
            rawAttachments
        ] = await Promise.all([
            fetchSubEntity('_Item', '_Item'),
            fetchSubEntity('_ApprovalStep', '_ApprovalStep'),
            fetchSubEntity('_Comment', '_Comment'),
            fetchSubEntity('_Attachment', '_Attachment')
        ]);

        const items = (Array.isArray(rawItems) ? rawItems : []).map(item => toCamelCaseKeys(item));

        // Normalize workflow approval steps exactly like PR and PO
        const normalizedSteps = (Array.isArray(rawSteps) ? rawSteps : []).map((s: any) => ({
            documentId: s.ObjectKey || objectId,
            level: Number(s.ApprovalLevel ?? 0),
            releaseCode: s.ReleaseCode || '',
            releaseText: s.ReleaseText || s.ReleaseCode || '',
            approver: s.ApproverName || '',
            approverUserId: s.ApproverUserId || '',
            status: s.ApprovalStatus || '',
            noteText: s.CommentText || '',
            postedOn: s.CommentDate || '',
            postedTime: s.CommentTime || ''
        }));

        // Normalize comments from _Comment navigation property
        const normalizedComments = (Array.isArray(rawComments) ? rawComments : []).map((c: any) => ({
            author: c.UserComment || c.userComment || c.Usercomment || c.author || c.CreatedBy || c.createdBy || '',
            text: c.NoteText || c.noteText || c.Notetext || c.text || c.CommentText || '',
            postedOn: c.PostedOn || c.postedOn || c.Postedon || c.CommentDate || '',
            postedTime: c.PostedTime || c.postedTime || c.Postedtime || c.CommentTime || ''
        }));

        // Normalize attachments from _Attachment navigation property
        const normalizedAttachments = (Array.isArray(rawAttachments) ? rawAttachments : []).map((att: any) => {
            const ext = att.FileExtension || att.fileExtension || '';
            let fileName = att.FileName || att.fileName || '';
            if (ext && !fileName.toLowerCase().endsWith('.' + ext.toLowerCase())) {
                fileName = `${fileName}.${ext}`;
            }
            const mimeType = att.MimeType || att.ContentType || getMimeTypeFromExtension(ext, fileName);
            return {
                id: att.DocId || att.id,
                fileName,
                fileDisplayName: att.FileName || att.fileName,
                mimeType,
                fileSize: Number(att.Length || att.length || 0),
                createdBy: att.CreatedBy || att.createdBy || '',
                createdAt: att.CreatedOnDate && att.CreatedOnTime ? `${att.CreatedOnDate}T${att.CreatedOnTime}` : new Date().toISOString()
            };
        });

        const camelHeader = toCamelCaseKeys(normalizedHeader);
        const documentType = rawHeader.DocumentType || camelHeader.documentType || 'RESV';
        const documentTypeText = rawHeader.DocumentTypeText || camelHeader.documentTypeText || 'Reservation';
        const documentTypeDisplay = rawHeader.DocumentTypeDisplay || camelHeader.documentTypeDisplay || `${documentType} - ${documentTypeText}`;

        const finalHeader = {
            ...camelHeader,
            documentType,
            documentTypeText,
            documentTypeDisplay
        };

        return {
            header: finalHeader,
            items,
            approvalTree: normalizedSteps,
            approvalSteps: normalizedSteps,
            comments: normalizedComments,
            attachments: normalizedAttachments
        };
    }

    async addComment(objectId: string, text: string, sapUser: string, userJwt?: string, type = 'NORM', decision = ''): Promise<void> {
        const isMockMode = process.env.USE_MOCK_SAP !== 'false';
        if (isMockMode) {
            addMockComment(objectId, text, sapUser);
            return;
        }

        const rawPadded = /^\d+$/.test(objectId) ? objectId.padStart(10, '0') : objectId;
        const paddedId = rawPadded.substring(0, 10);
        const servicePath = ODATA_SERVICES.INSTANCE_LIST.servicePath;
        const relativePath = `/CNMA_RESVHEADER(DocCategory='ZBUS2093',DocumentNumber='${paddedId}')/SAP__self.comment`;
        
        const cleanText = text ? text.trim().substring(0, 255) : '';
        const isGeneral = type !== 'APPR';
        const payload = {
            NoteText: cleanText,
            isGeneral,
            Decision: isGeneral ? '' : (decision || 'A')
        };

        await this.sapClient.post(servicePath, relativePath, payload, {}, sapUser, userJwt);
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
            if (objectId) {
                return getMockAttachmentContent(objectId, attachId);
            }
            return getMockAttachmentContentById(attachId);
        }

        const servicePath = ODATA_SERVICES.INSTANCE_LIST.servicePath;
        const relativePath = `/CNMA_ATTACH_CONTENT('${encodeURIComponent(attachId)}')/Content`;
        const res = await this.sapClient.getBinary(servicePath, relativePath, sapUser, userJwt);
        
        let data = res.data;
        if (data && data.length > 0) {
            let lastNonNull = data.length - 1;
            while (lastNonNull >= 0 && data[lastNonNull] === 0) {
                lastNonNull--;
            }
            data = data.subarray(0, lastNonNull + 1);
        }

        return {
            data,
            contentType: res.contentType,
            fileName: res.fileName || `attachment_${attachId}`
        };
    }
}


