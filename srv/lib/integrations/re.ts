import { BaseRawDetail, RawDetailSource } from './base';
import { AddCommentOptions } from './comment.types';
import { ODATA_SERVICES } from '../processors/odata-config';
import { AppError } from '../utils/error-handler';

export class ReDetail extends BaseRawDetail {
    readonly source: RawDetailSource = {
        objectType: 'RE',
        aliases: ['BUS2093', 'ZBUS2093'],
        entity: 'CNMA_RESVHEADER',
        docCategory: 'ZBUS2093',
        navigations: [
            '_Item',
            '_ApprovalStep',
            '_Comment',
            '_Attachment'
        ]
    } as const;

    async addComment(objectId: string, text: string, sapUser: string, options?: AddCommentOptions): Promise<void> {
        const paddedId = objectId.padStart(10, '0');
        const servicePath = ODATA_SERVICES.INSTANCE_LIST.servicePath;
        const relativePath = `/CNMA_RESVHEADER(DocCategory='ZBUS2093',DocumentNumber='${paddedId}')/SAP__self.comment`;
        const payload = this.buildCommentPayload(text, options);

        await this.sapClient.post(servicePath, relativePath, payload, {}, sapUser, options?.userJwt);
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
