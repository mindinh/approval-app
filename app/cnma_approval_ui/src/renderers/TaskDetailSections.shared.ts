import type {
    CustomAttribute,
    TaskDetail,
    TaskObject,
} from '@/services/inbox/inbox.types';
import type { DetailField, DetailTableModel, DetailTableRow } from './TaskDetailSections.types';
import { formatAmountWithCurrency } from '@/pages/Inbox/utils/formatters';
import { formatCodeWithText, formatDate, formatMaterialShortText, normalizeAndOrderTableColumns } from './shared/formatters';

const EMPTY_VALUE = '-';

const ATTRIBUTE_NAME_ALIASES: Record<string, string[]> = {
    documentId: ['ponumber', 'purchasenumber', 'purchaseorder', 'prnumber', 'purchaserequisition', 'banfn', 'ebeln'],
    supplier: ['vendorname', 'supplier', 'suppliername', 'lifnr'],
    companyCode: ['companycode', 'bukrs'],
    purchasingOrg: ['purchorganization', 'purchasingorganization', 'ekorg'],
    paymentTerms: ['paymentterms', 'zterm'],
    incoterms: ['incoterms', 'inco1', 'inco2'],
    netValue: ['netvalue', 'totalvalue', 'amount'],
    currency: ['currency', 'waers'],
    totalnetvaluebeforetax: ['totalnetvaluebeforetax', 'subtotal', 'netvaluebeforetax'],
    totalfreightamount: ['totalfreightamount', 'freightamount', 'shippingfee'],
    totalvatamount: ['totalvatamount', 'vatamount', 'taxamount', 'vat'],
    totalordervalue: ['totalordervalue', 'ordervalue', 'totalamount', 'netvalue'],
};

export function normalizeDisplayValue(value: unknown): string {
    if (value == null) return EMPTY_VALUE;
    const text = String(value).trim();
    return text ? text : EMPTY_VALUE;
}

export function field(label: string, value: unknown, key?: string): DetailField {
    return {
        key: key || label.toLowerCase().replace(/\s+/g, '-'),
        label,
        value: normalizeDisplayValue(value),
    };
}

export function createAttributeIndex(attributes?: CustomAttribute[]): Map<string, CustomAttribute> {
    const index = new Map<string, CustomAttribute>();
    for (const attr of (attributes || [])) {
        if (!attr || !attr.name) continue;
        index.set(attr.name.toLowerCase(), attr);
        if (attr.label) {
            index.set(attr.label.toLowerCase(), attr);
        }
    }
    return index;
}

export function pickAttribute(
    index: Map<string, CustomAttribute>,
    candidates: string[]
): CustomAttribute | undefined {
    if (!index || !candidates || !Array.isArray(candidates)) return undefined;
    for (const key of candidates) {
        if (!key) continue;
        const direct = index.get(key.toLowerCase());
        if (direct) return direct;
    }

    // fallback: fuzzy contains
    for (const [key, value] of index) {
        if (candidates.some((candidate) => candidate && key.includes(candidate.toLowerCase()))) {
            return value;
        }
    }

    return undefined;
}

export function pickByAlias(
    index: Map<string, CustomAttribute>,
    aliasKey: string
): string | undefined {
    const candidates = ATTRIBUTE_NAME_ALIASES[aliasKey] || [aliasKey];
    return pickAttribute(index, candidates)?.value;
}

export function buildTaskObjectsTable(taskObjects?: TaskObject[]): DetailTableModel {
    const rows: DetailTableRow[] = (taskObjects || []).map((obj, idx) => ({
        id: `${obj.objectId}-${idx}`,
        values: {
            type: normalizeDisplayValue(obj.type),
            objectId: normalizeDisplayValue(obj.objectId),
            name: normalizeDisplayValue(obj.name),
            url: normalizeDisplayValue(obj.url),
        },
    }));

    return {
        id: 'task-objects',
        title: 'Related Objects',
        columns: [
            { key: 'type', label: 'Type' },
            { key: 'objectId', label: 'Object ID' },
            { key: 'name', label: 'Name' },
            { key: 'url', label: 'URL' },
        ],
        rows,
        emptyMessage: 'No related objects',
    };
}

export function buildCustomAttributesTable(attributes?: CustomAttribute[]): DetailTableModel {
    const rows: DetailTableRow[] = (attributes || []).map((attr) => ({
        id: attr.name,
        values: {
            label: normalizeDisplayValue(attr.label),
            value: normalizeDisplayValue(attr.value),
            type: normalizeDisplayValue(attr.type),
            technicalName: normalizeDisplayValue(attr.name),
        },
    }));

    return {
        id: 'custom-attributes',
        title: 'Custom Attributes',
        columns: [
            { key: 'label', label: 'Label' },
            { key: 'value', label: 'Value' },
            { key: 'type', label: 'Type' },
            { key: 'technicalName', label: 'Name' },
        ],
        rows,
        emptyMessage: 'No custom attributes',
    };
}

export function formatFileSize(size?: number): string {
    if (size == null || Number.isNaN(size)) return EMPTY_VALUE;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function buildItemsTable(rawItems?: any[], parentCurrency?: string): DetailTableModel | null {
    if (!rawItems || rawItems.length === 0) return null;
    const rows: DetailTableRow[] = rawItems.map((item, idx) => {
        const itemCurrency =
            item.documentCurrency ||
            item.DocumentCurrency ||
            item.purReqnItemCurrency ||
            item.currency ||
            item.Currency ||
            item.docCurrency ||
            item.DocCurrency ||
            parentCurrency ||
            'VND';

        const itemPrice =
            item.price ??
            item.Price ??
            item.valuationPrice ??
            item.ValuationPrice ??
            item.netPriceAmount ??
            item.NetPriceAmount ??
            item.netPrice ??
            item.NetPrice ??
            item.purchaseRequisitionPrice ??
            item.PurchaseRequisitionPrice;

        const itemTotal =
            item.totalAmount ??
            item.TotalAmount ??
            item.netAmount ??
            item.NetAmount ??
            item.totalValue ??
            item.TotalValue ??
            item.purReqnItemTotalAmount;

        return {
            id: String(item.item || item.itemNumber || item.purchaseOrderItem || idx),
            values: {
                item: normalizeDisplayValue(item.item || item.itemNumber || item.purchaseOrderItem),
                plant: formatCodeWithText(item.plant || item.Plant || item.plantCode || item.PlantCode, item.plantName || item.plantText || item.PlantName || item.PlantText),
                storageLocation: formatCodeWithText(item.storageLocation || item.StorageLocation, item.storageLocationName || item.storageLocationText || item.StorageLocationName || item.StorageLocationText),
                material: normalizeDisplayValue(item.material || item.materialNumber || item.Material),
                shortText: formatMaterialShortText(item),
                materialGroup: formatCodeWithText(item.materialGroup || item.MaterialGroup || item.materialGroupCode || item.MaterialGroupCode, item.materialGroupText || item.materialGroupName || item.MaterialGroupText || item.MaterialGroupName),
                quantity: item.quantity != null ? String(item.quantity) : (item.Quantity != null ? String(item.Quantity) : EMPTY_VALUE),
                unit: normalizeDisplayValue(item.unit || item.baseUnit || item.purchaseOrderQuantityUnit || item.uom || item.UoM),
                deliveryDate: normalizeDisplayValue(item.deliveryDate || item.DeliveryDate),
                price: itemPrice != null ? formatAmountWithCurrency(itemPrice, itemCurrency) : EMPTY_VALUE,
                totalAmount: itemTotal != null ? formatAmountWithCurrency(itemTotal, itemCurrency) : EMPTY_VALUE,
                glAccount: formatCodeWithText(item.glAccount || item.GLAccount || item.GlAccount, item.glAccountName || item.glAccountText || item.GlAccountName || item.GLAccountName),
                fundsCenter: formatCodeWithText(item.fundsCenter || item.department || item.FundsCenter, item.fundsCenterName || item.fundsCenterText || item.FundsCenterName),
                commitmentItemShortId: formatCodeWithText(item.commitmentItemShortId || item.commitmentItem || item.CommitmentItem, item.commitmentItemName || item.commitmentItemText || item.CommitmentItemName)
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
            { key: 'fundsCenter', label: 'Funds Center' },
            { key: 'commitmentItemShortId', label: 'Commitment Item' }
        ],
        rows,
        emptyMessage: 'No items available'
    });
}

export function buildDefaultBusinessModel(detail: TaskDetail) {
    const attrIndex = createAttributeIndex(detail.customAttributes);
    const businessType = (detail.objectType || detail.businessContext?.type || detail.task?.TaskDefinitionID || 'UNKNOWN').toUpperCase();
    const isPo = businessType === 'PO' || businessType === 'BUS2012';

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

    const subtotalExclVat =
        detail.header?.TotalNetValueBeforeTax ??
        detail.header?.totalNetValueBeforeTax ??
        pickByAlias(attrIndex, 'totalnetvaluebeforetax') ??
        detail.totalNetValueBeforeTax;

    const shippingFee =
        detail.header?.TotalFreightAmount ??
        detail.header?.totalFreightAmount ??
        pickByAlias(attrIndex, 'totalfreightamount') ??
        detail.totalFreightAmount;

    const vatAmount =
        detail.header?.TotalVatAmount ??
        detail.header?.totalVatAmount ??
        pickByAlias(attrIndex, 'totalvatamount') ??
        detail.totalVatAmount;

    const totalOrderValue =
        detail.header?.TotalOrderValue ??
        detail.header?.totalOrderValue ??
        pickByAlias(attrIndex, 'totalordervalue') ??
        detail.totalOrderValue ??
        netValue;

    const docTypeDisplay = detail.documentTypeDisplay || detail.header?.purchaseRequisitionTypeDisplay || detail.header?.purchaseOrderTypeText || businessType;
    const compCodeDisplay = detail.companyCodeDisplay || detail.companyCode || detail.header?.companyCodeDisplay || detail.header?.companyCode;

    const itemsTable = buildItemsTable(detail.items, currency);

    const tables: DetailTableModel[] = [];
    if (itemsTable) tables.push(itemsTable);
    if (detail.customAttributes && detail.customAttributes.length > 0) tables.push(buildCustomAttributesTable(detail.customAttributes));
    if (detail.taskObjects && detail.taskObjects.length > 0) tables.push(buildTaskObjectsTable(detail.taskObjects));

    const formattedTotal = netValue ? formatAmountWithCurrency(netValue, currency) : EMPTY_VALUE;

    const overviewFields = isPo
        ? [
            field('PO Number', documentId),
            field('Document Type', docTypeDisplay),
            field('Requester', detail.header?.userName || detail.requestorName || detail.header?.userFullName || detail.header?.createdByUser),
            field('Created On', formatDate(detail.header?.creationDate || detail.createdOn || detail.header?.createdOn, detail.header?.creationTime || detail.header?.CreationTime || detail.header?.creation_time)),
            field('Release Strategy', detail.releaseStrategyName || detail.header?.releaseStrategyName),
            field('Header Note', detail.headerNote || detail.header?.purchaseOrderText),
            field('Vendor', detail.header?.vendorDisplay || detail.header?.supplierDisplay || pickByAlias(attrIndex, 'supplier')),
            field('Company Code', compCodeDisplay),
            field('Subtotal (Excl. VAT)', subtotalExclVat ? formatAmountWithCurrency(subtotalExclVat, currency) : EMPTY_VALUE),
            field('Shipping Fee', shippingFee ? formatAmountWithCurrency(shippingFee, currency) : EMPTY_VALUE),
            field('VAT', vatAmount ? formatAmountWithCurrency(vatAmount, currency) : EMPTY_VALUE),
            field('Total', totalOrderValue ? formatAmountWithCurrency(totalOrderValue, currency) : formattedTotal),
            field('Payment Terms', detail.header?.paymentTermsDisplay || detail.header?.paymentTermsDescription || detail.header?.paymentTerms),
        ]
        : [
            field('Document Number', documentId),
            field('Document Type', docTypeDisplay),
            field('Requester', detail.header?.userName || detail.requestorName || detail.header?.userFullName || detail.header?.createdByUser),
            field('Funds Center', formatCodeWithText(detail.header?.fundsCenter || detail.header?.department, detail.header?.fundsCenterName || detail.header?.departmentDisplay)),
            field('Created On', formatDate(detail.header?.creationDate || detail.createdOn || detail.header?.createdOn, detail.header?.creationTime || detail.header?.CreationTime || detail.header?.creation_time)),
            field('Release Strategy Name', detail.releaseStrategyName || detail.header?.releaseStrategyName),
            field('Total Amount', formattedTotal),
            field('Company Code', compCodeDisplay),
            field('Header Note', detail.headerNote || detail.header?.purchaseRequisitionText),
            field('Purpose', detail.header?.purpose),
            field('Paid By', detail.header?.paidBy),
            field('Bank Details', detail.header?.bankDetails),
        ];

    return {
        title: `${docTypeDisplay} Details`,
        subtitle: documentId ? `Document ${documentId}` : 'General task details',
        cards: [
            {
                id: 'document-summary',
                title: 'Overview',
                fields: overviewFields,
            },
        ],
        tables,
    };
}
