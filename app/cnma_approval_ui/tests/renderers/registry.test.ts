import { describe, it, expect } from 'vitest';
import {
    EMPTY_VALUE,
    OBJECT_TYPE_MODULES,
    findObjectTypeModule,
    resolveBusinessSectionModel,
    resolveObjectView,
    resolveTaskCardConfigForTask,
} from '@/renderers';
import { amount, codeText, date, excludeColumns, tableCol, text } from '@/renderers/core/fields';
import { getRecordVal } from '@/renderers/core/record';
import type { InboxTask } from '@/services/inbox/inbox.types';
import { UNKNOWN_RECORD, poRecord } from './golden/fixtures';

describe('object type registry', () => {
    it('maps every alias to exactly one module', () => {
        const aliases = OBJECT_TYPE_MODULES.flatMap((m) => m.aliases);
        expect(new Set(aliases).size).toBe(aliases.length);
        for (const module of OBJECT_TYPE_MODULES) {
            for (const alias of module.aliases) expect(findObjectTypeModule(alias)).toBe(module);
        }
    });

    it('matches category codes case-insensitively and rejects unknown codes', () => {
        expect(findObjectTypeModule('bus2012')?.category).toBe('PO');
        expect(findObjectTypeModule('zclaim')?.label).toBe('Claim');
        expect(findObjectTypeModule('ZINVOICE')).toBeUndefined();
        expect(findObjectTypeModule(undefined)).toBeUndefined();
    });

    it('gives each document type a distinct tone', () => {
        expect(Object.fromEntries(OBJECT_TYPE_MODULES.map((m) => [m.category, m.tone]))).toEqual({
            PR: 'primary',
            PO: 'info',
            RESERVATION: 'warning',
            CLAIM: 'success',
        });
    });
});

describe('unknown document types', () => {
    it('shows a readable summary instead of raw OData keys', () => {
        const model = resolveBusinessSectionModel({ businessObject: UNKNOWN_RECORD });
        const fields = model.cards[0].fields;
        expect(fields.map((f) => f.label)).toEqual(['Document Number']);
        expect(fields[0].value).toBe('INV-1');
        expect(JSON.stringify(model)).not.toMatch(/SomeAmount|nested|_Hidden/);
        expect(model.tables).toEqual([]);
    });

    it('uses the default tone and no chips on task cards', () => {
        const config = resolveTaskCardConfigForTask({ instanceId: '1', title: 'x', status: 'READY', objectType: 'ZINVOICE' } as InboxTask);
        expect(config.tone).toBe('primary');
        expect(config.module).toBeUndefined();
        expect(config.chips).toEqual([]);
    });
});

describe('field kinds', () => {
    it('tags header fields so platforms can present them natively', () => {
        const fields = resolveBusinessSectionModel({ businessObject: poRecord('ZNB1') }).cards[0].fields;
        const kindOf = (label: string) => fields.find((f) => f.label === label)?.kind;
        expect(kindOf('PO Number')).toBe('text');
        expect(kindOf('Document Type')).toBe('codeText');
        expect(kindOf('Total')).toBe('amount');
        expect(kindOf('Created On')).toBe('date');
    });

    it('infers column kinds from their configuration', () => {
        expect(tableCol({ key: 'a', header: 'A', code: 'C', text: 'T' }).kind).toBe('codeText');
        expect(tableCol({ key: 'a', header: 'A', value: 'V', currency: 'C' }).kind).toBe('amount');
        expect(tableCol({ key: 'a', header: 'A', value: 'V', unit: 'U' }).kind).toBe('quantity');
        expect(tableCol({ key: 'a', header: 'A', source: 'S' }).kind).toBe('text');
        expect(tableCol({ key: 'a', header: 'A' }).formatter(undefined, {})).toBe(EMPTY_VALUE);
    });
});

describe('field factories', () => {
    it('text() keeps a user-supplied formatter (CLAUDE.md rule)', () => {
        const field = text({ source: 'X', label: 'X', formatter: (_v, record) => `custom:${record.Y}` });
        expect(field.formatter('ignored', { Y: 'y' })).toBe('custom:y');
    });

    it('date() keeps a user-supplied formatter', () => {
        const field = date({ source: 'D', label: 'D', formatter: () => 'custom' });
        expect(field.formatter('2026-01-01', {})).toBe('custom');
    });

    it('amount() defaults the currency to LocalCurrency', () => {
        const model = resolveObjectView(
            { overviewCard: { id: 'c', title: 'c', fields: [amount({ value: 'Net', label: 'Net' })] } },
            { Net: '1500.5', LocalCurrency: 'USD' }
        );
        expect(model.cards[0].fields[0].value).toBe('1,500.5 USD');
    });

    it('excludeColumns derives a subtype column set', () => {
        const cols = [tableCol({ key: 'a', header: 'A', source: 'A' }), tableCol({ key: 'b', header: 'B', source: 'B' })];
        expect(excludeColumns(cols, 'a').map((c) => c.key)).toEqual(['b']);
    });

    it('a new document type needs only a definition (no evaluator changes)', () => {
        const model = resolveObjectView(
            {
                overviewCard: { id: 'contract', title: 'Contract', fields: [text({ source: 'ContractNo', label: 'Contract' }), codeText({ code: 'Vendor', text: 'VendorName', label: 'Vendor' })] },
                lineItemTable: { id: 'contract-items', title: 'Items', sourcePath: '_Item', columns: [tableCol({ key: 'qty', header: 'Qty', value: 'Qty', unit: 'Uom' })] },
            },
            { ContractNo: 'C-1', Vendor: 'V1', VendorName: 'ACME', _Item: [{ Qty: 2, Uom: 'EA' }] }
        );
        expect(model.cards[0].fields.map((f) => f.value)).toEqual(['C-1', 'V1 - ACME']);
        expect(model.tables[0].rows[0].values.qty).toBe('2 EA');
    });
});

describe('getRecordVal', () => {
    it('supports fallbacks, case-insensitive keys and skips empty values', () => {
        const record = { A: '', b: 0, Total: null, total: 5, Name: 'x' };
        expect(getRecordVal(record, 'A|B')).toBe(0);
        expect(getRecordVal(record, 'TOTAL')).toBeUndefined(); // first case-insensitive match (Total) is empty
        expect(getRecordVal(record, 'Missing|name')).toBe('x');
        expect(getRecordVal(null, 'A')).toBeUndefined();
        expect(getRecordVal(record, undefined)).toBeUndefined();
    });

    it('matches the first key in insertion order for case-insensitive lookups', () => {
        expect(getRecordVal({ total: 1, TOTAL: 2 }, 'Total')).toBe(1);
        expect(getRecordVal({ Total: null, total: 5 }, 'Total')).toBeUndefined();
    });
});

describe('line-item table options', () => {
    it('lets a document type override item id keys and the deletion flag', () => {
        const model = resolveObjectView(
            {
                overviewCard: { id: 'c', title: 'c', fields: [] },
                lineItemTable: {
                    id: 't',
                    title: 'Items',
                    sourcePath: '_Item',
                    columns: [tableCol({ key: 'a', header: 'A', source: 'A' })],
                    rowIdKeys: ['LineNo'],
                    deletionFlagPath: 'Cancelled',
                },
            },
            { _Item: [{ LineNo: '7', Cancelled: 'X', LOEKZ: '' }, { ItemNumber: '9', LOEKZ: 'L' }] }
        );
        expect(model.tables[0].rows.map((r) => [r.id, r.isDeleted])).toEqual([['7', true], ['2', false]]);
    });
});
