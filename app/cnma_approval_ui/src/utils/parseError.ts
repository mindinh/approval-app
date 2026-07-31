export type ErrorCategory = 'business' | 'technical' | 'network' | 'auth' | 'notFound';

export interface AppErrorDetails {
    statusCode?: number;
    code?: string;
    rawMessage?: string;
    stack?: string;
    timestamp: string;
    path?: string;
}

export interface AppError {
    title: string;
    message: string;
    category: ErrorCategory;
    details?: AppErrorDetails;
    canRetry: boolean;
}

/**
 * Parses raw API, Axios, or JavaScript errors into a clean, structured AppError.
 * Sanitizes technical details (stack traces, server paths) from the main user message
 * while preserving diagnostics for technical support.
 */
export function parseError(error: unknown): AppError {
    const timestamp = new Date().toISOString();

    if (!error) {
        return {
            title: 'Unexpected Error',
            message: 'An unknown error occurred. Please try again.',
            category: 'technical',
            details: { timestamp },
            canRetry: true,
        };
    }

    const errObj = (error || {}) as Record<string, any>;
    const response = errObj.response;
    const responseData = response?.data;

    // Helper to safely extract string message from unknown/nested values
    const extractString = (val: unknown): string | undefined => {
        if (val === undefined || val === null) return undefined;
        if (typeof val === 'string') return val;
        if (typeof val === 'object') {
            const obj = val as Record<string, any>;
            if (typeof obj.value === 'string') return obj.value;
            if (typeof obj.message === 'string') return obj.message;
            if (typeof obj.text === 'string') return obj.text;
            if (obj.message && typeof obj.message === 'object') {
                return extractString(obj.message);
            }
            try {
                return JSON.stringify(val);
            } catch {
                return String(val);
            }
        }
        return String(val);
    };

    const responseErr = responseData?.error;
    const responseErrMsg = extractString(responseErr?.message) || extractString(responseErr);

    // Extract status code & error code
    const statusCode: number | undefined = responseData?.statusCode || response?.status || errObj.statusCode || errObj.status;
    const code: string | undefined = (typeof responseErr === 'object' ? responseErr?.code : undefined) || responseData?.code || errObj.code;
    const rawMessage: string = responseErrMsg || extractString(responseData?.message) || extractString(errObj.message) || extractString(error) || 'Unexpected Error';
    const stack: string | undefined = typeof responseData?.stack === 'string' ? responseData.stack : (typeof errObj.stack === 'string' ? errObj.stack : undefined);

    const details: AppErrorDetails = {
        statusCode,
        code,
        rawMessage,
        stack,
        timestamp,
        path: response?.config?.url || errObj.config?.url,
    };

    // 1. Network / Connection Errors
    const isHtmlResponse = typeof responseData === 'string' && (responseData.includes('<html') || responseData.includes('<!DOCTYPE html>'));

    if (isHtmlResponse || errObj.code === 'ECONNREFUSED' || errObj.message?.includes('Network Error') || errObj.message?.includes('ECONNREFUSED') || (!statusCode && errObj.request)) {
        return {
            title: 'Connection / Gateway Error',
            message: 'Unable to connect to the backend server. Please verify the CAP service is running on port 4005.',
            category: 'network',
            details,
            canRetry: true,
        };
    }

    // 2. Authentication & Authorization Errors (401, 403)
    if (statusCode === 401) {
        return {
            title: 'Session Expired',
            message: 'Your session has expired. Please refresh or log in again.',
            category: 'auth',
            details,
            canRetry: false,
        };
    }

    if (statusCode === 403 || errObj.isForbidden) {
        return {
            title: 'Access Denied',
            message: 'You do not have permission to view or execute actions on this document.',
            category: 'auth',
            details,
            canRetry: false,
        };
    }

    // 3. Not Found (404)
    if (statusCode === 404) {
        return {
            title: 'Document Not Found',
            message: 'The requested document or task could not be found.',
            category: 'notFound',
            details,
            canRetry: false,
        };
    }

    // 4. Business Validation Errors (400)
    if (statusCode === 400 || code === 'VALIDATION_ERROR') {
        const cleanMessage = rawMessage.replace(/AppError:\s*/, '').replace(/\[Server Error Middleware\]\s*/, '');
        return {
            title: 'Validation Error',
            message: cleanMessage || 'The request could not be processed due to invalid data.',
            category: 'business',
            details,
            canRetry: false,
        };
    }

    // 5. Backend System / SAP Gateway Errors (500, 502, 503, 504, INTERNAL_ERROR, INTERNAL_SERVER_ERROR)
    const isSapGatewayError = rawMessage.includes('SAP business/gateway error') || rawMessage.includes('Unspecified provider error');
    
    if ((statusCode && statusCode >= 500) || code === 'INTERNAL_ERROR' || code === 'INTERNAL_SERVER_ERROR' || isSapGatewayError) {
        return {
            title: isSapGatewayError ? 'SAP Backend Error' : 'System Error',
            message: isSapGatewayError
                ? 'The SAP backend encountered an issue processing this request. Technical diagnostics are available for support.'
                : 'The server encountered an unexpected error. Please try again or contact IT support.',
            category: 'technical',
            details,
            canRetry: true,
        };
    }

    // Default fallback
    const fallbackMessage = rawMessage.length < 120 && !rawMessage.includes('\n') && !rawMessage.includes('    at ')
        ? rawMessage
        : 'An unexpected system error occurred.';

    return {
        title: 'Error Encountered',
        message: fallbackMessage,
        category: 'technical',
        details,
        canRetry: true,
    };
}
