import { BaseRawDetail, RawDetailSource } from './base';
import { AddCommentOptions } from './comment.types';
import { ODATA_SERVICES } from '../processors/odata-config';
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

    async addComment(objectId: string, text: string, sapUser: string, options?: AddCommentOptions): Promise<void> {
        const paddedId = objectId.padStart(10, '0');
        const servicePath = ODATA_SERVICES.INSTANCE_LIST.servicePath;
        const relativePath = `/CNMA_PRHEADER(DocCategory='BUS2105',DocumentNumber='${paddedId}')/SAP__self.comment`;

        const cleanText = text ? text.trim().substring(0, 255) : '';
        const isDecisionComment = Boolean(options?.decision && options.decision.trim());
        const taskId = options?.taskId ? options.taskId.trim().substring(0, 12) : '';
        const taggedUsers = (options?.taggedUsers || []).map((u) => ({
            USERNAME: String(u.USERNAME || '').trim().substring(0, 12),
            EMAIL: String(u.EMAIL || '').trim().substring(0, 241),
        }));

        const payload = {
            TASKID: taskId,
            NOTETEXT: cleanText,
            ISGENERAL: !isDecisionComment,
            DECISION: isDecisionComment ? options!.decision : '',
            TAGGEDUSER: taggedUsers,
        };

        await this.sapClient.post(servicePath, relativePath, payload, {}, sapUser, options?.userJwt);
    }

    async uploadAttachment(_objectId: string, _fileName: string, _mimeType: string, _buffer: Buffer, _sapUser: string, _userJwt?: string): Promise<void> {
        throw new AppError('Attachment upload is disabled for this service.', 405);
    }

    async fetchAttachmentContent(_objectId: string, attachId: string, sapUser: string, userJwt?: string): Promise<{ data: Buffer; contentType: string; fileName: string } | null> {
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
