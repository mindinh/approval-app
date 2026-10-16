import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    ChevronDown,
    SlidersHorizontal,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskCard } from './TaskCard';
import type { InboxTask } from '@/services/inbox/inbox.types';
import {
    getTaskObjectCategory,
    getTaskSubtype,
    extractSubtypeCounts,
    CATEGORY_ACCORDION_SECTIONS,
    type ObjectCategory,
} from '../utils/categoryUtils';
import { isPendingApprovalStatus, isApprovedApprovalStatus } from '../utils/predicates';
import {
    Button,
    Badge,
    Checkbox,
    Popover,
    PopoverTrigger,
    PopoverContent,
} from '@cnma/react-ui';

interface CategoryAccordionGroupProps {
    tasks: InboxTask[];
    selectedTaskId: string | null;
    normSelectedId: string;
    onSelectTask: (task: InboxTask) => void;
    handleCardClick: (task: InboxTask) => void;
    isMobile: boolean;
    scope?: 'my' | 'approved';
    showTaskActions: boolean;
    selectionMode: boolean;
    selectedIds: Set<string>;
    onToggleSelection: (taskId: string) => void;
    expandedCategories: Set<ObjectCategory>;
    onToggleCategory: (category: ObjectCategory) => void;
    categoryTotals?: Record<ObjectCategory, { pending: number; completed: number; total: number }>;
}

export function CategoryAccordionGroup({
    tasks,
    selectedTaskId,
    normSelectedId,
    handleCardClick,
    isMobile,
    scope = 'my',
    showTaskActions,
    selectionMode,
    selectedIds,
    onToggleSelection,
    expandedCategories,
    onToggleCategory,
    categoryTotals,
}: CategoryAccordionGroupProps) {
    const { t } = useTranslation();

    // Subtype quick filter state per category (PR, PO, etc.) - Multiple select Set
    const [selectedSubtypesMap, setSelectedSubtypesMap] = React.useState<Partial<Record<ObjectCategory, Set<string>>>>({});

    const handleToggleSubtype = (cat: ObjectCategory, subtype: string) => {
        setSelectedSubtypesMap((prev) => {
            const current = new Set(prev[cat] || []);
            if (current.has(subtype)) {
                current.delete(subtype);
            } else {
                current.add(subtype);
            }
            return {
                ...prev,
                [cat]: current,
            };
        });
    };

    const handleClearSubtypes = (cat: ObjectCategory) => {
        setSelectedSubtypesMap((prev) => ({
            ...prev,
            [cat]: new Set(),
        }));
    };

    const handleSelectAllSubtypes = (cat: ObjectCategory, subtypes: string[]) => {
        setSelectedSubtypesMap((prev) => ({
            ...prev,
            [cat]: new Set(subtypes),
        }));
    };

    // Group tasks by category
    const tasksByCategory = React.useMemo(() => {
        const map: Record<ObjectCategory, InboxTask[]> = {
            ALL: [],
            PR: [],
            PO: [],
            RESERVATION: [],
            CLAIM: [],
        };

        for (const task of tasks) {
            const cat = getTaskObjectCategory(task);
            if (cat !== 'OTHER') {
                map[cat].push(task);
            }
        }

        return map;
    }, [tasks]);

    return (
        <div className="w-full space-y-3">
            {CATEGORY_ACCORDION_SECTIONS.map((section) => {
                const isExpanded = expandedCategories.has(section.key);
                const catTasks = tasksByCategory[section.key] || [];
                const Icon = section.icon;

                // Pending vs completed vs total count (Total = In Approving + Completed)
                const catTotals = categoryTotals?.[section.key];
                const pendingCount = catTotals
                    ? catTotals.pending
                    : catTasks.filter((t) => isPendingApprovalStatus(t.status) || t.status !== 'COMPLETED').length;
                const completedCount = catTotals
                    ? catTotals.completed
                    : (catTasks.filter((t) => t.status === 'COMPLETED' || t.status === 'COMPLETE' || isApprovedApprovalStatus(t.status)).length || catTasks.length);
                const totalCount = catTotals
                    ? catTotals.total
                    : (pendingCount + completedCount || catTasks.length);

                // Subtypes extraction & smart visibility
                const activeSubtypeSet = selectedSubtypesMap[section.key] || new Set<string>();
                const selectedCount = activeSubtypeSet.size;
                const subtypes = extractSubtypeCounts(catTasks);

                // For Claim & Reservation, if they don't have distinct subtypes, do NOT show.
                // General rule: if <= 1 subtype, don't show filter pills.
                const isClaimOrReservation = section.key === 'CLAIM' || section.key === 'RESERVATION';
                const shouldShowSubtypeFilter =
                    subtypes.length > 1 &&
                    (!isClaimOrReservation ||
                        subtypes.some(
                            (s) =>
                                s.name.toUpperCase() !== 'CLAIM' &&
                                s.name.toUpperCase() !== 'RESERVATION' &&
                                s.name.toUpperCase() !== 'ZBUS2093'
                        ));

                const displayedTasks = selectedCount > 0
                    ? catTasks.filter((t) => activeSubtypeSet.has(getTaskSubtype(t)))
                    : catTasks;

                const triggerLabel = selectedCount === 0
                    ? t('common.allTypes', 'All Types')
                    : selectedCount === 1
                    ? Array.from(activeSubtypeSet)[0]
                    : t('common.nTypesSelected', '{{count}} types', { count: selectedCount });

                return (
                    <div key={section.key} className="flex flex-col w-full">
                        {/* ── Section Card Header ── */}
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={() => onToggleCategory(section.key)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onToggleCategory(section.key);
                                }
                            }}
                            className={cn(
                                "group relative flex items-center justify-between w-full select-none cursor-pointer transition-all duration-200",
                                isMobile
                                    ? "p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-border/70 bg-card shadow-xs hover:shadow-md hover:border-border"
                                    : "p-3 rounded-xl border border-border/70 bg-card shadow-2xs hover:shadow-xs hover:border-border",
                                "before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-1.5 before:rounded-r-full",
                                section.stripeClass,
                                isExpanded && (isMobile ? "ring-1 ring-border/80 shadow-sm" : "ring-1 ring-border/80 shadow-xs")
                            )}
                        >
                            {/* Left part: Icon + Title + Count Badge */}
                            <div className={cn("flex items-center pl-1 min-w-0", isMobile ? "gap-3.5 sm:gap-4" : "gap-2.5")}>
                                <div
                                    className={cn(
                                        "flex items-center justify-center border shadow-2xs shrink-0 transition-transform group-hover:scale-105",
                                        isMobile ? "size-11 sm:size-12 rounded-2xl" : "size-9 rounded-xl",
                                        section.iconBgClass
                                    )}
                                >
                                    <Icon className={isMobile ? "size-5.5 sm:size-6" : "size-4.5"} />
                                </div>

                                <div className="flex flex-col items-start gap-1 min-w-0">
                                    <h3 className={cn(
                                        "font-extrabold text-foreground tracking-tight truncate",
                                        isMobile ? "text-base sm:text-lg" : "text-sm"
                                    )}>
                                        {section.title}
                                    </h3>

                                    {scope === 'approved' ? (
                                        <span className={cn(
                                            "inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold bg-status-completed dark:bg-emerald-950/40 text-status-completed-text dark:text-emerald-300 border border-status-completed-border dark:border-emerald-700/60 shadow-2xs shrink-0 whitespace-nowrap",
                                            isMobile ? "px-2.5 py-0.5 sm:px-3 sm:py-1" : "px-2 py-0.5"
                                        )}>
                                            <span className="font-bold text-status-completed-text dark:text-emerald-400">
                                                {completedCount} {t('status.completed', 'Completed')}
                                            </span>
                                            <span className="text-muted-foreground/60 font-normal">/</span>
                                            <span className="font-medium text-foreground">
                                                {totalCount} {t('common.total', 'Total')}
                                            </span>
                                        </span>
                                    ) : (
                                        <span className={cn(
                                            "inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold bg-status-new dark:bg-amber-950/40 text-status-new-text dark:text-amber-300 border border-status-new-border dark:border-amber-700/60 shadow-2xs shrink-0 whitespace-nowrap",
                                            isMobile ? "px-2.5 py-0.5 sm:px-3 sm:py-1" : "px-2 py-0.5"
                                        )}>
                                            <span className="font-bold text-status-new-text dark:text-amber-400">
                                                {pendingCount} {t('status.inApproving', 'In Approving')}
                                            </span>
                                            <span className="text-muted-foreground/60 font-normal">/</span>
                                            <span className="font-medium text-foreground">
                                                {totalCount} {t('common.total', 'Total')}
                                            </span>
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Right part: Circular Chevron Button */}
                            <div className="flex items-center shrink-0 ml-2">
                                <div className={cn(
                                    "flex items-center justify-center rounded-full bg-muted/60 dark:bg-muted/40 text-muted-foreground group-hover:text-foreground transition-colors",
                                    isMobile ? "size-8" : "size-7"
                                )}>
                                    <ChevronDown
                                        className={cn(
                                            "transition-transform duration-300 ease-out",
                                            isMobile ? "size-4" : "size-3.5",
                                            isExpanded && "rotate-180"
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ── Expanded Task List Content ── */}
                        <AnimatePresence initial={false}>
                            {isExpanded && (
                                <motion.div
                                    key={`expanded-${section.key}`}
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.28, ease: 'easeInOut' }}
                                    className="overflow-hidden"
                                >
                                    <div className="pt-3 pb-2 space-y-2.5 px-0.5 sm:px-1">
                                        {/* ── Compact Multi-Select Subtype Dropdown (Mobile optimized) ── */}
                                        {shouldShowSubtypeFilter && (
                                            <div className="flex items-center justify-between px-1 pb-1 pt-0.5 text-xs">
                                                <span className="text-[11px] font-medium text-muted-foreground/80">
                                                    {selectedCount > 0
                                                        ? t('inbox.filteredSubtypeCount', 'Showing {{count}} of {{total}}', {
                                                              count: displayedTasks.length,
                                                              total: catTasks.length,
                                                          })
                                                        : t('inbox.totalSubtypeCount', '{{count}} requests', {
                                                              count: catTasks.length,
                                                          })}
                                                </span>

                                                <CategorySubtypeFilter
                                                    subtypes={subtypes}
                                                    activeSubtypeSet={activeSubtypeSet}
                                                    onToggleSubtype={(name) => handleToggleSubtype(section.key, name)}
                                                    onSelectAll={() => handleSelectAllSubtypes(section.key, subtypes.map((s) => s.name))}
                                                    onClearAll={() => handleClearSubtypes(section.key)}
                                                />
                                            </div>
                                        )}

                                        {catTasks.length === 0 ? (
                                            <div className="text-center text-xs text-muted-foreground py-6 border border-dashed border-border/60 rounded-2xl bg-muted/10 my-1">
                                                {t('inbox.noTasksInCategory', 'No tasks in this category')}
                                            </div>
                                        ) : displayedTasks.length === 0 ? (
                                            <div className="text-center text-xs text-muted-foreground py-6 border border-dashed border-border/60 rounded-2xl bg-muted/10 my-1 flex flex-col items-center justify-center gap-1.5">
                                                <p>{t('inbox.noTasksInSubtype', 'No tasks found for this subtype')}</p>
                                                <button
                                                    type="button"
                                                    onClick={() => handleClearSubtypes(section.key)}
                                                    className="text-xs font-semibold text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
                                                >
                                                    {t('inbox.showAllInGroup', 'Show all tasks')}
                                                </button>
                                            </div>
                                        ) : (
                                            displayedTasks.map((task) => (
                                                <div key={task.instanceId} className="flex items-start gap-2">
                                                    {showTaskActions && selectionMode && (
                                                        <div className={cn('shrink-0 pl-1', isMobile ? 'pt-4' : 'pt-3')}>
                                                            {task.normalTask !== false ? (
                                                                <Checkbox
                                                                    checked={selectedIds.has(task.instanceId)}
                                                                    onCheckedChange={() => onToggleSelection(task.instanceId)}
                                                                />
                                                            ) : (
                                                                <div
                                                                    className="size-4 rounded border border-dashed border-muted-foreground/30 bg-muted/20 flex items-center justify-center cursor-not-allowed opacity-40"
                                                                    title={t('task.ccNotActionable', 'Review-only / CC tasks cannot be approved or rejected')}
                                                                />
                                                            )}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <TaskCard
                                                            task={task}
                                                            isSelected={
                                                                task.instanceId === selectedTaskId ||
                                                                (!!normSelectedId &&
                                                                    String(task.instanceId).replace(/^0+/, '') === normSelectedId)
                                                            }
                                                            onClick={handleCardClick}
                                                            variant={isMobile ? 'mobile' : 'desktop'}
                                                        />
                                                    </div>
                                                </div>
                                            ))
                                        )}

                                        {totalCount > 0 && catTasks.length >= totalCount && (
                                            <p className="text-center text-[11px] text-muted-foreground/70 py-2">
                                                {t('inbox.allTasksLoaded', 'All tasks loaded')}
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
    );
}

interface CategorySubtypeFilterProps {
    subtypes: { name: string; count: number }[];
    activeSubtypeSet: Set<string>;
    onToggleSubtype: (name: string) => void;
    onSelectAll: () => void;
    onClearAll: () => void;
}

function CategorySubtypeFilter({
    subtypes,
    activeSubtypeSet,
    onToggleSubtype,
    onSelectAll,
    onClearAll,
}: CategorySubtypeFilterProps) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = React.useState(false);
    const selectedCount = activeSubtypeSet.size;

    const triggerLabel = React.useMemo(() => {
        if (selectedCount === 0) return t('common.allTypes', 'All Types');
        if (selectedCount === 1) {
            return Array.from(activeSubtypeSet)[0];
        }
        return t('common.nSelected', '{{count}} selected', { count: selectedCount });
    }, [selectedCount, activeSubtypeSet, t]);

    return (
        <div className="flex items-center gap-1">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <div
                        role="button"
                        tabIndex={0}
                        className={cn(
                            "h-7 px-2.5 rounded-md border text-xs font-normal cursor-pointer transition-all flex items-center gap-1.5 select-none shadow-2xs outline-none",
                            isOpen
                                ? "border-primary ring-1 ring-primary/20 bg-card text-foreground"
                                : selectedCount > 0
                                ? "border-primary/50 bg-primary/5 text-foreground font-medium hover:bg-primary/10"
                                : "border-input bg-card text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-muted/30"
                        )}
                    >
                        <SlidersHorizontal className="size-3 text-muted-foreground shrink-0" />
                        <span className="truncate max-w-[110px]">{triggerLabel}</span>
                        {selectedCount > 1 && (
                            <Badge
                                variant="secondary"
                                className="h-4 min-w-4 px-1 text-[10px] font-semibold rounded-full leading-none flex items-center justify-center bg-muted-foreground/15 text-foreground"
                            >
                                {selectedCount}
                            </Badge>
                        )}
                        <ChevronDown
                            className={cn(
                                "size-3 text-muted-foreground shrink-0 transition-transform duration-200 ml-0.5",
                                isOpen && "rotate-180"
                            )}
                        />
                    </div>
                </PopoverTrigger>

                <PopoverContent
                    align="end"
                    className="w-56 p-0 shadow-lg rounded-xl border border-border bg-popover text-popover-foreground overflow-hidden"
                >
                    {/* Header with Select All & Clear (identical to FilterBar) */}
                    <div className="p-2 border-b border-border bg-muted/20 flex items-center justify-between">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onSelectAll}
                            className="h-7 px-2 text-xs font-medium text-foreground hover:bg-accent cursor-pointer"
                        >
                            {t('common.selectAll', 'Select All')}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onClearAll}
                            disabled={selectedCount === 0}
                            className="h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 cursor-pointer"
                        >
                            {t('common.clear', 'Clear')}
                        </Button>
                    </div>

                    {/* Options list with Checkboxes (identical to FilterBar) */}
                    <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
                        {subtypes.map((sub) => {
                            const isSelected = activeSubtypeSet.has(sub.name);
                            return (
                                <div
                                    key={sub.name}
                                    onClick={() => onToggleSubtype(sub.name)}
                                    className={cn(
                                        "flex items-center justify-between space-x-2 py-1.5 px-2 rounded-lg cursor-pointer text-xs transition-colors select-none",
                                        isSelected
                                            ? "bg-accent/80 text-accent-foreground font-medium"
                                            : "hover:bg-muted/70 text-foreground"
                                    )}
                                >
                                    <div className="flex items-center space-x-2.5 min-w-0">
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() => onToggleSubtype(sub.name)}
                                            className="pointer-events-none size-4 rounded-[4px]"
                                        />
                                        <span className="truncate">{sub.name}</span>
                                    </div>
                                    <span className="text-[11px] text-muted-foreground/80 font-mono shrink-0 ml-2">
                                        {sub.count}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer summary if filtered */}
                    {selectedCount > 0 && (
                        <div className="px-3 py-1.5 border-t border-border bg-muted/20 text-[11px] text-muted-foreground flex items-center justify-between">
                            <span>{t('common.nSelected', '{{count}} selected', { count: selectedCount })}</span>
                            <span className="text-muted-foreground/60">
                                {t('inbox.ofSubtypes', 'of {{total}} types', { total: subtypes.length })}
                            </span>
                        </div>
                    )}
                </PopoverContent>
            </Popover>

            {selectedCount > 0 && (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onClearAll}
                    className="size-7 text-muted-foreground hover:text-foreground rounded-md cursor-pointer"
                    title={t('common.clearFilter', 'Clear filter')}
                >
                    <X className="size-3" />
                </Button>
            )}
        </div>
    );
}
