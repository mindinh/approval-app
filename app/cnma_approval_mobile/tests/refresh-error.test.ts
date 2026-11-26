import { isRefreshTokenRejected } from '@/lib/auth/refresh-error';

describe('isRefreshTokenRejected', () => {
    it('signs out only when Entra rejects the refresh token', () => {
        expect(isRefreshTokenRejected({ code: 'invalid_grant' })).toBe(true);
        expect(isRefreshTokenRejected({ code: 'INTERACTION_REQUIRED' })).toBe(true);
        expect(isRefreshTokenRejected({ params: { error: 'consent_required' } })).toBe(true);
    });

    it('keeps the session for network and server failures', () => {
        expect(isRefreshTokenRejected(new TypeError('Network request failed'))).toBe(false);
        expect(isRefreshTokenRejected({ code: 'temporarily_unavailable' })).toBe(false);
        expect(isRefreshTokenRejected({ code: 'server_error' })).toBe(false);
        expect(isRefreshTokenRejected(undefined)).toBe(false);
    });
});
