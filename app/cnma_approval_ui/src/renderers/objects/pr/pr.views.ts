import type { ObjectViewDefinition, TaskCardStyleConfig } from '../../core/renderer.types';
import { PR_OVERVIEW_FIELDS, PR_TABLE_COLUMNS } from './pr.fields';
import { text, codeText, amount, chip } from '../../core/fields';

const standardPrCardConfig: TaskCardStyleConfig = {
    colorKey: 'primary',
    textClass: 'text-primary font-semibold',
    stripeClass: 'before:bg-primary'
};

const standardPrCardChips = [
    chip(amount({ value: 'TotalNetAmountLocalCrcy|TotalNetAmount|totalNetAmount|TotalOrderValue|total', currency: 'LocalCurrency|DisplayCurrency|displayCurrency|DocumentCurrency', label: 'Total' }), true),
    chip(text({ source: 'DocumentTypeText|doctyp_desc|PurchaseRequisitionTypeText|purchaseRequisitionTypeText|documentTypeDisplay|DocumentType|PurchaseRequisitionType|purchaseRequisitionType', label: 'Type' })),
];









const defaultPrOverviewCard = {
    id: 'pr-summary',
    title: 'Document Summary',
    fields: [
        PR_OVERVIEW_FIELDS.documentNumber,
        PR_OVERVIEW_FIELDS.documentType,
        PR_OVERVIEW_FIELDS.createdByUser,
        PR_OVERVIEW_FIELDS.fundsCenter,
        PR_OVERVIEW_FIELDS.creationDate,
        // PR_OVERVIEW_FIELDS.releaseStrategyName,
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

/** Helper to exclude specific columns from the standard set declaratively */
function excludeColumns(base: typeof standardPrTableColumns, ...keysToExclude: string[]) {
    return base.filter((col) => !keysToExclude.includes(col.key));
}

// ZASS, ZEXP: Matnr (material) removed per requirements
const prColumnsNoMaterial = excludeColumns(standardPrTableColumns, 'material');

// ZNB1, ZNB2: G/L account removed per requirements
const prColumnsNoGlAccount = excludeColumns(standardPrTableColumns, 'glAccount');

export const PR_VIEWS: Record<string, ObjectViewDefinition> = {
    ZASS: {
        docCategory: 'BUS2105',
        documentType: 'ZASS',
        cardConfig: standardPrCardConfig,
        cardChips: standardPrCardChips,
        overviewCard: defaultPrOverviewCard,
        lineItemTable: {
            id: 'pr-items-zass',
            title: 'Line Items',
            sourcePath: '_Item',
            columns: prColumnsNoMaterial
        }
    },
    ZEXP: {
        docCategory: 'BUS2105',
        documentType: 'ZEXP',
        cardConfig: standardPrCardConfig,
        cardChips: standardPrCardChips,
        overviewCard: defaultPrOverviewCard,
        lineItemTable: {
            id: 'pr-items-zexp',
            title: 'Line Items',
            sourcePath: '_Item',
            columns: prColumnsNoMaterial
        }
    },
    ZMAK: {
        docCategory: 'BUS2105',
        documentType: 'ZMAK',
        cardConfig: standardPrCardConfig,
        cardChips: standardPrCardChips,
        overviewCard: defaultPrOverviewCard,
        lineItemTable: {
            id: 'pr-items-zmak',
            title: 'Line Items',
            sourcePath: '_Item',
            columns: [
                ...excludeColumns(standardPrTableColumns, 'material').filter(c => c.key !== 'commitmentItem'),
                PR_TABLE_COLUMNS.internalOrder,
                PR_TABLE_COLUMNS.commitmentItem
            ]
        }
    },
    ZNB1: {
        docCategory: 'BUS2105',
        documentType: 'ZNB1',
        cardConfig: standardPrCardConfig,
        cardChips: standardPrCardChips,
        overviewCard: defaultPrOverviewCard,
        lineItemTable: {
            id: 'pr-items-znb1',
            title: 'Line Items',
            sourcePath: '_Item',
            columns: prColumnsNoGlAccount
        }
    },
    ZNB2: {
        docCategory: 'BUS2105',
        documentType: 'ZNB2',
        cardConfig: standardPrCardConfig,
        cardChips: standardPrCardChips,
        overviewCard: defaultPrOverviewCard,
        lineItemTable: {
            id: 'pr-items-znb2',
            title: 'Line Items',
            sourcePath: '_Item',
            columns: prColumnsNoGlAccount
        }
    },
    ZTOL: {
        docCategory: 'BUS2105',
        documentType: 'ZTOL',
        cardConfig: standardPrCardConfig,
        cardChips: standardPrCardChips,
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
        cardConfig: standardPrCardConfig,
        cardChips: standardPrCardChips,
        overviewCard: defaultPrOverviewCard,
        lineItemTable: {
            id: 'pr-items-default',
            title: 'Line Items',
            sourcePath: '_Item',
            columns: standardPrTableColumns
        }
    }
};

