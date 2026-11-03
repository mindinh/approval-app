/** Raw S/4HANA OData record; keys keep their original SAP casing. */
export type RawODataEntity = Record<string, any>;

export interface RawTaskprocessingResponse {
    task: RawODataEntity | null;
    decisionOptions: RawODataEntity[];
}
