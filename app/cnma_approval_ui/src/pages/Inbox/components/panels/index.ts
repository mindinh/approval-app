import { LayoutDashboard, List, GitBranch, Paperclip, MessageSquare } from 'lucide-react';
import type { WorkflowApprovalComment } from '@/services/inbox/inbox.types';

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
    detail: any;
    workflowCount?: number;
    workflowComments?: WorkflowApprovalComment[];
    detailsCount?: number;
    attachmentCount?: number;
    t: any;
}) {
    const bo = detail?.businessObject || detail;
    const commentsList: any[] = Array.isArray(detail?.comments)
        ? detail.comments
        : Array.isArray(bo?._Comment)
        ? bo._Comment.map((c: any, idx: number) => ({
            id: c.id || c.DocId || `comment-${idx}`,
            text: c.NoteText || c.noteText || c.text || '',
            createdBy: c.UserComment || c.author || c.createdBy || 'User',
            createdAt: c.PostedOn ? `${c.PostedOn} ${c.PostedTime || ''}` : c.createdAt || ''
        }))
        : [];

    const seenComments = new Set<string>();
    let mergedCommentsCount = 0;

    for (const c of commentsList) {
        const text = String(c.text || '').trim().toLowerCase();
        const author = String(c.createdBy || '').trim().toLowerCase();
        const key = `${text}|${author}`;
        if (text && !seenComments.has(key)) {
            seenComments.add(key);
            mergedCommentsCount++;
        }
    }

    for (const wc of workflowComments || []) {
        const text = String(wc.noteText || (wc as any).text || '').trim().toLowerCase();
        const author = String(wc.userComment || (wc as any).author || '').trim().toLowerCase();
        const key = `${text}|${author}`;
        if (text && !seenComments.has(key)) {
            seenComments.add(key);
            mergedCommentsCount++;
        }
    }

    const rawAttachments = bo?._Attachment || detail?.attachments || [];

    const finalAttachmentCount = attachmentCount ?? (Array.isArray(rawAttachments) ? rawAttachments.length : 0);

    const docCategory = String(bo?.DocCategory || detail?.task?.businessContext?.type || detail?.objectType || detail?._meta?.objectType || '').toUpperCase();
    const showWorkflow = ['PR', 'PO', 'RE', 'BUS2105', 'BUS2012', 'ZBUS2093', 'BUS2093'].includes(docCategory);

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
