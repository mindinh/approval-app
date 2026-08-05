import type { TaskDetail } from '@/services/inbox/inbox.types';
import type { BusinessSectionModel, DetailTableModel, DetailTableRow } from '../../TaskDetailSections.types';
import {
    EMPTY_VALUE,
    formatAmount,
    formatCodeWithText,
    formatDate,
    formatMaterialShortText,
    normalizeDisplayValue,
    normalizeAndOrderTableColumns
} from '../../shared/formatters';
import {
    buildCustomAttributesTable,
    buildTaskObjectsTable,
    createAttributeIndex,
    field,
    pickByAlias
} from '../../shared/base.builder';
import { PR_SUBTYPE_CONFIGS } from './subtypes';

export function buildDefaultPrItemsTable(rawItems?: any[], parentCurrency?: string): DetailTableModel | null {
    if (!rawItems || rawItems.length === 0) return null;

    const rows: DetailTableRow[] = rawItems.map((item, idx) => {
        const itemCurrency = item.documentCurrency || item.purReqnItemCurrency || item.currency || item.docCurrency || parentCurrency || '';
        return {
            id: String(item.item || item.itemNumber || item.purchaseRequisitionItem || idx),
            values: {
                item: normalizeDisplayValue(item.item || item.itemNumber || item.purchaseRequisitionItem),
                plant: formatCodeWithText(item.plant, item.plantName),
                storageLocation: formatCodeWithText(item.storageLocation, item.storageLocationName),
                material: normalizeDisplayValue(item.material || item.materialNumber),
                shortText: formatMaterialShortText(item),
                materialGroup: formatCodeWithText(item.materialGroup, item.materialGroupName),
                quantity: item.quantity != null ? String(item.quantity) : EMPTY_VALUE,
                unit: normalizeDisplayValue(item.unit || item.baseUnit || item.purchaseOrderQuantityUnit || item.uom),
                deliveryDate: formatDate(item.deliveryDate),
                price: item.price != null ? formatAmount(item.price, itemCurrency) : (item.valuationPrice != null ? formatAmount(item.valuationPrice, itemCurrency) : EMPTY_VALUE),
                totalAmount: item.totalAmount != null ? formatAmount(item.totalAmount, itemCurrency) : (item.netAmount != null ? formatAmount(item.netAmount, itemCurrency) : EMPTY_VALUE),
                glAccount: formatCodeWithText(item.glAccount, item.glAccountName),
                commitmentItemShortId: formatCodeWithText(item.commitmentItemShortId || item.commitmentItem, item.commitmentItemName)
            }
        };
    });

    return normalizeAndOrderTableColumns({
        id: 'items',
        title: 'Line Items',
        columns: [
            { key: 'item', label: 'Item' },
            { key: 'plant', label: 'Plant' },
            { key: 'storageLocation', label: 'Storage Location' },
            { key: 'material', label: 'Material Number' },
            { key: 'shortText', label: 'Short Text' },
            { key: 'materialGroup', label: 'Material Group' },
            { key: 'quantity', label: 'Quantity', align: 'right' },
            { key: 'unit', label: 'UoM' },
            { key: 'deliveryDate', label: 'Delivery Date' },
            { key: 'price', label: 'Valuation Price', align: 'right' },
            { key: 'totalAmount', label: 'Total Value', align: 'right' },
            { key: 'glAccount', label: 'G/L Account' },
            { key: 'commitmentItemShortId', label: 'Commitment Item' }
        ],
        rows,
        emptyMessage: 'No items available'
    });
}

export function buildPrModel(detail: TaskDetail): BusinessSectionModel {
    const attrIndex = createAttributeIndex(detail.customAttributes);
    const rawDocType = detail.documentType || detail.header?.purchaseRequisitionType || detail.header?.documentType || '';
    const docType = rawDocType.split(/[\s-]/)[0].toUpperCase().trim();

    const documentId =
        detail.documentId ||
        detail.businessContext?.documentId ||
        pickByAlias(attrIndex, 'documentId') ||
        (detail.taskObjects && detail.taskObjects[0]?.objectId);

    const netValue =
        (detail.total != null ? String(detail.total) : undefined) ||
        pickByAlias(attrIndex, 'netValue') ||
        (detail.task?.total != null ? String(detail.task.total) : undefined) ||
        (detail.task?.total_doc_curr != null ? String(detail.task.total_doc_curr) : undefined);

    const currency =
        detail.currency ||
        pickByAlias(attrIndex, 'currency') ||
        detail.task?.curr_vnd ||
        detail.task?.doc_curr;

    const docTypeText = detail.header?.purchaseRequisitionTypeText || detail.header?.purchaseRequisitionTypeDescription || detail.header?.documentTypeText || detail.header?.doctyp_desc || '';
    const rawDocTypeDisplay = detail.documentTypeDisplay || detail.header?.purchaseRequisitionTypeDisplay;
    const docTypeDisplay = (rawDocTypeDisplay && rawDocTypeDisplay.includes('-'))
        ? rawDocTypeDisplay
        : (docType ? formatCodeWithText(docType, docTypeText || (rawDocTypeDisplay !== docType ? rawDocTypeDisplay : undefined)) : EMPTY_VALUE);

    const compCodeDisplay = formatCodeWithText(
        detail.companyCode || detail.header?.companyCode,
        detail.companyCodeDisplay || detail.header?.companyCodeDisplay
    );

    const formattedTotal = netValue ? formatAmount(netValue, currency) : EMPTY_VALUE;

    const overviewFields = [
        field('Document Number', documentId),
        field('Document Type', docTypeDisplay),
        field('Requester', detail.header?.userName || detail.requestorName || detail.header?.userFullName || detail.header?.createdByUser),
        field('Funds Center', formatCodeWithText(detail.header?.fundsCenter || detail.header?.department, detail.header?.departmentDisplay || detail.header?.fundsCenterName)),
        field('Created On', formatDate(detail.header?.creationDate || detail.createdOn || detail.header?.createdOn, detail.header?.creationTime || detail.header?.CreationTime || detail.header?.creation_time)),
        field('Release Strategy Name', detail.releaseStrategyName || detail.header?.releaseStrategyName),
        field('Total Amount', formattedTotal),
        field('Company Code', compCodeDisplay),
        field('Header Note', detail.headerNote || detail.header?.purchaseRequisitionText),
        field('Purpose', detail.header?.purpose),
        field('Paid By', detail.header?.paidBy),
        field('Bank Details', detail.header?.bankDetails),
    ];

    const subtypeConfig = PR_SUBTYPE_CONFIGS[docType];
    const itemsTable = subtypeConfig
        ? subtypeConfig.buildItemsTable(detail.items, currency)
        : buildDefaultPrItemsTable(detail.items, currency);

    const tables: DetailTableModel[] = [];
    if (itemsTable) tables.push(itemsTable);
    if (detail.customAttributes && detail.customAttributes.length > 0) tables.push(buildCustomAttributesTable(detail.customAttributes));
    if (detail.taskObjects && detail.taskObjects.length > 0) tables.push(buildTaskObjectsTable(detail.taskObjects));

    const titleLabel = rawDocTypeDisplay || (docType ? docType : 'PR');

    return {
        title: `${titleLabel} Details`,
        subtitle: documentId ? `Document ${documentId}` : 'Purchase Requisition details',
        cards: [
            {
                id: 'pr-summary',
                title: 'Overview',
                fields: overviewFields,
            },
        ],
        tables,
    };
}
