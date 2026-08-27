import { text, codeText, amount, date, tableCol } from '../../core/fields';
import { formatRawDate } from '../../core/formatters';

export const CLAIM_OVERVIEW_FIELDS = {
    claimNumber: text({ source: 'DocumentNumber|ClaimNumber', label: 'Claim Form Number' }),
    claimType: codeText({ code: 'ClaimType|DocumentType', text: 'ClaimTypeText|DocumentTypeText', label: 'Claim Type' }),
    requestor: text({ source: 'UserName|CreatedByUser', label: 'Requestor' }),
    creationDate: date({ source: 'CreationDate', label: 'Created On', timeSource: 'CreationTime' }),
    companyCode: codeText({ code: 'CompanyCode', text: 'CompanyCodeName', label: 'Company Code' }),
    claimStatus: text({ source: 'ClaimStatus', label: 'Claim Status' }),
    vendor: text({
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
    paymentAmount: amount({ value: 'PaymentAmount', currency: 'LocalCurrency', label: 'Payment Amount' }),
    totalAmount: amount({ value: 'TotalNetAmountLocalCrcy', currency: 'LocalCurrency', label: 'Total Amount' }),
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
    invoiceAmount: tableCol({ key: 'invoiceAmount', header: 'Invoice Amount', value: 'InvoiceAmount', currency: 'DocumentCurrency', align: 'right' }),
    paymentAmount: tableCol({ key: 'paymentAmount', header: 'Payment Amount', value: 'PaymentAmount', currency: 'DocumentCurrency', align: 'right' }),
    totalNetAmountLocalCrcy: tableCol({ key: 'totalNetAmountLocalCrcy', header: 'Amount in Local Currency', value: 'TotalNetAmountLocalCrcy', currency: 'DocumentCurrency', align: 'right' })
};
