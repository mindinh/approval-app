/**
 * WorkflowApprovalPanel — displays the PR approval tree with expandable steps.
 */
import { useState } from 'react';
import { CheckCircle2, Circle, Check, User, Clock3, MessageSquare, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge, Button } from '@cnma/react-ui';
import type { WorkflowApprovalTreeResponse } from '@/services/inbox/inbox.types';
import { safe } from '@/pages/Inbox/utils/formatters';
import {
    normalizeApprovalStatus,
    isPendingApprovalStatus,
    formatApprovalStatus,
} from '@/pages/Inbox/utils/predicates';
import { cn } from '@/lib/utils';

export function WorkflowApprovalPanel({
    data,
    isLoading,
    error,
    taskDetail,
}: {
    data?: WorkflowApprovalTreeResponse;
    isLoading: boolean;
    error?: string;
    taskDetail?: { createdByName?: string };
}) {
    const [expandedStepLevels, setExpandedStepLevels] = useState<number[]>([]);

    const toggleExpand = (level: number) => {
        setExpandedStepLevels(prev =>
            prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
        );
    };

    const steps = Array.isArray(data?.steps) ? [...data.steps].sort((a, b) => a.level - b.level) : [];
    const currentIndex = steps.findIndex((step) => isPendingApprovalStatus(step.status));
    const nextIndex = currentIndex >= 0 && currentIndex < steps.length - 1 ? currentIndex + 1 : -1;

    return (
        <div className="bg-card px-5 py-6 rounded-none sm:rounded-xl shadow-none sm:shadow-sm border border-border/40">
            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground mb-6">Workflow Progress</h3>

            {isLoading && (
                <div className="py-5 text-sm text-muted-foreground">
                    Loading workflow approval steps...
                </div>
            )}

            {!isLoading && error && (
                <div className="rounded-lg border border-dashed border-border/70 px-4 py-5 text-sm text-muted-foreground">
                    {typeof error === 'string' ? error : (error as any)?.message || JSON.stringify(error)}
                </div>
            )}

            {!isLoading && !error && steps.length === 0 && (
                <div className="py-5 text-sm text-muted-foreground italic">
                    No workflow approval steps found for this task.
                </div>
            )}

            {!isLoading && !error && steps.length > 0 && (
                <div className="space-y-0">
                    {steps.map((step, index) => {
                        const isCurrent = index === currentIndex;
                        const isNext = index === nextIndex;
                        const isCompleted = currentIndex >= 0 ? index < currentIndex : normalizeApprovalStatus(step.status) === 'APPROVED';
                        const isPending = !isCompleted && !isCurrent;
                        const statusRaw = normalizeApprovalStatus(step.status);
                        const isExpanded = expandedStepLevels.includes(step.level);

                        const title = step.approver || `Level ${step.level}`;
                        const initial = typeof title === 'string' && title.length > 0 ? title.charAt(0).toUpperCase() : 'C';

                        // Line color determination
                        let lineClasses = "hidden";
                        if (isCompleted) {
                            lineClasses = "bg-success w-0.5";
                        } else if (isCurrent) {
                            lineClasses = "border-l-2 border-dotted border-warning/40 w-0.5";
                        } else {
                            lineClasses = "border-l-2 border-dotted border-border w-0.5";
                        }

                        return (
                            <motion.div
                                key={`${step.documentId}-${step.level}-${index}`}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className="flex relative items-stretch"
                            >
                                {/* Left icon & vertical line */}
                                <div className="flex flex-col items-center mr-4 w-7 shrink-0 relative">
                                    <div className="z-10 bg-card py-1">
                                        {isCompleted ? (
                                            <div className="flex items-center justify-center size-7 rounded-full bg-success text-white shadow-sm ring-4 ring-card">
                                                <CheckCircle2 className="size-4" />
                                            </div>
                                        ) : isCurrent ? (
                                            <div className="flex items-center justify-center size-7 rounded-full bg-warning-bg text-warning ring-4 ring-card font-medium text-xs">
                                                <Loader2 className="size-3.5 animate-spin" />
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center size-7 rounded-full border-2 border-border bg-card ring-4 ring-card">
                                                <div className="size-2 rounded-full border border-border" />
                                            </div>
                                        )}
                                    </div>

                                    {/* The connecting line */}
                                    <div className={cn("absolute top-8 bottom-[-4px] left-1/2 -translate-x-1/2", lineClasses)} />
                                </div>

                                {/* Content block */}
                                <div className="flex-1 pb-8 min-w-0">
                                    <div className="text-xs text-muted-foreground font-medium mb-1 mt-0.5">
                                        Level {step.level}
                                        {(step.releaseText || step.releaseCode) && <span className="mx-1.5">•</span>}
                                        {step.releaseText ? (
                                            <span>{step.releaseText}</span>
                                        ) : step.releaseCode ? (
                                            <span>Code {step.releaseCode}</span>
                                        ) : null}
                                    </div>
                                    <div className="flex items-start justify-between">
                                        <h4 className={cn(
                                            "text-base flex items-center gap-2 font-semibold truncate mb-1.5",
                                            isCurrent ? "text-foreground" : "text-foreground/80",
                                            isPending && "text-muted-foreground"
                                        )}>
                                            <span>{title}</span>
                                            {isCurrent && <Badge variant="warning" className="h-5 px-1.5 text-xs">Current</Badge>}
                                            {isNext && <Badge variant="info" className="h-5 px-1.5 text-xs">Next</Badge>}
                                        </h4>
                                    </div>

                                    <div className="space-y-1.5 text-sm">
                                        <div className="flex items-center gap-1.5 truncate">
                                            <span className="text-muted-foreground w-32 shrink-0">Status:</span>
                                            <span className={cn(
                                                "font-medium",
                                                isCompleted ? "text-success" : (isCurrent ? "text-warning" : "text-muted-foreground")
                                            )}>
                                                {formatApprovalStatus(statusRaw)}
                                            </span>
                                        </div>

                                        {step.postedOn && (
                                            <div className="flex items-center gap-1.5 truncate">
                                                <span className="text-muted-foreground w-32 shrink-0">Approved Date:</span>
                                                <span className={isPending ? "text-muted-foreground" : "text-foreground/80"}>
                                                    {step.postedOn} {step.postedTime?.split('.')[0] || ''}
                                                </span>
                                            </div>
                                        )}

                                        {step.noteText && (
                                            <div className="flex justify-start pt-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => toggleExpand(step.level)}
                                                    className="text-xs text-muted-foreground hover:text-foreground font-medium shrink-0 h-auto p-0 hover:bg-transparent transition-colors"
                                                >
                                                    {isExpanded ? "Hide comment" : "Show more"}
                                                </Button>
                                            </div>
                                        )}

                                        {step.noteText && (
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                                        animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                                                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="bg-muted/30 rounded-lg p-3 text-foreground/80 border border-border/60 flex gap-2 w-full">
                                                            <MessageSquare className="size-3.5 mt-0.5 text-muted-foreground/60 shrink-0" />
                                                            <span className="whitespace-pre-wrap">{step.noteText}</span>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
