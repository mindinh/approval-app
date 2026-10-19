import { Fragment, useState, useMemo, useRef, useEffect, useId } from 'react';
import { Send, Loader2, MessageSquare, ArrowRight } from 'lucide-react';
import { Button, Badge, Card, FieldSeparator, Skeleton } from '@cnma/react-ui';
import { UserAvatar } from '@/components/common/UserAvatar';
import type { TaskDetail, BusUser, TaggedUser } from '@/services/inbox/inbox.types';
import { useAddComment } from '@/pages/Inbox/hooks/useInbox';
import { TeamsMentionDropdown } from '@/pages/Inbox/components/TeamsMentionDropdown';
import { RichMentionInput, type RichMentionInputRef } from '@/pages/Inbox/components/RichMentionInput';
import { formatDateTime } from '@/utils/formatters/date';
import { useUserIdentity } from '@/pages/Inbox/hooks/useUserIdentity';
import { useCommentToday } from '@/pages/Inbox/hooks/useCommentToday';
import { isCurrentCommentAuthor, commentAuthorInitials } from '@/pages/Inbox/utils/commentAuthor';
import { COMMENT_MAX_LENGTH, getCommentDraftState } from '@/pages/Inbox/utils/commentDraft';
import { buildCommentTimeline, isSameCommentDay } from '@/pages/Inbox/utils/commentTimeline';
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
    context,
    allowAddComment = true,
}: {
    detail: TaskDetail;
    instanceId?: string;
    context?: { sapOrigin?: string; documentId?: string; businessObjectType?: string };
    allowAddComment?: boolean;
}) {
    const { t, i18n } = useTranslation();
    const [commentText, setCommentText] = useState('');
    const draft = getCommentDraftState(commentText);
    const draftHelpId = useId();
    const [isMentionOpen, setIsMentionOpen] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [taggedUsers, setTaggedUsers] = useState<BusUser[]>([]);
    const richInputRef = useRef<RichMentionInputRef>(null);
    const commentListRef = useRef<HTMLDivElement>(null);
    const submitLock = useRef(false);
    const addCommentMutation = useAddComment();
    const { currentUser } = useUserIdentity({ comments: detail.comments });

    const comments = useMemo(() => {
        return (detail.comments || [])
            .filter((tc) => Boolean((tc.text || '').trim()))
            .map((tc, idx) => {
                return {
                    id: tc.id || `tc-${idx}`,
                    text: tc.text,
                    createdBy: tc.createdBy?.trim() || tc.createdByName?.trim() || t('comments.unknownAuthor'),
                    isOwn: isCurrentCommentAuthor(tc.createdBy, currentUser),
                    createdAt: tc.createdAt || '',
                    forward: tc.forward === true,
                    toUser: tc.toUser || '',
                };
            });
    }, [detail.comments, currentUser, t]);
    const timeline = useMemo(() => buildCommentTimeline(comments), [comments]);
    const today = useCommentToday();
    const formatDayLabel = (day: Date | null) => {
        if (!day) return t('comments.unknownDate');
        if (isSameCommentDay(day, today)) return t('comments.today');
        return formatDateTime(day.toISOString(), i18n.language, { dateStyle: 'medium' });
    };

    // Auto-scroll to bottom when comments list updates (e.g. user adds comment or detail refetches)
    useEffect(() => {
        if (commentListRef.current) {
            const timer = setTimeout(() => {
                if (commentListRef.current) {
                    commentListRef.current.scrollTo({
                        top: commentListRef.current.scrollHeight,
                        behavior: 'smooth',
                    });
                }
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [comments, addCommentMutation.isPending]);

    const handleCommentTextChange = (text: string) => {
        setCommentText(text);
        const activeUserNames = richInputRef.current?.getActiveUserNames() || [];
        setTaggedUsers((prev) => prev.filter((u) => activeUserNames.includes(u.SAPUserName)));
    };

    const handleSubmit = () => {
        if (!allowAddComment || !draft.canSend || !instanceId || submitLock.current || addCommentMutation.isPending) return;
        const docNum = context?.documentId || detail?.documentId || detail?.businessObject?.DocumentNumber || detail?.businessObject?.PurchaseRequisition || detail?.businessObject?.PurchaseOrder || detail?.businessObject?.ReservationNumber || detail?.businessObject?.ClaimNumber || instanceId;
        const boType = context?.businessObjectType || detail?.docCategory || detail?.businessObject?.DocCategory || detail?.objectType || '';

        const activeUserNames = richInputRef.current?.getActiveUserNames() || [];
        const activeTaggedUsers = taggedUsers.filter((u) => activeUserNames.includes(u.SAPUserName));

        const formattedTaggedUsers: TaggedUser[] = activeTaggedUsers.map((u) => ({
            USERNAME: u.SAPUserName,
            EMAIL: u.EmailAddress || '',
        }));

        submitLock.current = true;
        setIsMentionOpen(false);
        addCommentMutation.mutate(
            {
                instanceId,
                text: draft.text,
                taggedUsers: formattedTaggedUsers,
                context: {
                    sapOrigin: context?.sapOrigin || detail?.task?.sapOrigin || 'LOCAL',
                    documentId: docNum,
                    businessObjectType: boType,
                },
            },
            {
                onSettled: () => { submitLock.current = false; },
                onSuccess: () => {
                    setCommentText('');
                    setTaggedUsers([]);
                    setIsMentionOpen(false);
                    richInputRef.current?.clear();
                },
            }
        );
    };

    const handleSelectMentionUser = (user: BusUser) => {
        if (submitLock.current) return;
        richInputRef.current?.insertMention(user, mentionQuery);

        setTaggedUsers((prev) => {
            if (prev.some((u) => u.SAPUserName === user.SAPUserName)) return prev;
            return [...prev, user];
        });

        setIsMentionOpen(false);
    };

    return (
        <Card className="task-chat" role="region" aria-label={t('comments.title')}>
            <div ref={commentListRef} className="task-chat__messages" role="log" aria-label={t('comments.title')}>
                {comments.length === 0 && (
                    <div className="task-chat__empty">
                        <MessageSquare className="size-8" aria-hidden="true" />
                        {t('comments.empty')}
                    </div>
                )}
                {timeline.map(({ comment, day, startsDay }) => (
                    <Fragment key={comment.id}>
                        {startsDay && (
                            <FieldSeparator className="task-chat__day-divider">
                                {formatDayLabel(day)}
                            </FieldSeparator>
                        )}
                        <div className={cn('task-chat__message', comment.isOwn && 'task-chat__message--own')}>
                            <UserAvatar className="task-chat__avatar">{commentAuthorInitials(comment.createdBy)}</UserAvatar>
                            <div className="task-chat__body">
                                <div className="task-chat__metadata">
                                    <span className="task-chat__author">{comment.createdBy}</span>
                                    <time className="task-chat__time" title={formatDateTime(comment.createdAt, i18n.language)}>
                                        {formatDateTime(comment.createdAt, i18n.language, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </time>
                                </div>
                                <div className={cn('task-chat__bubble', comment.forward && 'task-chat__bubble--forward')}>
                                    {comment.forward && (
                                        <div className="task-chat__forward">
                                            <ArrowRight className="size-3.5 shrink-0" aria-hidden="true" />
                                            {t('comments.forwardedTo', { recipient: comment.toUser.trim() || t('comments.noRecipient') })}
                                        </div>
                                    )}
                                    {renderFormattedCommentText(comment.text)}
                                </div>
                            </div>
                        </div>
                    </Fragment>
                ))}
                {addCommentMutation.isPending && (
                    <div className="task-chat__message task-chat__message--own" role="status" aria-label={t('comments.sending')}>
                        <UserAvatar className="task-chat__avatar">{commentAuthorInitials(currentUser?.sapUsername || '')}</UserAvatar>
                        <div className="task-chat__body task-chat__pending" aria-hidden="true">
                            <Skeleton className="task-chat__skeleton-author" />
                            <div className="task-chat__bubble task-chat__skeleton-bubble">
                                <Skeleton className="task-chat__skeleton-line" />
                                <Skeleton className="task-chat__skeleton-line task-chat__skeleton-line--short" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {allowAddComment && instanceId && (
                <div className="task-chat__composer" aria-busy={addCommentMutation.isPending}>
                    <div className={cn('task-chat__input-row', draft.exceedsLimit && 'task-chat__input-row--invalid')}>
                    {isMentionOpen && !addCommentMutation.isPending && <TeamsMentionDropdown
                        isOpen={isMentionOpen && !addCommentMutation.isPending}
                        searchQuery={mentionQuery}
                        onSelectUser={handleSelectMentionUser}
                        onClose={() => setIsMentionOpen(false)}
                    />}
                        <RichMentionInput
                            ref={richInputRef}
                            value={commentText}
                            onChange={handleCommentTextChange}
                            onMentionQuery={(query, _index, open) => { setMentionQuery(query); setIsMentionOpen(open); }}
                            onSubmit={handleSubmit}
                            placeholder={t('comments.placeholder')}
                            disabled={addCommentMutation.isPending}
                            invalid={draft.exceedsLimit}
                            describedBy={draftHelpId}
                            className="task-chat__editor"
                        />
                        <div className="task-chat__input-footer">
                            <div id={draftHelpId} className="task-chat__draft-help">
                                <span className={cn('task-chat__counter', draft.exceedsLimit && 'task-chat__counter--invalid')}
                                    title={t('comments.characterLimitHint')}>
                                    {t('comments.characterLimitCount', { count: draft.length, max: COMMENT_MAX_LENGTH })}
                                </span>
                                {draft.exceedsLimit && <span className="task-chat__limit-error" role="status">
                                    {t('comments.characterLimitExceeded', { max: COMMENT_MAX_LENGTH })}
                                </span>}
                            </div>
                            <Button size="icon" className="task-chat__send" onClick={handleSubmit}
                                aria-label={t('comments.send')} title={t('comments.submitHint')} disabled={!draft.canSend || addCommentMutation.isPending}>
                                {addCommentMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                            </Button>
                        </div>
                    </div>

                </div>
            )}
        </Card>
    );
}
