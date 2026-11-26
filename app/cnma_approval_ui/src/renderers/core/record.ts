import type { RawODataEntity } from '@/services/inbox/inbox.contracts';

/**
 * Field lookup over raw OData records.
 *
 * A path may list fallbacks (`'TotalOrderValue|TotalAmount'`); the first non-empty value wins.
 * Each key is tried case-sensitively first, then case-insensitively (first matching key in
 * insertion order). Records are treated as immutable: the lower-case key index is built once
 * per record object and cached.
 */

const pathCache = new Map<string, readonly string[]>();
const keyIndexCache = new WeakMap<object, Map<string, string>>();

function splitPath(path: string): readonly string[] {
    let keys = pathCache.get(path);
    if (!keys) {
        keys = path.split('|').map((k) => k.trim());
        pathCache.set(path, keys);
    }
    return keys;
}

function keyIndex(record: RawODataEntity): Map<string, string> {
    let index = keyIndexCache.get(record);
    if (!index) {
        index = new Map();
        for (const key of Object.keys(record)) {
            const lower = key.toLowerCase();
            if (!index.has(lower)) index.set(lower, key);
        }
        keyIndexCache.set(record, index);
    }
    return index;
}

export function hasValue(value: unknown): boolean {
    return value !== undefined && value !== null && value !== '';
}

function readKey(record: RawODataEntity, key: string): unknown {
    const exact = record[key];
    if (hasValue(exact)) return exact;
    const actualKey = keyIndex(record).get(key.toLowerCase());
    if (actualKey === undefined) return undefined;
    const value = record[actualKey];
    return hasValue(value) ? value : undefined;
}

export function getRecordVal(record: RawODataEntity | null | undefined, path?: string): unknown {
    if (!record || !path || typeof record !== 'object') return undefined;
    for (const key of splitPath(path)) {
        const value = readKey(record, key);
        if (value !== undefined) return value;
    }
    return undefined;
}

/** For code-like fields (currency, unit) that OData delivers as strings. */
export function getRecordCode(record: RawODataEntity | null | undefined, path?: string): string | undefined {
    const value = getRecordVal(record, path);
    return value === undefined ? undefined : String(value);
}
