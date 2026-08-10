import type { ObjectViewDefinition } from '../../core/renderer.types';
import { text, codeText, amount, date, tableCol } from '../../core/fields';
import { formatRawDate, formatRawMultilineText } from '../../core/formatters';

export const CLAIM_VIEW: ObjectViewDefinition = {
    docCategory: 'ZCLAIM',
    overviewCard: {
        id: 'claim-summary',
        title: 'Document Summary',
        fields: [
            text({ source: 'DocumentNumber|ClaimNumber', label: 'Claim Form Number' }),
            codeText({ code: 'DocumentType', text: 'DocumentTypeText|DocumentTypeDisplay', label: 'Document Type' }),
            text({ source: 'UserName|Claimant|CreatedByUser', label: 'Claimant Name' }),
            date({ source: 'CreationDate', label: 'Created On', timeSource: 'CreationTime' }),
            amount({ value: 'TotalAmount', currency: 'Currency', label: 'Total Amount' }),
            codeText({ code: 'CompanyCode', text: 'CompanyCodeName', label: 'Company Code' }),
            text({ source: 'Purpose', label: 'Purpose', isLongText: true, formatter: (val, record) => formatRawMultilineText(val, record, '_PurposeText') }),
            text({ source: 'PaidBy', label: 'Paid By', isLongText: true, formatter: (val, record) => formatRawMultilineText(val, record, '_PaidByText') }),
            text({ source: 'BankDetails', label: 'Bank Details', isLongText: true, formatter: (val, record) => formatRawMultilineText(val, record, '_BankDetails') })
        ]
    },
    lineItemTable: {
        id: 'claim-items',
        title: 'Line Items',
        sourcePath: '_Item',
        columns: [
            tableCol({ key: 'itemNo', header: 'Item No', source: 'ItemNo' }),
            tableCol({ key: 'receiptDate', header: 'Receipt Date', source: 'ReceiptDate', formatter: (val) => formatRawDate(val) }),
            tableCol({ key: 'expenseType', header: 'Expense Type', source: 'ExpenseType' }),
            tableCol({ key: 'amount', header: 'Amount', value: 'Amount', align: 'right' }),
            tableCol({ key: 'description', header: 'Description', source: 'Description' })
        ]
    }
};
