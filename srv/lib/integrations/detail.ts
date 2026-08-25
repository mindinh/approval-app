import { TaggedUser, AddCommentOptions } from './comment.types';
import { ObjectTypeCode } from '../processors/object-config';

export type { TaggedUser, AddCommentOptions, ObjectTypeCode };

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

    fetchAttachmentContent?(
        objectId: string,
        attachId: string,
        sapUser: string,
        userJwt?: string
    ): Promise<{ data: Buffer; contentType: string; fileName: string } | null>;
}
