/**
 * SAP workflow instance IDs may arrive with or without leading zeros
 * (e.g. "000000123456" vs "123456"). Normalize them before comparing.
 */
export function normalizeInstanceId(id: unknown): string {
    return id ? String(id).replace(/^0+/, '') : '';
}

/** The id fields a task detail payload (raw-OData envelope or legacy shape) may carry. */
interface DetailIdSource {
    instanceId?: unknown;
    taskId?: unknown;
    taskprocessing?: { task?: { InstanceID?: unknown } | null } | null;
    task?: { instanceId?: unknown } | null;
}

/**
 * Instance id of a task detail payload: the first candidate that is a real id.
 * CC / review tasks come back from SAP TASKPROCESSING with an all-zero InstanceID
 * ("000000000000"), so ids that normalize to empty are skipped.
 */
export function resolveDetailInstanceId(detail: DetailIdSource | null | undefined): string | undefined {
    const candidates = [detail?.taskprocessing?.task?.InstanceID, detail?.instanceId, detail?.taskId, detail?.task?.instanceId];
    const id = candidates.find((candidate) => normalizeInstanceId(candidate) !== '');
    return id === undefined ? undefined : String(id);
}
