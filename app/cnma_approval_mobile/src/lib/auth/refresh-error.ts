/**
 * OAuth error codes meaning the refresh token itself is no longer valid (revoked, expired, consent
 * withdrawn). Only these sign the user out; anything else (offline, timeout, Entra 5xx) keeps the stored
 * token so the next attempt can succeed without a new browser sign-in.
 */
const REVOKED_CODES = new Set(['invalid_grant', 'interaction_required', 'login_required', 'consent_required', 'invalid_client', 'unauthorized_client']);

/** True when a refresh failure means "sign in again", false for transient failures. */
export function isRefreshTokenRejected(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    // expo-auth-session TokenError: `code` (and `params.error`) carry the OAuth error code.
    const { code, params } = error as { code?: unknown; params?: { error?: unknown } };
    const value = typeof code === 'string' ? code : typeof params?.error === 'string' ? params.error : '';
    return REVOKED_CODES.has(value.toLowerCase());
}
