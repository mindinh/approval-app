import { TaggedUser, AddCommentOptions } from './comment.types';
import { ObjectTypeCode } from '../processors/object-config';

export type { TaggedUser, AddCommentOptions, ObjectTypeCode };

export interface ForwardOnHeaderParams {
    taskId: string;
    notetext: string;
    toUser: string;
}

/**
 * Payload for the entity-bound approve/reject actions on the document header.
 * Used by Claim type to push the user's decision comment (zcomment) onto the
 * CNMA_CLAIMHEADER entity. SAP exposes two distinct bound actions
 * (`/SAP__self.approve` and `/SAP__self.reject`) per METADATA.xml — each one
 * takes the same `zcomment` parameter but is invoked separately depending on
 * the user's decision. The decision code itself is also recorded via the
 * `/SAP__self.comment` action so both endpoints must be called for the
 * workflow to advance.
 */
export interface ApproveOnHeaderParams {
    /** 'A' for approve, 'R' for reject (driven by decisionKey from TASKPROCESSING). */
    decision: 'A' | 'R';
    /** Free-text audit comment shown in the claim document history. */
    comment: string;
}

export interface Detail {
    readonly objectType: ObjectTypeCode;

    getDetail(
        objectId: string,
        sapUser: string,
        userJwt?: string,
        headerOnly?: boolean
    ): Promise<any>;

    getDetailBatch?(
        items: Array<{ objectType: string; objectId: string }>,
        sapUser: string,
        userJwt?: string
    ): Promise<Record<string, any>>;

    addComment?(
        objectId: string,
        text: string,
        sapUser: string,
        options?: AddCommentOptions
    ): Promise<void>;

    /**
     * Entity-bound `forward` action on the document header. Only PR (BUS2105) and PO (BUS2012)
     * expose this in METADATA.xml; Reservation/Claim strategies intentionally omit it so the
     * SapOdataAdapter dispatcher rejects unsupported object types.
     */
    forwardOnHeader?(
        objectId: string,
        params: ForwardOnHeaderParams,
        sapUser: string,
        userJwt?: string
    ): Promise<void>;

    /**
     * Entity-bound `approve` action on the document header. Currently only Claim
     * (CNMA_CLAIMHEADER) exposes this in METADATA.xml — PR/PO/Re strategies
     * intentionally omit it so the dispatcher rejects unsupported object types.
     *
     * SAP exposes two distinct bound actions on `CNMA_CLAIMHEADER` —
     * `/SAP__self.approve` and `/SAP__self.reject` — each with its own `zcomment`
     * parameter. Callers must dispatch to the correct one based on the user's
     * decision; the decision code is also recorded separately via
     * `/SAP__self.comment`.
     */
    approveOnHeader?(
        objectId: string,
        params: ApproveOnHeaderParams,
        sapUser: string,
        userJwt?: string
    ): Promise<void>;

    /**
     * Entity-bound `reject` action on the document header. Currently only Claim
     * (CNMA_CLAIMHEADER) exposes this in METADATA.xml — PR/PO/Re strategies
     * intentionally omit it so the dispatcher rejects unsupported object types.
     *
     * Mirror of `approveOnHeader` but POSTs to `/SAP__self.reject` instead.
     * The decision code is also recorded separately via `/SAP__self.comment`.
     */
    rejectOnHeader?(
        objectId: string,
        params: ApproveOnHeaderParams,
        sapUser: string,
        userJwt?: string
    ): Promise<void>;

    fetchAttachmentContent?(
        objectId: string,
        attachId: string,
        sapUser: string,
        userJwt?: string
    ): Promise<{ data: Buffer; contentType: string; fileName: string } | null>;
}
