import { describe, it, expect } from 'vitest';
import { buildPrZnb1ItemsTable, buildPrZnb2ItemsTable } from '@/renderers/modules/pr/subtypes';
import { buildPrZassItemsTable } from '@/renderers/modules/pr/subtypes/pr.zass';

describe('PR Subtypes G/L Account Column Hiding Rule', () => {
    describe('ZNB1 Subtype Table Builder', () => {
        it('omits G/L Account column when code and text are null/empty for all items', () => {
            const rawItems = [
                { item: '10', material: 'MAT01', glAccount: null, glAccountName: '' },
                { item: '20', material: 'MAT02', glAccount: undefined, glAccountText: null }
            ];
            const table = buildPrZnb1ItemsTable(rawItems);
            expect(table).not.toBeNull();
            const colKeys = table!.columns.map((c) => c.key);
            expect(colKeys).not.toContain('glAccount');
        });

        it('includes G/L Account column when at least one item has a code or text', () => {
            const rawItems = [
                { item: '10', material: 'MAT01', glAccount: '400000', glAccountName: 'Sales Revenue' },
                { item: '20', material: 'MAT02', glAccount: null, glAccountText: null }
            ];
            const table = buildPrZnb1ItemsTable(rawItems);
            expect(table).not.toBeNull();
            const colKeys = table!.columns.map((c) => c.key);
            expect(colKeys).toContain('glAccount');
        });
    });

    describe('ZNB2 Subtype Table Builder', () => {
        it('omits G/L Account column when code and text are null/empty for all items', () => {
            const rawItems = [
                { item: '10', material: 'MAT01', glAccount: '', glAccountName: null }
            ];
            const table = buildPrZnb2ItemsTable(rawItems);
            expect(table).not.toBeNull();
            const colKeys = table!.columns.map((c) => c.key);
            expect(colKeys).not.toContain('glAccount');
        });

        it('includes G/L Account column when item has glAccount code', () => {
            const rawItems = [
                { item: '10', material: 'MAT01', glAccount: '600000', glAccountName: '' }
            ];
            const table = buildPrZnb2ItemsTable(rawItems);
            expect(table).not.toBeNull();
            const colKeys = table!.columns.map((c) => c.key);
            expect(colKeys).toContain('glAccount');
        });
    });

    describe('Other PR Subtypes (e.g. ZASS)', () => {
        it('always includes G/L Account column even if code and text are null', () => {
            const rawItems = [
                { item: '10', material: 'MAT01', glAccount: null, glAccountName: null }
            ];
            const table = buildPrZassItemsTable(rawItems);
            expect(table).not.toBeNull();
            const colKeys = table!.columns.map((c) => c.key);
            expect(colKeys).toContain('glAccount');
            expect(table!.rows[0].values.glAccount).toBe('-');
        });
    });
});
