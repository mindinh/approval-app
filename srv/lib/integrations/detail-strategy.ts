import { ObjectTypeCode } from '../processors/object-config';

export interface DetailStrategy {
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
        userJwt?: string,
        type?: string
    ): Promise<void>;

    uploadAttachment?(
        objectId: string,
        fileName: string,
        mimeType: string,
        buffer: Buffer,
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
