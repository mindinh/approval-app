import { ObjectTypeCode } from './object-config';

export const SAP_TYPEID_OBJECT_MAP: Record<string, ObjectTypeCode> = {
  // PR
  "PR": "PR",
  "BUS2105": "PR",
  "WS90000001": "PR", // example workflow task template ID

  // PO
  "PO": "PO",
  "BUS2012": "PO",
  "TS20000166": "PO", // Standard PO release task
  "TS20000172": "PO", // Standard PO item release task

  // Reservation
  "RE": "RE",
  "RESERVATION": "RE",
  "BUS2093": "RE",
  "ZBUS2093": "RE",

  // Claim
  "CLAIM": "CLAIM"
};

export function resolveObjectTypeFromTypeId(typeid: string | undefined | null): ObjectTypeCode | undefined {
  if (!typeid) {
    return undefined;
  }
  const typeStr = String(typeid).toUpperCase();
  const objectType = SAP_TYPEID_OBJECT_MAP[typeStr] || SAP_TYPEID_OBJECT_MAP[typeid];
  if (objectType) {
    return objectType;
  }

  if (typeStr.includes("BUS2105") || (typeStr.startsWith("TS") && typeStr.toLowerCase().includes("pr"))) {
    return "PR";
  }
  if (typeStr.includes("BUS2012") || typeStr.toLowerCase().includes("po")) {
    return "PO";
  }
  if (typeStr.includes("BUS2093") || typeStr.includes("ZBUS2093") || typeStr.toLowerCase().includes("res")) {
    return "RE";
  }
  if (typeStr.includes("CLAIM")) {
    return "CLAIM";
  }

  return undefined;
}


export function resolveObjectTypeFromInstance(inst: any, fallbackType: ObjectTypeCode = 'PR'): ObjectTypeCode {
  if (!inst) return fallbackType;

  const fromCategory = inst.DocCategory ? resolveObjectTypeFromTypeId(inst.DocCategory) || inst.DocCategory : undefined;
  if (fromCategory) return fromCategory as ObjectTypeCode;

  const fromTech = inst.TechnicalWrkflwObjectType ? resolveObjectTypeFromTypeId(inst.TechnicalWrkflwObjectType) || inst.TechnicalWrkflwObjectType : undefined;
  if (fromTech) return fromTech as ObjectTypeCode;

  const fromType = resolveObjectTypeFromTypeId(inst.typeid || inst.TaskDefinitionID || '');
  if (fromType) return fromType;

  return fallbackType;
}

export const ODATA_SERVICES = {
  TASKPROCESSING: {
    servicePath: process.env.ODATA_PATH_TASKPROCESSING || '/sap/opu/odata/IWPGW/TASKPROCESSING;v=2',
    entitySet: 'TaskCollection'
  },
  INSTANCE_LIST: {
    servicePath: process.env.ODATA_PATH_INSTANCE_LIST || '/sap/opu/odata4/sap/za_cnma_prorequest/srvd_a2x/sap/za_cnma_prorequest/0001',
    entitySet: 'CNMA_WFTASK'
  }
};

