import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Menu } from 'lucide-react';
import { TaskList, TaskDetailView, MassSelectionView } from '@/pages/Inbox/components';
import {
    useInfiniteTasks,
    useInfiniteApprovedTasks,
    useTaskDetail,
    useDecision,
    useForward,
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
    const isMobile = useIsMobile();
    const { setOpenMobile } = useSidebar();

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
    const informationHints = useMemo(() => {
        if (!selectedTask) return undefined;
        return {
            sapOrigin: selectedTask.sapOrigin,
            documentId: selectedTask.businessContext?.documentId,
            businessObjectType: selectedTask.businessContext?.type,
            status: selectedTask.status,
        };
    }, [selectedTask]);

    const {
        data: detailResponse,
        isLoading: isLoadingDetail,
        isFetching: isFetchingDetail,
        isError: isErrorDetail,
        error: errorDetail,
        refetch: refetchDetail,
    } = useTaskDetail(selectedTaskId, informationHints, undefined, selectedTask);

    const decisionMutation = useDecision();
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

    // Auto-select first task on desktop when list loads and no task is selected
    useEffect(() => {
        if (hasAutoSelected.current) return;
        const isMobileViewport = window.innerWidth < 768;
        if (isMobileViewport) return;
        if (selectedTaskId) return;
        if (isLoadingList) return;
        if (tasks.length === 0) return;

        hasAutoSelected.current = true;
        const basePath = scope === 'approved' ? '/approved' : '/inbox';
        navigate(`${basePath}/${encodeURIComponent(tasks[0].instanceId)}`, { replace: true });
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
            forwardMutation.mutate(
                {
                    instanceId: selectedTaskId,
                    request: {
                        forwardTo,
                        comment,
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

    const isRefreshing = activeTasksQuery.isRefetching || (isFetchingDetail && !isLoadingDetail);

    const handleRefreshTasks = useCallback(() => {
        void activeTasksQuery.refetch();
        if (selectedTaskId) {
            void refetchDetail();
        }
    }, [activeTasksQuery, selectedTaskId, refetchDetail]);

    const showMassSelection = showTaskActions && isMyScope && selectionMode && selectedIds.size > 0;

    if (isMobile) {
        return (
            <div className="relative h-full flex flex-col min-h-0 overflow-hidden bg-background">
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
                        onMassDecision={handleMassDecision}
                        isExecuting={decisionMutation.isPending}
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
        </div>
    );
}
