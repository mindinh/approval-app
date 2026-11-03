import type { ObjectTypeModule, ObjectViewDefinition } from '../../core/types';
import { amount, chip, text } from '../../core/fields';
import { RESERVATION_OVERVIEW_FIELDS, RESERVATION_TABLE_COLUMNS } from './reservation.fields';

export const RESERVATION_VIEW: ObjectViewDefinition = {
    cardChips: [
        chip(amount({ value: 'TotalNetAmountLocalCrcy|TotalAmount', currency: 'LocalCurrency|DocumentCurrency', label: 'Total' }), true),
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
        ],
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
            RESERVATION_TABLE_COLUMNS.glAccount,
        ],
    },
};

export const reservationModule: ObjectTypeModule = {
    category: 'RESERVATION',
    label: 'Reservation',
    aliases: ['ZBUS2093', 'BUS2093', 'RE', 'RESV'],
    tone: 'warning',
    resolveView: () => RESERVATION_VIEW,
};
