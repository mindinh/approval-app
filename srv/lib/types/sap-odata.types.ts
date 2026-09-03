/** Represents any raw OData entity field dictionary */
export interface RawODataEntity {
    [key: string]: any;
}

/** Standard OData v2 single response envelope */
export interface ODataSingleResult<T = RawODataEntity> {
    d: T;
}

/** Standard OData v2 list/collection response envelope */
export interface ODataListResult<T = RawODataEntity> {
    d: {
        results: T[];
    };
}

/** Custom OData v4 response envelope */
export interface ODataV4Result<T = RawODataEntity> {
    value: T[];
}

/** Native S/4HANA OData Entity: CNMA_TASKBYSTATUS */
export interface CnmaTaskByStatusEntity {
    WorkflowTaskStatus: string;
    RequestCount: number;
}

/** Native S/4HANA OData Entity: CNMA_TASKBYDOCTYPE */
export interface CnmaTaskByDocTypeEntity {
    DocumentType: string;
    DocCategory: string;
    MovementType?: string;
    DocumentTypeText: string;
    MovementTypeName?: string;
    RequestCount: number;
    SumNetAmountLocalCrcy: number;
    LocalCurrency: string;
}

/** BFF Dashboard Aggregated Status Metric Item */
export interface StatusCountItem extends CnmaTaskByStatusEntity {
    statusLabel: string;
}

/** BFF Dashboard Response Structure */
export interface DashboardSummaryResponse {
    statusCounts: StatusCountItem[];
    docTypeCounts: CnmaTaskByDocTypeEntity[];
    items: any[];
    total: number;
}

/** Mass Decision Item Context */
export interface MassDecisionItemContext {
    instanceId: string;
    documentId?: string;
    documentNumber?: string;
    businessObjectType?: string;
    objectType?: string;
    type?: string;
    sapOrigin?: string;
}

/** Mass Decision Request Body */
export interface MassDecisionRequest {
    decisionKey: string;
    sapDecisionKey?: string;
    comment?: string;
    items: MassDecisionItemContext[];
}

/** Per-Item Mass Decision Result */
export interface MassDecisionItemResult {
    instanceId: string;
    documentNumber?: string;
    documentId?: string;
    status: 'SUCCESS' | 'FAILED' | 'PARTIAL_SUCCESS';
    message?: string;
    error?: string;
}

/** Consolidated Mass Decision Response */
export interface MassDecisionResponse {
    total: number;
    succeededCount: number;
    failedCount: number;
    results: MassDecisionItemResult[];
}

