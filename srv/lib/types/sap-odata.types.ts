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
