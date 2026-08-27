import { BaseRawDetail, RawDetailSource } from './base';
import { AddCommentOptions } from './comment.types';
import { ApproveOnHeaderParams } from './detail';
import { ODATA_SERVICES } from '../processors/odata-config';
import { AppError } from '../utils/error-handler';

export class ClaimDetail extends BaseRawDetail {
    readonly source: RawDetailSource = {
        objectType: 'CLAIM',
        aliases: ['CLAIM'],
        entity: 'CNMA_CLAIMHEADER',
        docCategory: 'CLAIM',
        navigations: [
            '_Item',
            '_ApprovalStep',
            '_Comment',
            '_Attachment'
        ]
    } as const;

    async addComment(objectId: string, text: string, sapUser: string, options?: AddCommentOptions): Promise<void> {
        const paddedId = this.padDocumentId(objectId);
        const servicePath = ODATA_SERVICES.INSTANCE_LIST.servicePath;
        const relativePath = `/CNMA_CLAIMHEADER(DocCategory='CLAIM',DocumentNumber='${paddedId}')/SAP__self.comment`;
        const payload = this.buildCommentPayload(text, options);

        await this.sapClient.post(servicePath, relativePath, payload, {}, sapUser, options?.userJwt);
    }

    /**
     * Posts the entity-bound `approve` action on the Claim header.
     *
     * URL: POST /CNMA_CLAIMHEADER(DocCategory='CLAIM',DocumentNumber='<padded10>')/SAP__self.approve?sap-language=en&sap-client=300
     * Body: { zcomment: "<user comment>" }
     *
     * SAP exposes two distinct bound actions on `CNMA_CLAIMHEADER` —
     * `/SAP__self.approve` and `/SAP__self.reject` — so callers must dispatch to
     * the correct one. The decision code itself is also recorded separately via
     * `/SAP__self.comment` so both endpoints must be called for the workflow to
     * advance. The `zcomment` field carries the user's free-text audit note.
     */
    async approveOnHeader(objectId: string, params: ApproveOnHeaderParams, sapUser: string, userJwt?: string): Promise<void> {
        const paddedId = this.padDocumentId(objectId);
        const servicePath = ODATA_SERVICES.INSTANCE_LIST.servicePath;
        const relativePath = `/CNMA_CLAIMHEADER(DocCategory='CLAIM',DocumentNumber='${paddedId}')/SAP__self.approve`;
        const cleanComment = (params.comment || '').trim().substring(0, 255);
        const payload = { zcomment: cleanComment };

        await this.sapClient.post(servicePath, relativePath, payload, {}, sapUser, userJwt);
    }

    /**
     * Posts the entity-bound `reject` action on the Claim header.
     *
     * URL: POST /CNMA_CLAIMHEADER(DocCategory='CLAIM',DocumentNumber='<padded10>')/SAP__self.reject?sap-language=en&sap-client=300
     * Body: { zcomment: "<user comment>" }
     *
     * Mirror of `approveOnHeader` — separate SAP endpoint per METADATA.xml.
     * The decision code is also recorded separately via `/SAP__self.comment`.
     */
    async rejectOnHeader(objectId: string, params: ApproveOnHeaderParams, sapUser: string, userJwt?: string): Promise<void> {
        const paddedId = this.padDocumentId(objectId);
        const servicePath = ODATA_SERVICES.INSTANCE_LIST.servicePath;
        const relativePath = `/CNMA_CLAIMHEADER(DocCategory='CLAIM',DocumentNumber='${paddedId}')/SAP__self.reject`;
        const cleanComment = (params.comment || '').trim().substring(0, 255);
        const payload = { zcomment: cleanComment };

        await this.sapClient.post(servicePath, relativePath, payload, {}, sapUser, userJwt);
    }

    async fetchAttachmentContent(objectId: string, attachId: string, sapUser: string, userJwt?: string): Promise<{ data: Buffer; contentType: string; fileName: string } | null> {
        const paddedId = this.padDocumentId(objectId);
        const cleanDocId = attachId.replace(/^guid'|['']/gi, '');
        const servicePath = ODATA_SERVICES.INSTANCE_LIST.servicePath;
        const relativePath = `/CNMA_CLAIM_ATTA(DocCategory='CLAIM',DocumentNumber='${paddedId}',Docid=${cleanDocId})/Content`;
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

