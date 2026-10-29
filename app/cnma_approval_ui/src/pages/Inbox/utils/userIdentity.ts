import type { UserInfo } from '@/services/inbox/inbox.api';

/** Only server-verified SAP principals and explicitly configured local writers establish ownership. */
export function resolveSapUsername(user: UserInfo | undefined): string | undefined {
    return [user?.sapUsername, user?.commentAuthorId]
        .map(value => value?.trim())
        .find(value => Boolean(value && value.length <= 12 && !/[@\s<>]/.test(value) && value.toUpperCase() !== 'MOCK_USER'));
}
