import { describe, expect, it } from 'vitest';
import { resolveSapUsername } from '@/pages/Inbox/utils/userIdentity';

describe('verified SAP username', () => {
    const login = { id: 'CONARUM2', sapUser: 'CONARUM2', displayName: 'Jane Doe', email: 'jane@example.com' };

    it('does not mistake a non-email IAS login for the propagated SAP principal', () => {
        expect(resolveSapUsername(login)).toBeUndefined();
        expect(resolveSapUsername({ ...login, sapUsername: ' CONARUM1 ' })).toBe('CONARUM1');
    });

    it('accepts an explicit local comment writer identity', () => {
        expect(resolveSapUsername({ ...login, commentAuthorId: 'CONARUM3' })).toBe('CONARUM3');
    });

    it.each(['jane@example.com', 'MOCK_USER', 'A B', '<USER>', 'ABCDEFGHIJKLM', ''])('rejects invalid SAP IDs: %s', value => {
        expect(resolveSapUsername({ ...login, sapUsername: value })).toBeUndefined();
    });
});
