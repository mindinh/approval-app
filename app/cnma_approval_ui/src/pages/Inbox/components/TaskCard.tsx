import { useMemo, memo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@cnma/react-ui';
import type { InboxTask } from '@/services/inbox/inbox.types';
import { Clock, User, ChevronRight, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PriorityBadge, StatusBadge, TaskTypeBadge } from './TaskBadges';
import { useQueryClient } from '@tanstack/react-query';

import { inboxKeys } from '../hooks/inboxKeys';
import { inboxApi } from '@/services/inbox/inbox.api';
import { resolveTaskCardConfigForTask, type BusinessChip } from '@/renderers/ObjectView.registry';

interface TaskCardProps {
    task: InboxTask;
    isSelected: boolean;
    onClick: (task: InboxTask) => void;
    variant?: 'desktop' | 'mobile';
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


    const contextType =
        task.businessContext?.type && task.businessContext.type !== 'UNKNOWN'
            ? task.businessContext.type
            : 'Workflow';
    const contextId = task.businessContext?.documentId || task.instanceId;
    const isHighPriority = task.priority === 'HIGH' || task.priority === 'VERY_HIGH';

    const { style, chips } = useTaskCardConfig(task);
    const colorKey = style.colorKey;
    const typeStyle = {
        text: style.textClass || 'text-muted-foreground',
        stripe: style.stripeClass || 'before:bg-transparent',
    };
    const stripeClass = isHighPriority ? 'before:bg-destructive' : typeStyle.stripe;

    /* ─── Mobile variant ──────────────────────────────────────── */
    if (variant === 'mobile') {
        return (
            <div
                role="button"
                tabIndex={0}
                id={`task-card-${task.instanceId}`}
                onClick={() => onClick(task)}
                onMouseEnter={handlePrefetch}
                onFocus={handlePrefetch}
                className={cn(
                    // Layout
                    'relative w-full h-auto overflow-hidden rounded-2xl border cursor-pointer select-none',
                    'flex flex-col items-stretch justify-start gap-0',
                    'px-4 py-4',
                    // Text
                    'text-left whitespace-normal',
                    // Transitions / focus
                    'transition-all duration-200 active:scale-[0.99] active:bg-muted/40',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    // Colour — base
                    'bg-card border-border',
                    'shadow-sm',
                    // Colour — selected
                    isSelected && {
                        'border-info/35 ring-1 ring-info/10 shadow-sm bg-info/5': colorKey === 'info',
                        'border-warning/35 ring-1 ring-warning/10 shadow-sm bg-warning/5': colorKey === 'warning',
                        'border-success/35 ring-1 ring-success/10 shadow-sm bg-success/5': colorKey === 'success',
                        'border-primary/35 ring-1 ring-primary/10 shadow-sm bg-primary/5': colorKey === 'primary',
                    },
                    // Priority accent stripe (left edge)
                    !isSelected && stripeClass !== 'before:bg-transparent' &&
                    cn('before:absolute before:inset-y-0 before:left-0 before:w-1', stripeClass),
                )}
            >
                {/* ── Icon + header row ── */}
                <div className="flex w-full items-start gap-3">
                    <div
                        className={cn(
                            'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl',
                            isSelected
                                ? {
                                    'bg-info/10 text-info': colorKey === 'info',
                                    'bg-warning/10 text-warning': colorKey === 'warning',
                                    'bg-success/10 text-success': colorKey === 'success',
                                    'bg-primary/10 text-primary': colorKey === 'primary',
                                }
                                : 'bg-muted text-muted-foreground',
                        )}
                    >
                        <FileText className="size-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                        {/* Type + ID + Badges */}
                        <div className="flex w-full items-start justify-between gap-2">
                            <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
                                <span className={cn('shrink-0 text-xs', typeStyle.text)}>
                                    {contextType}
                                </span>
                                <span className={cn('truncate text-xs', typeStyle.text)}>
                                    {contextId}
                                </span>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                                <TaskTypeBadge normalTask={task.normalTask} />
                                <PriorityBadge priority={task.priority} />
                                <StatusBadge status={task.status} />
                            </div>
                        </div>

                        {/* Title */}
                        <h3 className="mt-1 line-clamp-2 text-left text-sm font-bold leading-snug text-foreground">
                            {task.title}
                        </h3>
                    </div>
                </div>

                {/* ── Business detail chips ── */}
                {chips.length > 0 && (
                    <div className="mt-3 flex w-full flex-wrap gap-1.5 text-xs">
                        {chips.map((chip: BusinessChip, i: number) => (
                            <span
                                key={i}
                                className={cn(
                                    'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-colors',
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
                        <span className="truncate">Requestor: {task.requestorName || task.createdByName || '-'}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5">
                        <Clock className="size-3.5 text-muted-foreground/70" />
                        {task.createdOn
                            ? formatDistanceToNow(new Date(task.createdOn), { addSuffix: true })
                            : '-'}
                    </span>
                </div>
            </div>
        );
    }

    /* ─── Desktop variant ─────────────────────────────────────── */
    return (
        <Button
            variant="ghost"
            id={`task-card-${task.instanceId}`}
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
                    'shadow-sm',
                    colorKey === 'info' && 'border-info/35 ring-1 ring-info/10 bg-info/5 before:bg-info',
                    colorKey === 'warning' && 'border-warning/35 ring-1 ring-warning/10 bg-warning/5 before:bg-warning',
                    colorKey === 'success' && 'border-success/35 ring-1 ring-success/10 bg-success/5 before:bg-success',
                    colorKey === 'primary' && 'border-primary/35 ring-1 ring-primary/10 bg-primary/5 before:bg-primary',
                ],
            )}
        >
            {/* ── Header: type + id + badges ── */}
            <div className="flex w-full items-center justify-between gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
                    <span className={cn('shrink-0 text-xs font-normal', typeStyle.text)}>
                        {contextType}
                    </span>
                    <span className={cn('truncate text-xs', typeStyle.text)}>
                        {contextId}
                    </span>
                </div>
                <div className="flex shrink-0 flex-nowrap items-center gap-1">
                    <TaskTypeBadge normalTask={task.normalTask} />
                    <PriorityBadge priority={task.priority} />
                    <StatusBadge status={task.status} />
                </div>
            </div>

            {/* ── Title ── */}
            <h3 className="mt-1.5 w-full line-clamp-2 text-left text-sm font-bold leading-snug text-foreground">
                {task.title}
            </h3>

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
                    <span className="truncate">Requestor: {task.requestorName || task.createdByName || '-'}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                    <Clock className="size-3.5 text-muted-foreground/70" />
                    {task.createdOn
                        ? formatDistanceToNow(new Date(task.createdOn), { addSuffix: true })
                        : '-'}
                </span>
            </div>

            {/* ── Hover chevron indicator ── */}
            <ChevronRight
                className={cn(
                    'absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100',
                    isSelected && {
                        'text-info/60 opacity-100': colorKey === 'info',
                        'text-warning/60 opacity-100': colorKey === 'warning',
                        'text-success/60 opacity-100': colorKey === 'success',
                        'text-primary/60 opacity-100': colorKey === 'primary',
                    },
                )}
            />
        </Button>
    );
});

