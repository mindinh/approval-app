import { describe, it, expect } from 'vitest';
import { Request } from 'express';
import {
  extractJwtFromRequest,
  normalizeBase64Url,
  decodeJwtPayload,
  readStringClaim,
  readNumericClaim,
  summarizeJwtClaims,
  redactToken,
  hasHeaderValue,
  resolveIdentity,
  getSapUser,
  getIdentity
} from '../../../srv/lib/utils/auth-helper';

describe('auth-helper', () => {
  describe('extractJwtFromRequest', () => {
    it('should extract Bearer token from authorization header', () => {
      const req = {
        headers: {
          authorization: 'Bearer my-token-123'
        }
      } as unknown as Request;
      expect(extractJwtFromRequest(req)).toEqual({ token: 'my-token-123', source: 'authorization' });
    });

    it('should extract Bearer token from x-approuter-authorization header', () => {
      const req = {
        headers: {
          'x-approuter-authorization': 'Bearer my-approuter-token'
        }
      } as unknown as Request;
      expect(extractJwtFromRequest(req)).toEqual({ token: 'my-approuter-token', source: 'x-approuter-authorization' });
    });

    it('should extract Bearer token from x-approuter-authorization header if it is an array', () => {
      const req = {
        headers: {
          'x-approuter-authorization': ['Invalid', 'Bearer my-array-token']
        }
      } as unknown as Request;
      expect(extractJwtFromRequest(req)).toEqual({ token: 'my-array-token', source: 'x-approuter-authorization' });
    });

    it('should extract token from x-forwarded-access-token header', () => {
      const req = {
        headers: {
          'x-forwarded-access-token': '  forwarded-token  '
        }
      } as unknown as Request;
      expect(extractJwtFromRequest(req)).toEqual({ token: 'forwarded-token', source: 'x-forwarded-access-token' });
    });

    it('should extract token from x-user-token header', () => {
      const req = {
        headers: {
          'x-user-token': 'user-token'
        }
      } as unknown as Request;
      expect(extractJwtFromRequest(req)).toEqual({ token: 'user-token', source: 'x-user-token' });
    });

    it('should extract token from cds.user jwt field', () => {
      const req = {
        headers: {},
        user: {
          jwt: 'cds-jwt'
        }
      } as unknown as Request;
      expect(extractJwtFromRequest(req)).toEqual({ token: 'cds-jwt', source: 'cds.user.jwt' });
    });

    it('should extract token from cds.user _jwt field as fallback', () => {
      const req = {
        headers: {},
        user: {
          _jwt: 'cds-_jwt'
        }
      } as unknown as Request;
      expect(extractJwtFromRequest(req)).toEqual({ token: 'cds-_jwt', source: 'cds.user._jwt' });
    });

    it('should return source none if no token is found', () => {
      const req = {
        headers: {}
      } as unknown as Request;
      expect(extractJwtFromRequest(req)).toEqual({ source: 'none' });
    });
  });

  describe('normalizeBase64Url', () => {
    it('should replace url-safe characters and add padding', () => {
      // "a-_b" -> "a+/b" (length 4, no padding)
      expect(normalizeBase64Url('a-_b')).toBe('a+/b');
      // "a" (length 1, padding length 3 -> "a===")
      expect(normalizeBase64Url('a')).toBe('a===');
      // "ab" (length 2, padding length 2 -> "ab==")
      expect(normalizeBase64Url('ab')).toBe('ab==');
      // "abc" (length 3, padding length 1 -> "abc=")
      expect(normalizeBase64Url('abc')).toBe('abc=');
    });
  });

  describe('decodeJwtPayload', () => {
    it('should decode a valid JWT payload segment', () => {
      const payload = { user_name: 'john.doe', email: 'john@conarum.com', scope: ['uaa.user'] };
      const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const mockToken = `header.${payloadBase64}.signature`;
      
      expect(decodeJwtPayload(mockToken)).toEqual(payload);
    });

    it('should return undefined for malformed JWT token structure', () => {
      expect(decodeJwtPayload('invalidToken')).toBeUndefined();
    });

    it('should return undefined for invalid base64 content', () => {
      expect(decodeJwtPayload('header.!!!invalidbase64!!!.signature')).toBeUndefined();
    });
  });

  describe('readStringClaim & readNumericClaim', () => {
    it('should safely read string claims', () => {
      const payload = { name: 'Alice', age: 30, empty: '   ' };
      expect(readStringClaim(payload, 'name')).toBe('Alice');
      expect(readStringClaim(payload, 'age')).toBeUndefined();
      expect(readStringClaim(payload, 'empty')).toBeUndefined();
    });

    it('should safely read numeric claims', () => {
      const payload = { exp: 1719876543, name: 'Alice', invalidNum: NaN };
      expect(readNumericClaim(payload, 'exp')).toBe(1719876543);
      expect(readNumericClaim(payload, 'name')).toBeUndefined();
      expect(readNumericClaim(payload, 'invalidNum')).toBeUndefined();
    });
  });

  describe('summarizeJwtClaims', () => {
    it('should extract and map basic claims from JWT payload', () => {
      const payload = {
        sub: 'user-sub-id',
        email: 'alice@example.com',
        user_name: 'alice.username',
        preferred_username: 'alice.preferred',
        client_id: 'client-abc',
        grant_type: 'authorization_code',
        zid: 'tenant-zone-123',
        exp: 1719876543,
        iat: 1719800000,
        scope: ['user', 'admin'],
        aud: ['app-audience']
      };

      const summary = summarizeJwtClaims(payload);
      expect(summary.sub).toBe('user-sub-id');
      expect(summary.email).toBe('alice@example.com');
      expect(summary.userName).toBe('alice.username');
      expect(summary.preferredUsername).toBe('alice.preferred');
      expect(summary.clientId).toBe('client-abc');
      expect(summary.grantType).toBe('authorization_code');
      expect(summary.zoneId).toBe('tenant-zone-123');
      expect(summary.expiresAt).toBe(new Date(1719876543 * 1000).toISOString());
      expect(summary.issuedAt).toBe(new Date(1719800000 * 1000).toISOString());
      expect(summary.scope).toEqual(['user', 'admin']);
      expect(summary.audience).toEqual(['app-audience']);
    });

    it('should normalize scope and audience if they are string types', () => {
      const payload = {
        scope: 'read write',
        aud: 'app-audience'
      };
      const summary = summarizeJwtClaims(payload);
      expect(summary.scope).toEqual(['read', 'write']);
      expect(summary.audience).toEqual(['app-audience']);
    });
  });

  describe('redactToken', () => {
    it('should truncate and redact middle section of long tokens', () => {
      const longToken = 'abcdefghijklmnopqrstuvwxyz1234567890';
      expect(redactToken(longToken)).toBe('abcdefghijkl...yz1234567890');
    });

    it('should return original token if short', () => {
      expect(redactToken('short-token')).toBe('short-token');
    });
  });

  describe('hasHeaderValue', () => {
    it('should check if header value is present', () => {
      expect(hasHeaderValue('valid')).toBe(true);
      expect(hasHeaderValue('  ')).toBe(false);
      expect(hasHeaderValue(undefined)).toBe(false);
      expect(hasHeaderValue(['valid', ' '])).toBe(true);
      expect(hasHeaderValue([' ', ''])).toBe(false);
    });
  });

  describe('resolveIdentity', () => {
    it('should prioritize x-sap-user impersonation header in dev environments', () => {
      const req = {
        headers: {
          'x-sap-user': 'impersonated_user'
        }
      } as unknown as Request;
      const identity = resolveIdentity(req);
      expect(identity.sapUser).toBe('IMPERSONATED_USER');
    });

    it('should read from JWT email/username/sub if no impersonation header is present', () => {
      const payload = { email: 'alice@conarum.com', user_name: 'alice.c' };
      const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const req = {
        headers: {
          authorization: `Bearer header.${payloadBase64}.signature`
        }
      } as unknown as Request;
      
      const identity = resolveIdentity(req);
      expect(identity.sapUser).toBe('ALICE@CONARUM.COM');
      expect(identity.userJwt).toBe(`header.${payloadBase64}.signature`);
    });

    it('should fallback to username if email is missing in JWT', () => {
      const payload = { user_name: 'alice.c' };
      const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const req = {
        headers: {
          authorization: `Bearer header.${payloadBase64}.signature`
        }
      } as unknown as Request;
      
      const identity = resolveIdentity(req);
      expect(identity.sapUser).toBe('ALICE.C');
    });

    it('should fallback to env SAP_TASK_HARDCODED_USER if no headers or JWT are present', () => {
      const prevEnv = process.env.SAP_TASK_HARDCODED_USER;
      process.env.SAP_TASK_HARDCODED_USER = 'fallback_user';
      try {
        const req = { headers: {} } as unknown as Request;
        const identity = resolveIdentity(req);
        expect(identity.sapUser).toBe('FALLBACK_USER');
      } finally {
        process.env.SAP_TASK_HARDCODED_USER = prevEnv;
      }
    });

    it('should fallback to MOCK_USER if no other user identifiers exist', () => {
      const prevEnv = process.env.SAP_TASK_HARDCODED_USER;
      delete process.env.SAP_TASK_HARDCODED_USER;
      try {
        const req = { headers: {} } as unknown as Request;
        const identity = resolveIdentity(req);
        expect(identity.sapUser).toBe('MOCK_USER');
      } finally {
        process.env.SAP_TASK_HARDCODED_USER = prevEnv;
      }
    });
  });

  describe('getSapUser & getIdentity', () => {
    it('should wrap resolveIdentity correctly', () => {
      const req = {
        headers: {
          'x-sap-user': 'super_user'
        }
      } as unknown as Request;
      expect(getSapUser(req)).toBe('SUPER_USER');
      expect(getIdentity('SUPER_USER')).toEqual({
        btpUser: 'SUPER_USER',
        sapUser: 'SUPER_USER',
        isImpersonated: false
      });
    });
  });
});
