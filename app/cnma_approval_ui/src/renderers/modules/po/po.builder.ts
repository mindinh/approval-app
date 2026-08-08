import type { TaskDetail } from '@/services/inbox/inbox.types';
import type { BusinessSectionModel, DetailTableModel, DetailTableRow } from '../../TaskDetailSections.types';
import {
    EMPTY_VALUE,
    formatAmount,
    formatCodeWithText,
    formatDate,
    formatMaterialShortText,
    normalizeDisplayValue
} from '../../shared/formatters';
import {
    buildCustomAttributesTable,
    buildTaskObjectsTable,
    createAttributeIndex,
    field,
    pickByAlias
} from '../../shared/base.builder';
import { PO_SUBTYPE_CONFIGS } from './subtypes';

export interface RawPoItem {
    item?: string | number;
    itemNumber?: string | number;
    purchaseOrderItem?: string | number;
    plant?: string;
    Plant?: string;
    plantCode?: string;
    PlantCode?: string;
    plantDisplay?: string;
    plantName?: string;
    plantText?: string;
    PlantName?: string;
    PlantText?: string;
    storageLocation?: string;
    StorageLocation?: string;
    storageLocationDisplay?: string;
    storageLocationName?: string;
    storageLocationText?: string;
    StorageLocationName?: string;
    StorageLocationText?: string;
    material?: string;
    materialNumber?: string;
    Material?: string;
    shortText?: string;
    materialText?: string;
    purchaseOrderItemText?: string;
    purReqnItemText?: string;
    materialGroup?: string;
    MaterialGroup?: string;
    materialGroupCode?: string;
    MaterialGroupCode?: string;
    materialGroupDisplay?: string;
    materialGroupText?: string;
    materialGroupName?: string;
    MaterialGroupText?: string;
    MaterialGroupName?: string;
    quantity?: string | number;
    Quantity?: string | number;
    unit?: string;
    baseUnit?: string;
    purchaseOrderQuantityUnit?: string;
    uom?: string;
    UoM?: string;
    deliveryDate?: string;
    DeliveryDate?: string;
    price?: string | number;
    Price?: string | number;
    valuationPrice?: string | number;
    ValuationPrice?: string | number;
    netPriceAmount?: string | number;
    NetPriceAmount?: string | number;
    netPrice?: string | number;
    NetPrice?: string | number;
    purchaseRequisitionPrice?: string | number;
    PurchaseRequisitionPrice?: string | number;
    totalAmount?: string | number;
    TotalAmount?: string | number;
    netAmount?: string | number;
    NetAmount?: string | number;
    totalValue?: string | number;
    TotalValue?: string | number;
    purReqnItemTotalAmount?: string | number;
    documentCurrency?: string;
    DocumentCurrency?: string;
    purReqnItemCurrency?: string;
    currency?: string;
    Currency?: string;
    docCurrency?: string;
    DocCurrency?: string;
    ReferenceDocumentNumber?: string;
    referenceDocumentNumber?: string;
    referenceDocument?: string;
    purchaseRequisition?: string;
    purchaseRequisitionNumber?: string;
    referencePr?: string;
    refPrNumber?: string;
    refDocNumber?: string;
    refDocumentNumber?: string;
    banfn?: string;
    glAccount?: string;
    GLAccount?: string;
    GlAccount?: string;
    glAccountDisplay?: string;
    glAccountName?: string;
    glAccountText?: string;
    GlAccountName?: string;
    GLAccountName?: string;
    fundsCenter?: string;
    department?: string;
    FundsCenter?: string;
    fundsCenterDisplay?: string;
    fundsCenterName?: string;
    fundsCenterText?: string;
    FundsCenterName?: string;
    commitmentItemShortId?: string;
    commitmentItem?: string;
    CommitmentItem?: string;
    commitmentItemDisplay?: string;
    commitmentItemName?: string;
    commitmentItemText?: string;
    CommitmentItemName?: string;
    [key: string]: any;
}

export function mapPoItemRowValues(item: RawPoItem, parentCurrency?: string): Record<string, string> {
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
        item: normalizeDisplayValue(item.item || item.itemNumber || item.purchaseOrderItem),
        plant: formatCodeWithText(
            item.plant || item.Plant || item.plantCode || item.PlantCode,
            item.plantDisplay || item.plantName || item.plantText || item.PlantName || item.PlantText
        ),
        storageLocation: formatCodeWithText(
            item.storageLocation || item.StorageLocation,
            item.storageLocationDisplay || item.storageLocationName || item.storageLocationText || item.StorageLocationName || item.StorageLocationText
        ),
        material: normalizeDisplayValue(item.material || item.materialNumber || item.Material),
        materialNumber: normalizeDisplayValue(item.material || item.materialNumber || item.Material),
        shortText: formatMaterialShortText(item),
        materialGroup: formatCodeWithText(
            item.materialGroup || item.MaterialGroup || item.materialGroupCode || item.MaterialGroupCode,
            item.materialGroupDisplay || item.materialGroupText || item.materialGroupName || item.MaterialGroupText || item.MaterialGroupName
        ),
        quantity: item.quantity != null ? String(item.quantity) : item.Quantity != null ? String(item.Quantity) : EMPTY_VALUE,
        unit: normalizeDisplayValue(item.unit || item.baseUnit || item.purchaseOrderQuantityUnit || item.uom || item.UoM),
        deliveryDate: formatDate(item.deliveryDate || item.DeliveryDate),
        price: itemPrice != null ? formatAmount(itemPrice, itemCurrency) : EMPTY_VALUE,
        totalAmount: itemTotal != null ? formatAmount(itemTotal, itemCurrency) : EMPTY_VALUE,
        referencePr: normalizeDisplayValue(
            item.ReferenceDocumentNumber ||
            item.referenceDocumentNumber ||
            item.referenceDocument ||
            item.purchaseRequisition ||
            item.purchaseRequisitionNumber ||
            item.referencePr ||
            item.refPrNumber ||
            item.refDocNumber ||
            item.refDocumentNumber ||
            item.banfn
        ),
        glAccount: formatCodeWithText(
            item.glAccount || item.GLAccount || item.GlAccount,
            item.glAccountDisplay || item.glAccountName || item.glAccountText || item.GlAccountName || item.GLAccountName
        ),
        fundsCenter: formatCodeWithText(
            item.fundsCenter || item.department || item.FundsCenter,
            item.fundsCenterDisplay || item.fundsCenterName || item.fundsCenterText || item.FundsCenterName
        ),
        commitmentItem: formatCodeWithText(
            item.commitmentItemShortId || item.commitmentItem || item.CommitmentItem,
            item.commitmentItemDisplay || item.commitmentItemName || item.commitmentItemText || item.CommitmentItemName
        ),
        commitmentItemShortId: formatCodeWithText(
            item.commitmentItemShortId || item.commitmentItem || item.CommitmentItem,
            item.commitmentItemDisplay || item.commitmentItemName || item.commitmentItemText || item.CommitmentItemName
        ),
    };
}

export function buildDefaultPoItemsTable(rawItems?: RawPoItem[], parentCurrency?: string): DetailTableModel | null {
    if (!rawItems || rawItems.length === 0) return null;

    const rows: DetailTableRow[] = rawItems.map((item, idx) => ({
        id: String(item.item || item.itemNumber || item.purchaseOrderItem || idx),
        values: mapPoItemRowValues(item, parentCurrency)
    }));

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
            { key: 'referencePr', label: 'Reference PR' },
            { key: 'glAccount', label: 'G/L Account' },
            { key: 'fundsCenter', label: 'Funds Center' },
            { key: 'commitmentItemShortId', label: 'Commitment Item' }
        ],
        rows,
        emptyMessage: 'No items available'
    });
}

export function buildPoModel(detail: TaskDetail): BusinessSectionModel {
    const attrIndex = createAttributeIndex(detail.customAttributes);
    const rawDocType = detail.documentType || detail.header?.purchaseOrderType || detail.header?.documentType || '';
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
        detail.header?.documentCurrency ||
        detail.header?.displayCurrency ||
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

    const docTypeText = detail.header?.purchaseOrderTypeText || detail.header?.purchaseOrderTypeDescription || detail.header?.documentTypeText || detail.header?.doctyp_desc || '';
    const rawDocTypeDisplay = detail.documentTypeDisplay || detail.header?.purchaseOrderTypeDisplay;
    const docTypeDisplay = (rawDocTypeDisplay && rawDocTypeDisplay.includes('-'))
        ? rawDocTypeDisplay
        : (docType ? formatCodeWithText(docType, docTypeText || (rawDocTypeDisplay !== docType ? rawDocTypeDisplay : undefined)) : EMPTY_VALUE);

    const compCodeDisplay = formatCodeWithText(
        detail.companyCode || detail.header?.companyCode,
        detail.companyCodeDisplay || detail.header?.companyCodeDisplay
    );

    const isZub = docType === 'ZUB';

    let overviewFields;
    if (isZub) {
        const receivingPlantDisplay = formatCodeWithText(
            detail.header?.receivingPlant || detail.header?.plant,
            detail.header?.receivingPlantName || detail.header?.plantName || detail.header?.plantDisplay
        );
        const requesterBase = detail.header?.userName || detail.requestorName || detail.header?.userFullName || detail.header?.createdByUser;
        const requesterWithPlant = receivingPlantDisplay !== EMPTY_VALUE
            ? (requesterBase ? `${requesterBase} - ${receivingPlantDisplay}` : receivingPlantDisplay)
            : requesterBase;

        const supplyingPlantDisplay = formatCodeWithText(
            detail.header?.supplyingPlant || detail.header?.supplyingPlantCode || detail.header?.sendingPlant,
            detail.header?.supplyingPlantName || detail.header?.supplyingPlantText || detail.header?.sendingPlantName || detail.header?.supplyingPlantDisplay
        );

        overviewFields = [
            field('Document Number', documentId),
            field('Document Type', docTypeDisplay),
            field('Requester', requesterWithPlant),
            field('Created On', formatDate(detail.header?.creationDate || detail.createdOn || detail.header?.createdOn, detail.header?.creationTime || detail.header?.CreationTime || detail.header?.creation_time)),
            field('Release Strategy Name', detail.releaseStrategyName || detail.header?.releaseStrategyName),
            field('Header Text', detail.headerNote || detail.header?.purchaseOrderText),
            field('Supplying Plant', supplyingPlantDisplay),
            field('Company Code', compCodeDisplay),
            field('Total Amount', formatAmount(totalOrderValue, currency)),
        ];
    } else {
        overviewFields = [
            field('PO Number', documentId),
            field('Document Type', docTypeDisplay),
            field('Requester', detail.header?.userName || detail.requestorName || detail.header?.userFullName || detail.header?.createdByUser),
            field('Vendor', detail.header?.vendorDisplay || detail.header?.supplierDisplay || pickByAlias(attrIndex, 'supplier')),
            field('Release Strategy', detail.releaseStrategyName || detail.header?.releaseStrategyName),
            field('Company Code', compCodeDisplay),
            field('Created On', formatDate(detail.header?.creationDate || detail.createdOn || detail.header?.createdOn, detail.header?.creationTime || detail.header?.CreationTime || detail.header?.creation_time)),
            field('Payment Terms', detail.header?.paymentTermsDisplay || detail.header?.paymentTermsDescription || detail.header?.paymentTerms),
            field('Subtotal (Excl. VAT)', formatAmount(subtotalExclVat, currency)),
            field('Shipping Fee', formatAmount(shippingFee, currency)),
            field('VAT', formatAmount(vatAmount, currency)),
            field('Total', formatAmount(totalOrderValue, currency)),
            field('Header Note', detail.headerNote || detail.header?.purchaseOrderText),
        ];
    }

    const subtypeConfig = PO_SUBTYPE_CONFIGS[docType];
    const itemsTable = subtypeConfig
        ? subtypeConfig.buildItemsTable(detail.items, currency)
        : buildDefaultPoItemsTable(detail.items, currency);

    const tables: DetailTableModel[] = [];
    if (itemsTable) tables.push(itemsTable);
    if (detail.customAttributes && detail.customAttributes.length > 0) tables.push(buildCustomAttributesTable(detail.customAttributes));
    if (detail.taskObjects && detail.taskObjects.length > 0) tables.push(buildTaskObjectsTable(detail.taskObjects));

    const titleLabel = rawDocTypeDisplay || (docType ? docType : 'PO');

    return {
        title: `${titleLabel} Details`,
        subtitle: documentId ? `Document ${documentId}` : 'Purchase Order details',
        cards: [
            {
                id: 'po-summary',
                title: 'Overview',
                fields: overviewFields,
            },
        ],
        tables,
    };
}
