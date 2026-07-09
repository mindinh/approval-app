import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Menu } from 'lucide-react';
import { TaskList } from '@/pages/Inbox/components/TaskList';
import { TaskDetailView } from '@/pages/Inbox/components/TaskDetailView';
import { MassSelectionView } from '@/pages/Inbox/components/MassSelectionView';
import {
    useInfiniteTasks,
    useInfiniteApprovedTasks,
    useTaskOverview,
    useTaskInformation,
    useTaskDetail,
    useDecision,
} from '@/pages/Inbox/hooks/useInbox';
import { useCurrentUser } from '@/pages/Inbox/hooks/inboxQueries';
import type { InboxTask } from '@/services/inbox/inbox.types';
import { useIsMobile, useSidebar, Button } from '@cnma/react-ui';

type TaskScope = 'my' | 'approved';

export default function InboxPage() {
    const { t } = useTranslation();
    const DETAIL_PREFETCH_DELAY_MS = 200;
    const { taskId } = useParams<{ taskId?: string }>();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const selectedTaskId = taskId ? decodeURIComponent(taskId) : null;
    // Derive scope from URL search param — React Router v7 reliably re-renders
    // useSearchParams subscribers whenever params change, even on same-path navigations.
    const scope: TaskScope = searchParams.get('scope') === 'approved' ? 'approved' : 'my';

    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [detailPrefetchTaskId, setDetailPrefetchTaskId] = useState<string | null>(null);
    const isMobile = useIsMobile();
    const { setOpenMobile } = useSidebar();
    const { data: userInfo } = useCurrentUser();

    // Reset selection state whenever scope changes
    // Refs for auto-selection and scope tracking
    const hasAutoSelected = useRef(false);
    const prevScopeRef = useRef<TaskScope>(scope);
    useEffect(() => {
        if (prevScopeRef.current !== scope) {
            prevScopeRef.current = scope;
            setSelectionMode(false);
            setSelectedIds(new Set());
            hasAutoSelected.current = false; // Allow auto-select for the new scope
        }
    }, [scope]);

    const isMyScope = scope === 'my';
    const showTaskActions = true;

    const myTasksQuery = useInfiniteTasks({ enabled: isMyScope });
    const approvedTasksQuery = useInfiniteApprovedTasks({ enabled: !isMyScope });
    const activeTasksQuery = isMyScope ? myTasksQuery : approvedTasksQuery;

    // Derive performance hints from the task list item so the backend can
    // skip redundant SAP lookups and enrich in parallel.
    const tasks = useMemo(
        () => activeTasksQuery.data?.pages.flatMap((p) => p.items) ?? [],
        [activeTasksQuery.data]
    );
    const totalTasks = activeTasksQuery.data?.pages[0]?.total ?? 0;
    const selectedTask = selectedTaskId
        ? tasks.find((t) => t.instanceId === selectedTaskId)
        : undefined;
    const informationHints = selectedTask
        ? {
              sapOrigin: selectedTask.sapOrigin,
              documentId: selectedTask.businessContext?.documentId,
              businessObjectType: selectedTask.businessContext?.type,
          }
        : undefined;

    // ─── Stage 1: Ultra-lightweight overview (3-segment batch) ───
    // Fetches Description, CustomAttributes, DecisionOptions only.
    const {
        data: overviewResponse,
        isLoading: isLoadingOverview,
    } = useTaskOverview(selectedTaskId, { hints: informationHints });

    // ─── Stage 2: Background enrichment with TaskObjects/Attachments ───
    // Once overview is rendered, trigger the 5-segment batch in background.
    useEffect(() => {
        setDetailPrefetchTaskId(null);
    }, [selectedTaskId]);

    useEffect(() => {
        if (!selectedTaskId) return;
        const overviewTaskId = overviewResponse?.detail?.task.instanceId;
        if (overviewTaskId !== selectedTaskId) return;

        const timer = window.setTimeout(() => {
            setDetailPrefetchTaskId((current) =>
                current === selectedTaskId ? current : selectedTaskId
            );
        }, DETAIL_PREFETCH_DELAY_MS);

        return () => {
            window.clearTimeout(timer);
        };
    }, [selectedTaskId, overviewResponse?.detail?.task.instanceId, DETAIL_PREFETCH_DELAY_MS]);

    const shouldLoadFullDetail = !!selectedTaskId && detailPrefetchTaskId === selectedTaskId;

    // useTaskInformation now serves as the "enriched" second-tier, fetching
    // TaskObjects + Attachments that were excluded from the overview.
    const { data: informationResponse } = useTaskInformation(selectedTaskId, {
        enabled: shouldLoadFullDetail,
        hints: informationHints,
    });

    // Stage 3: Full detail (comments, logs) — deepest tier
    const { data: detailResponse } = useTaskDetail(selectedTaskId, {
        enabled: shouldLoadFullDetail && !!informationResponse?.detail,
    });

    const decisionMutation = useDecision();
    const isLoadingList = activeTasksQuery.isLoading;
    const isRefetchingList = activeTasksQuery.isRefetching;
    // Progressive merge: detail > information > overview
    const activeDetail = (detailResponse as any)?.detail ?? (informationResponse as any)?.detail ?? (overviewResponse as any)?.detail;
    const isLoadingDetail = !!selectedTaskId && isLoadingOverview && !(overviewResponse as any)?.detail;
    const isSecondaryLoading = !!selectedTaskId && shouldLoadFullDetail && !(detailResponse as any)?.detail;

    // Auto-select first task on desktop when list loads and no task is selected
    useEffect(() => {
        if (hasAutoSelected.current) return;
        const isMobileViewport = window.innerWidth < 768;
        if (isMobileViewport) return;
        if (selectedTaskId) return;
        if (isLoadingList) return;
        if (tasks.length === 0) return;

        hasAutoSelected.current = true;
        // Preserve ?scope= so switching to Approved Tasks isn't overridden here
        const scopeParam = scope !== 'my' ? `?scope=${scope}` : '';
        navigate(`/tasks/${encodeURIComponent(tasks[0].instanceId)}${scopeParam}`, { replace: true });
    }, [selectedTaskId, isLoadingList, tasks, navigate, scope]);


    const handleSelectTask = useCallback((task: InboxTask) => {
        // Preserve scope param when navigating to task detail
        const scopeParam = scope !== 'my' ? `?scope=${scope}` : '';
        navigate(`/tasks/${encodeURIComponent(task.instanceId)}${scopeParam}`);
    }, [navigate, scope]);

    const handleBack = useCallback(() => {
        // Return to inbox preserving scope
        const scopeParam = scope !== 'my' ? `?scope=${scope}` : '';
        navigate(`/inbox${scopeParam}`);
    }, [navigate, scope]);

    const handleDecision = useCallback(
        (decisionKey: string, comment: string) => {
            if (!selectedTaskId) return;
            // Forward task context to BFF to avoid redundant SAP $batch fetch
            const task = activeDetail?.task;
            decisionMutation.mutate(
                {
                    instanceId: selectedTaskId,
                    request: {
                        decisionKey,
                        comment,
                        type: 'APPR',
                        _context: task ? {
                            sapOrigin: task.sapOrigin,
                            documentId: task.businessContext?.documentId,
                            businessObjectType: task.businessContext?.type,
                        } : undefined,
                    },
                },
                {
                    onSuccess: () => {
                        const currentIndex = tasks.findIndex((t) => t.instanceId === selectedTaskId);
                        let nextTaskId = null;
                        if (currentIndex !== -1 && tasks.length > 1) {
                            if (currentIndex < tasks.length - 1) {
                                nextTaskId = tasks[currentIndex + 1].instanceId;
                            } else {
                                nextTaskId = tasks[currentIndex - 1].instanceId;
                            }
                        }

                        const scopeParam = scope !== 'my' ? `?scope=${scope}` : '';
                        if (nextTaskId) {
                            navigate(`/tasks/${encodeURIComponent(nextTaskId)}${scopeParam}`);
                        } else {
                            navigate(`/inbox${scopeParam}`);
                        }
                    },
                }
            );
        },
        [selectedTaskId, activeDetail, decisionMutation, navigate, tasks, scope]
    );

    const handleMassDecision = useCallback(
        (decisionKey: string, comment: string, taskIds: string[]) => {
            const executeNext = (index: number) => {
                if (index >= taskIds.length) {
                    setSelectionMode(false);
                    setSelectedIds(new Set());
                    return;
                }
                decisionMutation.mutate(
                    { instanceId: taskIds[index], request: { decisionKey, comment, type: 'APPR' } },
                    {
                        onSuccess: () => executeNext(index + 1),
                        onError: () => executeNext(index + 1),
                    }
                );
            };
            executeNext(0);
        },
        [decisionMutation]
    );

    const handleToggleSelection = useCallback((taskId: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(taskId)) {
                next.delete(taskId);
            } else {
                next.add(taskId);
            }
            return next;
        });
    }, []);

    const handleRefreshTasks = useCallback(() => {
        void activeTasksQuery.refetch();
    }, [activeTasksQuery]);

    const showMassSelection = showTaskActions && isMyScope && selectionMode && selectedIds.size > 0;

    if (isMobile) {
        return (
            <div className="relative h-screen flex flex-col overflow-hidden bg-background">
                {/* Mobile App Header — always visible gradient bar */}
                <div
                    className="px-4 py-3 flex items-center shadow-sm relative z-20 shrink-0"
                    style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)' }}
                >
                    <Button
                        variant="ghost"
                        onClick={() => setOpenMobile(true)}
                        className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors hover:bg-white/10 active:bg-white/20 absolute left-4"
                        aria-label={t('nav.openMenu', 'Open navigation menu')}
                    >
                        <Menu size={22} className="text-white" />
                    </Button>
                    <h1 className="text-lg font-bold text-white tracking-wide w-full text-center">
                        {scope === 'approved' ? t('nav.approvedTasks', 'Approved Tasks') : t('nav.myTasks', 'My Tasks')}
                    </h1>
                </div>
                <div className="relative flex-1 min-h-0 w-full min-w-0">
                    <AnimatePresence mode="wait">
                        {selectedTaskId ? (
                            <motion.div
                                key="detail"
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'tween', duration: 0.25, ease: 'easeInOut' }}
                                className="absolute inset-0 w-full min-w-0 z-10 bg-background overflow-hidden"
                            >
                                <TaskDetailView
                                    detail={activeDetail}
                                    isLoading={isLoadingDetail}
                                    isSecondaryLoading={isSecondaryLoading}
                                    onBack={handleBack}
                                    onDecision={handleDecision}
                                    isExecuting={decisionMutation.isPending}
                                    isMobile
                                    isApprovedScope={!isMyScope}
                                    showActionPanel={showTaskActions && isMyScope}
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="list"
                                initial={{ opacity: 0.8 }}
                                animate={{ opacity: 1 }}
                                className="h-full"
                            >
                                <TaskList
                                    tasks={tasks}
                                    selectedTaskId={selectedTaskId}
                                    onSelectTask={handleSelectTask}
                                    isLoading={isLoadingList}
                                    onRefresh={handleRefreshTasks}
                                    isRefreshing={isRefetchingList}
                                    totalItems={totalTasks}
                                    hasNextPage={activeTasksQuery.hasNextPage}
                                    isFetchingNextPage={activeTasksQuery.isFetchingNextPage}
                                    onLoadMore={() => activeTasksQuery.fetchNextPage()}
                                    isMobile
                                    selectionMode={selectionMode}
                                    selectedIds={selectedIds}
                                    onSelectionModeChange={setSelectionMode}
                                    onSelectedIdsChange={setSelectedIds}
                                    onMassDecision={showTaskActions && isMyScope ? handleMassDecision : undefined}
                                    isExecutingMass={showTaskActions && isMyScope && decisionMutation.isPending}
                                    showTaskActions={showTaskActions && isMyScope}
                                    hasMobileScopeBar={false}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            <aside className="relative w-80 shrink-0 overflow-hidden border-r border-border/60 bg-background">
                <TaskList
                    tasks={tasks}
                    selectedTaskId={selectedTaskId}
                    onSelectTask={handleSelectTask}
                    isLoading={isLoadingList}
                    onRefresh={handleRefreshTasks}
                    isRefreshing={isRefetchingList}
                    totalItems={totalTasks}
                    hasNextPage={activeTasksQuery.hasNextPage}
                    isFetchingNextPage={activeTasksQuery.isFetchingNextPage}
                    onLoadMore={() => activeTasksQuery.fetchNextPage()}
                    selectionMode={selectionMode}
                    selectedIds={selectedIds}
                    onSelectionModeChange={setSelectionMode}
                    onSelectedIdsChange={setSelectedIds}
                    showTaskActions={showTaskActions && isMyScope}
                    scope={scope}
                    onScopeChange={(nextScope) => {
                        setSearchParams(nextScope !== 'my' ? { scope: nextScope } : {});
                    }}
                />
            </aside>
            <main className="relative min-w-0 flex-1 overflow-hidden bg-muted/30">
                {showMassSelection ? (
                    <MassSelectionView
                        tasks={tasks}
                        selectedIds={selectedIds}
                        onToggleSelection={handleToggleSelection}
                        onMassDecision={handleMassDecision}
                        isExecuting={decisionMutation.isPending}
                    />
                ) : (
                    <TaskDetailView
                        detail={activeDetail}
                        isLoading={isLoadingDetail && !!selectedTaskId}
                        isSecondaryLoading={isSecondaryLoading}
                        onBack={handleBack}
                        onDecision={handleDecision}
                        isExecuting={decisionMutation.isPending}
                        isApprovedScope={!isMyScope}
                        showActionPanel={showTaskActions && isMyScope}
                    />
                )}
            </main>
        </div>
    );
}
