import type { DetailTableModel, DetailTableRow } from '../../../TaskDetailSections.types';
import { mapPoItemRowValues, type RawPoItem } from '../po.builder';

export function buildPoZcorItemsTable(rawItems?: RawPoItem[], parentCurrency?: string): DetailTableModel | null {
    if (!rawItems || rawItems.length === 0) return null;

    const rows: DetailTableRow[] = rawItems.map((item, idx) => ({
        id: String(item.item || item.itemNumber || item.purchaseOrderItem || idx),
        values: mapPoItemRowValues(item, parentCurrency)
    }));

    return {
        id: 'po-zcor-items',
        title: 'Line Items (Correction PO)',
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
            { key: 'fundsCenter', label: 'Funds Center' },
            { key: 'commitmentItem', label: 'Commitment Item' }
        ],
        rows,
        emptyMessage: 'No items available'
    };
}
