import { text, codeText, amount, date, tableCol } from '../../core/fields';
import { formatRawDate, formatRawMultilineText } from '../../core/formatters';

export const PR_OVERVIEW_FIELDS = {
    documentNumber: text({ source: 'DocumentNumber|PurchaseRequisition', label: 'Document Number' }),
    documentType: codeText({ code: 'DocumentType', text: 'DocumentTypeText', label: 'Document Type' }),
    createdByUser: text({ source: 'UserName', label: 'Requester' }),
    fundsCenter: codeText({ code: 'FundsCenter', text: 'FundsCenterName', label: 'Funds Center' }),
    creationDate: date({ source: 'CreationDate', label: 'Created On', timeSource: 'CreationTime' }),
    releaseStrategyName: text({ source: 'ReleaseStrategyName|ReleaseStrategyText', label: 'Release Strategy Name' }),
    totalAmount: amount({ value: 'TotalNetAmountLocalCrcy|Total', currency: 'LocalCurrency|Currency', label: 'Total Amount' }),
    companyCode: codeText({ code: 'CompanyCode', text: 'CompanyCodeName', label: 'Company Code' }),
    headerNote: text({ source: 'HeaderNote', label: 'Header Note', isLongText: true, formatter: (val, record) => formatRawMultilineText(val, record, '_HeaderText') }),
    purpose: text({ source: 'Purpose', label: 'Purpose', isLongText: true, formatter: (val, record) => formatRawMultilineText(val, record, '_PurposeText') }),
    paidBy: text({ source: 'PaidBy', label: 'Paid By', isLongText: true, formatter: (val, record) => formatRawMultilineText(val, record, '_PaidByText') }),
    bankDetails: text({ source: 'BankDetails', label: 'Bank Details', isLongText: true, formatter: (val, record) => formatRawMultilineText(val, record, '_BankDetails') })
};

export const PR_TABLE_COLUMNS = {
    item: tableCol({ key: 'item', header: 'Item', source: 'PurchaseRequisitionItem|ItemNumber' }),
    plant: tableCol({ key: 'plant', header: 'Plant', code: 'Plant', text: 'PlantName' }),
    storageLocation: tableCol({ key: 'storageLocation', header: 'Storage Location', code: 'StorageLocation', text: 'StorageLocationName' }),
    material: tableCol({ key: 'material', header: 'Material Number', source: 'Material' }),
    shortText: tableCol({ key: 'shortText', header: 'Short Text', source: 'PurchaseRequisitionItemText|MaterialText' }),
    materialGroup: tableCol({ key: 'materialGroup', header: 'Material Group', code: 'MaterialGroup', text: 'MaterialGroupText|MaterialGroupName' }),
    quantity: tableCol({ key: 'quantity', header: 'Quantity', value: 'RequestedQuantity|Quantity', unit: 'BaseUnit|Unit', align: 'right' }),
    unit: tableCol({ key: 'unit', header: 'UoM', source: 'BaseUnit|Unit' }),
    deliveryDate: tableCol({ key: 'deliveryDate', header: 'Delivery Date', source: 'DeliveryDate', formatter: (val) => formatRawDate(val) }),
    valuationPrice: tableCol({ key: 'valuationPrice', header: 'Valuation Price', value: 'PurchaseRequisitionPrice|ValuationPrice', currency: 'PurReqnItemCurrency|DocumentCurrency', align: 'right' }),
    totalValue: tableCol({ key: 'totalValue', header: 'Total Value', value: 'PurReqnItemTotalAmount|TotalNetAmountDocCrcy', currency: 'PurReqnItemCurrency|DocumentCurrency', align: 'right' }),
    glAccount: tableCol({ key: 'glAccount', header: 'G/L Account', code: 'GLAccount', text: 'GLAccountText' }),
    internalOrder: tableCol({ key: 'internalOrder', header: 'Internal Order', code: 'OrderInternalID', text: 'OrderInternalName' }),
    commitmentItem: tableCol({ key: 'commitmentItem', header: 'Commitment Item', code: 'CommitmentItem', text: 'CommitmentItemText|CommitmentItemDescription' })
};
