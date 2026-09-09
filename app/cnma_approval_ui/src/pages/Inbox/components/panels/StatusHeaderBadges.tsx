import { StatusBadge, TaskTypeBadge } from '../TaskBadges';

export function StatusHeaderBadges({ detail }: { detail: any }) {
    const bo = detail?.businessObject || detail;
    const tp = detail?.taskprocessing;
    const status = tp?.task?.Status || detail?.status || detail?.task?.status || 'READY';
    const normalTask = detail?.normalTask ?? detail?.task?.normalTask ?? true;

    return (
        <div className="flex items-center gap-2 overflow-hidden">
            <TaskTypeBadge normalTask={normalTask} />
            <StatusBadge status={status} />
        </div>
    );
}
