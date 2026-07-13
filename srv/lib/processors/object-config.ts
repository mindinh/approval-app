export type ObjectTypeCode = "PO" | "PR" | "RE" | "CLAIM";

export type DataType =
  | "TEXT"
  | "DATE"
  | "AMOUNT"
  | "QUANTITY"
  | "STATUS"
  | "USER"
  | "BOOLEAN";

export interface FieldDefinition {
  key: string;
  label: string;
  dataPath: string;
  dataType: DataType;
  formatter?: string;
  fallbackValue?: string;
  currencyPath?: string;
}

export interface UiSection {
  id: string;
  type:
  | "CARD"
  | "TABLE"
  | "TIMELINE"
  | "APPROVAL_TREE"
  | "COMMENTS"
  | "ATTACHMENTS";
  title: string;
  fields?: string[];
  dataPath?: string;
  columns?: string[];
  visibleWhen?: {
    field: string;
    operator: "exists" | "eq" | "neq" | "gt" | "lt";
    value?: any;
  };
}

export interface UiSchema {
  title?: string;
  subtitle?: string;
  sections: UiSection[];
}

export interface ActionDefinition {
  key: string;
  label: string;
  variant: "PRIMARY" | "DANGER" | "SECONDARY";
  requiresComment: boolean;
  confirmRequired?: boolean;
  confirmMessage?: string;
  sapDecisionKey?: string;
}

export interface CardChipDefinition {
  label?: string;
  dataPath: string;
  dataType: DataType;
  formatter?: string;
  isPrimary?: boolean;
}

export interface ObjectTypeConfiguration {
  objectType: ObjectTypeCode;
  documentType: string;
  name: string;
  description?: string;
  budgetMode?: "NONE" | "WARNING" | "BLOCK";
  fieldSchema: Record<string, FieldDefinition>;
  uiSchema: UiSchema;
  actions: ActionDefinition[];
  cardChips?: CardChipDefinition[];
}

// ─── PR BASE CONFIG ──────────────────────────────────────────
export const PR_BASE_CONFIG: ObjectTypeConfiguration = {
  objectType: "PR",
  documentType: "BASE",
  name: "Purchase Requisition",
  budgetMode: "NONE",
  fieldSchema: {
    prNumber: {
      key: "prNumber",
      label: "PR Number",
      dataPath: "$.header.purchaseRequisition",
      dataType: "TEXT",
    },
    description: {
      key: "description",
      label: "Description",
      dataPath: "$.header.purchaseRequisitionText",
      dataType: "TEXT",
    },
    requester: {
      key: "requester",
      label: "Requestor",
      dataPath: "$.header.userFullName",
      dataType: "USER",
    },
    prTypeDisplay: {
      key: "prTypeDisplay",
      label: "PR Type",
      dataPath: "$.header.purchaseRequisitionTypeDisplay",
      dataType: "TEXT",
    },
    departmentDisplay: {
      key: "departmentDisplay",
      label: "Department",
      dataPath: "$.header.departmentDisplay",
      dataType: "TEXT",
    },
    expenseTypeDisplay: {
      key: "expenseTypeDisplay",
      label: "Expense Type / Commitment",
      dataPath: "$.header.expenseTypeDisplay",
      dataType: "TEXT",
    },
    totalAmount: {
      key: "totalAmount",
      label: "Total Net Amount",
      dataPath: "$.header.totalNetAmount",
      dataType: "AMOUNT",
      formatter: "currency",
      currencyPath: "$.header.displayCurrency"
    },
    currency: {
      key: "currency",
      label: "Currency",
      dataPath: "$.header.displayCurrency",
      dataType: "TEXT",
    },
    totalDocAmount: {
      key: "totalDocAmount",
      label: "Document Net Amount",
      dataPath: "$.header.totalDocNetAmount",
      dataType: "AMOUNT",
      formatter: "currency",
      currencyPath: "$.header.docCurrency"
    },
    docCurrency: {
      key: "docCurrency",
      label: "Document Currency",
      dataPath: "$.header.docCurrency",
      dataType: "TEXT",
    },
    numberOfItems: {
      key: "numberOfItems",
      label: "Number of Items",
      dataPath: "$.header.numberOfItems",
      dataType: "TEXT",
    },
    createdDate: {
      key: "createdDate",
      label: "Created On",
      dataPath: "$.header.purReqCreationDate",
      dataType: "DATE",
      formatter: "date",
    },
    priority: {
      key: "priority",
      label: "Priority",
      dataPath: "$.header.priority",
      dataType: "TEXT",
    },
    releaseStrategy: {
      key: "releaseStrategy",
      label: "Release Strategy",
      dataPath: "$.header.releaseStrategyName",
      dataType: "TEXT",
    },
    // Item Fields
    item: {
      key: "item",
      label: "Item",
      dataPath: "$.purchaseRequisitionItem",
      dataType: "TEXT",
    },
    shortText: {
      key: "shortText",
      label: "Short Text",
      dataPath: "$.purchaseRequisitionItemText",
      dataType: "TEXT",
    },
    material: {
      key: "material",
      label: "Material",
      dataPath: "$.material",
      dataType: "TEXT",
    },
    materialGroup: {
      key: "materialGroup",
      label: "Material Group",
      dataPath: "$.materialGroupDisplay",
      dataType: "TEXT",
    },
    quantity: {
      key: "quantity",
      label: "Quantity",
      dataPath: "$.requestedQuantity",
      dataType: "QUANTITY",
      formatter: "quantity",
    },
    price: {
      key: "price",
      label: "Price",
      dataPath: "$.purchaseRequisitionPrice",
      dataType: "AMOUNT",
      formatter: "currency",
    },
    itemTotalAmount: {
      key: "itemTotalAmount",
      label: "Total Amount",
      dataPath: "$.purReqnItemTotalAmount",
      dataType: "AMOUNT",
      formatter: "currency",
    },
    deliveryDate: {
      key: "deliveryDate",
      label: "Delivery Date",
      dataPath: "$.deliveryDate",
      dataType: "DATE",
      formatter: "date",
    },
    plant: {
      key: "plant",
      label: "Plant",
      dataPath: "$.plant",
      dataType: "TEXT",
    },
  },
  uiSchema: {
    title: "{{prNumber}}",
    subtitle: "{{requester}}",
    sections: [
      {
        id: "basic",
        type: "CARD",
        title: "Basic Data",
        fields: [
          "prNumber",
          "description",
          "requester",
          "prTypeDisplay",
          "departmentDisplay",
          "expenseTypeDisplay",
        ],
      },
      {
        id: "amount",
        type: "CARD",
        title: "Amount",
        fields: [
          "totalAmount",
          "totalDocAmount",
          "numberOfItems",
        ],
      },
      {
        id: "workflow",
        type: "CARD",
        title: "Workflow",
        fields: [
          "createdDate",
          "priority",
          "releaseStrategy",
        ],
      },
      {
        id: "items",
        type: "TABLE",
        title: "Items",
        dataPath: "$.items",
        columns: ["item", "material", "shortText", "materialGroup", "quantity", "price", "itemTotalAmount", "deliveryDate", "plant"],
      },
    ],
  },
  actions: [
    {
      key: "APPROVE",
      label: "Approve",
      variant: "PRIMARY",
      requiresComment: false,
      sapDecisionKey: "0001"
    },
    {
      key: "REJECT",
      label: "Reject",
      variant: "DANGER",
      requiresComment: true,
      sapDecisionKey: "0002"
    },
  ],
  cardChips: [
    {
      label: "Total",
      dataPath: "$.header.totalNetAmount",
      dataType: "AMOUNT",
      formatter: "currency",
      isPrimary: true
    },
    {
      label: "Type",
      dataPath: "$.header.purchaseRequisitionTypeDisplay",
      dataType: "TEXT"
    },
    {
      label: "Dept",
      dataPath: "$.header.departmentDisplay",
      dataType: "TEXT"
    }
  ]
};

// ─── PO BASE CONFIG ──────────────────────────────────────────
export const PO_BASE_CONFIG: ObjectTypeConfiguration = {
  objectType: "PO",
  documentType: "BASE",
  name: "Purchase Order",
  budgetMode: "NONE",
  fieldSchema: {
    poNumber: {
      key: "poNumber",
      label: "PO Number",
      dataPath: "$.header.purchaseOrder",
      dataType: "TEXT",
    },
    poTypeDisplay: {
      key: "poTypeDisplay",
      label: "PO Type",
      dataPath: "$.header.purchaseOrderTypeDisplay",
      dataType: "TEXT",
    },
    supplierName: {
      key: "supplierName",
      label: "Supplier",
      dataPath: "$.header.supplierName",
      dataType: "TEXT",
    },
    requester: {
      key: "requester",
      label: "Created By",
      dataPath: "$.header.createdByUser",
      dataType: "USER",
    },
    paymentTermsText: {
      key: "paymentTermsText",
      label: "Payment Terms",
      dataPath: "$.header.paymentTermsText",
      dataType: "TEXT",
    },
    incoterms: {
      key: "incoterms",
      label: "Incoterms",
      dataPath: "$.header.incotermsClassification",
      dataType: "TEXT",
    },
    totalAmount: {
      key: "totalAmount",
      label: "Net Value",
      dataPath: "$.header.purchaseOrderNetAmount",
      dataType: "AMOUNT",
      formatter: "currency",
      currencyPath: "$.header.documentCurrency"
    },
    currency: {
      key: "currency",
      label: "Currency",
      dataPath: "$.header.documentCurrency",
      dataType: "TEXT",
    },
    companyCodeDisplay: {
      key: "companyCodeDisplay",
      label: "Company Code",
      dataPath: "$.header.companyCodeDisplay",
      dataType: "TEXT",
    },
    purchasingOrganizationDisplay: {
      key: "purchasingOrganizationDisplay",
      label: "Purchasing Org",
      dataPath: "$.header.purchasingOrganizationDisplay",
      dataType: "TEXT",
    },
    status: {
      key: "status",
      label: "Status",
      dataPath: "$.header.purchasingDocumentStatusName",
      dataType: "TEXT",
    },
    priority: {
      key: "priority",
      label: "Priority",
      dataPath: "$.header.priority",
      dataType: "TEXT",
    },
    // Item Columns
    item: {
      key: "item",
      label: "Item",
      dataPath: "$.purchaseOrderItem",
      dataType: "TEXT",
    },
    shortText: {
      key: "shortText",
      label: "Short Text",
      dataPath: "$.purchaseOrderItemText",
      dataType: "TEXT",
    },
    materialGroupDisplay: {
      key: "materialGroupDisplay",
      label: "Material Group",
      dataPath: "$.materialGroupDisplay",
      dataType: "TEXT",
    },
    deliveryDate: {
      key: "deliveryDate",
      label: "Delivery Date",
      dataPath: "$.firstDeliveryDate",
      dataType: "DATE",
      formatter: "date",
    },
    quantity: {
      key: "quantity",
      label: "Order Quantity",
      dataPath: "$.orderQuantity",
      dataType: "QUANTITY",
      formatter: "quantity",
    },
    netPrice: {
      key: "netPrice",
      label: "Net Price",
      dataPath: "$.netPriceAmount",
      dataType: "AMOUNT",
      formatter: "currency",
    },
    netAmount: {
      key: "netAmount",
      label: "Net Amount",
      dataPath: "$.netAmount",
      dataType: "AMOUNT",
      formatter: "currency",
    },
    // Account Assignment Columns
    assignment: {
      key: "assignment",
      label: "Assignment",
      dataPath: "$.accountAssignmentNumber",
      dataType: "TEXT",
    },
    distributionPercentage: {
      key: "distributionPercentage",
      label: "Distribution (%)",
      dataPath: "$.distributionPercentage",
      dataType: "TEXT",
    },
    glAccountDisplay: {
      key: "glAccountDisplay",
      label: "GL Account",
      dataPath: "$.glAccountDisplay",
      dataType: "TEXT",
    },
    costCenterDisplay: {
      key: "costCenterDisplay",
      label: "Cost Center",
      dataPath: "$.costCenterDisplay",
      dataType: "TEXT",
    },
    profitCenterDisplay: {
      key: "profitCenterDisplay",
      label: "Profit Center",
      dataPath: "$.profitCenterDisplay",
      dataType: "TEXT",
    },
    // Schedule Line Columns
    scheduleLine: {
      key: "scheduleLine",
      label: "Schedule Line",
      dataPath: "$.scheduleLine",
      dataType: "TEXT",
    },
    scheduleLineOrderQuantity: {
      key: "scheduleLineOrderQuantity",
      label: "Quantity",
      dataPath: "$.scheduleLineOrderQuantity",
      dataType: "QUANTITY",
      formatter: "quantity",
    },
    scheduleLineDeliveryDate: {
      key: "scheduleLineDeliveryDate",
      label: "Delivery Date",
      dataPath: "$.scheduleLineDeliveryDate",
      dataType: "DATE",
      formatter: "date",
    },
  },
  uiSchema: {
    title: "{{poNumber}}",
    subtitle: "{{supplierName}}",
    sections: [
      {
        id: "basic",
        type: "CARD",
        title: "Basic Data",
        fields: [
          "poNumber",
          "poTypeDisplay",
          "supplierName",
          "requester",
        ],
      },
      {
        id: "deliveryPayment",
        type: "CARD",
        title: "Delivery & Payment",
        fields: [
          "paymentTermsText",
          "incoterms",
          "totalAmount",
        ],
      },
      {
        id: "org",
        type: "CARD",
        title: "Recipient Data",
        fields: [
          "companyCodeDisplay",
          "purchasingOrganizationDisplay",
          "status",
          "priority",
        ],
      },
      {
        id: "items",
        type: "TABLE",
        title: "Items",
        dataPath: "$.items",
        columns: ["item", "shortText", "materialGroupDisplay", "deliveryDate", "quantity", "netPrice", "netAmount"],
      },
      {
        id: "accountAssignments",
        type: "TABLE",
        title: "Account Assignment",
        dataPath: "$.accountAssignments",
        columns: ["item", "assignment", "distributionPercentage", "glAccountDisplay", "costCenterDisplay", "profitCenterDisplay"],
      },
      {
        id: "scheduleLines",
        type: "TABLE",
        title: "Schedule Lines",
        dataPath: "$.scheduleLines",
        columns: ["item", "scheduleLine", "scheduleLineDeliveryDate", "scheduleLineOrderQuantity"],
      },
    ],
  },
  actions: [
    {
      key: "APPROVE",
      label: "Approve",
      variant: "PRIMARY",
      requiresComment: false,
      sapDecisionKey: "0001"
    },
    {
      key: "REJECT",
      label: "Reject",
      variant: "DANGER",
      requiresComment: true,
      sapDecisionKey: "0002"
    },
  ],
  cardChips: [
    {
      label: "Total",
      dataPath: "$.header.purchaseOrderNetAmount",
      dataType: "AMOUNT",
      formatter: "currency",
      isPrimary: true
    },
    {
      label: "Type",
      dataPath: "$.header.purchaseOrderTypeDisplay",
      dataType: "TEXT"
    },
    {
      label: "Supplier",
      dataPath: "$.header.supplierName",
      dataType: "TEXT"
    },
    {
      label: "Dept",
      dataPath: "$.header.purchasingGroupName",
      dataType: "TEXT"
    }
  ]
};

// ─── RE BASE CONFIG ──────────────────────────────────────────
export const RE_DEFAULT_CONFIG: ObjectTypeConfiguration = {
  objectType: "RE",
  documentType: "DEFAULT",
  name: "Reservation",
  fieldSchema: {},
  uiSchema: { sections: [] },
  actions: []
};

// ─── CLAIM DEFAULT CONFIG ────────────────────────────────────
export const CLAIM_DEFAULT_CONFIG: ObjectTypeConfiguration = {
  objectType: "CLAIM",
  documentType: "DEFAULT",
  name: "Claim Form",
  fieldSchema: {},
  uiSchema: { sections: [] },
  actions: []
};

// Merging utility to handle overrides simply
export function mergeObjectConfig(base: ObjectTypeConfiguration, overrides: Partial<ObjectTypeConfiguration>): ObjectTypeConfiguration {
  return {
    ...base,
    ...overrides,
    fieldSchema: {
      ...base.fieldSchema,
      ...(overrides.fieldSchema || {})
    },
    uiSchema: {
      ...base.uiSchema,
      sections: [
        ...base.uiSchema.sections,
        ...(overrides.uiSchema?.sections || [])
      ]
    },
    actions: overrides.actions || base.actions
  } as ObjectTypeConfiguration;
}

// Overrides examples
export const PR_ZASS_CONFIG = mergeObjectConfig(PR_BASE_CONFIG, {
  documentType: "ZASS",
  name: "Asset PR",
  budgetMode: "WARNING",
  fieldSchema: {
    assetClass: {
      key: "assetClass",
      label: "Asset Class",
      dataPath: "$.asset.assetClass",
      dataType: "TEXT",
    }
  },
  uiSchema: {
    sections: [
      {
        id: "asset",
        type: "CARD",
        title: "Asset Information",
        fields: ["assetClass"],
      },
    ],
  },
});

export const OBJECT_CONFIG_REGISTRY: Record<string, ObjectTypeConfiguration> = {
  "PR:DEFAULT": PR_BASE_CONFIG,
  "PR:ZASS": PR_ZASS_CONFIG,
  "PO:DEFAULT": PO_BASE_CONFIG,
  "RE:DEFAULT": RE_DEFAULT_CONFIG,
  "CLAIM:DEFAULT": CLAIM_DEFAULT_CONFIG,
};

export function getObjectConfig(objectType: string, documentType?: string): ObjectTypeConfiguration {
  const normalizedDocType = documentType || "DEFAULT";
  const key = `${objectType}:${normalizedDocType}`;

  const config = OBJECT_CONFIG_REGISTRY[key];
  if (!config) {
    return OBJECT_CONFIG_REGISTRY[`${objectType}:DEFAULT`] || PR_BASE_CONFIG;
  }
  return config;
}

export function resolveJsonPath(obj: any, path: string): any {
  if (!path || obj === null || obj === undefined) return undefined;
  if (path === '$') return obj;
  const cleanPath = path.startsWith('$.') ? path.substring(2) : path.startsWith('$') ? path.substring(1) : path;
  if (!cleanPath) return obj;

  const parts = cleanPath.split('.');
  let current: any = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current === 'object') {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return current;
}

export function mapCardChips(config: ObjectTypeConfiguration, businessObject: any): any[] {
  if (!config.cardChips || !businessObject) return [];
  const chips: any[] = [];

  for (const def of config.cardChips) {
    const rawVal = resolveJsonPath(businessObject, def.dataPath);
    if (rawVal === null || rawVal === undefined || rawVal === '') continue;

    const chip: any = {
      label: def.label,
      value: rawVal,
      dataType: def.dataType,
      isPrimary: def.isPrimary
    };

    if (def.dataType === 'AMOUNT') {
      chip.currency = businessObject.header?.displayCurrency || businessObject.header?.documentCurrency || '';
    }

    chips.push(chip);
  }

  return chips;
}
