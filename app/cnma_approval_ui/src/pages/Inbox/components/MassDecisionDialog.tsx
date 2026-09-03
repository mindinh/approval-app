import { useState, useEffect } from 'react';
import {
    Button,
    Textarea,
    Label,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Badge,
    ScrollArea,
} from '@cnma/react-ui';
import type { InboxTask } from '@/services/inbox/inbox.types';
import { CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DECISION_KEYS } from '@/pages/Inbox/utils/constants';

interface MassDecisionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (decisionKey: string, comment: string, tasks: InboxTask[]) => void;
    decisionKey: string;
    tasks: InboxTask[];
    isExecuting?: boolean;
}

export function MassDecisionDialog({
    isOpen,
    onClose,
    onConfirm,
    decisionKey,
    tasks,
    isExecuting = false,
}: MassDecisionDialogProps) {
    const [comment, setComment] = useState('');
    const { t } = useTranslation();

    const isReject = decisionKey === DECISION_KEYS.REJECT || String(decisionKey).toLowerCase().includes('reject');
    const isCommentRequired = isReject;
    const canSubmit = !isCommentRequired || comment.trim().length > 0;

    // Reset comment whenever dialog is opened
    useEffect(() => {
        if (isOpen) {
            setComment('');
        }
    }, [isOpen]);

    const handleConfirm = () => {
        if (!canSubmit) return;
        onConfirm(decisionKey, comment.trim(), tasks);
    };

    if (!isOpen || tasks.length === 0) return null;

    const actionText = isReject
        ? t('decision.reject', 'Reject')
        : t('decision.approve', 'Approve');

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-[92vw] sm:max-w-lg max-h-[88dvh] my-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                        {isReject ? (
                            <XCircle className="size-5 text-destructive" />
                        ) : (
                            <CheckCircle className="size-5 text-emerald-600 dark:text-emerald-400" />
                        )}
                        <span>
                            {actionText} {tasks.length} Task{tasks.length !== 1 ? 's' : ''}
                        </span>
                    </DialogTitle>
                    <DialogDescription>
                        {isCommentRequired
                            ? t(
                                  'decision.massRejectDesc',
                                  'A rejection reason is required and will be applied to all selected tasks.'
                              )
                            : t(
                                  'decision.massApproveDesc',
                                  'You may optionally add a common comment before confirming.'
                              )}
                    </DialogDescription>
                </DialogHeader>

                {/* Selected Documents Preview */}
                <div className="space-y-1.5 py-1">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {t('decision.selectedTasks', 'Selected Tasks')} ({tasks.length})
                    </Label>
                    <ScrollArea className="max-h-28 rounded-md border border-border/70 bg-muted/20 p-2">
                        <div className="flex flex-wrap gap-1.5">
                            {tasks.map((task) => {
                                const docNumber =
                                    task.businessContext?.documentId ||
                                    (task as any).documentNumber ||
                                    task.instanceId;
                                return (
                                    <Badge
                                        key={task.instanceId}
                                        variant="outline"
                                        className="text-xs font-mono bg-background/80 px-2 py-0.5"
                                    >
                                        {docNumber}
                                    </Badge>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </div>

                {/* Comment Textarea */}
                <div className="space-y-2 py-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="mass-decision-comment" className="text-sm font-medium">
                            {t('decision.comment', 'Comment')}
                            {isCommentRequired && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        <span className="text-xs text-muted-foreground">
                            {comment.length}/255
                        </span>
                    </div>
                    <Textarea
                        id="mass-decision-comment"
                        placeholder={
                            isCommentRequired
                                ? t('decision.enterReasonRequired', 'Enter reason for rejection (required)...')
                                : t('decision.addCommentOptional', 'Add an approval comment (optional)...')
                        }
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        maxLength={255}
                        className="min-h-24 resize-none text-base sm:text-sm font-sans"
                        autoFocus
                    />
                </div>

                <DialogFooter className="grid grid-cols-2 gap-3 pt-3 border-t sm:flex sm:justify-end sm:gap-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isExecuting}
                        className="h-11 sm:h-9 font-medium"
                    >
                        {t('decision.cancel', 'Cancel')}
                    </Button>
                    <Button
                        variant={isReject ? 'destructive' : 'success'}
                        onClick={handleConfirm}
                        disabled={!canSubmit || isExecuting}
                        className="h-11 sm:h-9 font-medium"
                    >
                        {isReject ? (
                            <XCircle className="size-4 mr-1.5" />
                        ) : (
                            <CheckCircle className="size-4 mr-1.5" />
                        )}
                        {actionText} ({tasks.length})
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
