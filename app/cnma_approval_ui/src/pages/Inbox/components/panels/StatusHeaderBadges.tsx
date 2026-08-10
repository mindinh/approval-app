import { StatusBadge, PriorityBadge, TaskTypeBadge } from '../TaskBadges';

export function StatusHeaderBadges({ detail }: { detail: any }) {
    const bo = detail?.businessObject || detail;
    const tp = detail?.taskprocessing;
    // const docCategory = String(bo?.DocCategory || detail?.objectType || detail?.task?.businessContext?.type || 'PR').toUpperCase();
    // const documentId = String(bo?.DocumentNumber || bo?.DocumentId || detail?.documentId || detail?.task?.businessContext?.documentId || '');
    const status = tp?.task?.Status || detail?.status || detail?.task?.status || 'READY';
    const priority = tp?.task?.Priority || detail?.priority || detail?.task?.priority || 'MEDIUM';
    const normalTask = detail?.normalTask ?? detail?.task?.normalTask ?? true;

    return (
        <div className="flex items-center gap-2 overflow-hidden">
            <TaskTypeBadge normalTask={normalTask} />
            {/* {docCategory && docCategory !== 'UNKNOWN' && (
                <span className="inline-flex items-center rounded bg-info-bg px-2 py-0.5 text-xs font-semibold text-info tracking-wide shrink-0 truncate max-w-48">
                    {docCategory} {documentId}
                </span>
            )} */}
            <StatusBadge status={status} />
            <PriorityBadge priority={priority} />
        </div>
    );
}
