import { text, codeText, amount, date, tableCol } from '../../core/fields';
import { formatRawDate, formatRawMultilineText } from '../../core/formatters';

export const PO_OVERVIEW_FIELDS = {
    poNumber: text({ source: 'DocumentNumber|PurchaseOrder', label: 'PO Number' }),
    documentType: codeText({ code: 'DocumentType', text: 'DocumentTypeText', label: 'Document Type' }),
    requester: text({ source: 'UserName', label: 'Requester' }),
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
    releaseStrategy: text({ source: 'ReleaseStrategyText|ReleaseStrategyName', label: 'Release Strategy' }),
    companyCode: codeText({ code: 'CompanyCode', text: 'CompanyCodeName', label: 'Company Code' }),
    creationDate: date({ source: 'CreationDate', label: 'Created On', timeSource: 'CreationTime' }),
    paymentTerms: codeText({ code: 'PaymentTerms', text: 'PaymentTermsDescription', label: 'Payment Terms' }),
    subtotal: amount({ value: 'TotalNetValueBeforeTax', currency: 'LocalCurrency', label: 'Subtotal (Excl. VAT)' }),
    shippingFee: amount({ value: 'TotalFreightAmount', currency: 'LocalCurrency', label: 'Shipping Fee' }),
    vat: amount({ value: 'TotalVatAmount', currency: 'LocalCurrency', label: 'VAT' }),
    total: amount({ value: 'TotalOrderValue|TotalAmount|Total', currency: 'LocalCurrency', label: 'Total' }),
    headerText: text({ source: 'HeaderText', label: 'Header Text', isLongText: true, formatter: (val, record) => formatRawMultilineText(val, record, '_HeaderText') }),
    headerNote: text({ source: 'HeaderNote', label: 'Header Note', isLongText: true, formatter: (val, record) => formatRawMultilineText(val, record, '_HeaderNote') }),

    // ZUB specific
    zubRequester: codeText({ code: 'CreatedByUser', text: 'ReceivingPlantName', label: 'Requester' }),
    supplyingPlant: codeText({ code: 'SupplyingPlant', text: 'SupplyingPlantName', label: 'Supplying Plant' }),
    zubTotalAmount: amount({ value: 'TotalNetAmountLocalCrcy', currency: 'LocalCurrency', label: 'Total Amount' }),
    zubHeaderText: text({ source: 'HeaderText', label: 'Header Text', isLongText: true, formatter: (val, record) => formatRawMultilineText(val, record, '_HeaderText') })
};

export const PO_TABLE_COLUMNS = {
    item: tableCol({ key: 'item', header: 'Item', source: 'ItemNumber' }),
    plant: tableCol({ key: 'plant', header: 'Plant', code: 'Plant', text: 'PlantName' }),
    storageLocation: tableCol({ key: 'storageLocation', header: 'Storage Location', code: 'StorageLocation', text: 'StorageLocationName' }),
    material: tableCol({ key: 'material', header: 'Material Number', source: 'Material' }),
    shortText: tableCol({ key: 'shortText', header: 'Short Text', source: 'MaterialText' }),
    materialGroup: tableCol({ key: 'materialGroup', header: 'Material Group', code: 'MaterialGroup', text: 'MaterialGroupName' }),
    quantity: tableCol({ key: 'quantity', header: 'Quantity', value: 'Quantity', unit: 'Unit', align: 'right' }),
    unit: tableCol({ key: 'unit', header: 'UoM', source: 'Unit' }),
    deliveryDate: tableCol({ key: 'deliveryDate', header: 'Delivery Date', source: 'DeliveryDate', formatter: (val) => formatRawDate(val) }),
    valuationPrice: tableCol({ key: 'valuationPrice', header: 'Valuation Price', value: 'ValuationPrice', currency: 'DocumentCurrency', align: 'right' }),
    totalValue: tableCol({ key: 'totalValue', header: 'Total Value', value: 'TotalNetAmountDocCrcy', currency: 'DocumentCurrency', align: 'right' }),
    referencePr: tableCol({ key: 'referencePr', header: 'Reference PR', source: 'ReferenceDocumentNumber' }),
    glAccount: tableCol({ key: 'glAccount', header: 'G/L Account', code: 'GLAccount', text: 'GLAccountText' }),
    internalOrder: tableCol({ key: 'internalOrder', header: 'Internal Order', code: 'OrderInternalID', text: 'OrderInternalName' }),
    fundsCenter: tableCol({ key: 'fundsCenter', header: 'Funds Center', code: 'FundsCenter', text: 'FundsCenterName' }),
    commitmentItem: tableCol({ key: 'commitmentItem', header: 'Commitment Item', code: 'CommitmentItem', text: 'CommitmentItemDescription' }),

    // ZMAK Marketing specific columns
    zMakOrder: tableCol({ key: 'OrderInternalID', header: 'Order Internal', source: 'OrderInternalID' }),
    zMakOrderText: tableCol({ key: 'OrderInternalName', header: 'Order Internal Text', source: 'OrderInternalName' }),

    // ZUB specific columns
    zubValuationPrice: tableCol({ key: 'valuationPrice', header: 'Valuation Price', value: 'ValuationPricePRCD', currency: 'LocalCurrency|DocumentCurrency', align: 'right' }),
    zubTotalValue: tableCol({ key: 'totalValue', header: 'Total Value', value: 'TotalNetAmountLocalCrcy|TotalNetAmountLocalCrcyPRCD|TotalNetAmountDocCrcy', currency: 'LocalCurrency|DocumentCurrency', align: 'right' })
};
