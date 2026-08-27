import type { ObjectViewDefinition, TaskCardStyleConfig } from '../../core/renderer.types';
import { PO_OVERVIEW_FIELDS, PO_TABLE_COLUMNS } from './po.fields';
import { text, codeText, amount, chip } from '../../core/fields';

const standardPoCardConfig: TaskCardStyleConfig = {
    colorKey: 'info',
    textClass: 'text-info font-semibold',
    stripeClass: 'before:bg-info'
};

const standardPoCardChips = [
    chip(amount({ value: 'TotalOrderValue|TotalNetAmountLocalCrcy|purchaseOrderNetAmount|TotalAmount|total', currency: 'LocalCurrency|DocumentCurrency|documentCurrency', label: 'Total' }), true),
    chip(text({ source: 'DocumentTypeText|doctyp_desc|purchaseOrderTypeText|documentTypeDisplay|DocumentType', label: 'Type' })),
];

const zubPoCardChips = [
    chip(amount({ value: 'TotalNetAmountLocalCrcy|TotalOrderValue|total', currency: 'LocalCurrency|DocumentCurrency|documentCurrency', label: 'Total' }), true),
    chip(text({ source: 'DocumentTypeText|doctyp_desc|purchaseOrderTypeText|documentTypeDisplay|DocumentType', label: 'Type' })),
];





const standardPoOverviewCard = {
    id: 'po-summary',
    title: 'Document Summary',
    fields: [
        PO_OVERVIEW_FIELDS.poNumber,
        PO_OVERVIEW_FIELDS.documentType,
        PO_OVERVIEW_FIELDS.requester,
        PO_OVERVIEW_FIELDS.vendor,
        PO_OVERVIEW_FIELDS.releaseStrategy,
        PO_OVERVIEW_FIELDS.companyCode,
        PO_OVERVIEW_FIELDS.creationDate,
        PO_OVERVIEW_FIELDS.paymentTerms,
        PO_OVERVIEW_FIELDS.subtotal,
        PO_OVERVIEW_FIELDS.shippingFee,
        PO_OVERVIEW_FIELDS.vat,
        PO_OVERVIEW_FIELDS.total,
        PO_OVERVIEW_FIELDS.headerText,
        PO_OVERVIEW_FIELDS.headerNote
    ]
};

const zubPoOverviewCard = {
    id: 'po-summary-zub',
    title: 'Document Summary',
    fields: [
        PO_OVERVIEW_FIELDS.poNumber,
        PO_OVERVIEW_FIELDS.documentType,
        PO_OVERVIEW_FIELDS.zubRequester,
        PO_OVERVIEW_FIELDS.supplyingPlant,
        PO_OVERVIEW_FIELDS.releaseStrategy,
        PO_OVERVIEW_FIELDS.companyCode,
        PO_OVERVIEW_FIELDS.creationDate,
        PO_OVERVIEW_FIELDS.zubTotalAmount,
        PO_OVERVIEW_FIELDS.zubHeaderText,
        PO_OVERVIEW_FIELDS.headerNote
    ]
};

const standardPoTableColumns = [
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
    PO_TABLE_COLUMNS.commitmentItem
];

export const PO_VIEWS: Record<string, ObjectViewDefinition> = {
    ZASS: { docCategory: 'BUS2012', documentType: 'ZASS', cardConfig: standardPoCardConfig, cardChips: standardPoCardChips, overviewCard: standardPoOverviewCard, lineItemTable: { id: 'po-items-zass', title: 'Line Items', sourcePath: '_Item', columns: standardPoTableColumns } },
    ZCON: { docCategory: 'BUS2012', documentType: 'ZCON', cardConfig: standardPoCardConfig, cardChips: standardPoCardChips, overviewCard: standardPoOverviewCard, lineItemTable: { id: 'po-items-zcon', title: 'Line Items', sourcePath: '_Item', columns: standardPoTableColumns } },
    ZCOR: { docCategory: 'BUS2012', documentType: 'ZCOR', cardConfig: standardPoCardConfig, cardChips: standardPoCardChips, overviewCard: standardPoOverviewCard, lineItemTable: { id: 'po-items-zcor', title: 'Line Items', sourcePath: '_Item', columns: standardPoTableColumns } },
    ZEXP: { docCategory: 'BUS2012', documentType: 'ZEXP', cardConfig: standardPoCardConfig, cardChips: standardPoCardChips, overviewCard: standardPoOverviewCard, lineItemTable: { id: 'po-items-zexp', title: 'Line Items', sourcePath: '_Item', columns: standardPoTableColumns } },
    ZMAK: {
        docCategory: 'BUS2012',
        documentType: 'ZMAK',
        cardConfig: standardPoCardConfig,
        cardChips: standardPoCardChips,
        overviewCard: standardPoOverviewCard,
        lineItemTable: {
            id: 'po-items-zmak',
            title: 'Line Items',
            sourcePath: '_Item',
            columns: [
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
                PO_TABLE_COLUMNS.internalOrder,
                PO_TABLE_COLUMNS.fundsCenter,
                PO_TABLE_COLUMNS.commitmentItem
            ]
        }
    },
    ZNB1: { docCategory: 'BUS2012', documentType: 'ZNB1', cardConfig: standardPoCardConfig, cardChips: standardPoCardChips, overviewCard: standardPoOverviewCard, lineItemTable: { id: 'po-items-znb1', title: 'Line Items', sourcePath: '_Item', columns: standardPoTableColumns } },
    ZNB2: { docCategory: 'BUS2012', documentType: 'ZNB2', cardConfig: standardPoCardConfig, cardChips: standardPoCardChips, overviewCard: standardPoOverviewCard, lineItemTable: { id: 'po-items-znb2', title: 'Line Items', sourcePath: '_Item', columns: standardPoTableColumns } },
    ZNBR: { docCategory: 'BUS2012', documentType: 'ZNBR', cardConfig: standardPoCardConfig, cardChips: standardPoCardChips, overviewCard: standardPoOverviewCard, lineItemTable: { id: 'po-items-znbr', title: 'Line Items', sourcePath: '_Item', columns: standardPoTableColumns } },
    ZTOL: { docCategory: 'BUS2012', documentType: 'ZTOL', cardConfig: standardPoCardConfig, cardChips: standardPoCardChips, overviewCard: standardPoOverviewCard, lineItemTable: { id: 'po-items-ztol', title: 'Line Items', sourcePath: '_Item', columns: standardPoTableColumns } },
    ZUB: {
        docCategory: 'BUS2012',
        documentType: 'ZUB',
        cardConfig: standardPoCardConfig,
        cardChips: zubPoCardChips,
        overviewCard: zubPoOverviewCard,
        lineItemTable: {
            id: 'po-items-zub',
            title: 'Line Items',
            sourcePath: '_Item',
            columns: [
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
                PO_TABLE_COLUMNS.referencePr,
                PO_TABLE_COLUMNS.glAccount,
                PO_TABLE_COLUMNS.fundsCenter,
                PO_TABLE_COLUMNS.commitmentItem
            ]
        }
    },
    DEFAULT: { docCategory: 'BUS2012', documentType: 'DEFAULT', cardConfig: standardPoCardConfig, cardChips: standardPoCardChips, overviewCard: standardPoOverviewCard, lineItemTable: { id: 'po-items-default', title: 'Line Items', sourcePath: '_Item', columns: standardPoTableColumns } }
};

