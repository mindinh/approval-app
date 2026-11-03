import type { CardDefinition, ObjectTypeModule, ObjectViewDefinition, TableColumnDefinition } from '../../core/types';
import { amount, chip, excludeColumns, text } from '../../core/fields';
import { PR_OVERVIEW_FIELDS, PR_TABLE_COLUMNS } from './pr.fields';

const prCardChips = [
    chip(amount({ value: 'TotalNetAmountLocalCrcy|TotalNetAmount|totalNetAmount|TotalOrderValue|total', currency: 'LocalCurrency|DisplayCurrency|displayCurrency|DocumentCurrency', label: 'Total' }), true),
    chip(text({ source: 'DocumentTypeText|doctyp_desc|PurchaseRequisitionTypeText|purchaseRequisitionTypeText|documentTypeDisplay|DocumentType|PurchaseRequisitionType|purchaseRequisitionType', label: 'Type' })),
];

const prOverviewCard: CardDefinition = {
    id: 'pr-summary',
    title: 'Document Summary',
    fields: [
        PR_OVERVIEW_FIELDS.documentNumber,
        PR_OVERVIEW_FIELDS.documentType,
        PR_OVERVIEW_FIELDS.createdByUser,
        PR_OVERVIEW_FIELDS.fundsCenter,
        PR_OVERVIEW_FIELDS.creationDate,
        PR_OVERVIEW_FIELDS.totalAmount,
        PR_OVERVIEW_FIELDS.companyCode,
        PR_OVERVIEW_FIELDS.headerNote,
        PR_OVERVIEW_FIELDS.purpose,
        PR_OVERVIEW_FIELDS.paidBy,
        PR_OVERVIEW_FIELDS.bankDetails,
    ],
};

const standardColumns: TableColumnDefinition[] = [
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
    PR_TABLE_COLUMNS.commitmentItem,
];

// ZASS, ZEXP: material number removed per requirements
const columnsNoMaterial = excludeColumns(standardColumns, 'material');
// ZNB1, ZNB2: G/L account removed per requirements
const columnsNoGlAccount = excludeColumns(standardColumns, 'glAccount');
// ZMAK (marketing): no material; internal order inserted before commitment item
const columnsMarketing = [
    ...excludeColumns(standardColumns, 'material', 'commitmentItem'),
    PR_TABLE_COLUMNS.internalOrder,
    PR_TABLE_COLUMNS.commitmentItem,
];

function prView(subtype: string, columns: TableColumnDefinition[]): ObjectViewDefinition {
    return {
        cardChips: prCardChips,
        overviewCard: prOverviewCard,
        lineItemTable: { id: `pr-items-${subtype}`, title: 'Line Items', sourcePath: '_Item', columns },
    };
}

/** PR layouts by document type (`DocumentType`). Unlisted types use DEFAULT. */
export const PR_VIEWS: Record<string, ObjectViewDefinition> = {
    ZASS: prView('zass', columnsNoMaterial),
    ZEXP: prView('zexp', columnsNoMaterial),
    ZMAK: prView('zmak', columnsMarketing),
    ZNB1: prView('znb1', columnsNoGlAccount),
    ZNB2: prView('znb2', columnsNoGlAccount),
    ZTOL: prView('ztol', standardColumns),
    DEFAULT: prView('default', standardColumns),
};

export const prModule: ObjectTypeModule = {
    category: 'PR',
    label: 'PR',
    aliases: ['BUS2105', 'PR'],
    tone: 'primary',
    resolveView: (documentType) => PR_VIEWS[documentType] || PR_VIEWS.DEFAULT,
};
