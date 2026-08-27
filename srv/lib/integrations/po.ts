import { BaseRawDetail, RawDetailSource } from './base';
import { AddCommentOptions } from './comment.types';
import { ForwardOnHeaderParams } from './detail';
import { ODATA_SERVICES } from '../processors/odata-config';
import { AppError } from '../utils/error-handler';

export class PoDetail extends BaseRawDetail {
    readonly source: RawDetailSource = {
        objectType: 'PO',
        aliases: ['BUS2012'],
        entity: 'CNMA_POHEADER',
        docCategory: 'BUS2012',
        navigations: [
            '_Item($orderby=ItemNumber asc)',
            '_ApprovalStep',
            '_HeaderText',
            '_HeaderNote',
            '_Attachment',
            '_Comment'
        ]
    } as const;

    async addComment(objectId: string, text: string, sapUser: string, options?: AddCommentOptions): Promise<void> {
        const paddedId = objectId.padStart(10, '0');
        const servicePath = ODATA_SERVICES.INSTANCE_LIST.servicePath;
        const relativePath = `/CNMA_POHEADER(DocCategory='BUS2012',DocumentNumber='${paddedId}')/SAP__self.comment`;
        const payload = this.buildCommentPayload(text, options);

        await this.sapClient.post(servicePath, relativePath, payload, {}, sapUser, options?.userJwt);
    }

    /**
     * Posts the entity-bound `forward` action on the PO header.
     * URL: /CNMA_POHEADER(DocCategory='BUS2012',DocumentNumber='<padded10>')/SAP__self.forward
     * Body: { task_id, notetext, to_user }
     */
    async forwardOnHeader(objectId: string, params: ForwardOnHeaderParams, sapUser: string, userJwt?: string): Promise<void> {
        const paddedId = objectId.padStart(10, '0');
        const servicePath = ODATA_SERVICES.INSTANCE_LIST.servicePath;
        const relativePath = `/CNMA_POHEADER(DocCategory='BUS2012',DocumentNumber='${paddedId}')/SAP__self.forward`;
        const payload = this.buildForwardPayload(params);

        await this.sapClient.post(servicePath, relativePath, payload, {}, sapUser, userJwt);
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
