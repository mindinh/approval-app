/**
 * Frontend domain types — mirrors backend normalized models.
 * These types define the API contract between React and CAP.
 */

export interface InboxIdentity {
    btpUser: string;
    sapUser: string;
    isImpersonated: boolean;
}

export interface TaskSupports {
    forward: boolean;
    comments: boolean;
}

export type DecisionNature = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';

export interface Decision {
    key: string;
    text: string;
    nature?: DecisionNature;
    /** Whether a comment is mandatory for this decision (from SAP TASKPROCESSING.DecisionOption.CommentMandatory) */
    commentMandatory?: boolean;
    /** Whether comments are supported for this decision (from SAP TASKPROCESSING.DecisionOption.CommentSupported, default true) */
    commentSupported?: boolean;
}

export type BusinessContextType = 'PR' | 'PO' | 'CLAIM' | 'RESERVATION' | 'RE' | 'ZBUS2093' | 'BUS2093' | 'UNKNOWN';

export interface PurchaseOrderHeader {
    purchaseOrder: string;
    purchaseOrderText?: string;
    purchaseOrderType?: string;
    purchaseOrderTypeText?: string;
    createdByUser?: string;
    createdOn?: string;
    purchaseOrderDate?: string;
    companyCode?: string;
    companyCodeName?: string;
    purchasingOrganization?: string;
    purchasingOrganizationName?: string;
    purchasingGroup?: string;
    purchasingGroupName?: string;
    supplier?: string;
    supplierName?: string;
    paymentTerms?: string;
    paymentTermsText?: string;
    incotermsClassification?: string;
    documentCurrency?: string;
    purchaseOrderNetAmount?: string;
    purchasingDocumentStatusName?: string;
    TotalNetValueBeforeTax?: number | string;
    totalNetValueBeforeTax?: number | string;
    TotalFreightAmount?: number | string;
    totalFreightAmount?: number | string;
    TotalVatAmount?: number | string;
    totalVatAmount?: number | string;
    TotalOrderValue?: number | string;
    totalOrderValue?: number | string;
    userFullName?: string;
    userName?: string;
    createdByUser?: string;
    fundsCenter?: string;
    fundsCenterName?: string;
    departmentDisplay?: string;
    raw?: Record<string, string>;
}

export interface PurchaseOrderItem {
    purchaseOrder: string;
    purchaseOrderItem: string;
    purchaseOrderItemText?: string;
    purchaseOrderItemCategoryText?: string;
    materialGroup?: string;
    materialGroupText?: string;
    productTypeText?: string;
    firstDeliveryDate?: string;
    orderQuantity?: string;
    purchaseOrderQuantityUnit?: string;
    netPriceAmount?: string;
    purchaseOrderPriceUnit?: string;
    netAmount?: string;
    documentCurrency?: string;
    servicePerformer?: string;
}

export interface PurchaseOrderAccountAssignment {
    purchaseOrder: string;
    purchaseOrderItem: string;
    accountAssignmentNumber: string;
    distributionPercentage?: string;
    glAccount?: string;
    glAccountText?: string;
    costCenter?: string;
    costCenterText?: string;
    functionalArea?: string;
    profitCenter?: string;
    profitCenterText?: string;
    unloadingPoint?: string;
    controllingArea?: string;
    controllingAreaText?: string;
    fund?: string;
    fundsCenter?: string;
    earmarkedFunds?: string;
    documentItem?: string;
    commitmentItem?: string;
    grant?: string;
    budgetPeriod?: string;
    businessProcess?: string;
    goodsRecipient?: string;
    asset?: string;
    assetSubNumber?: string;
    network?: string;
    networkActivity?: string;
    sdDocument?: string;
    sdDocumentItem?: string;
    salesOrder?: string;
    wbsElement?: string;
    projectName?: string;
    workPackageName?: string;
    serviceDocumentType?: string;
    serviceDocument?: string;
    serviceDocumentItem?: string;
    raw?: Record<string, string>;
}

export interface PurchaseOrderScheduleLine {
    purchaseOrder: string;
    purchaseOrderItem: string;
    scheduleLine: string;
    scheduleLineDeliveryDate?: string;
    scheduleLineOrderQuantity?: string;
    purchaseOrderQuantityUnit?: string;
}

export interface PurchaseOrderFactsheetData {
    header: PurchaseOrderHeader;
    items: PurchaseOrderItem[];
    accountAssignments: PurchaseOrderAccountAssignment[];
    scheduleLines: PurchaseOrderScheduleLine[];
}

export interface PurchaseRequisitionHeader {
    purchaseRequisition: string;
    purchaseRequisitionText?: string;
    purReqnRequestor?: string;
    userFullName?: string;
    userName?: string;
    purReqCreationDate?: string;
    numberOfItems?: number;
    purchaseRequisitionType?: string;
    totalNetAmount?: string;
    displayCurrency?: string;
    purReqnHdrCurrencySourceDesc?: string;
    workflowScenarioDefinition?: string;
    isPurReqnOvrlRel?: boolean;
    isOnBehalfCart?: boolean;
    createdByUser?: string;
    department?: string;
    fundsCenter?: string;
    fundsCenterName?: string;
    departmentDisplay?: string;
    expenseType?: string;
    commitmentItem?: string;
    releaseStrategyName?: string;
    raw?: Record<string, string>;
}

export interface PurchaseRequisitionItem {
    purchaseRequisition: string;
    purchaseRequisitionItem: string;
    purchaseRequisitionItemText?: string;
    material?: string;
    materialText?: string;
    materialGroup?: string;
    materialGroupText?: string;
    purchaseRequisitionType?: string;
    purchaseRequisitionTypeText?: string;
    purchaseRequisitionPrice?: string;
    purReqnItemTotalAmount?: string;
    purReqnPriceQuantity?: string;
    purReqnItemCurrency?: string;
    purReqnReleaseStatus?: string;
    purReqnReleaseStatusText?: string;
    processingStatus?: string;
    processingStatusText?: string;
    requestedQuantity?: string;
    baseUnit?: string;
    purchasingGroup?: string;
    purchasingOrganization?: string;
    plant?: string;
    deliveryDate?: string;
    plainLongText?: string;
    createdByUser?: string;
    userFullName?: string;
    supplier?: string;
    costCenter?: string;
    costCenterDescription?: string;
}

export interface PurchaseRequisitionFactsheetData {
    header: PurchaseRequisitionHeader;
    items: PurchaseRequisitionItem[];
    approvalTree?: WorkflowApprovalTreeResponse;
}

export interface BusinessContext {
    type: BusinessContextType;
    documentId?: string;
    pr?: PurchaseRequisitionFactsheetData | Record<string, unknown>;
    po?: PurchaseOrderFactsheetData | Record<string, unknown>;
}

export interface TaskDescription {
    type: 'text' | 'html';
    value: string;
}

export interface CustomAttribute {
    name: string;
    label: string;
    value: string;
    type?: string;
}

export interface TaskObject {
    objectId: string;
    type: string;
    name?: string;
    url?: string;
    mimeType?: string;
}

export interface BusinessChipConfig {
    label?: string;
    value: string | number | boolean;
    dataType: 'TEXT' | 'DATE' | 'AMOUNT' | 'QUANTITY' | 'BOOLEAN';
    isPrimary?: boolean;
    currency?: string;
    unit?: string;
}

export interface InboxTask {
    instanceId: string;
    sapOrigin?: string;
    title: string;
    status: string;
    priority?: string;
    createdOn?: string;
    createdByName?: string;
    processorName?: string;
    scenarioId?: string;
    taskDefinitionId?: string;
    taskDefinitionName?: string;
    instid?: string;
    documentId?: string;
    objectType?: string;
    documentTypeDisplay?: string;
    companyCodeDisplay?: string;
    companyCode?: string;
    releaseStrategyName?: string;
    startDeadline?: string;
    completionDeadline?: string;
    expiryDate?: string;
    completedOn?: string;
    forwardedOn?: string;
    isEscalated?: boolean;
    hasComments?: boolean;
    hasAttachments?: boolean;
    guiLink?: string;
    requestorName?: string;
    supports: TaskSupports;
    businessContext?: BusinessContext;
    total?: number;
    curr_vnd?: string;
    total_doc_curr?: number;
    doc_curr?: string;
    businessChips?: BusinessChipConfig[];
    normalTask?: boolean;
}

export interface TaskComment {
    id: string;
    createdAt?: string;
    createdBy?: string;
    createdByName?: string;
    text: string;
}

export interface ProcessingLog {
    orderId?: number;
    timestamp?: string;
    actionName?: string;
    performedBy?: string;
    performedByName?: string;
    comments?: string;
    taskStatus?: string;
}

export interface WorkflowLog {
    id: string;
    timestamp?: string;
    action?: string;
    user?: string;
    userName?: string;
    details?: string;
    raw: Record<string, unknown>;
}

export interface TaskAttachment {
    id: string;
    fileName?: string;
    fileDisplayName?: string;
    mimeType?: string;
    fileSize?: number;
    link?: string;
    linkDisplayName?: string;
    createdAt?: string;
    createdBy?: string;
    createdByName?: string;
}

export interface WorkflowApprovalStep {
    documentId: string;
    level: number;
    releaseCode?: string;
    releaseText?: string;
    approver?: string;
    approverUserId?: string;
    status?: string;
    noteText?: string;
    postedOn?: string;
    postedTime?: string;
}

export interface WorkflowApprovalComment {
    docNum?: string;
    postedOn?: string;
    postedTime?: string;
    noteText?: string;
    userComment?: string;
    type?: string;
}

export interface WorkflowApprovalTreeResponse {
    documentId?: string;
    releaseStrategyName?: string;
    steps: WorkflowApprovalStep[];
    comments?: WorkflowApprovalComment[];
}

export interface TaskDetailMeta {
    objectType: string;
    objectId: string;
    documentType?: string;
}

export interface TaskDetail {
    task: InboxTask;
    _meta?: TaskDetailMeta;
    header?: Record<string, any>;
    items?: Record<string, any>[];
    workflow?: Record<string, any>;
    object?: Record<string, any>;
    description?: TaskDescription;
    decisions?: Decision[];
    customAttributes?: CustomAttribute[];
    taskObjects?: TaskObject[];
    comments: TaskComment[];
    processingLogs?: ProcessingLog[];
    workflowLogs?: WorkflowLog[];
    attachments: TaskAttachment[];
    businessContext?: BusinessContext;
}

// ─── Dashboard ────────────────────────────────────────────

export interface DashboardTask {
    taskId: string;
    documentNumber: string;
    taskType: string;
    documentType: string;
    documentTypeDesc: string;
    status: string;
    currency: string;
    totalNetAmount: number | null;
    displayCurrency: string;
    createdAt?: string;
}

export interface DocTypeCountItem {
    DocumentType: string;
    DocCategory: string;
    DocumentTypeText?: string;
    RequestCount: number;
    SumNetAmountLocalCrcy: number;
    LocalCurrency: string;
}

export interface StatusCountItem {
    WorkflowTaskStatus: string;
    statusLabel?: string;
    RequestCount: number;
}

export interface DashboardResponse {
    statusCounts?: StatusCountItem[];
    docTypeCounts?: DocTypeCountItem[];
    items?: DashboardTask[];
    total?: number;
}

// ─── API Responses ────────────────────────────────────────

export interface TaskListResponse {
    items: InboxTask[];
    total: number;
}

export type TaskDetailResponse = TaskDetail;

export interface TaskActionResponse {
    success: boolean;
    message: string;
    task?: InboxTask;
}

// ─── API Requests ─────────────────────────────────────────

/** Context forwarded to BFF to avoid redundant SAP $batch fetch. */
export interface DecisionRequestContext {
    sapOrigin?: string;
    documentId?: string;
    businessObjectType?: string;
}

export interface DecisionRequest {
    decisionKey: string;
    comment?: string;
    reasonCode?: string;
    /** Decision type: 'APPR' for approval, 'NORM' for regular comment */
    type?: string;
    _context?: DecisionRequestContext;
}

export interface ForwardRequest {
    forwardTo: string;
    comment?: string;
    _context?: DecisionRequestContext;
}

export interface UserSearchResult {
    userId: string;
    uniqueName?: string;
    displayName: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    department?: string;
    company?: string;
}

export interface BusUser {
    SAPUserName: string;
    FirstName: string;
    LastName: string;
    FullName: string;
    EmailAddress: string;
}



// ─── Reference PR Types ───────────────────────────────────

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
}

export interface ReferencePrDetailResponse {
    header: ReferencePrHeader;
    items: ReferencePrItem[];
}
