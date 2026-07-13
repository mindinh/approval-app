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
  // Check if direct map exists
  const objectType = SAP_TYPEID_OBJECT_MAP[typeid];
  if (objectType) {
    return objectType;
  }
  
  // Regex mapping checks for common prefixes/patterns
  if (typeid.includes("BUS2105") || typeid.startsWith("TS") && typeid.toLowerCase().includes("pr")) {
    return "PR";
  }
  if (typeid.includes("BUS2012") || typeid.toLowerCase().includes("po")) {
    return "PO";
  }
  if (typeid.includes("BUS2093") || typeid.toLowerCase().includes("res")) {
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
    servicePath: process.env.ODATA_PATH_INSTANCE_LIST || '/sap/opu/odata4/sap/zsb_pr_approval_tree/srvd_a2x/sap/zsd_pr_approval_tree/0001',
    entitySet: 'ZC_INSTANCE_LIST'
  }
};

export interface ODataServiceConfig {
  servicePath: string;
  headerEntity: string;
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
    servicePath: '/sap/opu/odata/SAP/C_PURREQUISITION_FS_SRV',
    headerEntity: 'C_PurRequisitionFs',
    itemsEntity: '/ZC_PR_CUSTOM',
    approvalTreeEntity: '/ZI_PR_APPROVAL_LINE',
    commentsEntity: '/ZI_PR_COMMENT_TAB',
    attachmentsEntity: '/ZI_PR_ATTACHMENTS',
    commentPostAction: "/ZI_PR_COMMENT(Banfn='{id}')/SAP__self.Comment",
    attachmentPostAction: "/ZI_PR_ATTACH_TAB(doc_num='{id}')/SAP__self.upload",
    itemMapper: {
      purchaseRequisition: 'PurchaseRequisition',
      purchaseRequisitionItem: 'PRItem',
      purchaseRequisitionItemText: (item: any) => item.MaterialDescription || `Item ${item.PRItem} (${item.Material || 'Service'})`,
      material: (item: any) => item.Material || '',
      materialGroup: (item: any) => item.MaterialGroup || '',
      materialGroupText: (item: any) => item.MaterialGroupText || '',
      requestedQuantity: (item: any) => String(item.Quantity || '0'),
      baseUnit: (item: any) => item.QuantityUnit || 'PC',
      purchaseRequisitionPrice: (item: any) => String(item.Price || '0'),
      purReqnItemCurrency: (item: any) => item.DocumentCurrency || 'VND',
      purReqnItemTotalAmount: (item: any) => {
        const calculatedTotal = Number(item.Price || 0) * Number(item.Quantity || 0);
        return item.NetValueDocCrcy !== undefined && item.NetValueDocCrcy !== null && Number(item.NetValueDocCrcy) !== 0
          ? String(item.NetValueDocCrcy)
          : String(calculatedTotal);
      },
      deliveryDate: (item: any) => item.DeliveryDate || new Date().toISOString(),
      plant: (item: any) => item.Plant || '',
      costCenter: (item: any) => item.CostCenter || '',
      costCenterDescription: (item: any) => item.CostCenterDescription || '',
      commitmentItem: (item: any) => item.CommitmentItem || '',
      documentType: (item: any) => item.DocumentType || '',
      priceUnit: 'PriceUnit',
      netValueLocalCrcy: 'NetValueLocalCrcy',
      localCrcy: 'LocalCrcy',
      netValueDocCrcy: 'NetValueDocCrcy'
    }
  },
  PO: {
    servicePath: '/sap/opu/odata/sap/C_PURCHASEORDER_FS_SRV',
    headerEntity: 'C_PurchaseOrderFs',
    itemsEntity: '/C_PurOrdItemEnh',
    accountAssignmentsEntity: '/C_POAccountAssignmentFactSheet',
    scheduleLinesEntity: '/C_POScheduleLineFactSheet'
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
