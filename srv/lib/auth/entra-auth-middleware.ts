import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { EntraTokenError, EntraTokenValidator, isEntraToken } from './entra-token-validator';
import { TokenExchangeError, TokenExchangeService } from './token-exchange-service';
import type { EntraConfig } from './entra-config';

export interface EntraAuthDependencies {
    config: EntraConfig;
    validator: Pick<EntraTokenValidator, 'validate'>;
    exchange: Pick<TokenExchangeService, 'getXsuaaToken'>;
}

const sendError = (res: Response, status: number, code: string, message: string): void => {
    res.status(status).json({ error: { message, code } });
};

/**
 * Accepts Microsoft Entra ID access tokens from the mobile app.
 *
 * Requests whose bearer token is issued by the configured Entra tenant are validated, exchanged for an
 * XSUAA user token, and continue with `Authorization` replaced by that token, so the XSUAA passport
 * strategy, `resolveIdentity()` and principal propagation work unchanged. Any other request (web/XSUAA)
 * passes through untouched.
 */
export const createEntraAuthMiddleware = ({ config, validator, exchange }: EntraAuthDependencies): RequestHandler =>
    async (req: Request, res: Response, next: NextFunction) => {
        const auth = req.headers.authorization;
        if (typeof auth !== 'string' || !auth.startsWith('Bearer ')) return next();
        const token = auth.slice(7).trim();
        if (!token || !isEntraToken(token, config.tenantId)) return next();

        try {
            const claims = await validator.validate(token);
            const xsuaaToken = await exchange.getXsuaaToken(token, claims);
            req.headers.authorization = `Bearer ${xsuaaToken}`;
            // Upstream headers must not override the exchanged token in extractJwtFromRequest().
            delete req.headers['x-approuter-authorization'];
            delete req.headers['x-forwarded-access-token'];
            delete req.headers['x-user-token'];
            next();
        } catch (err) {
            if (err instanceof EntraTokenError) {
                console.warn(`[EntraAuth] Rejected Entra token: ${err.message}`);
                return sendError(res, 401, 'ENTRA_TOKEN_INVALID', 'Invalid or expired access token');
            }
            if (err instanceof TokenExchangeError) {
                console.error(`[EntraAuth] Token exchange failed (${err.step}): ${err.message}`);
                return sendError(res, 401, 'TOKEN_EXCHANGE_FAILED', 'Could not establish an SAP session for this user');
            }
            console.error('[EntraAuth] Unexpected error while validating Entra token:', err instanceof Error ? err.message : err);
            return sendError(res, 503, 'ENTRA_AUTH_UNAVAILABLE', 'Authentication service temporarily unavailable');
        }
    };
