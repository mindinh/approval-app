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

