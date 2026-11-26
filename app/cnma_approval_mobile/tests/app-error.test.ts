import { ApiError } from '@/lib/api/http-client';
import { describeError } from '@/utils/app-error';

describe('describeError', () => {
    it('maps transport failures to plain-language states', () => {
        expect(describeError(new ApiError('x', 'NETWORK_ERROR', 0)).kind).toBe('offline');
        expect(describeError(new ApiError('x', 'TIMEOUT', 0)).kind).toBe('timeout');
        expect(describeError(new TypeError('Network request failed')).kind).toBe('offline');
    });

    it('maps HTTP statuses', () => {
        const kind = (status: number) => describeError(new ApiError('x', 'HTTP_ERROR', status)).kind;
        expect(kind(403)).toBe('forbidden');
        expect(kind(404)).toBe('notFound');
        expect(kind(503)).toBe('unreachable');
        expect(kind(500)).toBe('server');
    });

    it('asks for a new sign-in on 401, but not when SAP rejected the account', () => {
        const expired = describeError(new ApiError('x', 'UNAUTHORIZED', 401));
        expect(expired).toMatchObject({ kind: 'session', needsSignIn: true, code: 'HTTP-401' });

        const sap = describeError(new ApiError('x', 'UNAUTHORIZED', 401, { error: { code: 'TOKEN_EXCHANGE_FAILED' } }));
        expect(sap).toMatchObject({ kind: 'sapLink', needsSignIn: false, code: 'SAP-LINK' });
    });

    it('puts technical details only in the IT report', () => {
        const info = describeError(new ApiError('ECONNRESET at socket', 'HTTP_ERROR', 502, undefined, '/tasks/1'), 'Opening task 1');
        expect(info.message).not.toContain('ECONNRESET');
        expect(info.report).toContain('Code: HTTP-502');
        expect(info.report).toContain('While: Opening task 1');
        expect(info.report).toContain('Endpoint: /tasks/1');
        expect(info.report).toContain('ECONNRESET');
    });
});
