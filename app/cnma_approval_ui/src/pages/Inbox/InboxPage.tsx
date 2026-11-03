import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { TaskList, TaskDetailView, MassSelectionView, MassDecisionDialog } from '@/pages/Inbox/components';
import type { TaskListProps } from '@/pages/Inbox/components/TaskList';
import type { TaskDetailViewProps } from '@/pages/Inbox/components/TaskDetailView';
import { normalizeInstanceId, resolveDetailInstanceId } from '@/pages/Inbox/utils/instanceId';
import { useTaskDetail, useDecision, useMassDecision } from '@/pages/Inbox/hooks/useInbox';
import { useInboxData } from '@/pages/Inbox/hooks/useInboxData';
import type { InboxTask } from '@/services/inbox/inbox.types';
import type { RawODataEntity } from '@/services/inbox/inbox.contracts';
import { useIsMobile } from '@cnma/react-ui';
import { useErrorModal } from '@/contexts/useErrorModal';
import { useMobileNav } from '@/contexts/MobileNavContext';
import {
    getFirstTaskByCategoryOrder,
    type ObjectCategory,
} from './utils/categoryUtils';

type TaskScope = 'my' | 'approved';

/** Legacy worklist payloads may still carry these un-normalized fields. */
type LegacyInboxTask = InboxTask & {
    documentNumber?: string;
    businessObjectType?: string;
    docCategory?: string;
};

const getScopeBasePath = (scope: TaskScope): string => (scope === 'approved' ? '/approved' : '/inbox');

const getTaskPath = (basePath: string, instanceId: string): string =>
    `${basePath}/${encodeURIComponent(instanceId)}`;

/** The task to show after the current one is decided: the next one, or the previous one when it was last. */
function getAdjacentTaskId(tasks: InboxTask[], currentId: string): string | null {
    const currentIndex = tasks.findIndex((t) => t.instanceId === currentId);
    if (currentIndex === -1 || tasks.length <= 1) return null;
    const adjacentIndex = currentIndex < tasks.length - 1 ? currentIndex + 1 : currentIndex - 1;
    return tasks[adjacentIndex].instanceId;
}

export default function InboxPage() {
    const { t } = useTranslation();
    const { showError } = useErrorModal();
    const { taskId } = useParams<{ taskId?: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const selectedTaskId = taskId ? decodeURIComponent(taskId) : null;
    const scope: TaskScope = location.pathname.startsWith('/approved') ? 'approved' : 'my';
    const isMyScope = scope === 'my';
    const basePath = getScopeBasePath(scope);
    // Decisions and mass actions are only offered in the "My Tasks" scope.
    const canTakeActions = isMyScope;

    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [selectedCategory, setSelectedCategory] = useState<ObjectCategory | null>(null);
    const [serverSearch, setServerSearch] = useState('');
    const [requested, setRequested] = useState<{ scope: TaskScope; categories: Exclude<ObjectCategory, 'ALL'>[] }>({ scope, categories: [] });
    const handleRequestedCategories = useCallback((categories: Exclude<ObjectCategory, 'ALL'>[]) => {
        setRequested(previous => previous.scope === scope && previous.categories.join(',') === categories.join(',')
            ? previous : { scope, categories });
    }, [scope]);
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

    // Adjust state during render when the scope or layout changes:
    // - scope change: leave selection mode and clear the selection
    // - mobile: reset the selected category (My Tasks <-> Approved Tasks, or entering mobile layout)
    const [previousLayout, setPreviousLayout] = useState({ scope, isMobile });
    if (previousLayout.scope !== scope || previousLayout.isMobile !== isMobile) {
        setPreviousLayout({ scope, isMobile });
        if (previousLayout.scope !== scope) {
            setSelectionMode(false);
            setSelectedIds(new Set());
        }
        if (isMobile) {
            setSelectedCategory(null);
        }
    }

    // Multi-category data aggregation, deduplication, and counts hook
    const {
        tasks,
        totalTasks,
        overallTotalTasks,
        categoryTotals,
        categoryCountsQuery,
        categoryStates,
        retryCategory,
        myCategoryCountsQuery,
        approvedCategoryCountsQuery,
        isLoadingList,
        isFetchingNextPage,
        hasNextPage,
        listError,
        isListError,
        isRefreshingList,
        handleLoadMore,
        cancelLoadMore,
        refreshList,
    } = useInboxData({
        scope,
        serverSearch,
        selectedTaskId,
        requestedCategories: requested.scope === scope && !(isMobile && selectedTaskId) ? requested.categories : [],
    });

    const normSelectedId = normalizeInstanceId(selectedTaskId);
    const selectedTask = normSelectedId
        ? tasks.find(
              (t) => t.instanceId === selectedTaskId || normalizeInstanceId(t.instanceId) === normSelectedId
          )
        : undefined;

    const {
        data: detailResponse,
        isLoading: isLoadingDetail,
        isFetching: isFetchingDetail,
        isError: isErrorDetail,
        error: errorDetail,
    } = useTaskDetail(selectedTaskId, undefined, selectedTask);

    const decisionMutation = useDecision();
    const massDecisionMutation = useMassDecision();

    // The detail payload is either the raw-OData envelope ({ businessObject, taskprocessing }) or a legacy TaskDetail.
    const rawDetail: RawODataEntity | undefined = detailResponse;
    const detailTaskId = resolveDetailInstanceId(rawDetail);
    const normDetailId = normalizeInstanceId(detailTaskId);

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

    const handleRefreshTasks = useCallback(() => refreshList(), [refreshList]);

    const handleSelectTask = useCallback(
        (task: InboxTask) => {
            navigate(getTaskPath(basePath, task.instanceId));
        },
        [navigate, basePath]
    );

    const handleBack = useCallback(() => {
        navigate(basePath);
    }, [navigate, basePath]);

    const handleLoadFirstTask = useCallback(() => {
        const firstTask = getFirstTaskByCategoryOrder(tasks);
        navigate(firstTask ? getTaskPath(basePath, firstTask.instanceId) : basePath, { replace: true });
    }, [navigate, basePath, tasks]);

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
                        // On mobile, always return to the task list view instead of loading the next task detail
                        const nextTaskId = isMobile ? null : getAdjacentTaskId(tasks, selectedTaskId);
                        navigate(nextTaskId ? getTaskPath(basePath, nextTaskId) : basePath);
                    },
                    onError: (err) => {
                        showError(err, {
                            title: 'Decision Failed',
                        });
                    },
                }
            );
        },
        [selectedTaskId, activeDetail, decisionMutation, navigate, tasks, basePath, showError, isMobile]
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
            const items = selectedTasks.map((t: LegacyInboxTask) => {
                const docId = t.businessContext?.documentId || t.documentNumber || t.instanceId;
                const boType = t.businessContext?.type || t.businessObjectType || t.docCategory || '';
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

    const showMassSelection = canTakeActions && selectionMode && selectedIds.size > 0;

    // Props shared by the mobile and desktop task list / detail views.
    const taskListProps: TaskListProps = {
        onRequestedCategoriesChange: handleRequestedCategories,
        tasks,
        selectedTaskId,
        onSelectTask: handleSelectTask,
        isLoading: isLoadingList,
        categoryStates,
        onRetryCategory: retryCategory,
        isError: isListError,
        error: listError,
        onRefresh: handleRefreshTasks,
        isRefreshing,
        totalItems: totalTasks,
        overallTotalItems: overallTotalTasks || totalTasks,
        myTasksCount: myCategoryCountsQuery.data?.ALL,
        approvedTasksCount: approvedCategoryCountsQuery.data?.ALL,
        hasNextPage,
        isFetchingNextPage,
        onCancelLoadMore: cancelLoadMore,
        onLoadMore: handleLoadMore,
        onSearchChange: setServerSearch,
        selectionMode,
        selectedIds,
        onSelectionModeChange: setSelectionMode,
        onSelectedIdsChange: setSelectedIds,
        onMassDecision: canTakeActions ? handleOpenMassDecision : undefined,
        isExecutingMass: canTakeActions && massDecisionMutation.isPending,
        showTaskActions: canTakeActions,
        scope,
        categoryTotals,
        categoryTotalsAreAuthoritative: categoryCountsQuery.data?.complete === true,
    };

    const taskDetailProps: TaskDetailViewProps = {
        detail: activeDetail,
        isLoading: isDetailLoading,
        isError: isErrorDetail,
        error: errorDetail,
        onRetry: handleRefreshTasks,
        onLoadFirstTask: handleLoadFirstTask,
        hasTasks: tasks.length > 0,
        isSecondaryLoading,
        onBack: handleBack,
        onDecision: handleDecision,
        isExecuting: decisionMutation.isPending,
        isApprovedScope: !isMyScope,
        showActionPanel: canTakeActions,
    };

    const massDecisionDialog = massDecisionConfig && (
        <MassDecisionDialog
            isOpen={massDecisionConfig.isOpen}
            onClose={() => setMassDecisionConfig(null)}
            onConfirm={handleConfirmMassDecision}
            decisionKey={massDecisionConfig.decisionKey}
            tasks={massDecisionConfig.tasks}
            isExecuting={massDecisionMutation.isPending}
        />
    );

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
                                <TaskDetailView {...taskDetailProps} isMobile />
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
                                    key={scope}
                                    {...taskListProps}
                                    isMobile
                                    hasMobileScopeBar={false}
                                    activeCategory={selectedCategory}
                                    onCategoryChange={setSelectedCategory}
                                    onBackToCategories={() => setSelectedCategory(null)}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                {massDecisionDialog}
            </div>
        );
    }

    // ── Desktop Layout ─────────────────────────────────────────
    return (
        <div className="flex h-full w-full overflow-hidden bg-background">
            <aside className="relative w-80 shrink-0 overflow-hidden border-r border-border/60 bg-background">
                <TaskList
                    key={scope}
                    {...taskListProps}
                    onScopeChange={(nextScope) => {
                        navigate(getScopeBasePath(nextScope));
                    }}
                    activeCategory={selectedCategory || 'ALL'}
                    onCategoryChange={setSelectedCategory}
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
                    <TaskDetailView {...taskDetailProps} />
                )}
            </main>
            {massDecisionDialog}
        </div>
    );
}
