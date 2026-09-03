import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Menu } from 'lucide-react';
import { TaskList, TaskDetailView, MassSelectionView, MassDecisionDialog } from '@/pages/Inbox/components';
import { useQueryClient } from '@tanstack/react-query';
import {
    useInfiniteTasks,
    useInfiniteApprovedTasks,
    useTaskDetail,
    useDecision,
    useMassDecision,
    useForward,
    invalidateTaskList,
} from '@/pages/Inbox/hooks/useInbox';


import type { InboxTask } from '@/services/inbox/inbox.types';
import { useIsMobile, useSidebar, Button } from '@cnma/react-ui';
import { useErrorModal } from '@/contexts/useErrorModal';

type TaskScope = 'my' | 'approved';

export default function InboxPage() {
    const { t } = useTranslation();
    const { showError } = useErrorModal();
    const { taskId } = useParams<{ taskId?: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const selectedTaskId = taskId ? decodeURIComponent(taskId) : null;
    const scope: TaskScope = location.pathname.startsWith('/approved') ? 'approved' : 'my';

    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [massDecisionConfig, setMassDecisionConfig] = useState<{
        isOpen: boolean;
        decisionKey: string;
        tasks: InboxTask[];
    } | null>(null);
    const isMobile = useIsMobile();
    const { setOpenMobile } = useSidebar();

    const queryClient = useQueryClient();

    // Reset selection state & invalidate query cache whenever scope changes
    const hasAutoSelected = useRef(false);
    const prevScopeRef = useRef<TaskScope>(scope);
    useEffect(() => {
        if (prevScopeRef.current !== scope) {
            prevScopeRef.current = scope;
            setSelectionMode(false);
            setSelectedIds(new Set());
            hasAutoSelected.current = false; // Allow auto-select for the new scope
            invalidateTaskList(queryClient, selectedTaskId);
        }
    }, [scope, queryClient, selectedTaskId]);

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
    const {
        data: detailResponse,
        isLoading: isLoadingDetail,
        isFetching: isFetchingDetail,
        isError: isErrorDetail,
        error: errorDetail,
        refetch: refetchDetail,
    } = useTaskDetail(selectedTaskId, undefined, selectedTask);




    const decisionMutation = useDecision();
    const massDecisionMutation = useMassDecision();
    const forwardMutation = useForward();
    const isLoadingList = activeTasksQuery.isLoading;
    const isRefetchingList = activeTasksQuery.isRefetching;


    const rawDetail = detailResponse as any;
    const detailTaskId = rawDetail?.taskprocessing?.task?.InstanceID ||
                         rawDetail?.instanceId ||
                         rawDetail?.taskId ||
                         rawDetail?.task?.instanceId;
    const normDetailId = detailTaskId ? String(detailTaskId).replace(/^0+/, '') : '';
    const normSelectedId = selectedTaskId ? String(selectedTaskId).replace(/^0+/, '') : '';

    const isDetailMatchingSelected = !!rawDetail && (
        !selectedTaskId ||
        !detailTaskId ||
        detailTaskId === selectedTaskId ||
        normDetailId === normSelectedId
    );
    const activeDetail = isDetailMatchingSelected ? rawDetail : undefined;

    const isDetailLoading =
        (isLoadingDetail && !activeDetail) ||
        (isLoadingList && tasks.length === 0) ||
        (!!selectedTaskId && !activeDetail);

    const isSecondaryLoading = isFetchingDetail && !!activeDetail;

    // Auto-select first task on desktop when list loads and no task is selected or selected task is stale
    useEffect(() => {
        const isMobileViewport = window.innerWidth < 768;
        if (isMobileViewport) return;
        if (isLoadingList) return;
        if (tasks.length === 0) return;

        const isSelectedTaskInList = selectedTaskId && tasks.some((t) => t.instanceId === selectedTaskId);
        if (!selectedTaskId || !isSelectedTaskInList) {
            hasAutoSelected.current = true;
            const basePath = scope === 'approved' ? '/approved' : '/inbox';
            navigate(`${basePath}/${encodeURIComponent(tasks[0].instanceId)}`, { replace: true });
        }
    }, [selectedTaskId, isLoadingList, tasks, navigate, scope]);



    const handleSelectTask = useCallback((task: InboxTask) => {
        const basePath = scope === 'approved' ? '/approved' : '/inbox';
        navigate(`${basePath}/${encodeURIComponent(task.instanceId)}`);
    }, [navigate, scope]);

    const handleBack = useCallback(() => {
        navigate(scope === 'approved' ? '/approved' : '/inbox');
    }, [navigate, scope]);

    const handleDecision = useCallback(
        (decisionKey: string, comment: string) => {
            if (!selectedTaskId) return;
            // Forward task context to BFF to avoid redundant SAP $batch fetch
            const task = activeDetail?.task;
            const bo = activeDetail?.businessObject;
            const docNum = task?.businessContext?.documentId || activeDetail?.documentId || bo?.DocumentNumber || bo?.PurchaseRequisition || bo?.PurchaseOrder || bo?.ReservationNumber || bo?.ClaimNumber;
            const boType = task?.businessContext?.type || activeDetail?.docCategory || bo?.DocCategory || activeDetail?.objectType || '';

            decisionMutation.mutate(
                {
                    instanceId: selectedTaskId,
                    request: {
                        decisionKey,
                        comment,
                        type: 'APPR',
                        _context: {
                            sapOrigin: task?.sapOrigin || 'LOCAL',
                            documentId: docNum,
                            businessObjectType: boType,
                        },
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

                        const basePath = scope === 'approved' ? '/approved' : '/inbox';
                        if (nextTaskId) {
                            navigate(`${basePath}/${encodeURIComponent(nextTaskId)}`);
                        } else {
                            navigate(basePath);
                        }
                    },
                    onError: (err) => {
                        showError(err, {
                            title: 'Decision Failed',
                        });
                    },
                }
            );
        },
        [selectedTaskId, activeDetail, decisionMutation, navigate, tasks, scope, showError]
    );

    const handleForward = useCallback(
        (forwardTo: string, comment?: string) => {
            if (!selectedTaskId) return;
            const task = activeDetail?.task;
            const bo = activeDetail?.businessObject;
            const docNum = task?.businessContext?.documentId || activeDetail?.documentId || bo?.DocumentNumber || bo?.PurchaseRequisition || bo?.PurchaseOrder || bo?.ReservationNumber || bo?.ClaimNumber;
            const boType = task?.businessContext?.type || activeDetail?.docCategory || bo?.DocCategory || activeDetail?.objectType || '';

            forwardMutation.mutate(
                {
                    instanceId: selectedTaskId,
                    request: {
                        forwardTo,
                        comment,
                        _context: {
                            sapOrigin: task?.sapOrigin || 'LOCAL',
                            documentId: docNum,
                            businessObjectType: boType,
                        },
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

                        const basePath = scope === 'approved' ? '/approved' : '/inbox';
                        if (nextTaskId) {
                            navigate(`${basePath}/${encodeURIComponent(nextTaskId)}`);
                        } else {
                            navigate(basePath);
                        }
                    },
                    onError: (err) => {
                        showError(err, {
                            title: 'Forward Failed',
                        });
                    },
                }
            );
        },
        [selectedTaskId, activeDetail, forwardMutation, navigate, tasks, scope, showError]
    );


    const handleOpenMassDecision = useCallback(
        (decisionKey: string, taskIds: string[]) => {
            const targetTasks = tasks.filter(
                (t) => taskIds.includes(t.instanceId) && t.normalTask !== false
            );
            if (targetTasks.length === 0) {
                toast.error(t('inbox.ccTasksCannotDecide', 'Review-only (CC) tasks cannot be approved or rejected.'));
                return;
            }
            setMassDecisionConfig({
                isOpen: true,
                decisionKey,
                tasks: targetTasks,
            });
        },
        [tasks, t]
    );

    const handleConfirmMassDecision = useCallback(
        (decisionKey: string, comment: string, selectedTasks: InboxTask[]) => {
            // 1. Immediately close modal and reset selection — completely non-blocking!
            setMassDecisionConfig(null);
            setSelectionMode(false);
            setSelectedIds(new Set());

            // 2. Map items with full context (documentId, businessObjectType, sapOrigin)
            const items = selectedTasks.map((t) => {
                const docId = t.businessContext?.documentId || (t as any).documentNumber || t.instanceId;
                const boType = t.businessContext?.type || (t as any).businessObjectType || (t as any).docCategory || '';
                const origin = t.sapOrigin || 'LOCAL';
                return {
                    instanceId: t.instanceId,
                    documentId: docId,
                    documentNumber: docId,
                    businessObjectType: boType,
                    sapOrigin: origin,
                };
            });

            // 3. Fire background mutation with Sonner toast orchestration
            massDecisionMutation.mutate({
                decisionKey,
                comment,
                items,
            });
        },
        [massDecisionMutation]
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

    const handleToggleSelectAll = useCallback(() => {
        const actionableTasks = tasks.filter((t) => t.normalTask !== false);
        setSelectedIds((prev) => {
            const allActionableSelected =
                actionableTasks.length > 0 &&
                actionableTasks.every((t) => prev.has(t.instanceId));
            if (allActionableSelected) {
                return new Set<string>();
            }
            return new Set(actionableTasks.map((t) => t.instanceId));
        });
    }, [tasks]);

    const isRefreshing = activeTasksQuery.isRefetching || activeTasksQuery.isFetching || (isFetchingDetail && !isLoadingDetail);

    const handleRefreshTasks = useCallback(() => {
        invalidateTaskList(queryClient, selectedTaskId);
        if (selectedTaskId) {
            void refetchDetail();
        }
    }, [queryClient, selectedTaskId, refetchDetail]);


    const showMassSelection = showTaskActions && isMyScope && selectionMode && selectedIds.size > 0;

    if (isMobile) {
        return (
            <div className="relative h-full flex flex-col min-h-0 overflow-hidden bg-background">
                {/* Mobile App Header — always visible gradient bar */}
                <div
                    className="px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 flex items-center justify-between shadow-sm relative z-20 shrink-0 min-h-[52px]"
                    style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)' }}
                >
                    <Button
                        variant="ghost"
                        onClick={() => setOpenMobile(true)}
                        className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors hover:bg-white/10 active:bg-white/20 p-0 relative z-10"
                        aria-label={t('nav.openMenu', 'Open navigation menu')}
                    >
                        <Menu size={22} className="text-white" />
                    </Button>
                    <h1 className="absolute left-1/2 top-[calc(50%+env(safe-area-inset-top)/2)] -translate-x-1/2 -translate-y-1/2 text-lg font-bold text-white tracking-wide text-center pointer-events-none whitespace-nowrap">
                        {scope === 'approved' ? t('nav.approvedTasks', 'Approved Tasks') : t('nav.myTasks', 'My Tasks')}
                    </h1>
                    <div className="w-9 h-9" />
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
                                    isLoading={isDetailLoading}
                                    isError={isErrorDetail}
                                    error={errorDetail}
                                    onRetry={handleRefreshTasks}
                                    isSecondaryLoading={isSecondaryLoading}
                                    onBack={handleBack}
                                    onDecision={handleDecision}
                                    onForward={handleForward}
                                    isExecuting={decisionMutation.isPending}
                                    isForwarding={forwardMutation.isPending}
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
                                    isError={activeTasksQuery.isError}
                                    error={activeTasksQuery.error}
                                    onRefresh={handleRefreshTasks}
                                    isRefreshing={isRefreshing}
                                    totalItems={totalTasks}
                                    hasNextPage={activeTasksQuery.hasNextPage}
                                    isFetchingNextPage={activeTasksQuery.isFetchingNextPage}
                                    onLoadMore={() => activeTasksQuery.fetchNextPage()}
                                    isMobile
                                    selectionMode={selectionMode}
                                    selectedIds={selectedIds}
                                    onSelectionModeChange={setSelectionMode}
                                    onSelectedIdsChange={setSelectedIds}
                                    onMassDecision={showTaskActions && isMyScope ? handleOpenMassDecision : undefined}
                                    isExecutingMass={showTaskActions && isMyScope && massDecisionMutation.isPending}
                                    showTaskActions={showTaskActions && isMyScope}
                                    hasMobileScopeBar={false}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                {massDecisionConfig && (
                    <MassDecisionDialog
                        isOpen={massDecisionConfig.isOpen}
                        onClose={() => setMassDecisionConfig(null)}
                        onConfirm={handleConfirmMassDecision}
                        decisionKey={massDecisionConfig.decisionKey}
                        tasks={massDecisionConfig.tasks}
                        isExecuting={massDecisionMutation.isPending}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="flex h-full w-full overflow-hidden bg-background">
            <aside className="relative w-80 shrink-0 overflow-hidden border-r border-border/60 bg-background">
                <TaskList
                    tasks={tasks}
                    selectedTaskId={selectedTaskId}
                    onSelectTask={handleSelectTask}
                    isLoading={isLoadingList}
                    isError={activeTasksQuery.isError}
                    error={activeTasksQuery.error}
                    onRefresh={handleRefreshTasks}
                    isRefreshing={isRefreshing}
                    totalItems={totalTasks}
                    hasNextPage={activeTasksQuery.hasNextPage}
                    isFetchingNextPage={activeTasksQuery.isFetchingNextPage}
                    onLoadMore={() => activeTasksQuery.fetchNextPage()}
                    selectionMode={selectionMode}
                    selectedIds={selectedIds}
                    onSelectionModeChange={setSelectionMode}
                    onSelectedIdsChange={setSelectedIds}
                    onMassDecision={showTaskActions && isMyScope ? handleOpenMassDecision : undefined}
                    isExecutingMass={showTaskActions && isMyScope && massDecisionMutation.isPending}
                    showTaskActions={showTaskActions && isMyScope}
                    scope={scope}
                    onScopeChange={(nextScope) => {
                        navigate(nextScope === 'approved' ? '/approved' : '/inbox');
                    }}
                />
            </aside>
            <main className="relative min-w-0 flex-1 overflow-hidden bg-muted/30">
                {showMassSelection ? (
                    <MassSelectionView
                        tasks={tasks}
                        selectedIds={selectedIds}
                        onToggleSelection={handleToggleSelection}
                        onToggleSelectAll={handleToggleSelectAll}
                        onMassDecision={handleOpenMassDecision}
                        isExecuting={massDecisionMutation.isPending}
                    />
                ) : (
                    <TaskDetailView
                        detail={activeDetail}
                        isLoading={isDetailLoading}
                        isError={isErrorDetail}
                        error={errorDetail}
                        onRetry={handleRefreshTasks}
                        isSecondaryLoading={isSecondaryLoading}
                        onBack={handleBack}
                        onDecision={handleDecision}
                        onForward={handleForward}
                        isExecuting={decisionMutation.isPending}
                        isForwarding={forwardMutation.isPending}
                        isApprovedScope={!isMyScope}
                        showActionPanel={showTaskActions && isMyScope}
                    />

                )}
            </main>
            {massDecisionConfig && (
                <MassDecisionDialog
                    isOpen={massDecisionConfig.isOpen}
                    onClose={() => setMassDecisionConfig(null)}
                    onConfirm={handleConfirmMassDecision}
                    decisionKey={massDecisionConfig.decisionKey}
                    tasks={massDecisionConfig.tasks}
                    isExecuting={massDecisionMutation.isPending}
                />
            )}
        </div>
    );
}
