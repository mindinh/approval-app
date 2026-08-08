import { describe, it, expect } from 'vitest';
import { buildReservationModel, buildDefaultReservationItemsTable } from '@/renderers/modules/reservation/reservation.builder';
import { resolveBusinessSectionModel } from '@/renderers/TaskDetailSections.registry';
import type { TaskDetail } from '@/services/inbox/inbox.types';

describe('Reservation Builder (ZBUS2093)', () => {
    const mockReservationDetail: TaskDetail = {
        objectType: 'ZBUS2093',
        documentId: '0000000883',
        task: {
            instanceId: '0000000883-task',
            title: 'Approve Reservation 0000000883',
            status: 'READY',
            supports: { forward: true, comments: true },
        },
        _meta: {
            objectType: 'ZBUS2093',
            objectId: '0000000883',
        },
        header: {
            DocCategory: 'ZBUS2093',
            DocumentNumber: '0000000883',
            CreatedByUser: 'CONARUM',
            UserName: 'prorequest CONARUM',
            CreationDate: '2026-07-30',
            CreationTime: '14:03:47',
            Plant: '1010',
            PlantName: 'Tổng kho Sài Gòn',
            DocumentType: 'RESV',
            DocumentTypeText: 'Reservation',
            MovementType: 'X27',
            MovementTypeName: 'X CPQL tiếp khách',
            CostCenter: '1001102000',
            CostCenterName: 'Ban Cố Vấn',
            Total: 7285.62,
            Currency: 'VND',
            ReleaseStrategyText: 'Release stategy test',
            _Item: [
                {
                    DocCategory: 'ZBUS2093',
                    DocumentNumber: '883',
                    ItemNumber: '1',
                    Plant: '1010',
                    PlantName: 'Tổng kho Sài Gòn',
                    StorageLocation: '1001',
                    StorageLocationName: 'Kho Chính',
                    Material: '10000003',
                    MaterialText: 'Khoan bê tông Bosh 1000',
                    Quantity: 1,
                    BaseUnit: 'CAI',
                    MovingAveragePrice: 756994,
                    Price: 728562,
                    Currency: 'VND',
                    RequirementDate: '2026-07-30',
                    GLAccount: '6417012000',
                    GLAccountText: 'Chi phí quà tặng, khuyến mãi cho khách hàng',
                    ItemText: 'test1',
                },
            ],
        },
        comments: [],
        attachments: [],
    };

    it('builds Overview fields matching Reservations requirement specification', () => {
        const model = buildReservationModel(mockReservationDetail);

        expect(model.title).toBe('Reservation Details');
        expect(model.subtitle).toBe('Reservation 0000000883');
        expect(model.cards.length).toBe(1);

        const overviewFields = model.cards[0].fields;
        const getFieldVal = (label: string) => overviewFields.find((f) => f.label === label)?.value;

        // Verify exact order and labels from Reservations specification
        const labels = overviewFields.map((f) => f.label);
        expect(labels).toEqual([
            'Document number',
            'Document type',
            'Requester',
            'Created on',
            'Total amount',
            'Plant',
            'Movement type',
            'Cost center',
            'Release Strategy Name',
        ]);

        expect(getFieldVal('Document number')).toBe('0000000883');
        expect(getFieldVal('Document type')).toBe('RESV - Reservation');
        expect(getFieldVal('Requester')).toBe('prorequest CONARUM');
        expect(getFieldVal('Created on')).toBe('30/07/2026 14:03:47');
        expect(getFieldVal('Total amount')).toContain('7,286');
        expect(getFieldVal('Plant')).toBe('1010 - Tổng kho Sài Gòn');
        expect(getFieldVal('Movement type')).toBe('X27 - X CPQL tiếp khách');
        expect(getFieldVal('Cost center')).toBe('1001102000 - Ban Cố Vấn');
        expect(getFieldVal('Release Strategy Name')).toBe('Release stategy test');
    });

    it('builds Line Items table matching Reservations requirement specification', () => {
        const model = buildReservationModel(mockReservationDetail);
        expect(model.tables.length).toBe(1);

        const table = model.tables[0];
        expect(table.title).toBe('Line Items');
        expect(table.rows.length).toBe(1);

        // Verify column labels and order
        const colLabels = table.columns.map((c) => c.label);
        expect(colLabels).toEqual([
            'Material number',
            'Material text',
            'ITEM TEXT',
            'Quantity',
            'Cost (Giá vốn)',
            'Value (Giá trị)',
            'Plant',
            'Storage location',
            'Requirement date',
            'G/L account',
        ]);

        const rowValues = table.rows[0].values;
        expect(rowValues.plant).toBe('1010 - Tổng kho Sài Gòn');
        expect(rowValues.storageLocation).toBe('1001 - Kho Chính');
        expect(rowValues.material).toBe('10000003');
        expect(rowValues.materialText).toBe('Khoan bê tông Bosh 1000');
        expect(rowValues.quantity).toBe('1 CAI');
        expect(rowValues.cost).toContain('756,994');
        expect(rowValues.value).toContain('728,562');
        expect(rowValues.requirementDate).toBe('30/07/2026');
        expect(rowValues.glAccount).toBe('6417012000 - Chi phí quà tặng, khuyến mãi cho khách hàng');
        expect(rowValues.itemText).toBe('test1');
    });

    it('resolves Reservation model automatically in strategy map for ZBUS2093', () => {
        const model = resolveBusinessSectionModel(mockReservationDetail);
        expect(model.title).toBe('Reservation Details');
        expect(model.cards[0].fields.find((f) => f.label === 'Document number')?.value).toBe('0000000883');
    });
});
