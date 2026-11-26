import { ApiError } from '@/lib/api/http-client';
import { freshPending, PENDING_MAX_AGE_MS } from '@/lib/api/pending-decisions';
import { countComments, decisionOutcome, hasComment, isUnknownOutcome, wasNotExecuted } from '@/lib/api/write-outcome';

const open = { decisions: [{ key: '0001' }] } as never;
const closed = { decisions: [] } as never;

describe('isUnknownOutcome', () => {
    it('treats dropped connections, timeouts and server errors as "may have landed"', () => {
        expect(isUnknownOutcome(new ApiError('x', 'NETWORK_ERROR', 0))).toBe(true);
        expect(isUnknownOutcome(new ApiError('x', 'TIMEOUT', 0))).toBe(true);
        expect(isUnknownOutcome(new ApiError('x', 'HTTP_ERROR', 502))).toBe(true);
        expect(isUnknownOutcome(new TypeError('Network request failed'))).toBe(true);
    });

    it('treats client errors as definite', () => {
        expect(isUnknownOutcome(new ApiError('x', 'HTTP_ERROR', 400))).toBe(false);
        expect(isUnknownOutcome(new ApiError('x', 'UNAUTHORIZED', 401))).toBe(false);
    });
});

describe('decisionOutcome', () => {
    it('a 401 never ran, so it is safe to try again', () => {
        expect(wasNotExecuted(new ApiError('x', 'UNAUTHORIZED', 401))).toBe(true);
        expect(decisionOutcome(new ApiError('x', 'UNAUTHORIZED', 401), closed)).toBe('notSent');
    });

    it('timeout + task now closed: the decision went through', () => {
        expect(decisionOutcome(new ApiError('x', 'TIMEOUT', 0), closed)).toBe('sent');
        expect(decisionOutcome(new ApiError('x', 'HTTP_ERROR', 500), closed)).toBe('sent');
    });

    it('SAP refused it and the task is closed: decided elsewhere (e.g. on the web)', () => {
        expect(decisionOutcome(new ApiError('x', 'HTTP_ERROR', 409), closed)).toBe('closedElsewhere');
    });

    it('task still open: not sent, the user may try again', () => {
        expect(decisionOutcome(new ApiError('x', 'TIMEOUT', 0), open)).toBe('notSent');
        expect(decisionOutcome(new ApiError('x', 'HTTP_ERROR', 400), open)).toBe('notSent');
    });

    it('task could not be read: unknown, never resent', () => {
        expect(decisionOutcome(new ApiError('x', 'NETWORK_ERROR', 0), null)).toBe('unknown');
    });
});

describe('hasComment', () => {
    it('finds a comment regardless of spacing and case', () => {
        const fresh = { comments: [{ text: 'Please  attach the  quote' }] } as never;
        expect(hasComment(fresh, 'please attach the quote')).toBe(true);
        expect(hasComment(fresh, 'something else')).toBe(false);
        expect(hasComment(null, 'x')).toBe(false);
    });
});

describe('freshPending', () => {
    it('drops records older than a day', () => {
        const now = 10 * PENDING_MAX_AGE_MS;
        const record = (age: number) => ({ instanceId: String(age), decisionKey: '0001', decisionText: 'Approve', documentId: '1', sentAt: now - age });
        expect(freshPending([record(60_000), record(PENDING_MAX_AGE_MS + 1)], now).map((item) => item.instanceId)).toEqual(['60000']);
    });
});

describe('countComments / hasComment baseline', () => {
    it('an older identical comment does not count as the new one', () => {
        const fresh = { comments: [{ text: 'ok' }, { text: 'OK ' }] } as never;
        expect(countComments([{ text: 'ok' }, { text: 'OK ' }, { text: 'no' }], 'ok')).toBe(2);
        expect(hasComment(fresh, 'ok', 2)).toBe(false);
        expect(hasComment(fresh, 'ok', 1)).toBe(true);
    });
});
