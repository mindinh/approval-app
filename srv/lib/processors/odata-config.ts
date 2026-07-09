import { ObjectTypeCode } from './object-config';

export const SAP_TYPEID_OBJECT_MAP: Record<string, ObjectTypeCode> = {
  // PR
  "BUS2105": "PR",
  "WS90000001": "PR", // example workflow task template ID
  
  // PO
  "BUS2012": "PO",
  
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
