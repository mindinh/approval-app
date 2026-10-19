import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { TaskList, TaskDetailView, MassSelectionView, MassDecisionDialog } from '@/pages/Inbox/components';
import { useTaskDetail, useDecision, useMassDecision } from '@/pages/Inbox/hooks/useInbox';
import { useInboxData } from '@/pages/Inbox/hooks/useInboxData';
import type { InboxTask } from '@/services/inbox/inbox.types';
import { useIsMobile } from '@cnma/react-ui';
import { useErrorModal } from '@/contexts/useErrorModal';
import { useMobileNav } from '@/contexts/MobileNavContext';
import {
    getFirstTaskByCategoryOrder,
    type ObjectCategory,
} from './utils/categoryUtils';

type TaskScope = 'my' | 'approved';

export default function InboxPage() {
    const { t } = useTranslation();
    const { showError } = useErrorModal();
    const { taskId } = useParams<{ taskId?: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const selectedTaskId = taskId ? decodeURIComponent(taskId) : null;
    const scope: TaskScope = location.pathname.startsWith('/approved') ? 'approved' : 'my';
    const isMyScope = scope === 'my';
    const showTaskActions = true;

    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [selectedCategory, setSelectedCategory] = useState<ObjectCategory | null>(null);
    const [serverSearch, setServerSearch] = useState('');
    const [massDecisionConfig, setMassDecisionConfig] = useState<{
        isOpen: boolean;
        decisionKey: string;
        tasks: InboxTask[];
    } | null>(null);

    const isMobile = useIsMobile();
    const { setHideBottomBar } = useMobileNav();

    // Mutual exclusivity: hide mobile bottom navigation when selection mode is active
    useEffect(() => {
        if (isMobile) {
            setHideBottomBar(selectionMode);
        }
        return () => {
            if (isMobile) {
                setHideBottomBar(false);
            }
        };
    }, [isMobile, selectionMode, setHideBottomBar]);

    // Reset selected category when switching between My Tasks and Approved Tasks on mobile
    useEffect(() => {
        if (isMobile) {
            setSelectedCategory(null);
        }
    }, [scope, isMobile]);

    // Multi-category data aggregation, deduplication, and counts hook
    const {
        tasks,
        totalTasks,
        overallTotalTasks,
        categoryTotals,
        categoryCountsQuery,
        myCategoryCountsQuery,
        approvedCategoryCountsQuery,
        isLoadingList,
        isFetchingNextPage,
        hasNextPage,
        listError,
        isListError,
        isRefreshingList,
        handleLoadMore,
        refreshList,
    } = useInboxData({
        scope,
        serverSearch,
        selectedTaskId,
    });

    // Reset selection state & invalidate query cache whenever scope changes
    const prevScopeRef = useRef<TaskScope>(scope);
    useEffect(() => {
        if (prevScopeRef.current !== scope) {
            prevScopeRef.current = scope;
            setSelectionMode(false);
            setSelectedIds(new Set());
            refreshList();
        }
    }, [scope, refreshList]);

    const normSelectedId = selectedTaskId ? String(selectedTaskId).replace(/^0+/, '') : '';
    const selectedTask = normSelectedId
        ? tasks.find(
              (t) =>
                  t.instanceId === selectedTaskId ||
                  String(t.instanceId).replace(/^0+/, '') === normSelectedId
          )
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

    const rawDetail = detailResponse as any;
    const detailTaskId =
        rawDetail?.taskprocessing?.task?.InstanceID ||
        rawDetail?.instanceId ||
        rawDetail?.taskId ||
        rawDetail?.task?.instanceId;
    const normDetailId = detailTaskId ? String(detailTaskId).replace(/^0+/, '') : '';

    const isDetailMatchingSelected =
        !!rawDetail &&
        (!selectedTaskId ||
            !detailTaskId ||
            detailTaskId === selectedTaskId ||
            normDetailId === normSelectedId);
    const activeDetail = isDetailMatchingSelected ? rawDetail : undefined;

    const isDetailLoading =
        !isErrorDetail &&
        ((isLoadingDetail && !activeDetail) ||
            (isLoadingList && tasks.length === 0 && !selectedTaskId) ||
            (!!selectedTaskId && !activeDetail));

    const isSecondaryLoading = isFetchingDetail && !!activeDetail;
    const isRefreshing = isRefreshingList || (isFetchingDetail && !isLoadingDetail);

    const handleRefreshTasks = useCallback(() => {
        refreshList();
        if (selectedTaskId) {
            void refetchDetail();
        }
    }, [refreshList, selectedTaskId, refetchDetail]);

    const handleSelectTask = useCallback(
        (task: InboxTask) => {
            const basePath = scope === 'approved' ? '/approved' : '/inbox';
            navigate(`${basePath}/${encodeURIComponent(task.instanceId)}`);
        },
        [navigate, scope]
    );

    const handleBack = useCallback(() => {
        navigate(scope === 'approved' ? '/approved' : '/inbox');
    }, [navigate, scope]);

    const handleLoadFirstTask = useCallback(() => {
        const basePath = scope === 'approved' ? '/approved' : '/inbox';
        const firstTask = getFirstTaskByCategoryOrder(tasks);
        if (firstTask) {
            navigate(`${basePath}/${encodeURIComponent(firstTask.instanceId)}`, { replace: true });
        } else {
            navigate(basePath, { replace: true });
        }
    }, [navigate, scope, tasks]);

    const handleDecision = useCallback(
        (decisionKey: string, comment: string) => {
            if (!selectedTaskId) return;
            // Forward task context to BFF to avoid redundant SAP $batch fetch
            const task = activeDetail?.task;
            const bo = activeDetail?.businessObject;
            const docNum =
                task?.businessContext?.documentId ||
                activeDetail?.documentId ||
                bo?.DocumentNumber ||
                bo?.PurchaseRequisition ||
                bo?.PurchaseOrder ||
                bo?.ReservationNumber ||
                bo?.ClaimNumber;
            const boType =
                task?.businessContext?.type ||
                activeDetail?.docCategory ||
                bo?.DocCategory ||
                activeDetail?.objectType ||
                '';

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
                        const basePath = scope === 'approved' ? '/approved' : '/inbox';
                        // On mobile, always return to the task list view instead of loading the next task detail
                        if (isMobile) {
                            navigate(basePath);
                            return;
                        }

                        const currentIndex = tasks.findIndex((t) => t.instanceId === selectedTaskId);
                        let nextTaskId = null;
                        if (currentIndex !== -1 && tasks.length > 1) {
                            if (currentIndex < tasks.length - 1) {
                                nextTaskId = tasks[currentIndex + 1].instanceId;
                            } else {
                                nextTaskId = tasks[currentIndex - 1].instanceId;
                            }
                        }

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
        [selectedTaskId, activeDetail, decisionMutation, navigate, tasks, scope, showError, isMobile]
    );

    const handleOpenMassDecision = useCallback(
        (decisionKey: string, taskIds: string[]) => {
            const targetTasks = tasks.filter(
                (t) => taskIds.includes(t.instanceId) && t.normalTask !== false
            );
            if (targetTasks.length === 0) {
                toast.error(
                    t('inbox.ccTasksCannotDecide', 'Review-only (CC) tasks cannot be approved or rejected.')
                );
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
            // 1. Immediately close modal and reset selection
            setMassDecisionConfig(null);
            setSelectionMode(false);
            setSelectedIds(new Set());

            // 2. Map items with full context (documentId, businessObjectType, sapOrigin)
            const items = selectedTasks.map((t) => {
                const docId = t.businessContext?.documentId || (t as any).documentNumber || t.instanceId;
                const boType =
                    t.businessContext?.type || (t as any).businessObjectType || (t as any).docCategory || '';
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
                actionableTasks.length > 0 && actionableTasks.every((t) => prev.has(t.instanceId));
            if (allActionableSelected) {
                return new Set<string>();
            }
            return new Set(actionableTasks.map((t) => t.instanceId));
        });
    }, [tasks]);

    const showMassSelection = showTaskActions && isMyScope && selectionMode && selectedIds.size > 0;

    // ── Mobile Layout ──────────────────────────────────────────
    if (isMobile) {
        return (
            <div className="relative h-full flex flex-col min-h-0 overflow-hidden bg-background">
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
                                    onLoadFirstTask={handleLoadFirstTask}
                                    hasTasks={tasks.length > 0}
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
                                key="task-list"
                                initial={{ opacity: 0.8 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0.8 }}
                                className="h-full"
                            >
                                <TaskList
                                    tasks={tasks}
                                    selectedTaskId={selectedTaskId}
                                    onSelectTask={handleSelectTask}
                                    isLoading={isLoadingList}
                                    isError={isListError}
                                    error={listError}
                                    onRefresh={handleRefreshTasks}
                                    isRefreshing={isRefreshing}
                                    totalItems={totalTasks}
                                    overallTotalItems={overallTotalTasks || totalTasks}
                                    myTasksCount={myCategoryCountsQuery.data?.ALL}
                                    approvedTasksCount={approvedCategoryCountsQuery.data?.ALL}
                                    hasNextPage={hasNextPage}
                                    isFetchingNextPage={isFetchingNextPage}
                                    onLoadMore={handleLoadMore}
                                    onSearchChange={setServerSearch}
                                    isMobile
                                    selectionMode={selectionMode}
                                    selectedIds={selectedIds}
                                    onSelectionModeChange={setSelectionMode}
                                    onSelectedIdsChange={setSelectedIds}
                                    onMassDecision={
                                        showTaskActions && isMyScope ? handleOpenMassDecision : undefined
                                    }
                                    isExecutingMass={
                                        showTaskActions && isMyScope && massDecisionMutation.isPending
                                    }
                                    showTaskActions={showTaskActions && isMyScope}
                                    hasMobileScopeBar={false}
                                    activeCategory={selectedCategory}
                                    onCategoryChange={setSelectedCategory}
                                    onBackToCategories={() => setSelectedCategory(null)}
                                    scope={scope}
                                    categoryTotals={categoryTotals}
                                    categoryTotalsAreAuthoritative={
                                        categoryCountsQuery.data?.complete === true
                                    }
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

    // ── Desktop Layout ─────────────────────────────────────────
    return (
        <div className="flex h-full w-full overflow-hidden bg-background">
            <aside className="relative w-80 shrink-0 overflow-hidden border-r border-border/60 bg-background">
                <TaskList
                    tasks={tasks}
                    selectedTaskId={selectedTaskId}
                    onSelectTask={handleSelectTask}
                    isLoading={isLoadingList}
                    isError={isListError}
                    error={listError}
                    onRefresh={handleRefreshTasks}
                    isRefreshing={isRefreshing}
                    totalItems={totalTasks}
                    overallTotalItems={overallTotalTasks || totalTasks}
                    myTasksCount={myCategoryCountsQuery.data?.ALL}
                    approvedTasksCount={approvedCategoryCountsQuery.data?.ALL}
                    hasNextPage={hasNextPage}
                    isFetchingNextPage={isFetchingNextPage}
                    onLoadMore={handleLoadMore}
                    onSearchChange={setServerSearch}
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
                    activeCategory={selectedCategory || 'ALL'}
                    onCategoryChange={(cat) => setSelectedCategory(cat)}
                    categoryTotals={categoryTotals}
                    categoryTotalsAreAuthoritative={categoryCountsQuery.data?.complete === true}
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
                        onLoadFirstTask={handleLoadFirstTask}
                        hasTasks={tasks.length > 0}
                        isSecondaryLoading={isSecondaryLoading}
                        onBack={handleBack}
                        onDecision={handleDecision}
                        isExecuting={decisionMutation.isPending}
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
