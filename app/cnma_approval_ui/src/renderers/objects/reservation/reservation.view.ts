import type { ObjectViewDefinition } from '../../core/renderer.types';
import { text, codeText, amount, date, tableCol } from '../../core/fields';
import { formatRawDate } from '../../core/formatters';

export const RESERVATION_VIEW: ObjectViewDefinition = {
    docCategory: 'ZBUS2093',
    overviewCard: {
        id: 'reservation-summary',
        title: 'Document Summary',
        fields: [
            text({ source: 'DocumentNumber|DocumentId', label: 'Document number' }),
            codeText({ code: 'DocumentType', text: 'DocumentTypeText', label: 'Document type' }),
            text({ source: 'UserName|CreatedByUser', label: 'Requester' }),
            date({ source: 'CreationDate', label: 'Created on', timeSource: 'CreationTime' }),
            amount({ value: 'TotalNetAmountLocalCrcy|Total', currency: 'LocalCurrency|Currency', label: 'Total amount' }),
            codeText({ code: 'Plant', text: 'PlantName', label: 'Plant' }),
            codeText({ code: 'MovementType', text: 'MovementTypeName', label: 'Movement type' }),
            codeText({ code: 'CostCenter', text: 'CostCenterName', label: 'Cost center' }),
            text({ source: 'ReleaseStrategyText|ReleaseStrategyName', label: 'Release Strategy Name' })
        ]
    },
    lineItemTable: {
        id: 'reservation-items',
        title: 'Line Items',
        sourcePath: '_Item',
        columns: [
            tableCol({ key: 'material', header: 'Material Number', source: 'Material' }),
            tableCol({ key: 'materialText', header: 'Material Text', source: 'MaterialText' }),
            tableCol({ key: 'itemText', header: 'ITEM TEXT', source: 'ItemText' }),
            tableCol({ key: 'quantity', header: 'Quantity', value: 'Quantity', unit: 'BaseUnit', align: 'right' }),
            tableCol({ key: 'cost', header: 'Cost (Giá vốn)', value: 'MovingAveragePrice', align: 'right' }),
            tableCol({ key: 'value', header: 'Value (Giá trị)', value: 'Price', align: 'right' }),
            tableCol({ key: 'plant', header: 'Plant', code: 'Plant', text: 'PlantName' }),
            tableCol({ key: 'storageLocation', header: 'Storage location', code: 'StorageLocation', text: 'StorageLocationName' }),
            tableCol({ key: 'requirementDate', header: 'Requirement date', source: 'RequirementDate', formatter: (val) => formatRawDate(val) }),
            tableCol({ key: 'glAccount', header: 'G/L account', code: 'GLAccount', text: 'GLAccountText' })
        ]
    }
};
