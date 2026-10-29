import { describe, expect, it } from 'vitest';
import { isCurrentCommentAuthor, commentAuthorInitials } from '@/pages/Inbox/utils/commentAuthor';

describe('comment author identity', () => {
    const user = { id: 'CONARUM2', sapUser: 'CONARUM2', sapUsername: 'CONARUM1', displayName: 'Jane Doe', email: 'jane@example.com' };

    it('matches the verified SAP principal ignoring casing and whitespace', () => {
        expect(isCurrentCommentAuthor(' conarum1 ', user)).toBe(true);
    });

    it.each(['CONARUM2', 'Jane Doe', 'jane@example.com', 'jane', '', undefined])('does not use login identifiers or display names for ownership: %s', author => {
        expect(isCurrentCommentAuthor(author, user)).toBe(false);
    });

    it('waits for verification even when the IAS login matches an author', () => {
        expect(isCurrentCommentAuthor('CONARUM2', { ...user, sapUsername: undefined })).toBe(false);
        expect(isCurrentCommentAuthor('CONARUM1')).toBe(false);
    });

    it('recognizes the explicit local writer when login differs', () => {
        expect(isCurrentCommentAuthor(' conarum3 ', { ...user, sapUsername: undefined, commentAuthorId: 'CONARUM3' })).toBe(true);
    });

    it('uses name initials or a short SAP username', () => {
        expect(commentAuthorInitials(' Jane Ann Doe ')).toBe('JD');
        expect(commentAuthorInitials('CONARUM3')).toBe('CO');
        expect(commentAuthorInitials('')).toBe('');
    });
});
