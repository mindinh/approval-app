/**
 * Comment ownership, same rules as the web (pages/Inbox/utils/userIdentity.ts): SAP writes the author as
 * the SAP user name (e.g. CONARUM1), while /tasks/me usually carries the login e-mail, so only a value that
 * looks like a SAP user name (max 12 characters, no @, spaces or tags) can prove ownership.
 */
export function asSapUsername(value: string | undefined | null): string | undefined {
    const trimmed = value?.trim();
    if (!trimmed || trimmed.length > 12 || /[@\s<>]/.test(trimmed) || trimmed.toUpperCase() === 'MOCK_USER') return undefined;
    return trimmed.toUpperCase();
}

/** Whether a comment author is the signed-in user (unknown user: nothing is "own"). */
export function isOwnAuthor(author: string, sapUsername: string | undefined): boolean {
    return Boolean(sapUsername) && author.trim().toUpperCase() === sapUsername;
}
