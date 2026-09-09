import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    ChevronDown,
    Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskCard } from './TaskCard';
import type { InboxTask } from '@/services/inbox/inbox.types';
import {
    getTaskObjectCategory,
    CATEGORY_ACCORDION_SECTIONS,
    type ObjectCategory,
} from '../utils/categoryUtils';
import { isPendingApprovalStatus, isApprovedApprovalStatus } from '../utils/predicates';
import { Checkbox } from '@cnma/react-ui';

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
    hasNextPage?: boolean;
    isFetchingNextPage?: boolean;
    onLoadMore?: () => void;
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
    hasNextPage = false,
    isFetchingNextPage = false,
    onLoadMore,
    categoryTotals,
}: CategoryAccordionGroupProps) {
    const { t } = useTranslation();

    // Infinite scroll observer for all expanded category sections (multi-sentinel support)
    const observerRef = useRef<IntersectionObserver | null>(null);
    const observedNodesRef = useRef<Set<HTMLDivElement>>(new Set());

    useEffect(() => {
        if (!onLoadMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting) && hasNextPage && !isFetchingNextPage) {
                    onLoadMore();
                }
            },
            { rootMargin: '200px' }
        );
        observerRef.current = observer;

        // Observe any already mounted sentinels
        observedNodesRef.current.forEach((el) => observer.observe(el));

        return () => {
            observer.disconnect();
            observerRef.current = null;
        };
    }, [hasNextPage, isFetchingNextPage, onLoadMore]);

    const registerSentinel = React.useCallback((node: HTMLDivElement | null) => {
        if (!node) return;
        observedNodesRef.current.add(node);
        observerRef.current?.observe(node);
    }, []);

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
                                "group relative flex items-center justify-between w-full p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-border/70 bg-card shadow-xs select-none cursor-pointer transition-all duration-200",
                                "hover:shadow-md hover:border-border",
                                "before:absolute before:left-0 before:top-3 before:bottom-3 before:w-1.5 before:rounded-r-full",
                                section.stripeClass,
                                isExpanded && "ring-1 ring-border/80 shadow-sm"
                            )}
                        >
                            {/* Left part: Icon + Title + Count Badge */}
                            <div className="flex items-center gap-3.5 sm:gap-4 pl-1 min-w-0">
                                <div
                                    className={cn(
                                        "flex size-11 sm:size-12 items-center justify-center rounded-2xl border shadow-2xs shrink-0 transition-transform group-hover:scale-105",
                                        section.iconBgClass
                                    )}
                                >
                                    <Icon className="size-5.5 sm:size-6" />
                                </div>

                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
                                    <h3 className="font-extrabold text-base sm:text-lg text-foreground tracking-tight shrink-0">
                                        {section.title}
                                    </h3>

                                    {scope === 'approved' ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg text-xs font-semibold bg-status-completed dark:bg-emerald-950/40 text-status-completed-text dark:text-emerald-300 border border-status-completed-border dark:border-emerald-700/60 shadow-2xs shrink-0">
                                            <span className="font-bold text-status-completed-text dark:text-emerald-400">
                                                {completedCount} {t('status.completed', 'Completed')}
                                            </span>
                                            <span className="text-muted-foreground/60 font-normal">/</span>
                                            <span className="font-medium text-foreground">
                                                {totalCount} {t('common.total', 'Total')}
                                            </span>
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg text-xs font-semibold bg-status-new dark:bg-amber-950/40 text-status-new-text dark:text-amber-300 border border-status-new-border dark:border-amber-700/60 shadow-2xs shrink-0">
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

                            {/* Right part: "View" text + Circular Chevron Button */}
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                                <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                                    {isExpanded ? t('inbox.hide', 'Hide') : t('inbox.view', 'View')}
                                </span>
                                <div className="flex size-8 items-center justify-center rounded-full bg-muted/60 dark:bg-muted/40 text-muted-foreground group-hover:text-foreground transition-colors">
                                    <ChevronDown
                                        className={cn(
                                            "size-4 transition-transform duration-300 ease-out",
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
                                        {catTasks.length === 0 ? (
                                            <div className="text-center text-xs text-muted-foreground py-6 border border-dashed border-border/60 rounded-2xl bg-muted/10 my-1">
                                                {t('inbox.noTasksInCategory', 'No tasks in this category')}
                                            </div>
                                        ) : (
                                            catTasks.map((task) => (
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

                                        {/* Sentinel for Infinite Scrolling in this expanded section */}
                                        <div ref={registerSentinel} className="h-2" />

                                        {isFetchingNextPage && (
                                            <div className="flex items-center justify-center py-3 gap-2 text-xs text-muted-foreground">
                                                <Loader2 className="size-4 animate-spin text-primary" />
                                                <span>{t('common.loadingMore', 'Loading more...')}</span>
                                            </div>
                                        )}
                                        {!hasNextPage && catTasks.length > 0 && !isFetchingNextPage && (
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
