import { describe, it, expect } from 'vitest';
import { parseError } from '@/utils/parseError';

describe('parseError Utility', () => {
    it('should parse SAP backend 500 error with stack trace and sanitize technical message', () => {
        const rawServerError = {
            message: 'Failed to load task detail: Failed to fetch header for PO 4500002229: SAP business/gateway error: Unspecified provider error occurred. See Error Context and Call Stack.',
            statusCode: 500,
            code: 'INTERNAL_ERROR',
            stack: 'at InboxProcessor.getTaskDetail (D:\\learning\\test\\cnma_approval\\srv\\lib\\processors\\inbox-processor.ts:422:19)',
        };

        const result = parseError(rawServerError);

        expect(result.category).toBe('technical');
        expect(result.title).toBe('SAP Backend Error');
        expect(result.message).toContain('SAP backend');
        expect(result.canRetry).toBe(true);
        expect(result.details?.statusCode).toBe(500);
        expect(result.details?.code).toBe('INTERNAL_ERROR');
        expect(result.details?.stack).toContain('InboxProcessor.getTaskDetail');
    });

    it('should classify 403 response as auth error', () => {
        const axios403Error = {
            response: {
                status: 403,
                data: { message: 'Forbidden', code: 'FORBIDDEN' },
            },
        };

        const result = parseError(axios403Error);

        expect(result.category).toBe('auth');
        expect(result.title).toBe('Access Denied');
        expect(result.canRetry).toBe(false);
    });

    it('should classify 404 response as notFound error', () => {
        const axios404Error = {
            response: {
                status: 404,
                data: { message: 'Not Found' },
            },
        };

        const result = parseError(axios404Error);

        expect(result.category).toBe('notFound');
        expect(result.title).toBe('Document Not Found');
        expect(result.canRetry).toBe(false);
    });

    it('should classify ECONNREFUSED as network error', () => {
        const networkErr = {
            code: 'ECONNREFUSED',
            message: 'connect ECONNREFUSED 127.0.0.1:4005',
        };

        const result = parseError(networkErr);

        expect(result.category).toBe('network');
        expect(result.title).toBe('Connection / Gateway Error');
        expect(result.canRetry).toBe(true);
    });

    it('should parse 400 validation error cleanly', () => {
        const validationErr = {
            response: {
                status: 400,
                data: {
                    statusCode: 400,
                    code: 'VALIDATION_ERROR',
                    message: 'Comment is required when rejecting task',
                },
            },
        };

        const result = parseError(validationErr);

        expect(result.category).toBe('business');
        expect(result.title).toBe('Validation Error');
        expect(result.message).toBe('Comment is required when rejecting task');
        expect(result.canRetry).toBe(false);
    });

    it('should parse CAP server error middleware format with nested error object', () => {
        const capServerError = {
            response: {
                status: 500,
                data: {
                    error: {
                        message: 'Failed to load task detail: Failed to fetch header for PO 4500002229: SAP business/gateway error: Unspecified provider error occurred. See Error Context and Call Stack.',
                        code: 'INTERNAL_SERVER_ERROR',
                    },
                },
            },
        };

        const result = parseError(capServerError);

        expect(result.category).toBe('technical');
        expect(result.title).toBe('SAP Backend Error');
        expect(result.message).toContain('SAP backend');
        expect(result.details?.statusCode).toBe(500);
        expect(result.details?.code).toBe('INTERNAL_SERVER_ERROR');
        expect(result.details?.rawMessage).toContain('Unspecified provider error occurred');
    });

    it('should extract primitive string message from nested SAP OData v4 error object', () => {
        const odataV4Error = {
            response: {
                status: 400,
                data: {
                    error: {
                        code: '400',
                        message: {
                            lang: 'en',
                            value: 'Comment text NoteText exceeds maximum allowed length of 1000 characters',
                        },
                    },
                },
            },
        };

        const result = parseError(odataV4Error);

        expect(result.category).toBe('business');
        expect(result.title).toBe('Validation Error');
        expect(typeof result.message).toBe('string');
        expect(result.message).toContain('Comment text NoteText exceeds maximum allowed length');
    });
});
