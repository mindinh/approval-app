import { text, codeText, amount, date, tableCol } from '../../core/fields';
import { formatRawAmount, formatRawDate, formatVendorCodeAndName, formatNoteText } from '../../core/formatters';
import { getRecordVal } from '../../core/objectView';

const formatItemAmount = (value: unknown, record: Record<string, any>) =>
    formatRawAmount(value, getRecordVal(record, 'DocumentCurrency'), 'vi-VN');

export const CLAIM_OVERVIEW_FIELDS = {
    claimNumber: text({ source: 'DocumentNumber|ClaimNumber', label: 'Claim Form Number' }),
    claimType: codeText({ code: 'ClaimType|DocumentType', text: 'ClaimTypeText|DocumentTypeText', label: 'Claim Type' }),
    requestor: text({ source: 'UserName|CreatedByUser', label: 'Requestor' }),
    creationDate: date({ source: 'CreationDate', label: 'Created On', timeSource: 'CreationTime' }),
    companyCode: codeText({ code: 'CompanyCode', text: 'CompanyCodeName', label: 'Company Code' }),
    claimStatus: text({ source: 'ClaimStatus', label: 'Claim Status' }),
    veriStatus: codeText({ code: 'VeriStatus', text: 'VeriStatusDesc', label: 'Verify Status' }),
    veriBy: text({ source: 'VeriBy', label: 'Verified/Refused By' }),
    veriDate: date({ source: 'VeriDate', label: 'Verify Time', timeSource: 'VeriTime' }),
    veriComment: text({ source: 'VeriComment', label: 'Verify Comment' }),
    vendor: text({
        source: 'Vendor',
        label: 'Vendor',
        formatter: (_val, record) => formatVendorCodeAndName(record)
    }),
    paymentAmount: amount({ value: 'PaymentAmount', currency: 'DocumentCurrency', label: 'Payment Amount', locale: 'vi-VN' }),
    totalAmount: amount({ value: 'TotalNetAmountLocalCrcy', currency: 'LocalCurrency', label: 'Total Amount', locale: 'vi-VN' }),
    note: text({
        source: 'Note|Notes',
        label: 'Note',
        isLongText: true,
        formatter: (val) => formatNoteText(val)
    }),
};

export const CLAIM_TABLE_COLUMNS = {
    itemNumber: tableCol({ key: 'itemNumber', header: 'Item', source: 'ItemNumber' }),
    docNum: tableCol({ key: 'docNum', header: 'Document Number', source: 'DocNum' }),
    fiscalYear: tableCol({ key: 'fiscalYear', header: 'Fiscal Year', source: 'FiscalYear' }),
    reference: tableCol({ key: 'reference', header: 'Reference', source: 'Reference' }),
    documentDate: tableCol({ key: 'documentDate', header: 'Document Date', source: 'DocumentDate', formatter: (val) => formatRawDate(val) }),
    netDueDate: tableCol({ key: 'netDueDate', header: 'Net Due Date', source: 'NetDueDate', formatter: (val) => formatRawDate(val) }),
    text: tableCol({ key: 'text', header: 'Text', source: 'Text' }),
    vendor: tableCol({ key: 'vendor', header: 'Vendor', source: 'Vendor' }),
    invoiceAmount: tableCol({ key: 'invoiceAmount', header: 'Invoice Amount', value: 'InvoiceAmount', currency: 'DocumentCurrency', align: 'right', formatter: formatItemAmount }),
    paymentAmount: tableCol({ key: 'paymentAmount', header: 'Payment Amount', value: 'PaymentAmount', currency: 'DocumentCurrency', align: 'right', formatter: formatItemAmount }),
    totalNetAmountLocalCrcy: tableCol({ key: 'totalNetAmountLocalCrcy', header: 'Amount in Local Currency', value: 'TotalNetAmountLocalCrcy', currency: 'DocumentCurrency', align: 'right', formatter: formatItemAmount })
};
