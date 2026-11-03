import { LayoutDashboard, List, GitBranch, Paperclip, MessageSquare, type LucideIcon } from 'lucide-react';
import type { RawODataEntity } from '@/services/inbox/inbox.contracts';

/** Minimal translate signature used for tab labels (compatible with i18next's `t`). */
type TranslateFn = (key: string, defaultValue: string) => string;

export interface TabDefinition {
    value: string;
    label: string;
    icon: LucideIcon;
    count: number | undefined;
}

/** Document categories that expose the approval workflow tab. */
const WORKFLOW_DOC_CATEGORIES = ['PR', 'PO', 'RE', 'CLAIM', 'BUS2105', 'BUS2012', 'ZBUS2093', 'BUS2093'];

interface CommentLike {
    text?: unknown;
}

function getComments(detail: RawODataEntity | null | undefined, bo: RawODataEntity | null | undefined): CommentLike[] {
    if (Array.isArray(detail?.comments)) return detail.comments;
    if (!Array.isArray(bo?._Comment)) return [];
    return bo._Comment.map((c: RawODataEntity, idx: number) => ({
        id: c.id || c.DocId || `comment-${idx}`,
        text: c.NoteText || c.noteText || c.text || '',
        createdBy: c.UserComment || c.author || c.createdBy || 'User',
        createdAt: c.PostedOn ? `${c.PostedOn} ${c.PostedTime || ''}` : c.createdAt || '',
        forward: c.Forward === true || c.forward === true,
        toUser: c.ToUser || c.toUser || '',
    }));
}

export function makeTabDefinitions({
    detail,
    workflowCount = 0,
    detailsCount,
    attachmentCount,
    t,
}: {
    detail: RawODataEntity | null | undefined;
    workflowCount?: number;
    detailsCount?: number;
    attachmentCount?: number;
    t: TranslateFn;
}): TabDefinition[] {
    const bo = detail?.businessObject || detail;
    const mergedCommentsCount = getComments(detail, bo).filter((c) => Boolean(String(c.text || '').trim())).length;

    const rawAttachments = bo?._Attachment || detail?.attachments || [];
    const finalAttachmentCount = attachmentCount ?? (Array.isArray(rawAttachments) ? rawAttachments.length : 0);

    const docCategory = String(
        bo?.DocCategory || detail?.task?.businessContext?.type || detail?.objectType || detail?._meta?.objectType || ''
    ).toUpperCase();
    const showWorkflow = WORKFLOW_DOC_CATEGORIES.includes(docCategory);

    const tabs: TabDefinition[] = [
        {
            value: 'overview',
            label: t('task.overview', 'Overview'),
            icon: LayoutDashboard,
            count: undefined,
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
