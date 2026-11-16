import { ApiError, pathOf } from '@/lib/api/http-client';
import { shouldRetry } from '@/lib/query/query-client';
import { firstParam } from '@/utils/route-params';

describe('pathOf', () => {
    it('keeps only the path for IT reports (no host, no query values)', () => {
        expect(pathOf('https://bff.example.com/api/tasks/1?search=secret')).toBe('/api/tasks/1');
        expect(pathOf('https://bff.example.com')).toBe('/');
    });
});

describe('serverCode', () => {
    it('reads the BFF error code', () => {
        expect(new ApiError('x', 'UNAUTHORIZED', 401, { error: { code: 'TOKEN_EXCHANGE_FAILED' } }).serverCode).toBe('TOKEN_EXCHANGE_FAILED');
        expect(new ApiError('x', 'HTTP_ERROR', 500, 'plain text').serverCode).toBeUndefined();
    });
});

describe('shouldRetry', () => {
    it('retries timeouts, 5xx, 408 and 429 once', () => {
        expect(shouldRetry(0, new ApiError('x', 'TIMEOUT', 0))).toBe(true);
        expect(shouldRetry(0, new ApiError('x', 'HTTP_ERROR', 503))).toBe(true);
        expect(shouldRetry(0, new ApiError('x', 'HTTP_ERROR', 429))).toBe(true);
        expect(shouldRetry(1, new ApiError('x', 'HTTP_ERROR', 503))).toBe(false);
    });

    it('does not retry offline, auth or other client errors', () => {
        expect(shouldRetry(0, new ApiError('x', 'NETWORK_ERROR', 0))).toBe(false);
        expect(shouldRetry(0, new ApiError('x', 'UNAUTHORIZED', 401))).toBe(false);
        expect(shouldRetry(0, new ApiError('x', 'HTTP_ERROR', 404))).toBe(false);
    });
});

describe('firstParam', () => {
    it('normalizes route params', () => {
        expect(firstParam(' 42 ')).toBe('42');
        expect(firstParam(['1', '2'])).toBe('1');
        expect(firstParam(undefined)).toBe('');
    });
});
