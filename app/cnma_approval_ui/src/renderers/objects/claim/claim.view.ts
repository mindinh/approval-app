import type { ObjectViewDefinition } from '../../core/renderer.types';
import { text, codeText, amount, date, tableCol, chip } from '../../core/fields';
import { formatRawDate } from '../../core/formatters';

export const CLAIM_VIEW: ObjectViewDefinition = {
    docCategory: 'CLAIM',
    cardConfig: {
        colorKey: 'success',
        textClass: 'text-success font-semibold',
        stripeClass: 'before:bg-success'
    },
    cardChips: [
        chip(amount({ value: 'TotalNetAmountLocalCrcy|PaymentAmount|total', currency: 'LocalCurrency|DocumentCurrency|documentCurrency', label: 'Total' }), true),
        chip(text({ source: 'DocumentTypeText|doctyp_desc|ClaimTypeText|documentTypeDisplay|DocumentType', label: 'Type' })),
    ],





    overviewCard: {

        id: 'claim-summary',
        title: 'Document Summary',
        fields: [
            text({ source: 'DocumentNumber|ClaimNumber', label: 'Claim Form Number' }),
            codeText({ code: 'ClaimType|DocumentType', text: 'ClaimTypeText|DocumentTypeText', label: 'Claim Type' }),
            text({ source: 'UserName|CreatedByUser', label: 'Requestor' }),
            date({ source: 'CreationDate', label: 'Created On', timeSource: 'CreationTime' }),
            amount({ value: 'PaymentAmountLocalCrcy', currency: 'LocalCurrency', label: 'Total Amount' }),
            text({
                source: 'Vendor',
                label: 'Vendor',
                formatter: (_val, record) => {
                    if (!record) return '-\n-\n-\n-\n-';
                    const s1 = (record.Vendor || record.Supplier || record.VendorCode || '').trim() || '-';
                    const s2 = (record.VendorName1 || record.VendorName || record.SupplierName || record.Name1 || record.VendorText || '').trim() || '-';
                    const s3 = (record.VendorName2 || record.Name2 || '').trim() || '-';
                    const s4 = (record.VendorName3 || record.Name3 || '').trim() || '-';
                    const s5 = (record.VendorName4 || record.Name4 || '').trim() || '-';

                    return [s1, s2, s3, s4, s5].join('\n');
                }
            }),
            codeText({ code: 'CompanyCode', text: 'CompanyCodeName', label: 'Company Code' }),
            text({ source: 'ClaimStatus', label: 'Claim Status' }),
        ]
    },
    lineItemTable: {
        id: 'claim-items',
        title: 'Line Items',
        sourcePath: '_Item',
        columns: [
            tableCol({ key: 'itemNumber', header: 'Item', source: 'ItemNumber' }),
            tableCol({ key: 'docNum', header: 'FI Doc Number', source: 'DocNum' }),
            tableCol({ key: 'fiscalYear', header: 'Fiscal Year', source: 'FiscalYear' }),
            tableCol({ key: 'reference', header: 'Reference', source: 'Reference' }),
            tableCol({ key: 'documentDate', header: 'Document Date', source: 'DocumentDate', formatter: (val) => formatRawDate(val) }),
            tableCol({ key: 'netDueDate', header: 'Net Due Date', source: 'NetDueDate', formatter: (val) => formatRawDate(val) }),
            tableCol({ key: 'text', header: 'Description', source: 'Text' }),
            tableCol({ key: 'vendor', header: 'Vendor', source: 'Vendor' }),
            tableCol({ key: 'invoiceAmount', header: 'Invoice Amount', value: 'InvoiceAmount', currency: 'DocumentCurrency', align: 'right' }),
            tableCol({ key: 'paymentAmount', header: 'Payment Amount', value: 'PaymentAmount', currency: 'DocumentCurrency', align: 'right' }),
            tableCol({ key: 'totalNetAmountLocalCrcy', header: 'Total Net Amount', value: 'TotalNetAmountLocalCrcy', currency: 'DocumentCurrency', align: 'right' })
        ]
    }
};
