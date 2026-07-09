import { Request } from 'express';

export interface InboxIdentity {
    btpUser: string;
    sapUser: string;
    isImpersonated: boolean;
    userJwt?: string;
}

export const extractJwtFromRequest = (req: Request): { token?: string; source: string } => {
    const auth = req.headers.authorization;
    if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
        const token = auth.slice(7).trim();
        if (token) return { token, source: 'authorization' };
    }

    const approuterAuth = req.headers['x-approuter-authorization'];
    if (typeof approuterAuth === 'string' && approuterAuth.startsWith('Bearer ')) {
        const token = approuterAuth.slice(7).trim();
        if (token) return { token, source: 'x-approuter-authorization' };
    }
    if (Array.isArray(approuterAuth)) {
        const found = approuterAuth.find((v) => typeof v === 'string' && v.startsWith('Bearer '));
        if (found) {
            const token = found.slice(7).trim();
            if (token) return { token, source: 'x-approuter-authorization' };
        }
    }

    const forwarded = req.headers['x-forwarded-access-token'];
    if (typeof forwarded === 'string' && forwarded.trim()) {
        return { token: forwarded.trim(), source: 'x-forwarded-access-token' };
    }

    const xUserToken = req.headers['x-user-token'];
    if (typeof xUserToken === 'string' && xUserToken.trim()) {
        return { token: xUserToken.trim(), source: 'x-user-token' };
    }

    const cdsUser = (req as any).user;
    if (typeof cdsUser?.jwt === 'string' && cdsUser.jwt.trim()) {
        return { token: cdsUser.jwt.trim(), source: 'cds.user.jwt' };
    }
    if (typeof cdsUser?._jwt === 'string' && cdsUser._jwt.trim()) {
        return { token: cdsUser._jwt.trim(), source: 'cds.user._jwt' };
    }

    return { source: 'none' };
};

export const normalizeBase64Url = (base64Url: string): string => {
    const padded = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padLength = (4 - (padded.length % 4)) % 4;
    return `${padded}${'='.repeat(padLength)}`;
};

export const decodeJwtPayload = (token: string): Record<string, unknown> | undefined => {
    const parts = token.split('.');
    if (parts.length < 2) return undefined;
    try {
        const base64 = normalizeBase64Url(parts[1]);
        const json = Buffer.from(base64, 'base64').toString('utf8');
        const payload = JSON.parse(json);
        return payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : undefined;
    } catch {
        return undefined;
    }
};

export const readStringClaim = (payload: Record<string, unknown>, key: string): string | undefined => {
    const value = payload[key];
    return typeof value === 'string' && value.trim() ? value : undefined;
};

export const readNumericClaim = (payload: Record<string, unknown>, key: string): number | undefined => {
    const value = payload[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    return undefined;
};

export const summarizeJwtClaims = (payload: Record<string, unknown>): Record<string, any> => {
    const exp = readNumericClaim(payload, 'exp');
    const iat = readNumericClaim(payload, 'iat');
    const scope = payload.scope;
    const aud = payload.aud;
    return {
        sub: readStringClaim(payload, 'sub'),
        email: readStringClaim(payload, 'email'),
        userName: readStringClaim(payload, 'user_name'),
        preferredUsername: readStringClaim(payload, 'preferred_username'),
        clientId: readStringClaim(payload, 'client_id') || readStringClaim(payload, 'cid') || readStringClaim(payload, 'azp'),
        grantType: readStringClaim(payload, 'grant_type'),
        zoneId: readStringClaim(payload, 'zid'),
        expiresAt: exp ? new Date(exp * 1000).toISOString() : undefined,
        issuedAt: iat ? new Date(iat * 1000).toISOString() : undefined,
        scope: Array.isArray(scope) ? scope : typeof scope === 'string' ? scope.split(' ') : scope,
        audience: Array.isArray(aud) ? aud : typeof aud === 'string' ? [aud] : undefined,
    };
};

export const redactToken = (token: string): string => {
    if (token.length <= 24) return token;
    return `${token.slice(0, 12)}...${token.slice(-12)}`;
};

export const hasHeaderValue = (value: string | string[] | undefined): boolean => {
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.some((entry) => typeof entry === 'string' && entry.trim().length > 0);
    return false;
};

export const resolveIdentity = (req: Request): { sapUser: string; userJwt?: string } => {
    const jwtInfo = extractJwtFromRequest(req);
    const userJwt = jwtInfo.token;
    
    let sapUser = 'MOCK_USER';
    
    // 1. Impersonation header check (dev)
    const headerOverride = req.headers['x-sap-user'];
    if (headerOverride) {
        sapUser = Array.isArray(headerOverride) ? (headerOverride[0] || '').toUpperCase() : String(headerOverride).toUpperCase();
    } else if (userJwt) {
        // 2. Decode JWT to extract user email or user_name
        const payload = decodeJwtPayload(userJwt);
        if (payload) {
            const email = readStringClaim(payload, 'email') || readStringClaim(payload, 'mail');
            const userName = readStringClaim(payload, 'user_name') || readStringClaim(payload, 'preferred_username');
            const sub = readStringClaim(payload, 'sub');
            sapUser = (email || userName || sub || 'MOCK_USER').toUpperCase();
        }
    } else {
        // 3. Fallback to hardcoded user or MOCK_USER
        sapUser = (process.env.SAP_TASK_HARDCODED_USER || 'MOCK_USER').toUpperCase();
    }
    
    return { sapUser, userJwt };
};

export const getSapUser = (req: Request): string => {
    return resolveIdentity(req).sapUser;
};

export const getIdentity = (sapUser: string) => ({
    btpUser: sapUser,
    sapUser,
    isImpersonated: false
});
