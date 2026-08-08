import { describe, it, expect } from 'vitest';
import {
    normalizeApprovalStatus,
    isPendingApprovalStatus,
    formatApprovalStatus,
    isSapUserMappingMissing,
    extractErrorMessage,
} from '@/pages/Inbox/utils/predicates';

describe('normalizeApprovalStatus', () => {
    it('returns UNKNOWN for undefined', () => {
        expect(normalizeApprovalStatus(undefined)).toBe('UNKNOWN');
    });

    it('returns UNKNOWN for empty string', () => {
        expect(normalizeApprovalStatus('')).toBe('UNKNOWN');
    });

    it('uppercases the value', () => {
        expect(normalizeApprovalStatus('pending')).toBe('PENDING');
    });

    it('trims whitespace', () => {
        expect(normalizeApprovalStatus('  Approved  ')).toBe('APPROVED');
    });

    it('handles special characters and retains them', () => {
        expect(normalizeApprovalStatus('in-process')).toBe('IN-PROCESS');
        expect(normalizeApprovalStatus('status_ok')).toBe('STATUS_OK');
    });
});

describe('isPendingApprovalStatus', () => {
    it.each(['PENDING', 'IN_PROCESS', 'CURRENT', 'OPEN'])(
        'returns true for %s',
        (status) => {
            expect(isPendingApprovalStatus(status)).toBe(true);
        }
    );

    it.each(['pending', 'in_process', 'current', 'open'])(
        'returns true for lowercase variant %s',
        (status) => {
            expect(isPendingApprovalStatus(status)).toBe(true);
        }
    );

    it('returns false for APPROVED', () => {
        expect(isPendingApprovalStatus('APPROVED')).toBe(false);
    });

    it('returns false for REJECTED', () => {
        expect(isPendingApprovalStatus('REJECTED')).toBe(false);
    });

    it('returns false for undefined', () => {
        expect(isPendingApprovalStatus(undefined)).toBe(false);
    });
    
    it('returns false for unknown statuses', () => {
        expect(isPendingApprovalStatus('COMPLETED')).toBe(false);
        expect(isPendingApprovalStatus('RANDOM_STATUS')).toBe(false);
    });
});

describe('formatApprovalStatus', () => {
    it('returns Unknown for undefined', () => {
        expect(formatApprovalStatus(undefined)).toBe('Unknown');
    });

    it('formats IN_PROCESS to title case', () => {
        expect(formatApprovalStatus('IN_PROCESS')).toBe('In Process');
    });

    it('formats APPROVED correctly', () => {
        expect(formatApprovalStatus('APPROVED')).toBe('Approved');
    });

    it('handles lowercase input', () => {
        expect(formatApprovalStatus('pending')).toBe('Pending');
    });

    it('formats snake_case with multiple underscores correctly', () => {
        expect(formatApprovalStatus('READY_FOR_APPROVAL')).toBe('Ready For Approval');
    });
});

describe('isSapUserMappingMissing', () => {
    it('returns true for the specific error code', () => {
        const error = { response: { data: { code: 'SAP_USER_MAPPING_MISSING' } } };
        expect(isSapUserMappingMissing(error)).toBe(true);
    });

    it('returns false for other error codes', () => {
        const error = { response: { data: { code: 'OTHER_ERROR' } } };
        expect(isSapUserMappingMissing(error)).toBe(false);
    });

    it('returns false for null', () => {
        expect(isSapUserMappingMissing(null)).toBe(false);
    });

    it('returns false for missing response', () => {
        expect(isSapUserMappingMissing({ message: 'fail' })).toBe(false);
    });

    it('returns false when code property is empty', () => {
        expect(isSapUserMappingMissing({ response: { data: {} } })).toBe(false);
    });
});

describe('extractErrorMessage', () => {
    it('prefers response.data.error', () => {
        const error = { response: { data: { error: 'api error' } }, message: 'axios error' };
        expect(extractErrorMessage(error, 'fallback')).toBe('api error');
    });

    it('falls back to message', () => {
        const error = { message: 'network error' };
        expect(extractErrorMessage(error, 'fallback')).toBe('network error');
    });

    it('falls back to the provided string', () => {
        expect(extractErrorMessage(null, 'something went wrong')).toBe('something went wrong');
    });

    it('extracts nested error messages from response if data.error is missing but data.message is present', () => {
        const error = { response: { data: { message: 'nested message' } } };
        expect(extractErrorMessage(error, 'fallback')).toBe('nested message');
    });
});
