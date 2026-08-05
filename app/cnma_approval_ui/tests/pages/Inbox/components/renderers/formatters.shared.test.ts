import { describe, it, expect } from 'vitest';
import { formatCodeWithText, formatMaterialShortText } from '@/renderers/shared/formatters';

describe('formatCodeWithText', () => {
    it('combines code and text when text does not start with code', () => {
        expect(formatCodeWithText('1710', 'Company Code 1710')).toBe('1710 - Company Code 1710');
    });

    it('prevents duplicating code when text already starts with code - description', () => {
        expect(formatCodeWithText('1710', '1710 - Company Code 1710')).toBe('1710 - Company Code 1710');
    });

    it('returns code when text is empty', () => {
        expect(formatCodeWithText('1710', '')).toBe('1710');
        expect(formatCodeWithText('1710', undefined)).toBe('1710');
    });

    it('returns text when code is empty', () => {
        expect(formatCodeWithText(undefined, 'Company Code 1710')).toBe('Company Code 1710');
    });

    it('returns - when both are empty', () => {
        expect(formatCodeWithText(undefined, undefined)).toBe('-');
    });
});

describe('formatMaterialShortText', () => {
    it('returns only the short text description without material number prefix', () => {
        expect(formatMaterialShortText({ material: 'MAT01', shortText: 'Laptop' })).toBe('Laptop');
    });

    it('strips material number prefix when short text starts with material number', () => {
        expect(formatMaterialShortText({ material: 'MAT01', shortText: 'MAT01 - Laptop' })).toBe('Laptop');
        expect(formatMaterialShortText({ material: '40000143', shortText: '40000143 - sữa chua uống vinamilk' })).toBe('sữa chua uống vinamilk');
    });

    it('returns material number when short text is empty', () => {
        expect(formatMaterialShortText({ material: 'MAT01', shortText: '' })).toBe('MAT01');
    });
});
