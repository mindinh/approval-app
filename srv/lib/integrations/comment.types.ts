import { ObjectTypeCode } from '../processors/object-config';

export interface TaggedUser {
    USERNAME: string;
    EMAIL: string;
}

export interface AddCommentOptions {
    userJwt?: string;
    decision?: string;
    objectType?: ObjectTypeCode | string;
    taskId?: string;
    taggedUsers?: TaggedUser[];
}
