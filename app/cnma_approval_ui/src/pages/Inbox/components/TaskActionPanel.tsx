import { useState } from 'react';
import {
    Button,
    Textarea,
    Label,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@cnma/react-ui';
import { ForwardTaskDialog } from './ForwardTaskDialog';
import type { TaskDetail as TaskDetailType, Decision } from '@/services/inbox/inbox.types';
import { Undo2, Forward, CheckCircle, XCircle, HelpCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface TaskActionPanelProps {
    detail: TaskDetailType;
    onDecision: (decisionKey: string, comment: string) => void;
    onForward?: (forwardTo: string, comment?: string) => void;
    onUndo?: () => void;
    isExecuting: boolean;
    isForwarding?: boolean;
    isApprovedScope?: boolean;
    isMobile?: boolean;
}

export function TaskActionPanel({
    detail,
    onDecision,
    onForward,
    onUndo,
    isExecuting,
    isForwarding,
    isApprovedScope,
    isMobile = false,
}: TaskActionPanelProps) {
    const [isForwardDialogOpen, setIsForwardDialogOpen] = useState(false);
    const [activeDecision, setActiveDecision] = useState<Decision | null>(null);
    const [decisionComment, setDecisionComment] = useState('');
    const { t } = useTranslation();

    // ── Undo Action for Approved Scope ──────────────────────
    if (isApprovedScope) {
        return (
            <div className="flex w-full items-center justify-end">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onUndo}
                    disabled={isExecuting || !onUndo}
                    className={cn(
                        "h-9 min-w-28 font-semibold text-foreground/80",
                        isMobile && "h-10 flex-1 min-w-0"
                    )}
                >
                    <Undo2 className="size-4 mr-1.5" />
                    {t('decision.undo', 'Undo')}
                </Button>
            </div>
        );
    }

    const decisions = detail.decisions || detail.task?.decisions || [];
    const supportsForward = (detail as any)?.supports?.forward !== false && (detail as any)?.task?.supports?.forward !== false;

    if (!decisions.length && !supportsForward) return null;

    // Sort decision options: NEGATIVE -> NEUTRAL -> POSITIVE (Reject before Approve)
    const sortedDecisions = [...decisions].sort((a, b) => {
        const order: Record<string, number> = { NEGATIVE: 0, NEUTRAL: 1, POSITIVE: 2 };
        return (order[a.nature || 'NEUTRAL'] ?? 1) - (order[b.nature || 'NEUTRAL'] ?? 1);
    });

    const isCommentRequired = (decision: Decision): boolean => {
        if (decision.commentMandatory === true) return true;
        if (decision.nature === 'NEGATIVE') return true;
        return false;
    };

    const handleOpenDecision = (decision: Decision) => {
        setActiveDecision(decision);
        setDecisionComment('');
    };

    const handleConfirmDecision = () => {
        if (!activeDecision) return;
        onDecision(activeDecision.key, decisionComment.trim());
        setDecisionComment('');
        setActiveDecision(null);
    };

    const commentRequired = activeDecision ? isCommentRequired(activeDecision) : false;
    const canSubmitDecision = !commentRequired || decisionComment.trim().length > 0;
    const commentSupported = activeDecision?.commentSupported !== false;

    // Compact uniform button styling
    const actionBtnClass = cn(
        "h-8 min-w-24 px-3 text-xs font-medium flex items-center justify-center gap-1.5 transition-all shadow-sm rounded-md",
        isMobile && "h-9 flex-1 min-w-0 text-xs rounded-lg"
    );


    return (
        <>
            <div className={cn(
                "flex items-center justify-end gap-2 text-sm",
                isMobile ? "w-full flex-row" : ""
            )}>
                {/* Forward Button */}
                {supportsForward && onForward && (
                    <Button
                        variant="action"
                        size="sm"
                        onClick={() => setIsForwardDialogOpen(true)}
                        disabled={isExecuting || isForwarding}
                        className={actionBtnClass}
                    >
                        <Forward className="size-4" />
                        {t('decision.forward', 'Forward')}
                    </Button>
                )}

                {/* Decision Buttons (e.g., Reject, Approve) */}
                {sortedDecisions.map((decision) => {
                    const nature = decision.nature || 'NEUTRAL';
                    const variantMap: Record<string, 'success' | 'destructive' | 'outline'> = {
                        POSITIVE: 'success',
                        NEGATIVE: 'destructive',
                        NEUTRAL: 'outline',
                    };
                    const variant = variantMap[nature] || 'outline';

                    return (
                        <Button
                            key={decision.key}
                            id={`decision-btn-${decision.key}`}
                            variant={variant}
                            size="sm"
                            onClick={() => handleOpenDecision(decision)}
                            disabled={isExecuting || isForwarding}
                            className={actionBtnClass}
                        >
                            {isExecuting ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <DecisionIcon nature={decision.nature} />
                            )}
                            {decision.text}
                        </Button>
                    );
                })}
            </div>

            {/* Forward Dialog Modal */}
            {supportsForward && onForward && (
                <ForwardTaskDialog
                    isOpen={isForwardDialogOpen}
                    onClose={() => setIsForwardDialogOpen(false)}
                    onForward={(forwardTo, comment) => {
                        onForward(forwardTo, comment);
                        setIsForwardDialogOpen(false);
                    }}
                    isSubmitting={!!isForwarding}
                    taskTitle={detail.title || detail.task?.title}
                />
            )}

            {/* Decision Confirmation Dialog */}
            <Dialog
                open={!!activeDecision}
                onOpenChange={(open) => {
                    if (!open) {
                        setActiveDecision(null);
                        setDecisionComment('');
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {activeDecision && (
                                <DecisionIcon nature={activeDecision.nature} />
                            )}
                            {activeDecision?.text}
                        </DialogTitle>
                        <DialogDescription>
                            {commentRequired
                                ? 'A comment is required for this action.'
                                : 'You may optionally add a comment before confirming.'}
                        </DialogDescription>
                    </DialogHeader>

                    {commentSupported && (
                        <div className="space-y-2 py-2">
                            <Label htmlFor="decision-dialog-comment" className="text-sm font-medium">
                                Comment {commentRequired && <span className="text-destructive">*</span>}
                            </Label>
                            <Textarea
                                id="decision-dialog-comment"
                                placeholder={
                                    commentRequired
                                        ? 'Enter your comment (required)...'
                                        : 'Add a comment (optional)...'
                                }
                                value={decisionComment}
                                onChange={(e) => setDecisionComment(e.target.value)}
                                maxLength={255}
                                className="min-h-24 resize-none text-sm font-sans"
                                autoFocus
                            />
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            className="mr-2 h-9 min-w-24"
                            onClick={() => {
                                setActiveDecision(null);
                                setDecisionComment('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant={activeDecision?.nature === 'NEGATIVE' ? 'destructive' : 'success'}
                            onClick={handleConfirmDecision}
                            disabled={!canSubmitDecision || isExecuting}
                            className="h-9 min-w-24 gap-1.5"
                        >
                            {isExecuting ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                activeDecision && <DecisionIcon nature={activeDecision.nature} />
                            )}
                            {activeDecision?.text}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function DecisionIcon({ nature }: { nature?: string }) {
    switch (nature) {
        case 'POSITIVE':
            return <CheckCircle className="size-4" />;
        case 'NEGATIVE':
            return <XCircle className="size-4" />;
        default:
            return <HelpCircle className="size-4" />;
    }
}
