import type { DetailTableModel, DetailTableRow } from '../../../TaskDetailSections.types';
import {
    EMPTY_VALUE,
    formatAmount,
    formatCodeWithText,
    formatDate,
    formatMaterialShortText,
    normalizeDisplayValue
} from '../../../shared/formatters';

export function buildPoZtolItemsTable(rawItems?: any[], parentCurrency?: string): DetailTableModel | null {
    if (!rawItems || rawItems.length === 0) return null;

    const rows: DetailTableRow[] = rawItems.map((item, idx) => {
        const itemCurrency = item.documentCurrency || item.purReqnItemCurrency || item.currency || item.docCurrency || parentCurrency || '';
        return {
            id: String(item.item || item.itemNumber || item.purchaseOrderItem || idx),
            values: {
                item: normalizeDisplayValue(item.item || item.itemNumber || item.purchaseOrderItem),
                plant: formatCodeWithText(item.plant, item.plantName || item.plantText),
                storageLocation: formatCodeWithText(item.storageLocation, item.storageLocationName || item.storageLocationText),
                materialNumber: normalizeDisplayValue(item.material || item.materialNumber),
                shortText: formatMaterialShortText(item),
                materialGroup: formatCodeWithText(item.materialGroup, item.materialGroupName || item.materialGroupText),
                quantity: item.quantity != null ? String(item.quantity) : EMPTY_VALUE,
                unit: normalizeDisplayValue(item.unit || item.baseUnit || item.purchaseOrderQuantityUnit || item.uom),
                deliveryDate: formatDate(item.deliveryDate),
                price: item.price != null ? formatAmount(item.price, itemCurrency) : (item.valuationPrice != null ? formatAmount(item.valuationPrice, itemCurrency) : EMPTY_VALUE),
                totalAmount: item.totalAmount != null ? formatAmount(item.totalAmount, itemCurrency) : (item.netAmount != null ? formatAmount(item.netAmount, itemCurrency) : EMPTY_VALUE),
                referencePr: normalizeDisplayValue(item.purchaseRequisition || item.referencePr || item.refPrNumber),
                glAccount: formatCodeWithText(item.glAccount, item.glAccountName || item.glAccountText),
                commitmentItem: formatCodeWithText(item.commitmentItemShortId || item.commitmentItem, item.commitmentItemName || item.commitmentItemText)
            }
        };
    });

    return {
        id: 'po-ztol-items',
        title: 'Line Items (Tools PO)',
        columns: [
            { key: 'item', label: 'Item' },
            { key: 'plant', label: 'Plant' },
            { key: 'storageLocation', label: 'Storage Location' },
            { key: 'materialNumber', label: 'Material Number' },
            { key: 'shortText', label: 'Short Text' },
            { key: 'materialGroup', label: 'Material Group' },
            { key: 'quantity', label: 'Quantity', align: 'right' },
            { key: 'unit', label: 'UoM' },
            { key: 'deliveryDate', label: 'Delivery Date' },
            { key: 'price', label: 'Valuation Price', align: 'right' },
            { key: 'totalAmount', label: 'Total Value', align: 'right' },
            { key: 'referencePr', label: 'Reference PR' },
            { key: 'glAccount', label: 'G/L Account' },
            { key: 'commitmentItem', label: 'Commitment Item' }
        ],
        rows,
        emptyMessage: 'No items available'
    };
}
