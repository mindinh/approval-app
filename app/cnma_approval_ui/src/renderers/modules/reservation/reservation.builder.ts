import type { TaskDetail } from '@/services/inbox/inbox.types';
import type { BusinessSectionModel, DetailTableModel, DetailTableRow } from '../../TaskDetailSections.types';
import {
    EMPTY_VALUE,
    formatAmount,
    formatCodeWithText,
    formatDate,
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



export function buildDefaultReservationItemsTable(rawItems?: any[], parentCurrency?: string): DetailTableModel | null {
    if (!rawItems || rawItems.length === 0) return null;

    const rows: DetailTableRow[] = rawItems.map((item, idx) => {
        const itemCurrency =
            item.Currency ||
            item.currency ||
            item.docCurrency ||
            item.documentCurrency ||
            parentCurrency ||
            '';

        const qtyRaw = item.Quantity != null ? String(item.Quantity) : (item.quantity != null ? String(item.quantity) : '');
        const unitVal = item.BaseUnit || item.baseUnit || item.unit || item.uom || '';
        const quantityFormatted = qtyRaw && unitVal ? `${qtyRaw} ${unitVal}` : (qtyRaw || EMPTY_VALUE);

        return {
            id: String(item.ItemNumber ?? item.itemNumber ?? item.Item ?? item.item ?? (idx + 1)),
            values: {
                plant: formatCodeWithText(item.Plant || item.plant, item.PlantName || item.plantName),
                storageLocation: formatCodeWithText(item.StorageLocation || item.storageLocation, item.StorageLocationName || item.storageLocationName),
                material: normalizeDisplayValue(item.Material || item.material || item.materialNumber),
                materialText: normalizeDisplayValue(item.MaterialText || item.materialText || item.shortText),
                quantity: quantityFormatted,
                cost: (item.MovingAveragePrice != null || item.movingAveragePrice != null)
                    ? formatAmount(item.MovingAveragePrice ?? item.movingAveragePrice, itemCurrency)
                    : EMPTY_VALUE,
                value: (item.Price != null || item.price != null)
                    ? formatAmount(item.Price ?? item.price, itemCurrency)
                    : EMPTY_VALUE,
                requirementDate: formatDate(item.RequirementDate || item.requirementDate || item.deliveryDate),
                glAccount: formatCodeWithText(item.GLAccount || item.glAccount, item.GLAccountText || item.glAccountText || item.glAccountName),
                itemText: normalizeDisplayValue(item.ItemText || item.itemText)
            }
        };
    });

    return normalizeAndOrderTableColumns({
        id: 'items',
        title: 'Line Items',
        columns: [
            { key: 'material', label: 'Material number' },
            { key: 'materialText', label: 'Material text' },
            { key: 'itemText', label: 'ITEM TEXT' },
            { key: 'quantity', label: 'Quantity', align: 'right' },
            { key: 'cost', label: 'Cost (Giá vốn)', align: 'right' },
            { key: 'value', label: 'Value (Giá trị)', align: 'right' },
            { key: 'plant', label: 'Plant' },
            { key: 'storageLocation', label: 'Storage location' },
            { key: 'requirementDate', label: 'Requirement date' },
            { key: 'glAccount', label: 'G/L account' }
        ],
        rows,
        emptyMessage: 'No items available',
        preserveOrder: true,
    });
}

export function buildReservationModel(detail: TaskDetail): BusinessSectionModel {
    const attrIndex = createAttributeIndex(detail.customAttributes);
    const header = (detail.header || detail.object || (detail as unknown as Record<string, any>)) || {};

    const documentId =
        detail.documentId ||
        detail.businessContext?.documentId ||
        header.DocumentNumber ||
        header.documentNumber ||
        header.DocumentId ||
        header.documentId ||
        pickByAlias(attrIndex, 'documentId') ||
        (detail.taskObjects && detail.taskObjects[0]?.objectId);

    const requester =
        header.UserName ||
        header.userName ||
        header.userFullName ||
        header.createdByName ||
        header.CreatedByUser ||
        header.createdByUser ||
        detail.header?.userName ||
        detail.requestorName ||
        EMPTY_VALUE;

    const creationDate = header.CreationDate || header.creationDate || header.createdOn || header.CreatedOn || detail.createdOn;
    const creationTime = header.CreationTime || header.creationTime;
    const createdOn = formatDate(creationDate, creationTime);

    const plantDisplay = formatCodeWithText(
        header.Plant || header.plant,
        header.PlantName || header.plantName
    );

    const movementTypeDisplay = formatCodeWithText(
        header.MovementType || header.movementType,
        header.MovementTypeName || header.movementTypeName
    );

    const costCenterDisplay = formatCodeWithText(
        header.CostCenter || header.costCenter,
        header.CostCenterName || header.costCenterName
    );

    const totalVal =
        header.Total ??
        header.total ??
        header.TotalNetAmountLocalCrcy ??
        header.totalNetAmountLocalCrcy ??
        detail.total ??
        detail.task?.total;
    const currencyVal =
        header.Currency ||
        header.currency ||
        header.LocalCurrency ||
        header.localCurrency ||
        detail.currency ||
        detail.task?.curr_vnd ||
        detail.task?.doc_curr ||
        'VND';
    const formattedTotal = totalVal != null ? formatAmount(totalVal, currencyVal) : EMPTY_VALUE;

    const releaseStrategyName =
        header.ReleaseStrategyText ||
        header.releaseStrategyText ||
        header.ReleaseStrategyName ||
        header.releaseStrategyName ||
        detail.releaseStrategyName ||
        detail.header?.releaseStrategyName ||
        EMPTY_VALUE;

    const docType = header.DocumentType || header.documentType || 'RESV';
    const docTypeText = header.DocumentTypeText || header.documentTypeText || 'Reservation';
    const documentTypeDisplay = formatCodeWithText(docType, docTypeText);

    const overviewFields = [
        field('Document number', documentId),
        field('Document type', documentTypeDisplay),
        field('Requester', requester),
        field('Created on', createdOn),
        field('Total amount', formattedTotal),
        field('Plant', plantDisplay),
        field('Movement type', movementTypeDisplay),
        field('Cost center', costCenterDisplay),
        field('Release Strategy Name', releaseStrategyName),
    ];

    const rawItems =
        detail.items ||
        header._Item ||
        header.items ||
        header.Item ||
        detail.object?._Item ||
        detail.object?.items;

    const itemsTable = buildDefaultReservationItemsTable(rawItems, currencyVal);

    const tables: DetailTableModel[] = [];
    if (itemsTable) tables.push(itemsTable);
    if (detail.customAttributes && detail.customAttributes.length > 0) tables.push(buildCustomAttributesTable(detail.customAttributes));
    if (detail.taskObjects && detail.taskObjects.length > 0) tables.push(buildTaskObjectsTable(detail.taskObjects));

    return {
        title: 'Reservation Details',
        subtitle: documentId ? `Reservation ${documentId}` : 'Reservation details',
        cards: [
            {
                id: 'reservation-summary',
                title: 'Overview',
                fields: overviewFields,
            },
        ],
        tables,
    };
}


