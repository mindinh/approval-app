import { describe, it, expect } from 'vitest';
import { resolveBusinessSectionModel } from '@/renderers/ObjectView.registry';
import { PO_OVERVIEW_FIELDS } from '@/renderers/objects/po/po.fields';

describe('PR & PO Object Type Column Visibility & PO Vendor Formatter', () => {
    describe('PR Column Visibility', () => {
        const createPr = (docType: string) => ({
            DocCategory: 'BUS2105',
            DocumentType: docType,
            DocumentNumber: '1000000001',
            _Item: [
                {
                    PurchaseRequisitionItem: '10',
                    Material: 'MAT-001',
                    PurchaseRequisitionItemText: 'Test Material',
                    GLAccount: '600000',
                    OrderInternalID: 'IO-001'
                }
            ]
        });

        it('removes Matnr (Material Number) for PR ZASS, ZEXP, ZMAK', () => {
            for (const docType of ['ZASS', 'ZEXP', 'ZMAK']) {
                const section = resolveBusinessSectionModel(createPr(docType));
                const headers = section.tables[0].columns.map((c) => c.label);
                expect(headers).not.toContain('Material Number');
            }
        });

        it('removes G/L Account for PR ZNB1, ZNB2', () => {
            for (const docType of ['ZNB1', 'ZNB2']) {
                const section = resolveBusinessSectionModel(createPr(docType));
                const headers = section.tables[0].columns.map((c) => c.label);
                expect(headers).toContain('Material Number');
                expect(headers).not.toContain('G/L Account');
            }
        });

        it('keeps both Material Number and G/L Account for PR ZTOL', () => {
            const section = resolveBusinessSectionModel(createPr('ZTOL'));
            const headers = section.tables[0].columns.map((c) => c.label);
            expect(headers).toContain('Material Number');
            expect(headers).toContain('G/L Account');
        });
    });

    describe('PO Column Visibility', () => {
        const createPo = (docType: string) => ({
            DocCategory: 'BUS2012',
            DocumentType: docType,
            DocumentNumber: '4500000001',
            _Item: [
                {
                    ItemNumber: '10',
                    Material: 'MAT-001',
                    MaterialText: 'Test Item',
                    ReferenceDocumentNumber: '1000000001',
                    GLAccount: '600000'
                }
            ]
        });

        it('removes Matnr (Material Number) for PO ZASS, ZEXP, ZMAK', () => {
            for (const docType of ['ZASS', 'ZEXP', 'ZMAK']) {
                const section = resolveBusinessSectionModel(createPo(docType));
                const headers = section.tables[0].columns.map((c) => c.label);
                expect(headers).not.toContain('Material Number');
                expect(headers).toContain('Reference PR');
                expect(headers).toContain('G/L Account');
            }
        });

        it('removes Reference PR for PO ZCOR', () => {
            const section = resolveBusinessSectionModel(createPo('ZCOR'));
            const headers = section.tables[0].columns.map((c) => c.label);
            expect(headers).toContain('Material Number');
            expect(headers).not.toContain('Reference PR');
            expect(headers).toContain('G/L Account');
        });

        it('removes G/L Account for PO ZNB1, ZNB2', () => {
            for (const docType of ['ZNB1', 'ZNB2']) {
                const section = resolveBusinessSectionModel(createPo(docType));
                const headers = section.tables[0].columns.map((c) => c.label);
                expect(headers).toContain('Material Number');
                expect(headers).toContain('Reference PR');
                expect(headers).not.toContain('G/L Account');
            }
        });

        it('removes both Reference PR and G/L Account for PO ZNBR', () => {
            const section = resolveBusinessSectionModel(createPo('ZNBR'));
            const headers = section.tables[0].columns.map((c) => c.label);
            expect(headers).toContain('Material Number');
            expect(headers).not.toContain('Reference PR');
            expect(headers).not.toContain('G/L Account');
        });

        it('keeps standard columns for PO ZCON and ZTOL', () => {
            for (const docType of ['ZCON', 'ZTOL']) {
                const section = resolveBusinessSectionModel(createPo(docType));
                const headers = section.tables[0].columns.map((c) => c.label);
                expect(headers).toContain('Material Number');
                expect(headers).toContain('Reference PR');
                expect(headers).toContain('G/L Account');
            }
        });
    });

    describe('PO Vendor Formatter', () => {
        const formatter = PO_OVERVIEW_FIELDS.vendor.formatter!;

        it('formats code + " - " + names when both code and names are present', () => {
            const record = {
                Vendor: '100050',
                VendorName: 'Công ty TNHH ABC',
                VendorName2: 'Chi nhánh Hà Nội'
            };
            expect(formatter(undefined, record)).toBe('100050 - Công ty TNHH ABC Chi nhánh Hà Nội');
        });

        it('returns only code when no names are present', () => {
            const record = {
                Vendor: '100050'
            };
            expect(formatter(undefined, record)).toBe('100050');
        });

        it('returns only names when code is missing', () => {
            const record = {
                VendorName: 'Công ty TNHH ABC'
            };
            expect(formatter(undefined, record)).toBe('Công ty TNHH ABC');
        });

        it('returns "-" when neither code nor names are present', () => {
            const record = {};
            expect(formatter(undefined, record)).toBe('-');
        });
    });
});
