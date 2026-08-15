import { text, codeText, amount, date, tableCol } from '../../core/fields';
import { formatRawDate } from '../../core/formatters';

export const RESERVATION_OVERVIEW_FIELDS = {
    documentNumber: text({
        source: 'DocumentNumber|DocumentId',
        label: 'Document number'
    }),
    documentType: codeText({
        code: 'DocumentType',
        text: 'DocumentTypeText',
        label: 'Document type'
    }),
    requester: text({
        source: 'UserName|CreatedByUser',
        label: 'Requester'
    }),
    creationDate: date({
        source: 'CreationDate',
        label: 'Created on',
        timeSource: 'CreationTime'
    }),
    totalAmount: amount({
        value: 'TotalNetAmountLocalCrcy|Total',
        currency: 'LocalCurrency|Currency',
        label: 'Total amount'
    }),
    plant: codeText({
        code: 'Plant',
        text: 'PlantName',
        label: 'Plant'
    }),
    movementType: codeText({
        code: 'MovementType',
        text: 'MovementTypeName',
        label: 'Movement type'
    }),
    costCenter: codeText({
        code: 'CostCenter',
        text: 'CostCenterName',
        label: 'Cost center'
    }),
    releaseStrategyName: text({
        source: 'ReleaseStrategyText|ReleaseStrategyName',
        label: 'Release Strategy Name'
    })
};

export const RESERVATION_TABLE_COLUMNS = {
    material: tableCol({
        key: 'material',
        header: 'Material Number',
        code: 'Material',
        text: 'MaterialText'
    }),
    itemText: tableCol({
        key: 'itemText',
        header: 'ITEM TEXT',
        source: 'ItemText'
    }),
    quantity: tableCol({
        key: 'quantity',
        header: 'Quantity',
        value: 'Quantity',
        unit: 'BaseUnit',
        align: 'right'
    }),
    cost: tableCol({
        key: 'cost',
        header: 'Cost',
        value: 'CostPrice',
        currency: 'Currency|LocalCurrency',
        align: 'right'
    }),
    value: tableCol({
        key: 'value',
        header: 'Value',
        value: 'Price',
        currency: 'Currency|LocalCurrency',
        align: 'right'
    }),
    plant: tableCol({ key: 'plant', header: 'Plant', code: 'Plant', text: 'PlantName' }),
    storageLocation: tableCol({
        key: 'storageLocation',
        header: 'Storage location',
        code: 'StorageLocation',
        text: 'StorageLocationName'
    }),
    requirementDate: tableCol({
        key: 'requirementDate',
        header: 'Requirement date',
        source: 'RequirementDate',
        formatter: (val) => formatRawDate(val)
    }),
    glAccount: tableCol({
        key: 'glAccount',
        header: 'G/L account',
        code: 'GLAccount',
        text: 'GLAccountText'
    })
};
