import { useMemo, memo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@cnma/react-ui';
import type { InboxTask } from '@/services/inbox/inbox.types';
import { Clock, User, ChevronRight, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { StatusBadge, TaskTypeBadge } from './TaskBadges';
import { useQueryClient } from '@tanstack/react-query';

import { inboxKeys } from '../hooks/inboxKeys';
import { inboxApi } from '@/services/inbox/inbox.api';
import { findObjectTypeModule, resolveTaskCardConfigForTask, type BusinessChip, type Tone } from '@/renderers';

import { isApprovedApprovalStatus } from '../utils/predicates';

import { SlaIcon } from './SlaIcons';

interface TaskCardProps {
    task: InboxTask;
    isSelected: boolean;
    onClick: (task: InboxTask) => void;
    variant?: 'desktop' | 'mobile';
}

/** Tailwind classes per renderer tone (literal strings so Tailwind can detect them). */
const TONE_CLASSES: Record<Tone, { text: string; stripe: string }> = {
    primary: { text: 'text-primary font-semibold', stripe: 'before:bg-primary' },
    info: { text: 'text-info font-semibold', stripe: 'before:bg-info' },
    warning: { text: 'text-warning font-semibold', stripe: 'before:bg-warning' },
    success: { text: 'text-success font-semibold', stripe: 'before:bg-success' },
};

const DAY_MS = 1000 * 60 * 60 * 24;
const OVERDUE_AFTER_DAYS = 5;

/** Age of an open task (days since `createdOn`, measured now), or null when the date is missing or invalid. */
function getAging(createdOn: string | undefined) {
    if (!createdOn) return null;
    const createdTime = new Date(createdOn).getTime();
    if (Number.isNaN(createdTime)) return null;
    const diffDays = (Date.now() - createdTime) / DAY_MS;
    return { isOverdue: diffDays > OVERDUE_AFTER_DAYS, days: Math.floor(diffDays) };
}

/**
 * Custom hook to resolve Task Card configuration (chips and styling) directly from Task data.
 */
function useTaskCardConfig(task: InboxTask) {
    return useMemo(() => resolveTaskCardConfigForTask(task), [task]);
}

export const TaskCard = memo(function TaskCard({
    task,
    isSelected,
    onClick,
    variant = 'desktop',
}: TaskCardProps) {
    const queryClient = useQueryClient();
    const handlePrefetch = useCallback(() => {
        void queryClient.prefetchQuery({
            queryKey: inboxKeys.taskDetail(task.instanceId),
            queryFn: () => inboxApi.getTaskDetail(task.instanceId),
            staleTime: 5 * 60 * 1000,
        });
    }, [queryClient, task.instanceId]);

    const rawTypeText = task.DocumentTypeText || task.doctyp_desc || task.documentTypeDisplay;
    const category = task.objectType || task.DocCategory || task.TechnicalWrkflwObjectType || task.businessContext?.type;
    const contextType = rawTypeText || findObjectTypeModule(category)?.label || task.objectType || 'Task';
    const contextId = task.businessContext?.documentId || task.instid || task.instanceId;

    const isCompleted = isApprovedApprovalStatus(task.status) || task.status === 'COMPLETED' || task.status === 'APPROVED';
    const actionPrefix = task.normalTask === false ? (isCompleted ? 'Reviewed' : 'Review') : (isCompleted ? 'Approved' : 'Approve');

    const hasBorCodeTitle = task.title && (task.title.includes('BUS2') || task.title.includes('ZBUS2'));
    const displayTitle = (task.title && !hasBorCodeTitle) ? task.title : `${actionPrefix} ${contextType} ${contextId}`;
    const requesterName = task.requestorName || task.createdByName || task.CreatedByUser || task.CreatedByName || task.createdByUser || task.UserName || task.UserFullName || '-';

    const aging = useMemo(() => (isCompleted ? null : getAging(task.createdOn)), [task.createdOn, isCompleted]);

    const { tone, chips } = useTaskCardConfig(task);
    const { text: toneTextClass, stripe: stripeClass } = TONE_CLASSES[tone];

    /* ─── Mobile variant ──────────────────────────────────────── */
    if (variant === 'mobile') {
        return (
            <div
                role="button"
                tabIndex={0}
                id={`task-card-${task.instanceId}`}
                aria-current={isSelected ? 'true' : undefined}
                onClick={() => onClick(task)}
                onMouseEnter={handlePrefetch}
                onFocus={handlePrefetch}
                className={cn(
                    // Layout
                    'group relative w-full h-auto overflow-hidden rounded-2xl border cursor-pointer select-none',
                    'flex flex-col items-stretch justify-start gap-0',
                    'px-4 py-3.5',
                    // Text
                    'text-left whitespace-normal',
                    // Transitions / focus / tactile feel
                    'transition-all duration-150 active:scale-[0.98] active:bg-muted/30',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    // Colour — base
                    'bg-card border-border/80',
                    'shadow-xs hover:shadow-sm',
                    // Colour — selected
                    isSelected && {
                        'border-info ring-2 ring-info/30 shadow-md bg-info/10': tone === 'info',
                        'border-warning ring-2 ring-warning/30 shadow-md bg-warning/10': tone === 'warning',
                        'border-success ring-2 ring-success/30 shadow-md bg-success/10': tone === 'success',
                        'border-primary ring-2 ring-primary/30 shadow-md bg-primary/10': tone === 'primary',
                    },
                    // Priority accent stripe (left edge)
                    !isSelected &&
                    cn('before:absolute before:inset-y-0 before:left-0 before:w-1 before:rounded-r-full', stripeClass),
                )}
            >
                {/* ── Icon + header row ── */}
                <div className="flex w-full items-start gap-3">
                    {!isCompleted && (
                        <div
                            className={cn(
                                'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl transition-all',
                                aging
                                    ? aging.isOverdue
                                        ? 'bg-rose-100/70 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/50 shadow-xs'
                                        : 'bg-emerald-100/70 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50 shadow-xs'
                                    : (isSelected
                                        ? {
                                            'bg-info/15 text-info border border-info/30': tone === 'info',
                                            'bg-warning/15 text-warning border border-warning/30': tone === 'warning',
                                            'bg-success/15 text-success border border-success/30': tone === 'success',
                                            'bg-primary/15 text-primary border border-primary/30': tone === 'primary',
                                        }
                                        : 'bg-muted/80 text-muted-foreground border border-border/70'),
                            )}
                            title={aging ? (aging.isOverdue ? 'Pending > 5 days (Overdue)' : 'New task (< 5 days)') : undefined}
                        >
                            {aging ? (
                                <SlaIcon isOverdue={aging.isOverdue} className="size-6" />
                            ) : (
                                <FileText className="size-4 text-muted-foreground" />
                            )}
                        </div>
                    )}

                    <div className="min-w-0 flex-1">
                        {/* ID + Badges */}
                        <div className="flex w-full items-start justify-between gap-1.5">
                            <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
                                <span className={cn('truncate text-xs font-semibold tracking-wide', toneTextClass)}>
                                    {contextId}
                                </span>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                                <TaskTypeBadge normalTask={task.normalTask} />
                                <StatusBadge status={task.status} />
                            </div>
                        </div>

                        {/* Title */}
                        <h3 className="mt-1 line-clamp-2 text-left text-sm font-bold leading-snug text-foreground">
                            {displayTitle}
                        </h3>
                    </div>
                </div>

                {/* ── Business detail chips ── */}
                {chips.length > 0 && (
                    <div className="mt-2.5 flex w-full flex-wrap gap-1.5 text-xs">
                        {chips.map((chip: BusinessChip, i: number) => (
                            <span
                                key={i}
                                className={cn(
                                    'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-colors',
                                    chip.isPrimary
                                        ? 'bg-primary/10 text-primary border-primary/25 font-semibold'
                                        : 'bg-muted/60 text-muted-foreground border-border/70'
                                )}
                            >
                                {chip.label && (
                                    <span className={cn('shrink-0 opacity-80', chip.isPrimary ? 'text-primary' : 'text-muted-foreground')}>{chip.label}:</span>
                                )}
                                <span className={cn('truncate', chip.isPrimary ? 'font-bold' : 'text-foreground')}>{chip.value}</span>
                            </span>
                        ))}
                    </div>
                )}

                {/* ── Footer ── */}
                <div className="mt-3 flex w-full items-center justify-between gap-3 border-t border-border/50 pt-2.5 text-xs text-muted-foreground">
                    <span className="flex min-w-0 items-center gap-1.5 overflow-hidden">
                        <User className="size-3.5 shrink-0 text-muted-foreground/70" />
                        <span className="truncate">Requestor: {requesterName}</span>
                    </span>
                    <div className="flex shrink-0 items-center gap-2">
                        {isCompleted ? (
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground/80">
                                <Clock className="size-3 text-muted-foreground/60 shrink-0" />
                                <span>
                                    {task.createdOn
                                        ? formatDistanceToNow(new Date(task.createdOn), { addSuffix: true })
                                        : '-'}
                                </span>
                            </span>
                        ) : (
                            <span
                                title={aging?.isOverdue ? 'Pending > 5 days' : 'New task (< 5 days)'}
                                className={cn(
                                    'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium border transition-colors',
                                    aging
                                        ? aging.isOverdue
                                            ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-800/40'
                                            : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/40'
                                        : 'text-muted-foreground bg-muted/40 border-border/50'
                                )}
                            >
                                <Clock className="size-3 shrink-0" />
                                <span>
                                    {task.createdOn
                                        ? formatDistanceToNow(new Date(task.createdOn), { addSuffix: true })
                                        : '-'}
                                </span>
                            </span>
                        )}
                        <ChevronRight className="size-3.5 text-muted-foreground/40 group-active:translate-x-0.5 transition-transform" />
                    </div>
                </div>
            </div>
        );
    }

    /* ─── Desktop variant ─────────────────────────────────────── */
    return (
        <Button
            variant="ghost"
            id={`task-card-${task.instanceId}`}
            aria-current={isSelected ? 'true' : undefined}
            onClick={() => onClick(task)}
            onMouseEnter={handlePrefetch}
            onFocus={handlePrefetch}
            className={cn(
                // Layout — override Button defaults
                'group relative w-full h-auto overflow-hidden rounded-2xl border',
                'flex flex-col items-stretch justify-start gap-0',
                'px-4 py-3.5',
                // Text
                'text-left whitespace-normal',
                // Transitions / focus
                'transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                // Left accent stripe (always present, transparent by default)
                'before:absolute before:inset-y-0 before:left-0 before:w-1 before:rounded-r-full before:transition-colors',
                // Colour — base (not selected)
                !isSelected && [
                    'bg-card border-border',
                    'shadow-sm',
                    stripeClass,
                ],
                // Colour — selected
                isSelected && [
                    'shadow-md ring-2',
                    tone === 'info' && 'border-info ring-info/30 bg-info/10 before:bg-info',
                    tone === 'warning' && 'border-warning ring-warning/30 bg-warning/10 before:bg-warning',
                    tone === 'success' && 'border-success ring-success/30 bg-success/10 before:bg-success',
                    tone === 'primary' && 'border-primary ring-primary/30 bg-primary/10 before:bg-primary',
                ],
            )}
        >
            {/* ── Icon + header row ── */}
            <div className="flex w-full items-start gap-3">
                {!isCompleted && (
                    <div
                        className={cn(
                            'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl transition-all',
                            aging
                                ? aging.isOverdue
                                    ? 'bg-rose-100/70 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/50 shadow-xs'
                                    : 'bg-emerald-100/70 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50 shadow-xs'
                                : (isSelected
                                    ? {
                                        'bg-info/15 text-info border border-info/30': tone === 'info',
                                        'bg-warning/15 text-warning border border-warning/30': tone === 'warning',
                                        'bg-success/15 text-success border border-success/30': tone === 'success',
                                        'bg-primary/15 text-primary border border-primary/30': tone === 'primary',
                                    }
                                    : 'bg-muted/80 text-muted-foreground border border-border/70'),
                        )}
                        title={aging ? (aging.isOverdue ? 'Pending > 5 days (Overdue)' : 'New task (< 5 days)') : undefined}
                    >
                        {aging ? (
                            <SlaIcon isOverdue={aging.isOverdue} className="size-6" />
                        ) : (
                            <FileText className="size-4 text-muted-foreground" />
                        )}
                    </div>
                )}

                <div className="min-w-0 flex-1">
                    {/* ── Header: id + badges ── */}
                    <div className="flex w-full items-center justify-between gap-2">
                        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
                            <span className={cn('truncate text-xs font-medium', toneTextClass)}>
                                {contextId}
                            </span>
                        </div>
                        <div className="flex shrink-0 flex-nowrap items-center gap-1">
                            <TaskTypeBadge normalTask={task.normalTask} />
                            <StatusBadge status={task.status} />
                        </div>
                    </div>

                    {/* ── Title ── */}
                    <h3 className="mt-1.5 w-full line-clamp-2 text-left text-sm font-bold leading-snug text-foreground">
                        {displayTitle}
                    </h3>
                </div>
            </div>

            {/* ── Business detail chips ── */}
            {chips.length > 0 && (
                <div className="mt-2.5 flex w-full flex-wrap gap-1.5 text-xs">
                    {chips.map((chip: BusinessChip, i: number) => (
                        <span
                            key={i}
                            className={cn(
                                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors',
                                chip.isPrimary
                                    ? 'bg-primary/10 text-primary border-primary/20'
                                    : 'bg-muted/70 text-muted-foreground border-border/80'
                            )}
                        >
                            {chip.label && (
                                <span className={cn('shrink-0 opacity-85', chip.isPrimary ? 'text-primary' : 'text-muted-foreground')}>{chip.label}:</span>
                            )}
                            <span className={cn('truncate', chip.isPrimary ? 'font-semibold' : 'text-foreground')}>{chip.value}</span>
                        </span>
                    ))}
                </div>
            )}

            {/* ── Footer ── */}
            <div className="mt-3 flex w-full items-center justify-between gap-3 border-t border-border/60 pt-2.5 text-xs text-muted-foreground">
                <span className="flex min-w-0 items-center gap-1.5 overflow-hidden">
                    <User className="size-3.5 shrink-0 text-muted-foreground/70" />
                    <span className="truncate">Requestor: {requesterName}</span>
                </span>
                {isCompleted ? (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground/80 shrink-0">
                        <Clock className="size-3 text-muted-foreground/60 shrink-0" />
                        <span>
                            {task.createdOn
                                ? formatDistanceToNow(new Date(task.createdOn), { addSuffix: true })
                                : '-'}
                        </span>
                    </span>
                ) : (
                    <span
                        title={aging?.isOverdue ? 'Pending > 5 days' : 'New task (< 5 days)'}
                        className={cn(
                            'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium border transition-colors shrink-0',
                            aging
                                ? aging.isOverdue
                                    ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-800/40'
                                    : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/40'
                                : 'text-muted-foreground bg-muted/40 border-border/50'
                        )}
                    >
                        <Clock className="size-3 shrink-0" />
                        <span>
                            {task.createdOn
                                ? formatDistanceToNow(new Date(task.createdOn), { addSuffix: true })
                                : '-'}
                        </span>
                    </span>
                )}
            </div>

            {/* ── Hover chevron indicator ── */}
            <ChevronRight
                className={cn(
                    'absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100',
                    isSelected && {
                        'text-info/60 opacity-100': tone === 'info',
                        'text-warning/60 opacity-100': tone === 'warning',
                        'text-success/60 opacity-100': tone === 'success',
                        'text-primary/60 opacity-100': tone === 'primary',
                    },
                )}
            />
        </Button>
    );
});
