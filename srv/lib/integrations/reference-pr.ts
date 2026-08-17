import { SapClient } from './sap-client';
import { Logger } from '../utils/logger';
import { AppError } from '../utils/error-handler';

export interface ReferencePrHeader {
    purchaseRequisition: string;
    purchaseRequisitionType?: string;
    purchaseRequisitionTypeDisplay?: string;
    createdByUser?: string;
    createdByFullName?: string;
    creationDate?: string;
    purchaseRequisitionStatus?: string;
    purchaseRequisitionStatusText?: string;
    purReqnDescription?: string;
    totalAmount?: number | string;
    currency?: string;
    companyCode?: string;
    companyCodeName?: string;
    plant?: string;
    plantName?: string;
    purchasingGroup?: string;
    headerNote?: string;
}

export interface ReferencePrItem {
    purchaseRequisition: string;
    purchaseRequisitionItem: string;
    material?: string;
    purchaseRequisitionItemText?: string;
    plant?: string;
    plantName?: string;
    storageLocation?: string;
    storageLocationName?: string;
    materialGroup?: string;
    materialGroupName?: string;
    requestedQuantity?: number | string;
    baseUnit?: string;
    purchaseRequisitionPrice?: number | string;
    totalAmount?: number | string;
    purReqnItemCurrency?: string;
    deliveryDate?: string;
    glAccount?: string;
    glAccountName?: string;
    costCenter?: string;
    costCenterName?: string;
    wbsElement?: string;
    commitmentItem?: string;
    accountAssignments?: any[];
    deliveryAddress?: any;
    itemNotes?: any[];
}

export interface ReferencePrDetail {
    header: ReferencePrHeader;
    items: ReferencePrItem[];
}

const logger = new Logger('ReferencePrIntegration');
const sapClient = new SapClient();
const SERVICE_PATH = '/sap/opu/odata/sap/API_PURCHASEREQ_PROCESS_SRV';
const FULL_EXPAND = 'to_PurchaseReqnItem,to_PurchaseReqnItem/to_PurchaseReqnAcctAssgmt,to_PurchaseReqnItem/to_PurchaseReqnDeliveryAddress,to_PurchaseReqnItem/to_PurchaseReqnItemText';

function parseSapDate(val?: any): string {
    if (!val) return '';
    if (typeof val === 'string' && val.includes('/Date(')) {
        const match = val.match(/\/Date\((\d+)\)\//);
        if (match) {
            const timestamp = parseInt(match[1], 10);
            return new Date(timestamp).toISOString().split('T')[0];
        }
    }
    if (typeof val === 'string' && val.includes('T')) {
        return val.split('T')[0];
    }
    return String(val);
}

export async function fetchReferencePrDetail(
    prNumber: string,
    sapUser: string,
    userJwt?: string
): Promise<ReferencePrDetail> {
    const stripped = prNumber.replace(/^0+/, '');
    const cleanPrNumber = stripped.length > 0 ? stripped : (prNumber || '0');
    const paddedPrNumber = cleanPrNumber.padStart(10, '0');

    try {
        logger.info(`[SAP OData] Querying ${SERVICE_PATH}/A_PurchaseRequisitionHeader('${paddedPrNumber}')?$expand=${FULL_EXPAND}`);

        let response: any;
        try {
            response = await sapClient.get(
                SERVICE_PATH,
                `/A_PurchaseRequisitionHeader('${paddedPrNumber}')`,
                { $expand: FULL_EXPAND, $format: 'json' },
                sapUser,
                userJwt
            );
        } catch (err: any) {
            // Try with unpadded ID if padded ID query fails
            logger.warn(`Query with padded PR ID '${paddedPrNumber}' failed (${err.message}). Retrying with unpadded ID '${cleanPrNumber}'...`);
            response = await sapClient.get(
                SERVICE_PATH,
                `/A_PurchaseRequisitionHeader('${cleanPrNumber}')`,
                { $expand: FULL_EXPAND, $format: 'json' },
                sapUser,
                userJwt
            );
        }

        const rawHeader = response?.d || response?.value || response;
        if (rawHeader) {
            const rawItems = rawHeader.to_PurchaseReqnItem?.results ||
                             rawHeader.to_PurchaseReqnItem ||
                             rawHeader.to_PurchaseRequisitionItem?.results ||
                             rawHeader.to_PurchaseRequisitionItem || [];

            const items: ReferencePrItem[] = rawItems.map((it: any, idx: number) => {
                const qty = Number(it.RequestedQuantity ?? it.requestedQuantity ?? it.Quantity ?? 1);
                const price = Number(it.PurchaseRequisitionPrice ?? it.valuationPrice ?? it.Price ?? 0);
                const total = it.TotalAmount != null ? Number(it.TotalAmount) : (qty * price);
                const itemCurrency = it.PurReqnItemCurrency || it.Currency || it.documentCurrency || rawHeader.Currency || 'VND';

                // Extract Account Assignments
                const rawAcct = it.to_PurchaseReqnAcctAssgmt?.results || it.to_PurchaseReqnAcctAssgmt || [];
                const acctList = Array.isArray(rawAcct) ? rawAcct : (rawAcct ? [rawAcct] : []);
                const firstAcct = acctList[0] || {};

                // Extract Delivery Address
                const delivAddr = it.to_PurchaseReqnDeliveryAddress?.results || it.to_PurchaseReqnDeliveryAddress || null;

                // Extract Item Notes / Texts
                const rawNotes = it.to_PurchaseReqnItemText?.results || it.to_PurchaseReqnItemText || [];
                const notesList = Array.isArray(rawNotes) ? rawNotes : (rawNotes ? [rawNotes] : []);

                const glAcc = firstAcct.GLAccount || firstAcct.CostElement || it.GLAccount || it.GlAccount || '';
                const costCtr = firstAcct.CostCenter || it.CostCenter || '';
                const wbs = firstAcct.WBSElement || it.WBSElement || '';
                const commItem = firstAcct.CommitmentItem || it.CommitmentItem || '';

                return {
                    purchaseRequisition: String(it.PurchaseRequisition || paddedPrNumber),
                    purchaseRequisitionItem: String(it.PurchaseRequisitionItem || it.Item || ((idx + 1) * 10)),
                    material: it.Material || it.materialNumber || '',
                    purchaseRequisitionItemText: it.PurchaseRequisitionItemText || it.ShortText || it.HeaderNote || 'PR Line Item',
                    plant: it.Plant || '',
                    plantName: it.PlantName || it.Plant || '',
                    storageLocation: it.StorageLocation || '',
                    storageLocationName: it.StorageLocationName || it.StorageLocation || '',
                    materialGroup: it.MaterialGroup || '',
                    materialGroupName: it.MaterialGroupName || it.MaterialGroup || '',
                    requestedQuantity: qty,
                    baseUnit: it.BaseUnit || it.Unit || 'EA',
                    purchaseRequisitionPrice: price,
                    totalAmount: total,
                    purReqnItemCurrency: itemCurrency,
                    deliveryDate: parseSapDate(it.DeliveryDate),
                    glAccount: glAcc,
                    glAccountName: firstAcct.GLAccountName || it.GLAccountName || '',
                    costCenter: costCtr,
                    costCenterName: firstAcct.CostCenterName || it.CostCenterName || '',
                    wbsElement: wbs,
                    commitmentItem: commItem,
                    accountAssignments: acctList,
                    deliveryAddress: delivAddr,
                    itemNotes: notesList
                };
            });

            const computedHeaderTotal = items.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);
            const headerCurrency = rawHeader.Currency || items.find((it) => Boolean(it.purReqnItemCurrency))?.purReqnItemCurrency || 'VND';

            return {
                header: {
                    purchaseRequisition: String(rawHeader.PurchaseRequisition || paddedPrNumber),
                    purchaseRequisitionType: rawHeader.PurchaseRequisitionType || 'NB',
                    purchaseRequisitionTypeDisplay: rawHeader.PurchaseRequisitionTypeDisplay || rawHeader.PurchaseRequisitionType || 'Standard PR',
                    createdByUser: rawHeader.CreatedByUser || sapUser,
                    createdByFullName: rawHeader.CreatedByFullName || rawHeader.CreatedByUser || 'Requisitioner',
                    creationDate: parseSapDate(rawHeader.CreationDate),
                    purchaseRequisitionStatus: rawHeader.PurchaseRequisitionStatus || 'RELEASED',
                    purchaseRequisitionStatusText: rawHeader.PurchaseRequisitionStatusText || 'Approved / Released',
                    purReqnDescription: rawHeader.PurReqnDescription || rawHeader.PurchaseRequisitionText || `Reference PR ${paddedPrNumber}`,
                    totalAmount: rawHeader.TotalAmount != null ? Number(rawHeader.TotalAmount) : computedHeaderTotal,
                    currency: headerCurrency,
                    companyCode: rawHeader.CompanyCode || '1000',
                    companyCodeName: rawHeader.CompanyCodeName || rawHeader.CompanyCode || '',
                    purchasingGroup: rawHeader.PurchasingGroup || '',
                    headerNote: rawHeader.HeaderNote || rawHeader.PurReqnDescription || ''
                },
                items
            };
        }
        throw new AppError(`Reference PR ${paddedPrNumber} not found`, 404);
    } catch (err: any) {
        if (err instanceof AppError) throw err;
        logger.error(`Failed to fetch Reference PR from SAP API_PURCHASEREQ_PROCESS_SRV: ${err.message}`, err);
        throw new AppError(`Failed to fetch Reference PR ${paddedPrNumber}: ${err.message}`, 404);
    }
}
