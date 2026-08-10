import type { RawODataEntity } from '@/services/inbox/inbox.contracts';
import type { VisibilityPredicate } from './renderer.types';

export const when = {
    exists: (field: string): VisibilityPredicate => (record: RawODataEntity) => {
        const val = record?.[field];
        return val !== undefined && val !== null && String(val).trim() !== '';
    },

    eq: (field: string, target: string | number | boolean): VisibilityPredicate => (record: RawODataEntity) => {
        const val = record?.[field];
        return val === target || String(val) === String(target);
    },

    in: (field: string, targets: readonly string[]): VisibilityPredicate => (record: RawODataEntity) => {
        const val = String(record?.[field] || '');
        return targets.includes(val);
    },

    notEq: (field: string, target: string | number | boolean): VisibilityPredicate => (record: RawODataEntity) => {
        const val = record?.[field];
        return val !== target && String(val) !== String(target);
    },

    notEmpty: (field: string): VisibilityPredicate => (record: RawODataEntity) => {
        const val = record?.[field];
        if (Array.isArray(val)) return val.length > 0;
        return val !== undefined && val !== null && String(val).trim() !== '';
    },

    all: (...predicates: VisibilityPredicate[]): VisibilityPredicate => (record: RawODataEntity) => {
        return predicates.every(p => p(record));
    },

    any: (...predicates: VisibilityPredicate[]): VisibilityPredicate => (record: RawODataEntity) => {
        return predicates.some(p => p(record));
    },

    not: (predicate: VisibilityPredicate): VisibilityPredicate => (record: RawODataEntity) => {
        return !predicate(record);
    }
};
