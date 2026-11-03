import type { CardDefinition, ObjectTypeModule, ObjectViewDefinition, TableColumnDefinition, TaskCardChipDefinition } from '../../core/types';
import { amount, chip, excludeColumns, text } from '../../core/fields';
import { PO_OVERVIEW_FIELDS, PO_TABLE_COLUMNS } from './po.fields';

const typeChip = chip(text({ source: 'DocumentTypeText|doctyp_desc|purchaseOrderTypeText|documentTypeDisplay|DocumentType', label: 'Type' }));

const standardCardChips: TaskCardChipDefinition[] = [
    chip(amount({ value: 'TotalOrderValue|TotalNetAmountLocalCrcy|purchaseOrderNetAmount|TotalAmount|total', currency: 'LocalCurrency|DocumentCurrency|documentCurrency', label: 'Total' }), true),
    typeChip,
];

// Stock transfers (ZUB) carry their value in local currency.
const zubCardChips: TaskCardChipDefinition[] = [
    chip(amount({ value: 'TotalNetAmountLocalCrcy|TotalOrderValue|total', currency: 'LocalCurrency|DocumentCurrency|documentCurrency', label: 'Total' }), true),
    typeChip,
];

const standardOverviewCard: CardDefinition = {
    id: 'po-summary',
    title: 'Document Summary',
    fields: [
        PO_OVERVIEW_FIELDS.poNumber,
        PO_OVERVIEW_FIELDS.documentType,
        PO_OVERVIEW_FIELDS.requester,
        PO_OVERVIEW_FIELDS.vendor,
        PO_OVERVIEW_FIELDS.companyCode,
        PO_OVERVIEW_FIELDS.creationDate,
        PO_OVERVIEW_FIELDS.paymentTerms,
        PO_OVERVIEW_FIELDS.subtotal,
        PO_OVERVIEW_FIELDS.shippingFee,
        PO_OVERVIEW_FIELDS.vat,
        PO_OVERVIEW_FIELDS.total,
        PO_OVERVIEW_FIELDS.headerText,
        PO_OVERVIEW_FIELDS.headerNote,
    ],
};

const zubOverviewCard: CardDefinition = {
    id: 'po-summary-zub',
    title: 'Document Summary',
    fields: [
        PO_OVERVIEW_FIELDS.poNumber,
        PO_OVERVIEW_FIELDS.documentType,
        PO_OVERVIEW_FIELDS.zubRequester,
        PO_OVERVIEW_FIELDS.supplyingPlant,
        PO_OVERVIEW_FIELDS.plant,
        PO_OVERVIEW_FIELDS.companyCode,
        PO_OVERVIEW_FIELDS.creationDate,
        PO_OVERVIEW_FIELDS.zubTotalAmount,
        PO_OVERVIEW_FIELDS.headerText,
        PO_OVERVIEW_FIELDS.headerNote,
    ],
};

const standardColumns: TableColumnDefinition[] = [
    PO_TABLE_COLUMNS.item,
    PO_TABLE_COLUMNS.material,
    PO_TABLE_COLUMNS.shortText,
    PO_TABLE_COLUMNS.quantity,
    PO_TABLE_COLUMNS.valuationPrice,
    PO_TABLE_COLUMNS.totalValue,
    PO_TABLE_COLUMNS.deliveryDate,
    PO_TABLE_COLUMNS.materialGroup,
    PO_TABLE_COLUMNS.plant,
    PO_TABLE_COLUMNS.storageLocation,
    PO_TABLE_COLUMNS.referencePr,
    PO_TABLE_COLUMNS.glAccount,
    PO_TABLE_COLUMNS.fundsCenter,
    PO_TABLE_COLUMNS.commitmentItem,
];

// ZASS, ZEXP: material number removed per requirements
const columnsNoMaterial = excludeColumns(standardColumns, 'material');
// ZCOR: reference PR removed per requirements
const columnsNoRefPr = excludeColumns(standardColumns, 'referencePr');
// ZNB1, ZNB2: G/L account removed per requirements
const columnsNoGlAccount = excludeColumns(standardColumns, 'glAccount');
// ZNBR: reference PR and G/L account removed per requirements
const columnsNoRefPrNoGlAccount = excludeColumns(standardColumns, 'referencePr', 'glAccount');
// ZMAK (marketing): no material; internal order inserted before funds center and commitment item
const columnsMarketing = [
    ...excludeColumns(standardColumns, 'material', 'fundsCenter', 'commitmentItem'),
    PO_TABLE_COLUMNS.internalOrder,
    PO_TABLE_COLUMNS.fundsCenter,
    PO_TABLE_COLUMNS.commitmentItem,
];
// ZUB (stock transfer): values in local currency, no reference PR / G/L account
const columnsStockTransfer = [
    PO_TABLE_COLUMNS.item,
    PO_TABLE_COLUMNS.material,
    PO_TABLE_COLUMNS.shortText,
    PO_TABLE_COLUMNS.quantity,
    PO_TABLE_COLUMNS.zubValuationPrice,
    PO_TABLE_COLUMNS.zubTotalValue,
    PO_TABLE_COLUMNS.deliveryDate,
    PO_TABLE_COLUMNS.materialGroup,
    PO_TABLE_COLUMNS.plant,
    PO_TABLE_COLUMNS.storageLocation,
    PO_TABLE_COLUMNS.fundsCenter,
    PO_TABLE_COLUMNS.commitmentItem,
];

function poView(subtype: string, columns: TableColumnDefinition[], overrides: Partial<ObjectViewDefinition> = {}): ObjectViewDefinition {
    return {
        cardChips: standardCardChips,
        overviewCard: standardOverviewCard,
        lineItemTable: { id: `po-items-${subtype}`, title: 'Line Items', sourcePath: '_Item', columns },
        ...overrides,
    };
}

/** PO layouts by document type (`DocumentType`). Unlisted types use DEFAULT. */
export const PO_VIEWS: Record<string, ObjectViewDefinition> = {
    ZASS: poView('zass', columnsNoMaterial),
    ZCON: poView('zcon', standardColumns),
    ZCOR: poView('zcor', columnsNoRefPr),
    ZEXP: poView('zexp', columnsNoMaterial),
    ZMAK: poView('zmak', columnsMarketing),
    ZNB1: poView('znb1', columnsNoGlAccount),
    ZNB2: poView('znb2', columnsNoGlAccount),
    ZNBR: poView('znbr', columnsNoRefPrNoGlAccount),
    ZTOL: poView('ztol', standardColumns),
    ZUB: poView('zub', columnsStockTransfer, { cardChips: zubCardChips, overviewCard: zubOverviewCard }),
    DEFAULT: poView('default', standardColumns),
};

export const poModule: ObjectTypeModule = {
    category: 'PO',
    label: 'PO',
    aliases: ['BUS2012', 'PO'],
    tone: 'info',
    resolveView: (documentType) => PO_VIEWS[documentType] || PO_VIEWS.DEFAULT,
};
