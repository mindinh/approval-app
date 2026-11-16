import { isInThread, type PendingComment } from '@/hooks/mutations/pending-comments';
import { asSapUsername, isOwnAuthor } from '@/utils/comment-author';

describe('comment ownership', () => {
    it('only a SAP user name proves ownership (not the login e-mail)', () => {
        expect(asSapUsername('duy.nguyenanh@conarum.com')).toBeUndefined();
        expect(asSapUsername('MOCK_USER')).toBeUndefined();
        expect(asSapUsername(' conarum1 ')).toBe('CONARUM1');
    });

    it('matches the author case-insensitively', () => {
        expect(isOwnAuthor('CONARUM1', 'CONARUM1')).toBe(true);
        expect(isOwnAuthor('conarum1 ', 'CONARUM1')).toBe(true);
        expect(isOwnAuthor('OTHER', 'CONARUM1')).toBe(false);
        expect(isOwnAuthor('CONARUM1', undefined)).toBe(false);
    });
});

describe('isInThread', () => {
    const local = (status: PendingComment['status'], before = 0): PendingComment => ({ id: 'l1', text: 'Please check', tagged: [], status, createdAt: '', before });

    it('a sent comment is replaced once the thread has one more copy than before', () => {
        expect(isInThread(local('sent'), [{ text: 'please  check' }])).toBe(true);
        expect(isInThread(local('sent', 1), [{ text: 'please check' }])).toBe(false);
    });

    it('a failed or still-sending comment stays visible', () => {
        expect(isInThread(local('failed'), [{ text: 'please check' }])).toBe(false);
        expect(isInThread(local('sending'), [{ text: 'please check' }])).toBe(false);
    });
});
