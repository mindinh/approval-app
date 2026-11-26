import { createPublicKey, verify as verifySignature, type JsonWebKeyInput, type KeyObject } from 'node:crypto';
import axios from 'axios';
import { decodeJwtPayload, normalizeBase64Url } from '../utils/auth-helper';

/** Validated claims of a Microsoft Entra ID v2.0 access token. */
export interface EntraClaims {
    oid: string;
    tid: string;
    exp: number;
    [claim: string]: unknown;
}

export class EntraTokenError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'EntraTokenError';
    }
}

export interface EntraValidatorOptions {
    tenantId: string;
    apiClientId: string;
    requiredScope: string;
    /** Fetches the tenant's JWKS document; injectable for tests. */
    fetchJwks?: (url: string) => Promise<{ keys: Array<JsonWebKeyInput['key'] & { kid?: string }> }>;
    now?: () => number;
}

const CLOCK_SKEW_SECONDS = 300;
const JWKS_TTL_MS = 12 * 60 * 60 * 1000;
/** Minimum delay between JWKS refreshes triggered by an unknown `kid`. */
const JWKS_MISS_REFRESH_MS = 5 * 60 * 1000;

const defaultFetchJwks = async (url: string) => (await axios.get(url, { timeout: 10_000 })).data;

export const entraIssuer = (tenantId: string): string => `https://login.microsoftonline.com/${tenantId}/v2.0`;

/** True when the (unverified) token claims to be issued by the given Entra tenant. Used only for routing. */
export const isEntraToken = (token: string, tenantId: string): boolean => {
    const payload = decodeJwtPayload(token);
    return payload?.iss === entraIssuer(tenantId);
};

const decodeSegment = (segment: string): Record<string, unknown> => {
    try {
        return JSON.parse(Buffer.from(normalizeBase64Url(segment), 'base64').toString('utf8'));
    } catch {
        throw new EntraTokenError('Malformed token');
    }
};

/**
 * Validates Entra ID v2.0 access tokens issued for the CNMA Approval API: RS256 signature against the
 * tenant JWKS, issuer, tenant, audience, lifetime and delegated scope.
 */
export class EntraTokenValidator {
    private keys = new Map<string, KeyObject>();
    private keysFetchedAt = 0;
    private keysInFlight?: Promise<void>;
    private readonly fetchJwks;
    private readonly now;
    private readonly issuer;
    private readonly audiences;
    private readonly jwksUrl;

    constructor(private readonly options: EntraValidatorOptions) {
        this.fetchJwks = options.fetchJwks ?? defaultFetchJwks;
        this.now = options.now ?? Date.now;
        this.issuer = entraIssuer(options.tenantId);
        this.audiences = new Set([options.apiClientId, `api://${options.apiClientId}`]);
        this.jwksUrl = `https://login.microsoftonline.com/${options.tenantId}/discovery/v2.0/keys`;
    }

    async validate(token: string): Promise<EntraClaims> {
        const parts = token.split('.');
        if (parts.length !== 3) throw new EntraTokenError('Malformed token');
        const [headerSegment, payloadSegment, signatureSegment] = parts;
        const header = decodeSegment(headerSegment);
        const payload = decodeSegment(payloadSegment);

        if (header.alg !== 'RS256') throw new EntraTokenError('Unsupported token algorithm');
        if (typeof header.kid !== 'string') throw new EntraTokenError('Token has no key id');

        const key = await this.getKey(header.kid);
        const signature = Buffer.from(normalizeBase64Url(signatureSegment), 'base64');
        const signedData = Buffer.from(`${headerSegment}.${payloadSegment}`);
        if (!verifySignature('RSA-SHA256', signedData, key, signature)) {
            throw new EntraTokenError('Invalid token signature');
        }

        if (payload.iss !== this.issuer) throw new EntraTokenError('Unexpected token issuer');
        if (payload.tid !== this.options.tenantId) throw new EntraTokenError('Unexpected tenant');
        if (typeof payload.aud !== 'string' || !this.audiences.has(payload.aud)) {
            throw new EntraTokenError('Unexpected token audience');
        }

        const nowSeconds = Math.floor(this.now() / 1000);
        if (typeof payload.exp !== 'number' || payload.exp + CLOCK_SKEW_SECONDS < nowSeconds) {
            throw new EntraTokenError('Token expired');
        }
        if (typeof payload.nbf === 'number' && payload.nbf - CLOCK_SKEW_SECONDS > nowSeconds) {
            throw new EntraTokenError('Token not yet valid');
        }

        const scopes = typeof payload.scp === 'string' ? payload.scp.split(' ') : [];
        if (!scopes.includes(this.options.requiredScope)) throw new EntraTokenError('Missing required scope');
        if (typeof payload.oid !== 'string' || !payload.oid) throw new EntraTokenError('Token has no user object id');

        return payload as EntraClaims;
    }

    private async getKey(kid: string): Promise<KeyObject> {
        const elapsed = this.now() - this.keysFetchedAt;
        const stale = elapsed > JWKS_TTL_MS;
        const unknownKid = !this.keys.has(kid) && elapsed > JWKS_MISS_REFRESH_MS;
        if (stale || unknownKid) await this.refreshKeys();

        const key = this.keys.get(kid);
        if (!key) throw new EntraTokenError('Unknown token signing key');
        return key;
    }

    private refreshKeys(): Promise<void> {
        this.keysInFlight ??= (async () => {
            try {
                const jwks = await this.fetchJwks(this.jwksUrl);
                const keys = new Map<string, KeyObject>();
                for (const jwk of jwks.keys ?? []) {
                    if (jwk.kty === 'RSA' && typeof jwk.kid === 'string') {
                        keys.set(jwk.kid, createPublicKey({ key: jwk, format: 'jwk' }));
                    }
                }
                this.keys = keys;
                this.keysFetchedAt = this.now();
            } finally {
                this.keysInFlight = undefined;
            }
        })();
        return this.keysInFlight;
    }
}
