import type { TaskDetail } from '@/services/inbox/inbox.types';
import { StatusBadge, PriorityBadge } from '../TaskBadges';

export function StatusHeaderBadges({ detail }: { detail: TaskDetail }) {
    const context = detail.businessContext;
    return (
        <div className="flex items-center gap-2 overflow-hidden">
            {context?.type && context.type !== 'UNKNOWN' && (
                <span className="inline-flex items-center rounded bg-info-bg px-2 py-0.5 text-xs font-semibold text-info tracking-wide shrink-0 truncate max-w-48">
                    {context.type} {context.documentId || ''}
                </span>
            )}
            <StatusBadge status={detail.task.status} />
            <PriorityBadge priority={detail.task.priority} />
        </div>
    );
}
