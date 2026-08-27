import type { ObjectViewDefinition } from '../../core/renderer.types';
import { amount, text, chip } from '../../core/fields';
import { CLAIM_OVERVIEW_FIELDS, CLAIM_TABLE_COLUMNS } from './claim.fields';

export const CLAIM_VIEW: ObjectViewDefinition = {
    docCategory: 'CLAIM',
    cardConfig: {
        colorKey: 'success',
        textClass: 'text-success font-semibold',
        stripeClass: 'before:bg-success'
    },
    cardChips: [
        chip(amount({ value: 'PaymentAmountLocalCrcy|PaymentAmount|TotalNetAmountLocalCrcy|total', currency: 'LocalCurrency|DocumentCurrency|documentCurrency', label: 'Total' }), true),
        chip(text({ source: 'DocumentTypeText|doctyp_desc|ClaimTypeText|documentTypeDisplay|DocumentType|DocCategory', label: 'Type' })),
    ],
    overviewCard: {
        id: 'claim-summary',
        title: 'Document Summary',
        fields: [
            CLAIM_OVERVIEW_FIELDS.claimNumber,
            CLAIM_OVERVIEW_FIELDS.claimType,
            CLAIM_OVERVIEW_FIELDS.requestor,
            CLAIM_OVERVIEW_FIELDS.creationDate,
            CLAIM_OVERVIEW_FIELDS.companyCode,
            CLAIM_OVERVIEW_FIELDS.claimStatus,
            CLAIM_OVERVIEW_FIELDS.vendor,
            CLAIM_OVERVIEW_FIELDS.paymentAmount,
            CLAIM_OVERVIEW_FIELDS.totalAmount,
        ]
    },
    lineItemTable: {
        id: 'claim-items',
        title: 'Line Items',
        sourcePath: '_Item',
        columns: [
            CLAIM_TABLE_COLUMNS.itemNumber,
            CLAIM_TABLE_COLUMNS.reference,
            CLAIM_TABLE_COLUMNS.documentDate,
            CLAIM_TABLE_COLUMNS.docNum,
            CLAIM_TABLE_COLUMNS.text,
            CLAIM_TABLE_COLUMNS.netDueDate,
            CLAIM_TABLE_COLUMNS.paymentAmount,
            CLAIM_TABLE_COLUMNS.totalNetAmountLocalCrcy,
            CLAIM_TABLE_COLUMNS.invoiceAmount,
            CLAIM_TABLE_COLUMNS.vendor,
            CLAIM_TABLE_COLUMNS.fiscalYear,
        ]
    }
};
