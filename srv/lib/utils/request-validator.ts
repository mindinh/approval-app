import { AppError } from './error-handler';

/**
 * Lightweight runtime validators used at the controller boundary so malformed
 * bodies produce 400 (Bad Request) instead of 500 (Internal Server Error).
 *
 * We avoid adding a full schema validator (zod / joi) because the BFF only
 * accepts a handful of payloads. These helpers stay small, type-safe, and
 * easy to read.
 */

export function ensureString(value: unknown, fieldName: string, opts?: { maxLength?: number; allowEmpty?: boolean }): string {
    if (typeof value !== 'string') {
        throw new AppError(`Field '${fieldName}' must be a string`, 400);
    }
    if (!opts?.allowEmpty && value.trim() === '') {
        throw new AppError(`Field '${fieldName}' is required`, 400);
    }
    if (opts?.maxLength && value.length > opts.maxLength) {
        throw new AppError(`Field '${fieldName}' exceeds max length of ${opts.maxLength}`, 400);
    }
    return value;
}

export function ensureOptionalString(value: unknown, fieldName: string): string | undefined {
    if (value === undefined || value === null) return undefined;
    if (typeof value !== 'string') {
        throw new AppError(`Field '${fieldName}' must be a string when provided`, 400);
    }
    return value;
}

export function ensureObject(value: unknown, fieldName: string): Record<string, any> {
    if (value === undefined || value === null) return {};
    if (typeof value !== 'object' || Array.isArray(value)) {
        throw new AppError(`Field '${fieldName}' must be an object`, 400);
    }
    return value as Record<string, any>;
}

export function ensureArray(value: unknown, fieldName: string): any[] {
    if (value === undefined || value === null) return [];
    if (!Array.isArray(value)) {
        throw new AppError(`Field '${fieldName}' must be an array`, 400);
    }
    return value;
}
