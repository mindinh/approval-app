import type { ObjectViewDefinition } from '../../core/renderer.types';
import { RESERVATION_OVERVIEW_FIELDS, RESERVATION_TABLE_COLUMNS } from './reservation.fields';
import { text, codeText, amount, chip } from '../../core/fields';

export const RESERVATION_VIEW: ObjectViewDefinition = {
    docCategory: 'ZBUS2093',
    cardConfig: {
        colorKey: 'warning',
        textClass: 'text-warning font-semibold',
        stripeClass: 'before:bg-warning'
    },
    cardChips: [
        chip(amount({ value: 'TotalNetAmountLocalCrcy|TotalAmount|total', currency: 'LocalCurrency|DocumentCurrency|documentCurrency', label: 'Total' }), true),
        chip(text({ source: 'DocumentTypeText', label: 'Type' })),
    ],





    overviewCard: {

        id: 'reservation-summary',
        title: 'Document Summary',
        fields: [
            RESERVATION_OVERVIEW_FIELDS.documentNumber,
            RESERVATION_OVERVIEW_FIELDS.documentType,
            RESERVATION_OVERVIEW_FIELDS.requester,
            RESERVATION_OVERVIEW_FIELDS.creationDate,
            RESERVATION_OVERVIEW_FIELDS.totalAmount,
            RESERVATION_OVERVIEW_FIELDS.plant,
            RESERVATION_OVERVIEW_FIELDS.movementType,
            RESERVATION_OVERVIEW_FIELDS.costCenter,
            RESERVATION_OVERVIEW_FIELDS.releaseStrategyName
        ]
    },
    lineItemTable: {
        id: 'reservation-items',
        title: 'Line Items',
        sourcePath: '_Item',
        columns: [
            RESERVATION_TABLE_COLUMNS.material,
            RESERVATION_TABLE_COLUMNS.materialText,
            RESERVATION_TABLE_COLUMNS.itemText,
            RESERVATION_TABLE_COLUMNS.quantity,
            RESERVATION_TABLE_COLUMNS.cost,
            RESERVATION_TABLE_COLUMNS.value,
            RESERVATION_TABLE_COLUMNS.plant,
            RESERVATION_TABLE_COLUMNS.storageLocation,
            RESERVATION_TABLE_COLUMNS.requirementDate,
            RESERVATION_TABLE_COLUMNS.glAccount
        ]
    }
};
