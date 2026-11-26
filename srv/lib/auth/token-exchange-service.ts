import axios from 'axios';
import { decodeJwtPayload } from '../utils/auth-helper';
import type { EntraConfig } from './entra-config';
import type { EntraClaims } from './entra-token-validator';

/** Subset of the XSUAA service binding needed for the saml2-bearer grant. */
export interface XsuaaCredentials {
    url: string;
    clientid: string;
    clientsecret: string;
}

export class TokenExchangeError extends Error {
    constructor(message: string, readonly step: 'obo' | 'saml2-bearer') {
        super(message);
        this.name = 'TokenExchangeError';
    }
}

type PostForm = (url: string, form: Record<string, string>, auth?: { username: string; password: string }) => Promise<Record<string, unknown>>;

export interface TokenExchangeOptions {
    entra: EntraConfig;
    xsuaa: XsuaaCredentials;
    /** Posts an x-www-form-urlencoded body and returns the JSON response; injectable for tests. */
    postForm?: PostForm;
    now?: () => number;
}

interface CacheEntry {
    token: string;
    /** Epoch ms after which the token is no longer reused. */
    reuseUntil: number;
}

/** Stop reusing an XSUAA token this long before it expires. */
const EXPIRY_MARGIN_MS = 60_000;
const MAX_CACHE_ENTRIES = 1000;

const defaultPostForm: PostForm = async (url, form, auth) => {
    const response = await axios.post(url, new URLSearchParams(form).toString(), {
        auth,
        timeout: 15_000,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    });
    return response.data;
};

/** Describes an axios/HTTP failure without echoing tokens or secrets. */
const describeFailure = (err: unknown): string => {
    if (axios.isAxiosError(err)) {
        const data = err.response?.data as Record<string, unknown> | undefined;
        const code = typeof data?.error === 'string' ? data.error : undefined;
        const codes = Array.isArray(data?.error_codes) ? ` ${JSON.stringify(data?.error_codes)}` : '';
        // Error descriptions from Entra/XSUAA explain the failure and contain no credentials.
        const description = typeof data?.error_description === 'string' ? ` - ${data.error_description.slice(0, 300)}` : '';
        return `HTTP ${err.response?.status ?? 'n/a'}${code ? ` ${code}` : ''}${codes}${description}`;
    }
    return err instanceof Error ? err.message : String(err);
};

/**
 * Exchanges a validated Entra access token for an XSUAA user token:
 * Entra On-Behalf-Of (SAML 2.0 assertion for the XSUAA Enterprise App) → XSUAA `saml2-bearer` grant.
 *
 * Tokens are cached per Entra user (`tid` + `oid`) until shortly before expiry, and concurrent requests
 * for the same user share a single exchange.
 */
export class TokenExchangeService {
    private readonly cache = new Map<string, CacheEntry>();
    private readonly inFlight = new Map<string, Promise<string>>();
    private readonly postForm: PostForm;
    private readonly now: () => number;

    constructor(private readonly options: TokenExchangeOptions) {
        this.postForm = options.postForm ?? defaultPostForm;
        this.now = options.now ?? Date.now;
    }

    async getXsuaaToken(entraToken: string, claims: EntraClaims): Promise<string> {
        const key = `${claims.tid}:${claims.oid}`;
        const cached = this.cache.get(key);
        if (cached && cached.reuseUntil > this.now()) return cached.token;

        const pending = this.inFlight.get(key);
        if (pending) return pending;

        const exchange = this.exchange(entraToken)
            .then((token) => {
                this.store(key, token);
                return token;
            })
            .finally(() => this.inFlight.delete(key));
        this.inFlight.set(key, exchange);
        return exchange;
    }

    private async exchange(entraToken: string): Promise<string> {
        const assertion = await this.requestSamlAssertion(entraToken);
        return this.requestXsuaaToken(assertion);
    }

    private async requestSamlAssertion(entraToken: string): Promise<string> {
        const { entra } = this.options;
        try {
            const data = await this.postForm(`https://login.microsoftonline.com/${entra.tenantId}/oauth2/v2.0/token`, {
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                client_id: entra.apiClientId,
                client_secret: entra.clientSecret,
                assertion: entraToken,
                scope: entra.samlScope,
                requested_token_use: 'on_behalf_of',
                requested_token_type: 'urn:ietf:params:oauth:token-type:saml2',
            });
            if (typeof data.access_token !== 'string' || !data.access_token) {
                throw new Error('response has no SAML assertion');
            }
            return data.access_token;
        } catch (err) {
            throw new TokenExchangeError(`Entra OBO failed: ${describeFailure(err)}`, 'obo');
        }
    }

    private async requestXsuaaToken(samlAssertion: string): Promise<string> {
        const { xsuaa, entra } = this.options;
        const baseUrl = xsuaa.url.replace(/\/+$/, '');
        const tokenUrl = entra.xsuaaTokenAlias ? `${baseUrl}/oauth/token/alias/${entra.xsuaaTokenAlias}` : `${baseUrl}/oauth/token`;
        try {
            const data = await this.postForm(
                tokenUrl,
                { grant_type: 'urn:ietf:params:oauth:grant-type:saml2-bearer', assertion: samlAssertion },
                { username: xsuaa.clientid, password: xsuaa.clientsecret }
            );
            if (typeof data.access_token !== 'string' || !data.access_token) {
                throw new Error('response has no access token');
            }
            return data.access_token;
        } catch (err) {
            throw new TokenExchangeError(`XSUAA saml2-bearer failed: ${describeFailure(err)}`, 'saml2-bearer');
        }
    }

    private store(key: string, token: string): void {
        const exp = decodeJwtPayload(token)?.exp;
        if (typeof exp !== 'number') return;
        const reuseUntil = exp * 1000 - EXPIRY_MARGIN_MS;
        if (reuseUntil <= this.now()) return;

        if (this.cache.size >= MAX_CACHE_ENTRIES) {
            const now = this.now();
            for (const [cachedKey, entry] of this.cache) {
                if (entry.reuseUntil <= now) this.cache.delete(cachedKey);
            }
            if (this.cache.size >= MAX_CACHE_ENTRIES) {
                const oldestKey = this.cache.keys().next().value;
                if (oldestKey !== undefined) this.cache.delete(oldestKey);
            }
        }
        this.cache.set(key, { token, reuseUntil });
    }
}
