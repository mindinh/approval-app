import { BaseRawDetail, RawDetailSource } from './base';
import { addMockComment, addMockAttachment, getMockAttachmentContent, getMockAttachmentContentById } from './mock-data-provider';
import { AppError } from '../utils/error-handler';

export class ClaimDetail extends BaseRawDetail {
    readonly source: RawDetailSource = {
        objectType: 'CLAIM',
        aliases: ['ZCLAIM'],
        entity: 'CNMA_CLAIMHEADER',
        docCategory: 'ZCLAIM',
        navigations: [
            '_Item',
            '_ApprovalStep',
            '_Comment',
            '_Attachment'
        ]
    } as const;

    async addComment(objectId: string, text: string, sapUser: string, userJwt?: string, type = 'NORM', decision = ''): Promise<void> {
        const isMockMode = process.env.USE_MOCK_SAP !== 'false';
        if (isMockMode) {
            addMockComment(objectId, text, sapUser);
            return;
        }
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
        return null;
    }
}
