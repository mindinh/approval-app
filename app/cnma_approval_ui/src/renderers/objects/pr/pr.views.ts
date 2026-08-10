import type { ObjectViewDefinition } from '../../core/renderer.types';
import { PR_OVERVIEW_FIELDS, PR_TABLE_COLUMNS } from './pr.fields';

const defaultPrOverviewCard = {
    id: 'pr-summary',
    title: 'Document Summary',
    fields: [
        PR_OVERVIEW_FIELDS.documentNumber,
        PR_OVERVIEW_FIELDS.documentType,
        PR_OVERVIEW_FIELDS.createdByUser,
        PR_OVERVIEW_FIELDS.fundsCenter,
        PR_OVERVIEW_FIELDS.creationDate,
        PR_OVERVIEW_FIELDS.releaseStrategyName,
        PR_OVERVIEW_FIELDS.totalAmount,
        PR_OVERVIEW_FIELDS.companyCode,
        PR_OVERVIEW_FIELDS.headerNote,
        PR_OVERVIEW_FIELDS.purpose,
        PR_OVERVIEW_FIELDS.paidBy,
        PR_OVERVIEW_FIELDS.bankDetails
    ]
};

const standardPrTableColumns = [
    PR_TABLE_COLUMNS.item,
    PR_TABLE_COLUMNS.material,
    PR_TABLE_COLUMNS.shortText,
    PR_TABLE_COLUMNS.quantity,
    PR_TABLE_COLUMNS.valuationPrice,
    PR_TABLE_COLUMNS.totalValue,
    PR_TABLE_COLUMNS.deliveryDate,
    PR_TABLE_COLUMNS.materialGroup,
    PR_TABLE_COLUMNS.plant,
    PR_TABLE_COLUMNS.storageLocation,
    PR_TABLE_COLUMNS.glAccount,
    PR_TABLE_COLUMNS.commitmentItem
];

export const PR_VIEWS: Record<string, ObjectViewDefinition> = {
    ZASS: {
        docCategory: 'BUS2105',
        documentType: 'ZASS',
        overviewCard: defaultPrOverviewCard,
        lineItemTable: {
            id: 'pr-items-zass',
            title: 'Line Items',
            sourcePath: '_Item',
            columns: standardPrTableColumns
        }
    },
    ZEXP: {
        docCategory: 'BUS2105',
        documentType: 'ZEXP',
        overviewCard: defaultPrOverviewCard,
        lineItemTable: {
            id: 'pr-items-zexp',
            title: 'Line Items',
            sourcePath: '_Item',
            columns: standardPrTableColumns
        }
    },
    ZMAK: {
        docCategory: 'BUS2105',
        documentType: 'ZMAK',
        overviewCard: defaultPrOverviewCard,
        lineItemTable: {
            id: 'pr-items-zmak',
            title: 'Line Items',
            sourcePath: '_Item',
            columns: [
                PR_TABLE_COLUMNS.item,
                PR_TABLE_COLUMNS.material,
                PR_TABLE_COLUMNS.shortText,
                PR_TABLE_COLUMNS.quantity,
                PR_TABLE_COLUMNS.valuationPrice,
                PR_TABLE_COLUMNS.totalValue,
                PR_TABLE_COLUMNS.deliveryDate,
                PR_TABLE_COLUMNS.materialGroup,
                PR_TABLE_COLUMNS.plant,
                PR_TABLE_COLUMNS.storageLocation,
                PR_TABLE_COLUMNS.glAccount,
                PR_TABLE_COLUMNS.internalOrder,
                PR_TABLE_COLUMNS.commitmentItem
            ]
        }
    },
    ZNB1: {
        docCategory: 'BUS2105',
        documentType: 'ZNB1',
        overviewCard: defaultPrOverviewCard,
        lineItemTable: {
            id: 'pr-items-znb1',
            title: 'Line Items',
            sourcePath: '_Item',
            columns: standardPrTableColumns
        }
    },
    ZNB2: {
        docCategory: 'BUS2105',
        documentType: 'ZNB2',
        overviewCard: defaultPrOverviewCard,
        lineItemTable: {
            id: 'pr-items-znb2',
            title: 'Line Items',
            sourcePath: '_Item',
            columns: standardPrTableColumns
        }
    },
    ZTOL: {
        docCategory: 'BUS2105',
        documentType: 'ZTOL',
        overviewCard: defaultPrOverviewCard,
        lineItemTable: {
            id: 'pr-items-ztol',
            title: 'Line Items',
            sourcePath: '_Item',
            columns: standardPrTableColumns
        }
    },
    DEFAULT: {
        docCategory: 'BUS2105',
        documentType: 'DEFAULT',
        overviewCard: defaultPrOverviewCard,
        lineItemTable: {
            id: 'pr-items-default',
            title: 'Line Items',
            sourcePath: '_Item',
            columns: standardPrTableColumns
        }
    }
};
