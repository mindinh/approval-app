import { describe, it, expect } from 'vitest';
import { resolveBusinessSectionModel } from '@/renderers/ObjectView.registry';

describe('Reservation ObjectView', () => {
    it('splits material number and material text into two separate columns', () => {
        const mockReservationData = {
            DocCategory: 'ZBUS2093',
            DocumentNumber: '0000000903',
            _Item: [
                {
                    Material: '30000028',
                    MaterialText: 'A4 Copy Paper',
                    ItemText: 'Urgent request',
                    Quantity: '1',
                    BaseUnit: 'BIC'
                }
            ]
        };

        const sectionModel = resolveBusinessSectionModel(mockReservationData);
        expect(sectionModel.tables).toHaveLength(1);

        const itemTable = sectionModel.tables[0];
        const headers = itemTable.columns.map(c => c.label);
        
        expect(headers[0]).toBe('Material Number');
        expect(headers[1]).toBe('Material Text');
        expect(headers[2]).toBe('ITEM TEXT');

        const firstRow = itemTable.rows[0];
        expect(firstRow.values.material).toBe('30000028');
        expect(firstRow.values.materialText).toBe('A4 Copy Paper');
        expect(firstRow.values.itemText).toBe('Urgent request');
    });
});
