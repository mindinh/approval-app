import { BaseRawDetail, RawDetailSource } from './base';
import { AddCommentOptions } from './comment.types';
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

    async addComment(_objectId: string, _text: string, _sapUser: string, _options?: AddCommentOptions): Promise<void> {
        // Claim comment handling
    }

    async uploadAttachment(_objectId: string, _fileName: string, _mimeType: string, _buffer: Buffer, _sapUser: string, _userJwt?: string): Promise<void> {
        throw new AppError('Attachment upload is disabled for this service.', 405);
    }

    async fetchAttachmentContent(_objectId: string, _attachId: string, _sapUser: string, _userJwt?: string): Promise<{ data: Buffer; contentType: string; fileName: string } | null> {
        return null;
    }
}
