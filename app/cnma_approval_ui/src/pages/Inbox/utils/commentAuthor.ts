import type { UserInfo } from '@/services/inbox/inbox.api';
import { resolveSapUsername } from './userIdentity';

/** Login names, email addresses and display names are not SAP comment-author identities. */
export function isCurrentCommentAuthor(author: string | undefined, user?: UserInfo): boolean {
    const identity = author?.trim().toLowerCase();
    const sapUsername = resolveSapUsername(user)?.toLowerCase();
    return Boolean(identity && sapUsername && identity === sapUsername);
}

export function commentAuthorInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : name.trim().slice(0, 2)).toUpperCase();
}
