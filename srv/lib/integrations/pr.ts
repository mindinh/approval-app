import { BaseRawDetail, RawDetailSource } from './base';
import { ODATA_SERVICES } from '../processors/odata-config';
import { addMockComment, addMockAttachment, getMockAttachmentContent, getMockAttachmentContentById } from './mock-data-provider';
import { AppError } from '../utils/error-handler';

export class PrDetail extends BaseRawDetail {
    readonly source: RawDetailSource = {
        objectType: 'PR',
        aliases: ['BUS2105'],
        entity: 'CNMA_PRHEADER',
        docCategory: 'BUS2105',
        navigations: [
            '_Item($orderby=ItemNumber asc)',
            '_ApprovalStep',
            '_HeaderText',
            '_Attachment',
            '_Comment',
            '_PurposeText',
            '_PaidByText',
            '_BankDetails'
        ]
    } as const;

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
        const isAppr = type === 'APPR';
        const isGeneral = isAppr ? false : true;
        const payload = {
            NoteText: cleanText,
            isGeneral,
            Decision: isAppr ? (decision || 'A') : ''
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
