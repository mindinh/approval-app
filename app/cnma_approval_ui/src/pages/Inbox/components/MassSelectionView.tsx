import { useMemo } from 'react';
import { ScrollArea, Button, Badge, Checkbox } from '@cnma/react-ui';
import type { InboxTask } from '@/services/inbox/inbox.types';
import { CheckCircle, XCircle, ListChecks, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatShortDate } from '@/pages/Inbox/utils/formatters';
import { DECISION_KEYS } from '@/pages/Inbox/utils/constants';
import { PriorityBadge, StatusBadge } from './TaskBadges';

interface MassSelectionViewProps {
    tasks: InboxTask[];
    selectedIds: Set<string>;
    onToggleSelection: (taskId: string) => void;
    onToggleSelectAll?: () => void;
    onMassDecision: (decisionKey: string, taskIds: string[]) => void;
    isExecuting: boolean;
}

export function MassSelectionView({
    tasks,
    selectedIds,
    onToggleSelection,
    onToggleSelectAll,
    onMassDecision,
    isExecuting,
}: MassSelectionViewProps) {
    const selectedTasks = useMemo(
        () => tasks.filter((t) => selectedIds.has(t.instanceId) && t.normalTask !== false),
        [tasks, selectedIds]
    );

    const excludedCcTasks = useMemo(
        () => tasks.filter((t) => t.normalTask === false),
        [tasks]
    );

    // Collect common decisions across all selected tasks
    // For mass action, we provide generic Approve/Reject buttons
    const hasSelectedTasks = selectedTasks.length > 0;

    if (!hasSelectedTasks) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <ListChecks className="size-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-sm font-medium text-muted-foreground">
                    Select tasks to view summary
                </h3>
                <p className="text-xs text-muted-foreground/70 mt-1">
                    Use the checkboxes in the task list to select multiple tasks
                </p>
            </div>
        );
    }

    return (
        <div className="flex h-full min-w-0 flex-col bg-muted/30">
            {/* Header */}
            <div className="border-b border-border/60 px-5 py-4 bg-background">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h2 className="text-xl font-semibold text-foreground">
                            Task Summary
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''} selected for mass action
                            {excludedCcTasks.length > 0 && ` (${excludedCcTasks.length} review-only task${excludedCcTasks.length !== 1 ? 's' : ''} excluded)`}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {excludedCcTasks.length > 0 && (
                            <Badge variant="outline" className="h-7 px-2.5 text-xs text-muted-foreground font-normal">
                                {excludedCcTasks.length} CC excluded
                            </Badge>
                        )}
                        <Badge variant="secondary" className="h-7 px-3 text-sm font-medium">
                            {selectedTasks.length} selected
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Summary Table */}
            <ScrollArea className="flex-1 min-h-0">
                <div className="px-5 py-4 space-y-6">
                    {/* ── Actionable Selected Tasks Table ── */}
                    <div className="rounded-lg border border-border bg-card overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/50">
                                    <th className="px-3 py-2.5 text-left w-10">
                                        <Checkbox
                                            checked={
                                                selectedTasks.length === tasks.filter((t) => t.normalTask !== false).length &&
                                                tasks.filter((t) => t.normalTask !== false).length > 0
                                            }
                                            onCheckedChange={onToggleSelectAll}
                                            disabled={!onToggleSelectAll}
                                        />
                                    </th>
                                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Task Title
                                    </th>
                                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Requestor
                                    </th>
                                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Document
                                    </th>
                                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Priority
                                    </th>
                                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Created On
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedTasks.map((task, idx) => {
                                    const typeText =
                                        task.documentTypeDisplay ||
                                        task.documentTypeDesc ||
                                        (task as any).DocumentTypeText ||
                                        (task as any).doctyp_desc ||
                                        task.businessContext?.type ||
                                        task.objectType ||
                                        '-';

                                    return (
                                        <tr
                                            key={task.instanceId}
                                            onClick={() => onToggleSelection(task.instanceId)}
                                            className={cn(
                                                'border-b border-border/60 hover:bg-muted/30 transition-colors cursor-pointer select-none',
                                                idx % 2 === 0 ? 'bg-card' : 'bg-muted/10'
                                            )}
                                        >
                                            <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                                                <Checkbox
                                                    checked={selectedIds.has(task.instanceId)}
                                                    onCheckedChange={() => onToggleSelection(task.instanceId)}
                                                />
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <div className="font-medium text-foreground truncate max-w-64">
                                                    {task.title}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5 text-muted-foreground">
                                                {task.requestorName || task.createdByName || '-'}
                                            </td>
                                            <td className="px-3 py-2.5 text-muted-foreground font-mono text-xs">
                                                {task.businessContext?.documentId || '-'}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs px-1.5 py-0"
                                                >
                                                    {typeText}
                                                </Badge>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <PriorityBadge priority={task.priority} />
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <StatusBadge status={task.status} />
                                            </td>
                                            <td className="px-3 py-2.5 text-muted-foreground text-xs">
                                                {formatShortDate(task.createdOn)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* ── Excluded Review-Only (CC) Tasks Section ── */}
                    {excludedCcTasks.length > 0 && (
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center gap-2">
                                <Info className="size-4 text-muted-foreground" />
                                <h3 className="text-sm font-semibold text-foreground">
                                    Excluded Tasks — Review Only ({excludedCcTasks.length})
                                </h3>
                                <Badge variant="outline" className="text-xs text-muted-foreground font-normal">
                                    Cannot be approved or rejected
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                The following tasks are tagged for comment/review only and are excluded from mass decision actions:
                            </p>
                            <div className="rounded-lg border border-border/70 bg-card overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/40 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                                            <th className="px-3 py-2 text-left">Task Title</th>
                                            <th className="px-3 py-2 text-left">Requestor</th>
                                            <th className="px-3 py-2 text-left">Document</th>
                                            <th className="px-3 py-2 text-left">Type</th>
                                            <th className="px-3 py-2 text-left">Status</th>
                                            <th className="px-3 py-2 text-left">Type Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40 text-xs">
                                        {excludedCcTasks.map((task) => (
                                            <tr key={task.instanceId} className="hover:bg-muted/20">
                                                <td className="px-3 py-2 font-medium text-foreground max-w-64 truncate">
                                                    {task.title}
                                                </td>
                                                <td className="px-3 py-2 text-muted-foreground">
                                                    {task.requestorName || task.createdByName || '-'}
                                                </td>
                                                <td className="px-3 py-2 text-muted-foreground font-mono">
                                                    {task.businessContext?.documentId || '-'}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <Badge variant="outline" className="text-[11px] px-1.5 py-0">
                                                        {task.documentTypeDisplay || task.documentTypeDesc || task.objectType || '-'}
                                                    </Badge>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <StatusBadge status={task.status} />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <Badge variant="secondary" className="text-[11px] text-muted-foreground font-normal bg-muted">
                                                        CC / Tagged
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Mass Action Footer */}
            <div className="shrink-0 border-t border-border/60 bg-background/95 backdrop-blur-sm px-5 py-3">
                <div className="flex items-center justify-end gap-2">
                    <Button
                        variant="destructive"
                        onClick={() => onMassDecision(DECISION_KEYS.REJECT, [...selectedIds])}
                        disabled={isExecuting || selectedTasks.length === 0}
                        className="h-11 sm:h-9 font-medium"
                    >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject ({selectedTasks.length})
                    </Button>
                    <Button
                        variant="success"
                        onClick={() => onMassDecision(DECISION_KEYS.APPROVE, [...selectedIds])}
                        disabled={isExecuting || selectedTasks.length === 0}
                        className="h-11 sm:h-9 font-medium"
                    >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve ({selectedTasks.length})
                    </Button>
                </div>
            </div>
        </div>
    );
}

