import { ObjectTypeCode } from './object-config';

export const SAP_TYPEID_OBJECT_MAP: Record<string, ObjectTypeCode> = {
  // PR
  "BUS2105": "PR",
  "WS90000001": "PR", // example workflow task template ID

  // PO
  "BUS2012": "PO",
  "TS20000166": "PO", // Standard PO release task
  "TS20000172": "PO", // Standard PO item release task

  // Reservation
  "BUS2093": "RE",

  // Claim
  "ZCLAIM": "CLAIM"
};

export function resolveObjectTypeFromTypeId(typeid: string): ObjectTypeCode {
  if (!typeid) {
    return "PR";
  }
  const typeStr = String(typeid);
  // Check if direct map exists
  const objectType = SAP_TYPEID_OBJECT_MAP[typeStr];
  if (objectType) {
    return objectType;
  }

  // Regex mapping checks for common prefixes/patterns
  if (typeStr.includes("BUS2105") || typeStr.startsWith("TS") && typeStr.toLowerCase().includes("pr")) {
    return "PR";
  }
  if (typeStr.includes("BUS2012") || typeStr.toLowerCase().includes("po")) {
    return "PO";
  }
  if (typeStr.includes("BUS2093") || typeStr.toLowerCase().includes("res")) {
    return "RE";
  }

  // Fallback to PR default (or throw if preferred, let's return PR as default)
  return "PR";
}

export const ODATA_SERVICES = {
  TASKPROCESSING: {
    servicePath: process.env.ODATA_PATH_TASKPROCESSING || '/sap/opu/odata/IWPGW/TASKPROCESSING;v=2',
    entitySet: 'TaskCollection'
  },
  INSTANCE_LIST: {
    servicePath: process.env.ODATA_PATH_INSTANCE_LIST || '/sap/opu/odata4/sap/zsb_prorequest/srvd_a2x/sap/zsd_prorequest/0001',
    entitySet: 'ZC_WORKFLOWTASK'
  }
};

export interface ODataServiceConfig {
  servicePath: string;
  headerEntity: string;
  docCategory?: string;
  itemsEntity?: string;
  approvalTreeEntity?: string;
  commentsEntity?: string;
  attachmentsEntity?: string;
  commentPostAction?: string;
  attachmentPostAction?: string;
  accountAssignmentsEntity?: string;
  scheduleLinesEntity?: string;
  itemMapper?: Record<string, string | ((item: any) => any)>;
}

export const ODATA_DETAIL_CONFIGS: Record<ObjectTypeCode, ODataServiceConfig> = {
  PR: {
    servicePath: '/sap/opu/odata4/sap/zsb_prorequest/srvd_a2x/sap/zsd_prorequest/0001',
    headerEntity: 'ZC_PRHEADER',
    docCategory: 'BUS2105',
    itemMapper: {
      purchaseRequisition: 'DocumentNumber',
      purchaseRequisitionItem: 'ItemNumber',
      purchaseRequisitionItemText: (item: any) => item.MaterialText || item.ItemText || `Item ${item.ItemNumber} (${item.Material || 'Service'})`,
      material: (item: any) => item.Material || '',
      materialGroup: (item: any) => item.MaterialGroup || '',
      materialGroupText: (item: any) => item.MaterialGroupText || '',
      requestedQuantity: (item: any) => String(item.Quantity || '0'),
      baseUnit: (item: any) => item.Unit || 'PC',
      purchaseRequisitionPrice: (item: any) => {
        const qty = Number(item.Quantity || 0);
        const netAmt = Number(item.NetAmount || 0);
        return qty > 0 ? String(netAmt / qty) : String(netAmt);
      },
      purReqnItemCurrency: (item: any) => item.DocumentCurrency || 'VND',
      purReqnItemTotalAmount: (item: any) => String(item.NetAmount || '0'),
      deliveryDate: (item: any) => item.DeliveryDate || new Date().toISOString(),
      plant: (item: any) => item.Plant || '',
      costCenter: (item: any) => item.CostCenter || '',
      costCenterDescription: (item: any) => item.CostCenterDescription || '',
      documentType: (item: any) => item.DocumentType || ''
    }
  },
  PO: {
    servicePath: '/sap/opu/odata4/sap/zsb_prorequest/srvd_a2x/sap/zsd_prorequest/0001',
    headerEntity: 'ZC_POHEADER',
    docCategory: 'BUS2012',
    itemMapper: {
      purchaseOrder: 'DocumentNumber',
      purchaseOrderItem: 'ItemNumber',
      purchaseOrderItemText: (item: any) => item.MaterialText || item.ItemText || `Item ${item.ItemNumber} (${item.Material || 'Service'})`,
      material: (item: any) => item.Material || '',
      materialGroup: (item: any) => item.MaterialGroup || '',
      materialGroupText: (item: any) => item.MaterialGroupText || '',
      orderQuantity: (item: any) => String(item.Quantity || '0'),
      purchaseOrderQuantityUnit: (item: any) => item.Unit || 'PC',
      netPriceAmount: (item: any) => {
        const qty = Number(item.Quantity || 0);
        const netAmt = Number(item.NetAmount || 0);
        return qty > 0 ? String(netAmt / qty) : String(netAmt);
      },
      purchaseOrderPriceUnit: (item: any) => item.DocumentCurrency || 'VND',
      documentCurrency: (item: any) => item.DocumentCurrency || 'VND',
      netAmount: (item: any) => String(item.NetAmount || '0'),
      plant: (item: any) => item.Plant || ''
    }
  },
  // Placeholders to satisfy type-checking for Reservation / Claim
  RE: {
    servicePath: '',
    headerEntity: ''
  },
  CLAIM: {
    servicePath: '',
    headerEntity: ''
  }
};
