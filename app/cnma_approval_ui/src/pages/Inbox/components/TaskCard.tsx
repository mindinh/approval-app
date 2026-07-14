import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@cnma/react-ui';
import type { InboxTask } from '@/services/inbox/inbox.types';
import { Clock, User, ChevronRight, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { mapBusinessChips, type BusinessChip } from '@/pages/Inbox/mappers/taskCard.mapper';
import { PriorityBadge, StatusBadge } from './TaskBadges';

interface TaskCardProps {
    task: InboxTask;
    isSelected: boolean;
    onClick: () => void;
    variant?: 'desktop' | 'mobile';
}

/**
 * Hook wrapper around the pure mapBusinessChips function.
 */
function useBusinessChips(task: InboxTask): BusinessChip[] {
    return useMemo(() => mapBusinessChips(task), [task.businessContext]);
}

function getObjectTypeStyle(type?: string) {
    const defaultStyle = {
        text: 'text-muted-foreground',
        stripe: 'before:bg-transparent',
    };
    if (!type || type === 'UNKNOWN') return defaultStyle;

    const map: Record<string, { text: string; stripe: string }> = {
        PR: { text: 'text-primary font-semibold', stripe: 'before:bg-primary' },
        PO: { text: 'text-info font-semibold', stripe: 'before:bg-info' },
        RE: { text: 'text-warning font-semibold', stripe: 'before:bg-warning' },
        CLAIM: { text: 'text-success font-semibold', stripe: 'before:bg-success' },
    };
    return map[type.toUpperCase()] || defaultStyle;
}

export function TaskCard({
    task,
    isSelected,
    onClick,
    variant = 'desktop',
}: TaskCardProps) {
    const contextType =
        task.businessContext?.type && task.businessContext.type !== 'UNKNOWN'
            ? task.businessContext.type
            : 'Workflow';
    const contextId = task.businessContext?.documentId || task.instanceId;
    const isHighPriority = task.priority === 'HIGH' || task.priority === 'VERY_HIGH';
    const chips = useBusinessChips(task);

    const typeStyle = getObjectTypeStyle(task.businessContext?.type);
    const stripeClass = isHighPriority ? 'before:bg-destructive' : typeStyle.stripe;

    /* ─── Mobile variant ──────────────────────────────────────── */
    if (variant === 'mobile') {
        return (
            <Button
                variant="ghost"
                id={`task-card-${task.instanceId}`}
                onClick={onClick}
                className={cn(
                    // Layout — override Button defaults (items-center → items-stretch, h-auto)
                    'relative w-full h-auto overflow-hidden rounded-2xl border',
                    'flex flex-col items-stretch justify-start gap-0',
                    'px-4 py-4',
                    // Text
                    'text-left whitespace-normal',
                    // Transitions / focus
                    'transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    // Colour — base
                    'bg-card border-border',
                    'shadow-sm',
                    // Colour — selected
                    isSelected &&
                        'border-primary/35 ring-1 ring-primary/10 shadow-sm bg-primary/5',
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
                                ? 'bg-primary/10 text-primary'
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
                    <div className="mt-3 flex w-full flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                        {chips.map((chip, i) => (
                            <span key={i} className="inline-flex min-w-0 max-w-full items-center gap-1">
                                {chip.label && (
                                    <span className="shrink-0 text-muted-foreground/80">{chip.label}:</span>
                                )}
                                <span className="truncate text-foreground">{chip.value}</span>
                            </span>
                        ))}
                    </div>
                )}

                {/* ── Footer ── */}
                <div className="mt-3 flex w-full items-center justify-between gap-3 border-t border-border/60 pt-2.5 text-xs text-muted-foreground">
                    <span className="flex min-w-0 items-center gap-1.5 overflow-hidden">
                        <User className="size-3.5 shrink-0 text-muted-foreground/70" />
                        <span className="truncate">{task.requestorName || task.createdByName || '-'}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5">
                        <Clock className="size-3.5 text-muted-foreground/70" />
                        {task.createdOn
                            ? formatDistanceToNow(new Date(task.createdOn), { addSuffix: true })
                            : '-'}
                    </span>
                </div>
            </Button>
        );
    }

    /* ─── Desktop variant ─────────────────────────────────────── */
    return (
        <Button
            variant="ghost"
            id={`task-card-${task.instanceId}`}
            onClick={onClick}
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
                    'border-primary/35 ring-1 ring-primary/10',
                    'shadow-sm',
                    'bg-primary/5',
                    'before:bg-primary',
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
                {/* Badges — shrink-0 + flex-nowrap so they never wrap */}
                <div className="flex shrink-0 flex-nowrap items-center gap-1">
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
                <div className="mt-2 flex w-full flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {chips.map((chip, i) => (
                        <span key={i} className="inline-flex min-w-0 items-center gap-1 overflow-hidden">
                            {chip.label && (
                                <span className="shrink-0 text-muted-foreground/80">{chip.label}:</span>
                            )}
                            <span className="truncate text-foreground">{chip.value}</span>
                        </span>
                    ))}
                </div>
            )}

            {/* ── Footer ── */}
            <div className="mt-3 flex w-full items-center justify-between gap-3 border-t border-border/60 pt-2.5 text-xs text-muted-foreground">
                <span className="flex min-w-0 items-center gap-1.5 overflow-hidden">
                    <User className="size-3.5 shrink-0 text-muted-foreground/70" />
                    <span className="truncate">{task.requestorName || task.createdByName || '-'}</span>
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
                    isSelected && 'text-primary/60 opacity-100',
                )}
            />
        </Button>
    );
}
