import { generateKeyPairSync, sign } from 'node:crypto';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response } from 'express';
import { loadEntraConfig, type EntraConfig } from '../../../srv/lib/auth/entra-config';
import { EntraTokenError, EntraTokenValidator, isEntraToken } from '../../../srv/lib/auth/entra-token-validator';
import { TokenExchangeError, TokenExchangeService } from '../../../srv/lib/auth/token-exchange-service';
import { createEntraAuthMiddleware } from '../../../srv/lib/auth/entra-auth-middleware';
import { resolveIdentity, isImpersonatedRequest } from '../../../srv/lib/utils/auth-helper';

const TENANT = '64655e8c-1d2b-4423-9240-e6dec2200c76';
const API_CLIENT = '5657705e-1dea-4d2b-b82b-74cb5e83fee5';
const NOW = 1_800_000_000_000;
const nowSeconds = Math.floor(NOW / 1000);

const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'key-1', use: 'sig' };

const b64url = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');

const signToken = (claims: Record<string, unknown>, header: Record<string, unknown> = { alg: 'RS256', kid: 'key-1', typ: 'JWT' }) => {
    const body = `${b64url(header)}.${b64url(claims)}`;
    return `${body}.${sign('RSA-SHA256', Buffer.from(body), privateKey).toString('base64url')}`;
};

const validClaims = (overrides: Record<string, unknown> = {}) => ({
    iss: `https://login.microsoftonline.com/${TENANT}/v2.0`,
    tid: TENANT,
    aud: API_CLIENT,
    oid: 'user-oid-1',
    scp: 'access_as_user',
    exp: nowSeconds + 3600,
    nbf: nowSeconds - 60,
    ...overrides,
});

const unsignedJwt = (claims: Record<string, unknown>) => `${b64url({ alg: 'none' })}.${b64url(claims)}.sig`;

const config: EntraConfig = {
    tenantId: TENANT,
    apiClientId: API_CLIENT,
    clientSecret: 'super-secret',
    samlScope: 'https://proconarum-vj-qas.authentication.ap11.hana.ondemand.com/.default',
    requiredScope: 'access_as_user',
};

const newValidator = (fetchJwks = vi.fn().mockResolvedValue({ keys: [jwk] })) =>
    ({ fetchJwks, validator: new EntraTokenValidator({ tenantId: TENANT, apiClientId: API_CLIENT, requiredScope: 'access_as_user', fetchJwks, now: () => NOW }) });

describe('loadEntraConfig', () => {
    it('reads the user-provided service from VCAP_SERVICES', () => {
        const vcap = { 'user-provided': [{ name: 'cnma-prorequest-s4h-entra', credentials: { ...config, xsuaaTokenAlias: 'alias-1' } }] };
        expect(loadEntraConfig({ VCAP_SERVICES: JSON.stringify(vcap) })).toEqual({ ...config, xsuaaTokenAlias: 'alias-1' });
    });

    it('falls back to ENTRA_* environment variables', () => {
        const result = loadEntraConfig({
            ENTRA_TENANT_ID: TENANT,
            ENTRA_API_CLIENT_ID: API_CLIENT,
            ENTRA_API_CLIENT_SECRET: 'super-secret',
            ENTRA_SAML_SCOPE: config.samlScope,
        });
        expect(result).toEqual({ ...config, xsuaaTokenAlias: undefined });
    });

    it('is disabled when nothing or only part of the configuration is present', () => {
        expect(loadEntraConfig({})).toBeUndefined();
        vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(loadEntraConfig({ ENTRA_TENANT_ID: TENANT })).toBeUndefined();
    });
});

describe('EntraTokenValidator', () => {
    it('accepts a correctly signed token for the API', async () => {
        const { validator } = newValidator();
        await expect(validator.validate(signToken(validClaims()))).resolves.toMatchObject({ oid: 'user-oid-1', tid: TENANT });
    });

    it('accepts the api:// form of the audience', async () => {
        const { validator } = newValidator();
        await expect(validator.validate(signToken(validClaims({ aud: `api://${API_CLIENT}` })))).resolves.toBeTruthy();
    });

    it.each([
        ['another audience', { aud: 'other-api' }, 'audience'],
        ['another issuer', { iss: 'https://login.microsoftonline.com/other/v2.0' }, 'issuer'],
        ['another tenant', { tid: 'other' }, 'tenant'],
        ['an expired token', { exp: nowSeconds - 3600 }, 'expired'],
        ['a missing scope', { scp: 'User.Read' }, 'scope'],
        ['no oid', { oid: undefined }, 'object id'],
    ])('rejects %s', async (_label, overrides, message) => {
        const { validator } = newValidator();
        await expect(validator.validate(signToken(validClaims(overrides)))).rejects.toThrow(new RegExp(message, 'i'));
    });

    it('rejects a tampered signature', async () => {
        const { validator } = newValidator();
        const [header, , signature] = signToken(validClaims()).split('.');
        const tampered = `${header}.${b64url(validClaims({ oid: 'attacker' }))}.${signature}`;
        await expect(validator.validate(tampered)).rejects.toBeInstanceOf(EntraTokenError);
    });

    it('rejects non-RS256 tokens', async () => {
        const { validator } = newValidator();
        await expect(validator.validate(signToken(validClaims(), { alg: 'HS256', kid: 'key-1' }))).rejects.toThrow(/algorithm/);
    });

    it('caches the JWKS and rejects unknown key ids', async () => {
        const { validator, fetchJwks } = newValidator();
        await validator.validate(signToken(validClaims()));
        await validator.validate(signToken(validClaims()));
        await expect(validator.validate(signToken(validClaims(), { alg: 'RS256', kid: 'unknown' }))).rejects.toThrow(/signing key/);
        expect(fetchJwks).toHaveBeenCalledTimes(1);
        expect(fetchJwks).toHaveBeenCalledWith(`https://login.microsoftonline.com/${TENANT}/discovery/v2.0/keys`);
    });

    it('routes only tokens from the configured tenant', () => {
        expect(isEntraToken(unsignedJwt(validClaims()), TENANT)).toBe(true);
        expect(isEntraToken(unsignedJwt({ iss: 'https://proconarum-vj-qas.authentication.ap11.hana.ondemand.com/oauth/token' }), TENANT)).toBe(false);
        expect(isEntraToken('not-a-jwt', TENANT)).toBe(false);
    });
});

describe('TokenExchangeService', () => {
    const xsuaa = { url: 'https://proconarum-vj-qas.authentication.ap11.hana.ondemand.com/', clientid: 'xs-client', clientsecret: 'xs-secret' };
    const xsuaaToken = unsignedJwt({ exp: nowSeconds + 3600, email: 'user@example.com' });
    const claims = { oid: 'user-oid-1', tid: TENANT, exp: nowSeconds + 3600 };

    const okPost = () => vi.fn(async (url: string) =>
        url.includes('login.microsoftonline.com') ? { access_token: 'saml-assertion' } : { access_token: xsuaaToken });

    it('performs OBO for a SAML assertion and redeems it at XSUAA', async () => {
        const postForm = okPost();
        const service = new TokenExchangeService({ entra: config, xsuaa, postForm, now: () => NOW });

        await expect(service.getXsuaaToken('entra-token', claims)).resolves.toBe(xsuaaToken);

        expect(postForm).toHaveBeenNthCalledWith(1, `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`, {
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            client_id: API_CLIENT,
            client_secret: 'super-secret',
            assertion: 'entra-token',
            scope: config.samlScope,
            requested_token_use: 'on_behalf_of',
            requested_token_type: 'urn:ietf:params:oauth:token-type:saml2',
        });
        expect(postForm).toHaveBeenNthCalledWith(
            2,
            'https://proconarum-vj-qas.authentication.ap11.hana.ondemand.com/oauth/token',
            { grant_type: 'urn:ietf:params:oauth:grant-type:saml2-bearer', assertion: 'saml-assertion' },
            { username: 'xs-client', password: 'xs-secret' }
        );
    });

    it('uses the XSUAA token alias endpoint when configured', async () => {
        const postForm = okPost();
        const service = new TokenExchangeService({ entra: { ...config, xsuaaTokenAlias: 'proconarum-vj-qas.cf-ap11' }, xsuaa, postForm, now: () => NOW });
        await service.getXsuaaToken('entra-token', claims);
        expect(postForm.mock.calls[1][0]).toBe('https://proconarum-vj-qas.authentication.ap11.hana.ondemand.com/oauth/token/alias/proconarum-vj-qas.cf-ap11');
    });

    it('caches per user and shares concurrent exchanges', async () => {
        const postForm = okPost();
        const service = new TokenExchangeService({ entra: config, xsuaa, postForm, now: () => NOW });

        await Promise.all([service.getXsuaaToken('t1', claims), service.getXsuaaToken('t2', claims)]);
        await service.getXsuaaToken('t3', claims);
        expect(postForm).toHaveBeenCalledTimes(2);

        await service.getXsuaaToken('t4', { ...claims, oid: 'user-oid-2' });
        expect(postForm).toHaveBeenCalledTimes(4);
    });

    it('re-exchanges once the cached token is about to expire', async () => {
        const postForm = okPost();
        let now = NOW;
        const service = new TokenExchangeService({ entra: config, xsuaa, postForm, now: () => now });
        await service.getXsuaaToken('t1', claims);
        now = NOW + 3600_000 - 30_000;
        await service.getXsuaaToken('t2', claims);
        expect(postForm).toHaveBeenCalledTimes(4);
    });

    it('reports the failing step without leaking secrets', async () => {
        const postForm = vi.fn().mockRejectedValue(new Error('network down'));
        const service = new TokenExchangeService({ entra: config, xsuaa, postForm, now: () => NOW });
        const error = await service.getXsuaaToken('entra-token', claims).catch((e) => e);
        expect(error).toBeInstanceOf(TokenExchangeError);
        expect(error.step).toBe('obo');
        expect(error.message).not.toContain('super-secret');
        expect(error.message).not.toContain('entra-token');
    });
});

describe('createEntraAuthMiddleware', () => {
    const entraToken = unsignedJwt(validClaims());

    const run = async (headers: Record<string, string>, deps: Partial<Parameters<typeof createEntraAuthMiddleware>[0]> = {}) => {
        const validator = { validate: vi.fn().mockResolvedValue(validClaims()) };
        const exchange = { getXsuaaToken: vi.fn().mockResolvedValue('xsuaa-token') };
        const middleware = createEntraAuthMiddleware({ config, validator, exchange, ...deps });
        const req = { headers: { ...headers } } as unknown as Request;
        const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() } as unknown as Response;
        const next = vi.fn();
        await middleware(req, res, next);
        return { req, res, next, validator, exchange };
    };

    beforeEach(() => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('leaves XSUAA (web) requests untouched', async () => {
        const xsuaaJwt = unsignedJwt({ iss: 'https://proconarum-vj-qas.authentication.ap11.hana.ondemand.com/oauth/token' });
        const { req, next, validator } = await run({ authorization: `Bearer ${xsuaaJwt}` });
        expect(next).toHaveBeenCalledOnce();
        expect(validator.validate).not.toHaveBeenCalled();
        expect(req.headers.authorization).toBe(`Bearer ${xsuaaJwt}`);
    });

    it('leaves requests without a bearer token untouched', async () => {
        const { next, validator } = await run({});
        expect(next).toHaveBeenCalledOnce();
        expect(validator.validate).not.toHaveBeenCalled();
    });

    it('replaces an Entra token with the exchanged XSUAA token', async () => {
        const { req, next } = await run({ authorization: `Bearer ${entraToken}`, 'x-forwarded-access-token': 'spoofed' });
        expect(next).toHaveBeenCalledOnce();
        expect(req.headers.authorization).toBe('Bearer xsuaa-token');
        expect(req.headers['x-forwarded-access-token']).toBeUndefined();
    });

    it('answers 401 for an invalid Entra token', async () => {
        const validator = { validate: vi.fn().mockRejectedValue(new EntraTokenError('Token expired')) };
        const { res, next } = await run({ authorization: `Bearer ${entraToken}` }, { validator });
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('answers 401 when the exchange fails', async () => {
        const exchange = { getXsuaaToken: vi.fn().mockRejectedValue(new TokenExchangeError('HTTP 400 invalid_grant', 'obo')) };
        const { res, next } = await run({ authorization: `Bearer ${entraToken}` }, { exchange });
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: { message: expect.any(String), code: 'TOKEN_EXCHANGE_FAILED' } });
    });

    it('answers 503 when the signing keys cannot be fetched', async () => {
        const validator = { validate: vi.fn().mockRejectedValue(new Error('ETIMEDOUT')) };
        const { res } = await run({ authorization: `Bearer ${entraToken}` }, { validator });
        expect(res.status).toHaveBeenCalledWith(503);
    });
});

describe('x-sap-user impersonation', () => {
    const originalEnv = process.env.NODE_ENV;
    afterEach(() => {
        process.env.NODE_ENV = originalEnv;
    });

    it('is ignored in production', () => {
        process.env.NODE_ENV = 'production';
        const req = { headers: { 'x-sap-user': 'boss', authorization: `Bearer ${unsignedJwt({ email: 'me@example.com' })}` } } as unknown as Request;
        expect(resolveIdentity(req).sapUser).toBe('ME@EXAMPLE.COM');
        expect(isImpersonatedRequest(req)).toBe(false);
    });

    it('still works outside production', () => {
        process.env.NODE_ENV = 'development';
        const req = { headers: { 'x-sap-user': 'boss' } } as unknown as Request;
        expect(resolveIdentity(req).sapUser).toBe('BOSS');
        expect(isImpersonatedRequest(req)).toBe(true);
    });
});
