export type RawODataEntity = Record<string, any>;

export interface RawTaskprocessingResponse {
    task: RawODataEntity | null;
    decisionOptions: RawODataEntity[];
}

export interface RawTaskDetailResponse {
    businessObject: RawODataEntity;
    taskprocessing: RawTaskprocessingResponse;
}
