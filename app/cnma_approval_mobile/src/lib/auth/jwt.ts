/** Claims shown in the app. The token signature is verified by the BFF, never here. */
export interface TokenClaims {
    name?: string;
    preferred_username?: string;
    upn?: string;
    email?: string;
    oid?: string;
    tid?: string;
    aud?: string;
    scp?: string;
    ver?: string;
    exp?: number;
}

function decodeBase64Url(segment: string): string {
    const base64 = segment
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .padEnd(Math.ceil(segment.length / 4) * 4, '=');
    const binary = atob(base64);
    // Decode UTF-8 so Vietnamese names render correctly (TextDecoder is not guaranteed on Hermes).
    const percentEncoded = Array.from(binary, (char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join('');
    return decodeURIComponent(percentEncoded);
}

/** Reads the payload of a JWT for display; returns null for malformed tokens. */
export function decodeJwtClaims(token: string): TokenClaims | null {
    const payload = token.split('.')[1];
    if (!payload) return null;
    try {
        return JSON.parse(decodeBase64Url(payload)) as TokenClaims;
    } catch {
        return null;
    }
}

/** The identity the BFF will see: email, then UPN-style names. */
export function userNameOf(claims: TokenClaims | null): string | undefined {
    return claims?.email || claims?.preferred_username || claims?.upn;
}
