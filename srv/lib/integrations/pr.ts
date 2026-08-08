import { BaseDetail, toCamelCaseKeys } from './base';
import { ObjectTypeCode } from '../processors/object-config';
import { ODATA_SERVICES } from '../processors/odata-config';
import { RawODataEntity } from '../types/sap-odata.types';
import { addMockComment, addMockAttachment, getMockAttachmentContent, getMockAttachmentContentById } from './mock-data-provider';
import { AppError } from '../utils/error-handler';
import { getMimeTypeFromExtension } from '../utils/mime';

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
        const docCategory = rawHeader.DocCategory || 'BUS2105';
        const headerKey = `/CNMA_PRHEADER(DocCategory='${docCategory}',DocumentNumber='${paddedId}')`;

        // Helper for concurrent sub-entity fetches when not expanded in rawHeader
        const fetchSubEntity = async (propName: string, subPath: string, warnMsg?: string): Promise<any> => {
            if (rawHeader[propName] !== undefined && rawHeader[propName] !== null) {
                return rawHeader[propName];
            }
            try {
                const res: any = await this.sapClient.get(servicePath, `${headerKey}/${subPath}`, { $format: 'json' }, sapUser, userJwt);
                return res?.value || res?.d?.results || res?.d || [];
            } catch (e: any) {
                if (warnMsg) {
                    console.warn(`[PrDetail] ${warnMsg} for ${paddedId}: ${e.message}`);
                }
                return [];
            }
        };

        const [
            rawItems,
            rawSteps,
            rawTexts,
            rawAttachments,
            rawComments,
            rawPurpose,
            rawPaidBy,
            rawBankDetails
        ] = await Promise.all([
            fetchSubEntity('_Item', '_Item', 'Failed to fetch _Item sub-entity'),
            fetchSubEntity('_ApprovalStep', '_ApprovalStep', 'Failed to fetch _ApprovalStep sub-entity'),
            fetchSubEntity('_HeaderText', '_HeaderText'),
            fetchSubEntity('_Attachment', '_Attachment', 'Failed to fetch _Attachment sub-entity'),
            fetchSubEntity('_Comment', '_Comment'),
            fetchSubEntity('_PurposeText', '_PurposeText'),
            fetchSubEntity('_PaidByText', '_PaidByText'),
            fetchSubEntity('_BankDetails', '_BankDetails')
        ]);

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
            releaseText: s.ReleaseText || s.ReleaseCode || '',
            approver: s.ApproverName || '',
            approverUserId: s.ApproverUserId || '',
            status: s.ApprovalStatus || '',
            noteText: s.CommentText || '',
            postedOn: s.CommentDate || '',
            postedTime: s.CommentTime || ''
        }));

        // Normalize attachments from _Attachment navigation property
        const normalizedAttachments = rawAttachments.map((att: any) => {
            const ext = att.FileExtension || '';
            let fileName = att.FileName || '';
            if (ext && !fileName.toLowerCase().endsWith('.' + ext.toLowerCase())) {
                fileName = `${fileName}.${ext}`;
            }
            const mimeType = att.MimeType || att.ContentType || getMimeTypeFromExtension(ext, fileName);
            return {
                id: att.DocId,
                fileName,
                fileDisplayName: att.FileName,
                mimeType,
                fileSize: Number(att.Length || 0),
                createdBy: att.CreatedBy || '',
                createdAt: att.CreatedOnDate && att.CreatedOnTime ? `${att.CreatedOnDate}T${att.CreatedOnTime}` : new Date().toISOString()
            };
        });

        // Derive PR description from first text element or join them
        const prDescription = rawTexts.map((t: any) => t.LongText || '').join('\n').replace(/\n{3,}/g, '\n\n').trim();

        const extractTextFromNav = (raw: unknown): string => {
            if (!raw) return '';
            if (typeof raw === 'string') return raw;
            if (Array.isArray(raw)) {
                return raw.map((item: any) => item?.LongText || item?.Text || item?.Value || '').filter(Boolean).join('\n').trim();
            }
            const item = raw as any;
            return item.LongText || item.Text || item.Value || '';
        };

        const purposeText = extractTextFromNav(rawPurpose) || normalizedHeader.Purpose || normalizedHeader.purpose || '';
        const paidByText = extractTextFromNav(rawPaidBy) || normalizedHeader.PaidBy || normalizedHeader.paidBy || '';
        const bankDetailsText = extractTextFromNav(rawBankDetails) || normalizedHeader.BankDetails || normalizedHeader.bankDetails || '';

        // Normalize comments from _Comment navigation property
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
            purchaseRequisitionText: prDescription || normalizedHeader.PurchaseRequisitionText || normalizedHeader.purchaseRequisitionText || '',
            purpose: purposeText,
            paidBy: paidByText,
            bankDetails: bankDetailsText
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

    async addComment(objectId: string, text: string, sapUser: string, userJwt?: string, type = 'NORM', decision = ''): Promise<void> {
        const isMockMode = process.env.USE_MOCK_SAP !== 'false';
        if (isMockMode) {
            addMockComment(objectId, text, sapUser);
            return;
        }

        const paddedId = objectId.padStart(10, '0');
        const servicePath = ODATA_SERVICES.INSTANCE_LIST.servicePath;
        const relativePath = `/CNMA_PRHEADER(DocCategory='BUS2105',DocumentNumber='${paddedId}')/SAP__self.comment`;

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
