import { LayoutDashboard, List, GitBranch, Paperclip, MessageSquare } from 'lucide-react';
import { mergeAndDeduplicateComments } from '@/pages/Inbox/mappers/comments.mapper';
import type { TaskDetail, WorkflowApprovalComment } from '@/services/inbox/inbox.types';

export { OverviewPanel } from './OverviewPanel';
export { DetailsPanel } from './DetailsPanel';
export { ActivityPanel } from './ActivityPanel';
export { AttachmentsPanel } from './AttachmentsPanel';
export { CommentsPanel } from './CommentsPanel';
export { WorkflowApprovalPanel } from './WorkflowApprovalPanel';
export { StatusHeaderBadges } from './StatusHeaderBadges';

export function makeTabDefinitions({
    detail,
    workflowCount = 0,
    workflowComments,
    detailsCount,
    attachmentCount,
    t,
}: {
    detail: TaskDetail;
    workflowCount?: number;
    workflowComments?: WorkflowApprovalComment[];
    detailsCount?: number;
    attachmentCount?: number;
    t: any;
}) {
    const mergedCommentsCount = mergeAndDeduplicateComments(detail.comments, workflowComments).length;
    const finalAttachmentCount = attachmentCount ?? detail.attachments.length;

    const showWorkflow = detail.task.businessContext?.type === 'PR' || detail.task.businessContext?.type === 'PO';

    const tabs = [
        {
            value: 'overview',
            label: t('task.overview', 'Overview'),
            icon: LayoutDashboard,
            count: undefined as number | undefined,
        },
        {
            value: 'details',
            label: t('task.details', 'Details'),
            icon: List,
            count: detailsCount && detailsCount > 0 ? detailsCount : undefined,
        },
    ];

    if (showWorkflow) {
        tabs.push({
            value: 'workflow',
            label: t('task.approvalTree', 'Workflow'),
            icon: GitBranch,
            count: workflowCount,
        });
    }

    tabs.push(
        { value: 'attachments', label: t('task.attachments', 'Attachments'), icon: Paperclip, count: finalAttachmentCount },
        { value: 'comments', label: t('task.comments', 'Comments'), icon: MessageSquare, count: mergedCommentsCount }
    );

    return tabs;
}
