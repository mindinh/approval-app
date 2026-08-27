import { useState, useMemo, useRef } from 'react';
import { Send, Loader2, MessageSquare, User, AtSign, X } from 'lucide-react';
import { Button, Textarea, Badge } from '@cnma/react-ui';
import type { TaskDetail, WorkflowApprovalComment, BusUser, TaggedUser } from '@/services/inbox/inbox.types';
import { useAddComment } from '@/pages/Inbox/hooks/useInbox';
import { TeamsMentionDropdown } from '@/pages/Inbox/components/TeamsMentionDropdown';
import { RichMentionInput, type RichMentionInputRef } from '@/pages/Inbox/components/RichMentionInput';
import { formatRelative } from '@/pages/Inbox/utils/formatters';
import { formatDate, formatDateTime } from '@/utils/formatters/date';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

function unescapeTags(str: string): string {
    return str.replace(/&lt;tag&gt;/g, '<tag>').replace(/&lt;\/tag&gt;/g, '</tag>');
}

function renderFormattedCommentText(text: string) {
    if (!text) return null;
    const mentionRegex = /(<tag>.*?<\/tag>|@[\p{L}\p{N}._-]+(?:\s+[\p{Lu}\p{N}_][\p{L}\p{N}._-]*)*)/gu;
    const parts = text.split(mentionRegex);

    return parts.map((part, idx) => {
        if (part.startsWith('<tag>') && part.endsWith('</tag>')) {
            const content = part.slice(5, -6);
            return (
                <Badge
                    key={idx}
                    variant="secondary"
                    className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs font-semibold bg-primary/10 text-primary border border-primary/20 rounded-md mx-0.5 align-baseline"
                >
                    {unescapeTags(content)}
                </Badge>
            );
        }
        if (part.startsWith('@') && part.length > 1) {
            return (
                <Badge
                    key={idx}
                    variant="secondary"
                    className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs font-semibold bg-primary/10 text-primary border border-primary/20 rounded-md mx-0.5 align-baseline"
                >
                    {part}
                </Badge>
            );
        }
        return <span key={idx}>{unescapeTags(part)}</span>;
    });
}

export function CommentsPanel({
    detail,
    instanceId,
    onCommentAdded,
    context,
    workflowComments,
    isLoadingWorkflowComments,
    allowAddComment = true,
}: {
    detail: TaskDetail;
    instanceId?: string;
    onCommentAdded?: () => void;
    context?: { sapOrigin?: string; documentId?: string; businessObjectType?: string };
    workflowComments?: WorkflowApprovalComment[];
    isLoadingWorkflowComments?: boolean;
    allowAddComment?: boolean;
}) {
    const { t } = useTranslation();
    const [commentText, setCommentText] = useState('');
    const [isMentionOpen, setIsMentionOpen] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionIndex, setMentionIndex] = useState(-1);
    const [taggedUsers, setTaggedUsers] = useState<BusUser[]>([]);
    const richInputRef = useRef<RichMentionInputRef>(null);
    const addCommentMutation = useAddComment();

    const merged = useMemo(() => {
        const list: Array<{
            id: string;
            text: string;
            createdBy: string;
            createdAt: string;
            forward?: boolean;
            toUser?: string;
        }> = [];

        for (const wc of workflowComments || []) {
            const text = (wc.noteText || (wc as any).text || '').trim();
            if (!text) continue;
            let dateStr = wc.postedOn || '';
            if (wc.postedOn && wc.postedTime) {
                let t = wc.postedTime;
                if (t.startsWith('PT')) {
                    t = t.replace('PT', '').replace('H', ':').replace('M', ':').replace('S', '');
                }
                dateStr += `T${t.split('.')[0]}`;
            }
            list.push({
                id: `wc-${wc.docNum}-${dateStr}-${list.length}`,
                text,
                createdBy: wc.userComment || (wc as any).author || 'System',
                createdAt: dateStr,
            });
        }

        for (const tc of detail.comments || []) {
            const text = (tc.text || '').trim();
            if (!text) continue;
            list.push({
                id: tc.id || `tc-${list.length}`,
                text: tc.text,
                createdBy: tc.createdByName || tc.createdBy || 'Unknown',
                createdAt: tc.createdAt || '',
                forward: tc.forward === true,
                toUser: tc.toUser || '',
            });
        }

        return list;
    }, [detail.comments, workflowComments]);

    const handleCommentTextChange = (text: string) => {
        setCommentText(text);
        const activeUserNames = richInputRef.current?.getActiveUserNames() || [];
        setTaggedUsers((prev) => prev.filter((u) => activeUserNames.includes(u.SAPUserName)));
    };

    const handleSubmit = () => {
        if (!commentText.trim() || !instanceId) return;
        const docNum = context?.documentId || detail?.documentId || detail?.businessObject?.DocumentNumber || detail?.businessObject?.PurchaseRequisition || detail?.businessObject?.PurchaseOrder || detail?.businessObject?.ReservationNumber || detail?.businessObject?.ClaimNumber || instanceId;
        const boType = context?.businessObjectType || detail?.docCategory || detail?.businessObject?.DocCategory || detail?.objectType || '';

        const activeUserNames = richInputRef.current?.getActiveUserNames() || [];
        const activeTaggedUsers = taggedUsers.filter((u) => activeUserNames.includes(u.SAPUserName));

        const formattedTaggedUsers: TaggedUser[] = activeTaggedUsers.map((u) => ({
            USERNAME: u.SAPUserName,
            EMAIL: u.EmailAddress || '',
        }));

        addCommentMutation.mutate(
            {
                instanceId,
                text: commentText.trim(),
                taggedUsers: formattedTaggedUsers,
                context: {
                    sapOrigin: context?.sapOrigin || detail?.task?.sapOrigin || 'LOCAL',
                    documentId: docNum,
                    businessObjectType: boType,
                },
            },
            {
                onSuccess: () => {
                    setCommentText('');
                    setTaggedUsers([]);
                    setIsMentionOpen(false);
                    richInputRef.current?.clear();
                    onCommentAdded?.();
                },
            }
        );
    };

    const handleSelectMentionUser = (user: BusUser) => {
        richInputRef.current?.insertMention(user, mentionQuery);

        setTaggedUsers((prev) => {
            if (prev.some((u) => u.SAPUserName === user.SAPUserName)) return prev;
            return [...prev, user];
        });

        setIsMentionOpen(false);
    };

    const handleTriggerMention = () => {
        richInputRef.current?.focus();
        setIsMentionOpen(true);
        setMentionQuery('');
    };

    const handleRemoveTag = (sapUserName: string) => {
        setTaggedUsers((prev) => prev.filter((u) => u.SAPUserName !== sapUserName));
    };

    return (
        <div className="bg-card rounded-none sm:rounded-xl shadow-none sm:shadow-sm border border-border/40 overflow-visible relative flex flex-col">
            <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between text-foreground">
                <div className="flex items-center gap-2">
                    <MessageSquare className="size-5 text-muted-foreground/80" />
                    <h3 className="text-base font-semibold">{t('comments.title', 'Comments')}</h3>
                </div>
            </div>

            <div className="p-5 flex flex-col space-y-6">
                {/* Comment list */}
                {isLoadingWorkflowComments && (
                    <div className="py-4 text-center text-sm text-muted-foreground">Loading comments...</div>
                )}
                {merged.length === 0 && !isLoadingWorkflowComments && (
                    <div className="py-8 text-center text-sm text-muted-foreground/60">
                        No comments yet.
                    </div>
                )}
                <div className="space-y-3 max-h-72 sm:max-h-80 overflow-y-auto pr-1">
                    {merged.map((comment) => (
                        <div
                            key={comment.id}
                            className="rounded-lg border border-border/60 p-3 space-y-1.5 bg-muted/10 min-w-0 max-w-full overflow-hidden"
                        >
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <User className="size-3 shrink-0" />
                                <span className="font-medium text-foreground/80 truncate">{comment.createdBy}</span>
                                <span>·</span>
                                <span className="shrink-0">{formatDateTime(comment.createdAt)}</span>
                            </div>
                            <div className="text-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-foreground min-w-0">
                                {renderFormattedCommentText(comment.text)}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Comment input area */}
                {allowAddComment && instanceId && (
                    <div className="flex flex-col gap-3 relative">
                        {/* MS Teams Style Mention Dropdown Popover */}
                        <TeamsMentionDropdown
                            isOpen={isMentionOpen}
                            searchQuery={mentionQuery}
                            onSelectUser={handleSelectMentionUser}
                            onClose={() => setIsMentionOpen(false)}
                        />

                        <RichMentionInput
                            ref={richInputRef}
                            value={commentText}
                            onChange={handleCommentTextChange}
                            onMentionQuery={(query, idx, open) => {
                                setMentionQuery(query);
                                setMentionIndex(idx);
                                setIsMentionOpen(open);
                            }}
                            onSubmit={handleSubmit}
                            placeholder="Write a comment... (Type '@' to mention someone)"
                        />

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground/60">
                                    Ctrl+Enter to submit {commentText.length > 0 && `· ${commentText.length}/255`}
                                </span>
                            </div>
                            <Button
                                onClick={handleSubmit}
                                disabled={!commentText.trim() || addCommentMutation.isPending}
                                className={cn(
                                    "bg-primary hover:bg-primary-hover text-primary-foreground disabled:opacity-50",
                                    "px-4 h-11 sm:h-9 font-medium transition-colors"
                                )}
                            >
                                {addCommentMutation.isPending && (
                                    <Loader2 className="size-4 animate-spin mr-2" />
                                )}
                                Add Comment
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}



