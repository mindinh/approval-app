import { describe, it, expect } from 'vitest';
import { resolveBusinessSectionModel } from '@/renderers/ObjectView.registry';

describe('Internal Order Column Visibility for PO & PR', () => {
    it('includes Internal Order column for Marketing PO (ZMAK)', () => {
        const zmakPo = {
            DocCategory: 'BUS2012',
            DocumentType: 'ZMAK',
            DocumentNumber: '4500000001',
            _Item: [
                {
                    ItemNumber: '10',
                    OrderInternalID: '1000234',
                    OrderInternalName: 'Marketing Campaign A'
                }
            ]
        };

        const section = resolveBusinessSectionModel(zmakPo);
        const headers = section.tables[0].columns.map(c => c.label);
        expect(headers).toContain('Internal Order');

        const firstRow = section.tables[0].rows[0];
        expect(firstRow.values.internalOrder).toBe('1000234 - Marketing Campaign A');
    });

    it('does NOT include Internal Order column for non-Marketing PO (e.g. ZNB1)', () => {
        const standardPo = {
            DocCategory: 'BUS2012',
            DocumentType: 'ZNB1',
            DocumentNumber: '4500000002',
            _Item: [
                {
                    ItemNumber: '10',
                    OrderInternalID: '1000234',
                    OrderInternalName: 'Marketing Campaign A'
                }
            ]
        };

        const section = resolveBusinessSectionModel(standardPo);
        const headers = section.tables[0].columns.map(c => c.label);
        expect(headers).not.toContain('Internal Order');
    });

    it('includes Internal Order column for Marketing PR (ZMAK)', () => {
        const zmakPr = {
            DocCategory: 'BUS2105',
            DocumentType: 'ZMAK',
            DocumentNumber: '1000000001',
            _Item: [
                {
                    PurchaseRequisitionItem: '10',
                    OrderInternalID: '1000234',
                    OrderInternalName: 'Marketing Campaign A'
                }
            ]
        };

        const section = resolveBusinessSectionModel(zmakPr);
        const headers = section.tables[0].columns.map(c => c.label);
        expect(headers).toContain('Internal Order');

        const firstRow = section.tables[0].rows[0];
        expect(firstRow.values.internalOrder).toBe('1000234 - Marketing Campaign A');
    });

    it('does NOT include Internal Order column for non-Marketing PR (e.g. ZNB1)', () => {
        const standardPr = {
            DocCategory: 'BUS2105',
            DocumentType: 'ZNB1',
            DocumentNumber: '1000000002',
            _Item: [
                {
                    PurchaseRequisitionItem: '10',
                    OrderInternalID: '1000234',
                    OrderInternalName: 'Marketing Campaign A'
                }
            ]
        };

        const section = resolveBusinessSectionModel(standardPr);
        const headers = section.tables[0].columns.map(c => c.label);
        expect(headers).not.toContain('Internal Order');
    });
});
