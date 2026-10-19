import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { Badge, Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@cnma/react-ui';
import { FileText, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useErrorModal } from '@/contexts/ErrorContext';
import { parseError } from '@/utils/parseError';
import {
    ActivityPanel,
    AttachmentsPanel,
    CommentsPanel,
    DetailsPanel,
    OverviewPanel,
    WorkflowApprovalPanel,
    makeTabDefinitions,
} from './panels';
import { resolveBusinessSectionModel } from '@/renderers';
import { useTranslation } from 'react-i18next';
import { normalizeDetailForView } from '../utils/normalizeTaskDetail';
import { TaskActionPanel } from './TaskActionPanel';
import { TaskDetailSkeleton, SecondaryTabSkeleton } from './TaskDetailSkeletons';
import { ReferencePrDetailView } from './ReferencePrDetailView';
import { TaskDetailErrorState } from './TaskDetailErrorState';
import { TaskDetailHeader } from './TaskDetailHeader';
import { TaskDetailTabContent } from './TaskDetailTabContent';
import { useMobileTabGestures } from '../hooks/useMobileTabGestures';

export interface TaskDetailViewProps {
    detail: any;
    isLoading: boolean;
    isError?: boolean;
    error?: unknown;
    onRetry?: () => void;
    onLoadFirstTask?: () => void;
    hasTasks?: boolean;
    isSecondaryLoading?: boolean;
    onBack: () => void;
    onDecision: (decisionKey: string, comment: string) => void;
    onForward?: (forwardTo: string, comment?: string) => void;
    onUndo?: () => void;
    isExecuting: boolean;
    isForwarding?: boolean;
    isMobile?: boolean;
    isApprovedScope?: boolean;
    showActionPanel?: boolean;
}

export function TaskDetailView({
    detail,
    isLoading,
    isError = false,
    error,
    onRetry,
    onLoadFirstTask,
    hasTasks = false,
    isSecondaryLoading = false,
    onBack,
    onDecision,
    onForward,
    onUndo,
    isExecuting,
    isForwarding = false,
    isMobile = false,
    isApprovedScope = false,
    showActionPanel = true,
}: TaskDetailViewProps) {
    const { t } = useTranslation();
    const { showError } = useErrorModal();

    const viewData = useMemo(() => normalizeDetailForView(detail), [detail]);
    const businessModel = useMemo(
        () => (detail ? resolveBusinessSectionModel(detail) : null),
        [detail]
    );

    const [tabState, setTabState] = useState<{ taskId: string; tab: string }>({
        taskId: '',
        tab: 'overview',
    });
    const [activeSubView, setActiveSubView] = useState<{ type: 'reference-pr'; prNumber: string } | null>(null);

    const prevTabIndexRef = useRef(0);

    const ptr = usePullToRefresh({
        onRefresh: onRetry ? () => void onRetry() : () => { },
        isRefreshing: isSecondaryLoading || isLoading,
        disabled: !isMobile || !onRetry,
    });

    const activeTaskId = viewData?.instanceId || '';
    const activeTab = viewData && tabState.taskId === activeTaskId ? tabState.tab : 'overview';

    useEffect(() => {
        setActiveSubView(null);
    }, [activeTaskId]);

    const handleSelectReferencePr = useCallback((prNumber: string) => {
        setActiveSubView({ type: 'reference-pr', prNumber });
    }, []);

    const documentId = viewData?.documentId || '';
    const workflowData = viewData?.workflowData;
    const prAttachmentCount = viewData?.attachments?.length || 0;
    const isPrAttachmentsLoading = false;
    const workflowError = undefined;

    const detailsCount = useMemo(() => {
        if (!businessModel || !Array.isArray(businessModel.tables)) return 0;
        const filteredTables = businessModel.tables.filter(
            (table) => table && !['Header Facts', 'Custom Attributes', 'Related Objects'].includes(table.title)
        );
        return filteredTables.reduce((acc, t) => acc + (Array.isArray(t?.rows) ? t.rows.length : 0), 0);
    }, [businessModel]);

    const tabs = useMemo(
        () =>
            viewData
                ? makeTabDefinitions({
                    detail: viewData,
                    workflowCount: workflowData?.steps?.length || 0,
                    detailsCount,
                    attachmentCount: prAttachmentCount,
                    t,
                }) || []
                : [],
        [viewData, workflowData?.steps?.length, detailsCount, prAttachmentCount, t]
    );

    // Automatically trigger ErrorModal when a detail loading error occurs (suppress 404 Not Found and 403 Forbidden)
    useEffect(() => {
        if (isError && error) {
            const parsed = parseError(error);
            const isUnavailable =
                parsed.category === 'notFound' ||
                parsed.category === 'auth' ||
                parsed.details?.statusCode === 403 ||
                parsed.details?.statusCode === 404 ||
                parsed.details?.statusCode === 401;
            if (!isUnavailable) {
                showError(error, { onRetry, onClose: onBack });
            }
        }
    }, [isError, error, showError, onRetry, onBack]);

    const handleMobileTabChange = useCallback((nextTab: string) => {
        prevTabIndexRef.current = tabs.findIndex((t) => t.value === activeTab);
        setTabState({ taskId: viewData?.instanceId || '', tab: nextTab });
    }, [activeTab, tabs, viewData?.instanceId]);

    // Mobile gestures (pull-up to next tab, touch resistance, wheel, center tab pills)
    const {
        pullUpDistance,
        isSwitchingTab,
        pullThreshold,
        tabButtonRefs,
        currentTabIndex,
        handleContainerTouchStart,
        handleContainerTouchMove,
        handleContainerTouchEnd,
        handleContainerWheel,
    } = useMobileTabGestures({
        isMobile,
        tabs,
        activeTab,
        containerRef: ptr.scrollContainerRef,
        onTabChange: handleMobileTabChange,
    });

    // Compute mobile animation direction
    const animationDirection = currentTabIndex >= prevTabIndexRef.current ? 1 : -1;

    // ── Early returns (All hooks strictly declared above this line) ───────────

    if (isLoading) {
        return <TaskDetailSkeleton onBack={onBack} isMobile={isMobile} />;
    }

    if (isError && !detail) {
        return (
            <TaskDetailErrorState
                error={error}
                isMobile={isMobile}
                onBack={onBack}
                onRetry={onRetry}
                onLoadFirstTask={onLoadFirstTask}
                hasTasks={hasTasks}
                onShowErrorDialog={(err) => showError(err, { onRetry })}
            />
        );
    }

    if (!detail || !viewData) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <FileText className="size-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-sm font-medium text-muted-foreground">
                    {t('inbox.noTasks', 'Select a task to view details')}
                </h3>
            </div>
        );
    }

    if (activeSubView?.type === 'reference-pr') {
        return (
            <ReferencePrDetailView
                prNumber={activeSubView.prNumber}
                parentDocumentId={documentId}
                onBack={() => setActiveSubView(null)}
                isMobile={isMobile}
            />
        );
    }

    const isActionPanelVisible = showActionPanel && (viewData?.normalTask ?? viewData?.task?.normalTask) !== false;

    return (
        <div className="flex h-full min-w-0 w-full max-w-full overflow-hidden flex-col bg-muted/30 relative">
            {isSecondaryLoading && (
                <div className="h-0.5 w-full bg-primary/10 overflow-hidden absolute top-0 inset-x-0 z-50">
                    <div className="h-full bg-primary animate-pulse w-full" />
                </div>
            )}

            {/* ── Header ── */}
            {isMobile && <TaskDetailHeader
                viewData={viewData}
                isMobile={isMobile}
                isSecondaryLoading={isSecondaryLoading}
                onBack={onBack}
            />}

            {/* ── Desktop Tabs ── */}
            {!isMobile && (
                <Tabs
                    value={activeTab}
                    onValueChange={(nextTab) =>
                        setTabState({
                            taskId: viewData?.instanceId || '',
                            tab: nextTab,
                        })
                    }
                    className="flex-1 min-h-0 w-full flex flex-col gap-0"
                >
                    <TaskDetailHeader viewData={viewData} isSecondaryLoading={isSecondaryLoading} onBack={onBack}>
                        <TabsList className="task-detail-tabs">
                            {tabs.map((tab) => (
                                <TabsTrigger
                                    key={tab.value}
                                    value={tab.value}
                                    className="task-detail-tabs__trigger"
                                >
                                    <tab.icon className="size-4" />
                                    <span>{tab.label}</span>
                                    {tab.count !== undefined && tab.count > 0 && (
                                        <Badge variant="secondary" className="task-detail-tabs__count">
                                            {tab.count}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </TaskDetailHeader>

                    <div className={cn(
                        "flex-1 min-h-0 overflow-y-auto overflow-x-hidden",
                        activeTab === 'attachments' && "hidden",
                        activeTab === 'comments' && "flex flex-col overflow-hidden"
                    )}>
                        <div className={cn("w-full px-5 py-4 space-y-4 pb-6", activeTab === 'comments' && "task-chat-host")}>
                            <TabsContent value="overview" className="mt-0 w-full">
                                {businessModel && (
                                    <OverviewPanel
                                        model={businessModel}
                                        detail={viewData}
                                        isMobile={false}
                                        isSecondaryLoading={isSecondaryLoading}
                                        onSelectReferencePr={handleSelectReferencePr}
                                    />
                                )}
                            </TabsContent>
                            <TabsContent value="details" className="mt-0 w-full">
                                {isSecondaryLoading && businessModel && businessModel.tables.length === 0 ? (
                                    <SecondaryTabSkeleton message={t('task.loadingDetails', 'Loading details...')} />
                                ) : (
                                    businessModel && (
                                        <DetailsPanel
                                            model={businessModel}
                                            detail={viewData}
                                            isMobile={false}
                                            isSecondaryLoading={isSecondaryLoading}
                                            onSelectReferencePr={handleSelectReferencePr}
                                        />
                                    )
                                )}
                            </TabsContent>
                            <TabsContent value="workflow" className="mt-0 w-full">
                                <WorkflowApprovalPanel
                                    data={workflowData}
                                    isLoading={false}
                                    error={workflowError}
                                    taskDetail={viewData?.task}
                                />
                            </TabsContent>
                            <TabsContent value="comments" className="mt-0 w-full h-full min-h-0">
                                {isSecondaryLoading && (viewData?.comments?.length || 0) === 0 ? (
                                    <SecondaryTabSkeleton message={t('task.loadingComments', 'Loading comments...')} />
                                ) : (
                                    <CommentsPanel
                                        detail={viewData}
                                        instanceId={viewData?.instanceId}
                                        allowAddComment={!isApprovedScope && viewData?.supports?.comments !== false}
                                        context={{
                                            sapOrigin: viewData?.task?.sapOrigin,
                                            documentId: viewData?.task?.businessContext?.documentId || viewData?.documentId,
                                            businessObjectType: viewData?.task?.businessContext?.type || viewData?.docCategory,
                                        }}
                                    />
                                )}
                            </TabsContent>
                            <TabsContent value="activity" className="mt-0 w-full">
                                {isSecondaryLoading &&
                                    (viewData?.processingLogs?.length || 0) === 0 &&
                                    (viewData?.workflowLogs?.length || 0) === 0 ? (
                                    <SecondaryTabSkeleton message={t('task.loadingActivity', 'Loading activity...')} />
                                ) : (
                                    <ActivityPanel detail={viewData} />
                                )}
                            </TabsContent>
                        </div>
                    </div>

                    <TabsContent value="attachments" className="mt-0 w-full flex-1 min-h-0 px-5 py-4 data-[state=active]:flex data-[state=active]:flex-col">
                        <AttachmentsPanel
                            detail={viewData}
                            isPrLoading={isPrAttachmentsLoading}
                            isSecLoading={isSecondaryLoading}
                        />
                    </TabsContent>
                </Tabs>
            )}

            {/* ── Desktop: docked action footer ── */}
            {!isMobile && isActionPanelVisible && (
                <div className="shrink-0 border-t border-border/60 bg-background/95 backdrop-blur-sm px-5 py-3 empty:hidden">
                    <TaskActionPanel
                        detail={viewData}
                        onDecision={onDecision}
                        onForward={onForward}
                        onUndo={onUndo}
                        isExecuting={isExecuting}
                        isForwarding={isForwarding}
                        isApprovedScope={isApprovedScope}
                        isMobile={false}
                    />
                </div>
            )}

            {/* ── Mobile Tabs ── */}
            {isMobile && (
                <>
                    <div className="bg-card border-b border-border/60 px-3 py-1.5 shrink-0 shadow-2xs">
                        <div className="flex overflow-x-auto no-scrollbar gap-1">
                            {tabs.map((tab) => {
                                const isActive = activeTab === tab.value;
                                return (
                                    <Button
                                        variant="ghost"
                                        key={tab.value}
                                        ref={(el) => {
                                            tabButtonRefs.current[tab.value] = el;
                                        }}
                                        onClick={() => handleMobileTabChange(tab.value)}
                                        className={cn(
                                            'relative shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium transition-all rounded-full min-h-11 h-auto',
                                            'focus-visible:outline-none',
                                            isActive
                                                ? 'bg-primary text-primary-foreground shadow-sm'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted/70'
                                        )}
                                    >
                                        <tab.icon className={cn("size-3.5", isActive ? "text-primary-foreground" : "text-muted-foreground/60")} />
                                        <span>{tab.label}</span>
                                        {tab.count !== undefined && tab.count > 0 && (
                                            <span className={cn(
                                                'ml-0.5 rounded-full px-1.5 py-0 text-xs font-semibold',
                                                isActive
                                                    ? 'bg-primary-foreground/20 text-primary-foreground'
                                                    : 'bg-muted text-muted-foreground'
                                            )}>
                                                {tab.count}
                                            </span>
                                        )}
                                        {isActive && (
                                            <motion.div
                                                layoutId={`mobile-tab-indicator-${viewData?.instanceId}`}
                                                className="absolute inset-0 rounded-full bg-primary -z-10"
                                                transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                                            />
                                        )}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Mobile: Action Panel directly under switchable tabs ── */}
                    {isActionPanelVisible && (
                        <div className="shrink-0 border-b border-border/60 bg-card px-3 py-2 shadow-2xs empty:hidden">
                            <TaskActionPanel
                                detail={viewData}
                                onDecision={onDecision}
                                onForward={onForward}
                                onUndo={onUndo}
                                isExecuting={isExecuting}
                                isForwarding={isForwarding}
                                isApprovedScope={isApprovedScope}
                                isMobile={true}
                            />
                        </div>
                    )}

                    <div
                        ref={ptr.containerRef}
                        onTouchStart={activeTab === 'comments' ? undefined : handleContainerTouchStart}
                        onTouchMove={activeTab === 'comments' ? undefined : handleContainerTouchMove}
                        onTouchEnd={activeTab === 'comments' ? undefined : handleContainerTouchEnd}
                        onTouchCancel={activeTab === 'comments' ? undefined : handleContainerTouchEnd}
                        onWheel={activeTab === 'comments' ? undefined : handleContainerWheel}
                        className={cn("flex-1 min-h-0 w-full min-w-0 overflow-y-auto overflow-x-hidden relative bg-background", activeTab === 'comments' && "flex flex-col overflow-hidden")}
                    >
                        {/* ── Mobile Pull-to-Refresh Indicator ── */}
                        {(ptr.pullDistance > 0 || ptr.isRefreshing) && (
                            <div
                                className="flex items-center justify-center overflow-hidden transition-all duration-150 py-1"
                                style={{
                                    height: ptr.isRefreshing ? 48 : Math.min(ptr.pullDistance, 60),
                                    opacity: ptr.isRefreshing ? 1 : Math.min(ptr.pullDistance / 50, 1),
                                }}
                            >
                                {ptr.isRefreshing ? (
                                    <div className="flex items-center gap-2 text-xs font-medium text-primary">
                                        <span className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                        <span>{t('common.refreshing', 'Refreshing...')}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <span
                                            className="transition-transform duration-200"
                                            style={{ transform: `rotate(${ptr.pullDistance > 50 ? 180 : 0}deg)` }}
                                        >
                                            ↓
                                        </span>
                                        <span>
                                            {ptr.pullDistance > 50
                                                ? t('common.releaseToRefresh', 'Release to refresh')
                                                : t('common.pullToRefresh', 'Pull down to refresh')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        <AnimatePresence initial={false} mode="popLayout" custom={animationDirection}>
                            <motion.div
                                key={activeTab}
                                custom={animationDirection}
                                initial={{ x: `${animationDirection * 20}%`, opacity: 0, scale: 0.98 }}
                                animate={{ x: 0, opacity: 1, scale: 1 }}
                                exit={{ x: `${-animationDirection * 20}%`, opacity: 0, scale: 0.98 }}
                                transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
                                className={cn("w-full", activeTab === 'comments' && "flex-1 min-h-0 flex flex-col")}
                            >
                                <div className={cn("p-4 space-y-4 pb-12", activeTab === 'comments' && "task-chat-host")}>
                                    <TaskDetailTabContent
                                        tabValue={activeTab}
                                        mobile={true}
                                        businessModel={businessModel}
                                        viewData={viewData}
                                        isSecondaryLoading={isSecondaryLoading}
                                        isPrAttachmentsLoading={isPrAttachmentsLoading}
                                        workflowData={workflowData}
                                        workflowError={workflowError}
                                        isApprovedScope={isApprovedScope}
                                        onSelectReferencePr={handleSelectReferencePr}
                                    />
                                    {activeTab !== 'comments' && currentTabIndex < tabs.length - 1 && (
                                        <div className="flex flex-col items-center justify-center pt-6 pb-4 text-xs font-medium text-muted-foreground/70 select-none">
                                            {pullUpDistance > 0 || isSwitchingTab ? (
                                                <div className="flex flex-col items-center gap-1.5 text-primary animate-pulse">
                                                    <div className="flex items-center gap-1.5 font-semibold">
                                                        <ChevronDown
                                                            className="size-4 transition-transform duration-200"
                                                            style={{
                                                                transform: `rotate(${pullUpDistance >= pullThreshold || isSwitchingTab ? 180 : 0}deg)`,
                                                            }}
                                                        />
                                                        <span>
                                                            {pullUpDistance >= pullThreshold || isSwitchingTab
                                                                ? `${t('common.switchingTo', 'Đang chuyển sang')} ${tabs[currentTabIndex + 1]?.label}...`
                                                                : `${t('common.pullUpToNext', 'Kéo tiếp để xem')} ${tabs[currentTabIndex + 1]?.label}`}
                                                        </span>
                                                    </div>
                                                    <div className="w-28 h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                                                        <div
                                                            className="h-full bg-primary rounded-full transition-all duration-100 ease-out"
                                                            style={{
                                                                width: `${Math.min((pullUpDistance / pullThreshold) * 100, 100)}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-muted-foreground/50">
                                                    <span>{t('common.scrollToNextTab', 'Cuộn xuống để xem')} {tabs[currentTabIndex + 1]?.label}</span>
                                                    <ChevronDown className="size-3.5" />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </>
            )}
        </div>
    );
}
