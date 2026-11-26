import type { RawODataEntity } from '@/services/inbox/inbox.contracts';
import { StatusBadge, TaskTypeBadge } from '../TaskBadges';

export function StatusHeaderBadges({ detail }: { detail: RawODataEntity | null | undefined }) {
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
