import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { Button, Tabs, TabsContent, TabsList, TabsTrigger, Skeleton } from '@cnma/react-ui';

import type { TaskDetail as TaskDetailType } from '@/services/inbox/inbox.types';
import { ArrowLeft, FileText, AlertTriangle, RotateCcw, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

import { invalidateAfterComment } from '@/pages/Inbox/hooks/inboxInvalidation';
import { useQueryClient } from '@tanstack/react-query';
import { useErrorModal } from '@/contexts/ErrorContext';
import { parseError } from '@/utils/parseError';
import {
    ActivityPanel,
    AttachmentsPanel,
    CommentsPanel,
    DetailsPanel,
    OverviewPanel,
    StatusHeaderBadges,
    WorkflowApprovalPanel,
    makeTabDefinitions,
} from './panels';
import { resolveBusinessSectionModel } from '@/renderers';
import { useTranslation } from 'react-i18next';
import { buildSapPrLaunchpadUrl } from '@/utils/launchpad';
import { normalizeDetailForView } from '../utils/normalizeTaskDetail';
import { TaskActionPanel } from './TaskActionPanel';
import { TaskDetailSkeleton, SecondaryTabSkeleton } from './TaskDetailSkeletons';

interface TaskDetailViewProps {
    detail: any;
    isLoading: boolean;
    isError?: boolean;
    error?: unknown;
    onRetry?: () => void;
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
    const { t } = useTranslation();

    const ptr = usePullToRefresh({
        onRefresh: onRetry ? () => void onRetry() : () => { },
        isRefreshing: isSecondaryLoading || isLoading,
        disabled: !isMobile || !onRetry,
    });

    const queryClient = useQueryClient();
    const handleCommentAdded = useCallback(() => {
        if (!viewData) return;
        invalidateAfterComment(queryClient, viewData.instanceId);
    }, [viewData, queryClient]);

    const activeTaskId = viewData?.instanceId || '';
    const activeTab = viewData && tabState.taskId === activeTaskId ? tabState.tab : 'overview';

    useEffect(() => {
        setActiveSubView(null);
    }, [activeTaskId]);

    const handleSelectReferencePr = useCallback((prNumber: string) => {
        const url = buildSapPrLaunchpadUrl(prNumber);
        if (url && typeof window !== 'undefined') {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
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
                    workflowComments: workflowData?.comments,
                    detailsCount,
                    attachmentCount: prAttachmentCount,
                    t,
                }) || []
                : [],
        [viewData, workflowData?.steps?.length, workflowData?.comments, detailsCount, prAttachmentCount, t]
    );

    const { showError } = useErrorModal();

    // Automatically trigger ErrorModal when a detail loading error occurs
    useEffect(() => {
        if (isError && error) {
            showError(error, { onRetry, onClose: onBack });
        }
    }, [isError, error, showError, onRetry, onBack]);

    if (isLoading) {
        return <TaskDetailSkeleton onBack={onBack} isMobile={isMobile} />;
    }

    if (isError && !detail) {
        const parsed = parseError(error);
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 max-w-md mx-auto space-y-4">
                <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <AlertTriangle className="size-8" />
                </div>
                <h3 className="text-base font-bold text-foreground">
                    {parsed.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {parsed.message}
                </p>
                <div className="flex items-center gap-3 pt-2">
                    {onRetry && (
                        <Button variant="default" size="sm" onClick={onRetry} className="gap-1.5 text-xs">
                            <RotateCcw className="size-3.5" />
                            {t('common.retry', 'Retry')}
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => showError(error, { onRetry })}
                        className="gap-1.5 text-xs"
                    >
                        <Info className="size-3.5" />
                        {t('error.viewDetails', 'View Diagnostics')}
                    </Button>
                </div>
            </div>
        );
    }

    if (!detail) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <FileText className="size-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-sm font-medium text-muted-foreground">
                    {t('inbox.noTasks', 'Select a task to view details')}
                </h3>
            </div>
        );
    }


    // Render tab content (shared between mobile & desktop)
    const renderTabContent = (tabValue: string, mobile: boolean) => {
        switch (tabValue) {
            case 'overview':
                return businessModel ? (
                    <OverviewPanel
                        model={businessModel}
                        detail={viewData}
                        isMobile={mobile}
                        isSecondaryLoading={isSecondaryLoading}
                        onSelectReferencePr={handleSelectReferencePr}
                    />
                ) : null;
            case 'details':
                if (isSecondaryLoading && businessModel && businessModel.tables.length === 0) {
                    return <SecondaryTabSkeleton message={t('task.loadingDetails', 'Loading details...')} />;
                }
                return businessModel ? (
                    <DetailsPanel
                        model={businessModel}
                        detail={viewData}
                        isMobile={mobile}
                        isSecondaryLoading={isSecondaryLoading}
                        onSelectReferencePr={handleSelectReferencePr}
                    />
                ) : null;
            case 'workflow':
                return (
                    <WorkflowApprovalPanel
                        data={workflowData}
                        isLoading={false}
                        error={workflowError}
                        taskDetail={viewData?.task}
                    />
                );
            case 'attachments':
                if (isPrAttachmentsLoading || (isSecondaryLoading && (viewData?.attachments?.length || 0) === 0)) {
                    return <SecondaryTabSkeleton message={t('task.loadingAttachments', 'Loading attachments...')} />;
                }
                return <AttachmentsPanel detail={viewData} isMobile={mobile} allowUpload={showActionPanel} />;
            case 'comments':
                if (isSecondaryLoading && (viewData?.comments?.length || 0) === 0) {
                    return <SecondaryTabSkeleton message={t('task.loadingComments', 'Loading comments...')} />;
                }
                return (
                    <CommentsPanel
                        detail={viewData}
                        instanceId={viewData?.instanceId}
                        onCommentAdded={handleCommentAdded}
                        allowAddComment={showActionPanel}
                        context={{
                            sapOrigin: viewData?.task?.sapOrigin,
                            documentId: viewData?.task?.businessContext?.documentId,
                            businessObjectType: viewData?.task?.businessContext?.type,
                        }}
                        workflowComments={workflowData?.comments}
                        isLoadingWorkflowComments={false}
                    />
                );
            case 'activity':
                if (
                    isSecondaryLoading &&
                    (viewData?.processingLogs?.length || 0) === 0 &&
                    (viewData?.workflowLogs?.length || 0) === 0
                ) {
                    return <SecondaryTabSkeleton message={t('task.loadingActivity', 'Loading activity...')} />;
                }
                return <ActivityPanel detail={viewData} />;
            default:
                return null;
        }
    };

    // Compute mobile animation direction
    const currentTabIndex = tabs.findIndex((t) => t.value === activeTab);
    const animationDirection = currentTabIndex >= prevTabIndexRef.current ? 1 : -1;

    const handleMobileTabChange = (nextTab: string) => {
        prevTabIndexRef.current = tabs.findIndex((t) => t.value === activeTab);
        setTabState({ taskId: viewData?.instanceId || '', tab: nextTab });
    };

    return (
        <div className="flex h-full min-w-0 w-full max-w-full overflow-hidden flex-col bg-muted/30 relative">
            {isSecondaryLoading && (
                <div className="h-0.5 w-full bg-primary/10 overflow-hidden absolute top-0 inset-x-0 z-50">
                    <div className="h-full bg-primary animate-pulse w-full" />
                </div>
            )}
            {/* ── Header ── */}
            {isMobile ? (
                <div className="px-4 pt-4 pb-0 bg-muted/30 shrink-0">
                    <div className="rounded-t-xl bg-white border border-x-border/40 border-t-border/40 border-b-border/40 px-4 py-4 space-y-2 relative z-10">
                        <div className="flex items-start gap-1.5">
                            <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 mt-0.5 size-8 p-0 rounded-md hover:bg-muted transition-colors">
                                <ArrowLeft className="size-5 text-foreground" />
                            </Button>
                            {isSecondaryLoading ? (
                                <Skeleton className="h-6 w-3/4 my-0.5 rounded-md animate-pulse bg-muted/60" />
                            ) : (
                                <h2 className="text-lg font-bold text-foreground leading-snug line-clamp-2 flex-1">
                                    {viewData?.title || 'Task Details'}
                                </h2>
                            )}
                        </div>
                        <div className="pl-7">
                            <StatusHeaderBadges detail={viewData} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="border-b border-border/60 bg-background px-5 py-4">
                    <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1 space-y-2">
                            {isSecondaryLoading ? (
                                <Skeleton className="h-7 w-80 my-0.5 rounded-md animate-pulse bg-muted/60" />
                            ) : (
                                <h2 className="text-xl font-semibold text-foreground truncate">
                                    {viewData?.title || 'Task Details'}
                                </h2>
                            )}
                            <StatusHeaderBadges detail={viewData} />
                        </div>
                    </div>
                </div>
            )}

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
                    className="flex-1 min-h-0 w-full flex flex-col gap-0 border-t border-border/60"
                >
                    <TabsList className="h-auto w-full justify-start border-b border-border/60 bg-white px-3 py-0 gap-1">
                        {tabs.map((tab) => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className={cn(
                                    'h-10 min-w-24 rounded-none border-b-2 border-transparent px-3 text-sm text-muted-foreground',
                                    'hover:bg-muted/50 hover:text-foreground',
                                    'data-[state=active]:border-b-primary data-[state=active]:text-primary data-[state=active]:font-medium',
                                    'data-[state=active]:bg-transparent data-[state=active]:shadow-none [&>svg]:data-[state=active]:text-primary'
                                )}
                            >
                                <tab.icon className="size-4" />
                                <span>{tab.label}</span>
                                {tab.count !== undefined && tab.count > 0 && (
                                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                                        {tab.count}
                                    </span>
                                )}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <div className={cn(
                        "flex-1 min-h-0 overflow-y-auto overflow-x-hidden",
                        activeTab === 'attachments' && "hidden"
                    )}>
                        <div className="w-full px-5 py-4 space-y-4 pb-6">
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
                            <TabsContent value="comments" className="mt-0 w-full">
                                {isSecondaryLoading && (viewData?.comments?.length || 0) === 0 ? (
                                    <SecondaryTabSkeleton message={t('task.loadingComments', 'Loading comments...')} />
                                ) : (
                                    <CommentsPanel
                                        detail={viewData}
                                        instanceId={viewData?.instanceId}
                                        onCommentAdded={handleCommentAdded}
                                        allowAddComment={showActionPanel}
                                        context={{
                                            sapOrigin: viewData?.task?.sapOrigin,
                                            documentId: viewData?.task?.businessContext?.documentId,
                                            businessObjectType: viewData?.task?.businessContext?.type,
                                        }}
                                        workflowComments={workflowData?.comments}
                                        isLoadingWorkflowComments={false}
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
                            allowUpload={showActionPanel}
                            isPrLoading={isPrAttachmentsLoading}
                            isSecLoading={isSecondaryLoading}
                        />
                    </TabsContent>
                </Tabs>
            )}

            {/* ── Mobile Tabs ── */}
            {isMobile && (
                <>
                    <div className="px-4 pb-2 bg-muted/30 shrink-0">
                        <div className="rounded-b-xl border border-x-border/40 border-b-border/40 border-t-0 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden">
                            <div className="flex overflow-x-auto no-scrollbar">
                                {tabs.map((tab) => {
                                    const isActive = activeTab === tab.value;
                                    return (
                                        <Button
                                            variant="ghost"
                                            key={tab.value}
                                            onClick={() => handleMobileTabChange(tab.value)}
                                            className={cn(
                                                'relative shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 mt-1 mb-1 mx-1 text-sm font-medium transition-all rounded-full h-auto',
                                                'focus-visible:outline-none',
                                                isActive
                                                    ? 'bg-primary text-white shadow-sm'
                                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                            )}
                                        >
                                            <tab.icon className={cn("size-3.5", isActive ? "text-white" : "text-muted-foreground/60")} />
                                            <span>{tab.label}</span>
                                            {tab.count !== undefined && tab.count > 0 && (
                                                <span className={cn(
                                                    'ml-0.5 rounded-full px-1.5 py-0 text-xs font-semibold',
                                                    isActive
                                                        ? 'bg-white/20 text-white'
                                                        : 'bg-muted text-muted-foreground'
                                                )}>
                                                    {tab.count}
                                                </span>
                                            )}
                                            {isActive && (
                                                <motion.div
                                                    layoutId={`mobile-tab-indicator-${viewData?.instanceId}`}
                                                    className="absolute inset-0 rounded-full bg-primary"
                                                    style={{ zIndex: -1 }}
                                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                                                />
                                            )}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 w-full min-w-0 overflow-hidden relative">
                        <AnimatePresence initial={false} mode="popLayout" custom={animationDirection}>
                            <motion.div
                                key={activeTab}
                                custom={animationDirection}
                                initial={{ x: `${animationDirection * 20}%`, opacity: 0, scale: 0.98 }}
                                animate={{ x: 0, opacity: 1, scale: 1 }}
                                exit={{ x: `${-animationDirection * 20}%`, opacity: 0, scale: 0.98 }}
                                transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
                                className="absolute inset-0 w-full"
                            >
                                <div
                                    ref={ptr.containerRef}
                                    {...(isMobile ? ptr.touchHandlers : {})}
                                    className={cn(
                                        'h-full w-full overflow-y-auto overflow-x-hidden scroll-smooth overscroll-y-contain touch-pan-y',
                                        isMobile && 'will-change-scroll [webkit-overflow-scrolling:touch]'
                                    )}
                                >
                                    {isMobile && (ptr.pullDistance > 0 || ptr.isRefreshing) && (
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

                                    <div className="p-4 space-y-4 pb-24">
                                        {renderTabContent(activeTab, true)}
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </>
            )}

            {/* ── Desktop: docked action footer ── */}
            {!isMobile && showActionPanel && (
                <div className="shrink-0 border-t border-border/60 bg-background/95 backdrop-blur-sm px-5 py-3 empty:hidden">
                    <TaskActionPanel
                        detail={viewData}
                        onDecision={onDecision}
                        onForward={onForward}
                        onUndo={onUndo}
                        isExecuting={isExecuting}
                        isForwarding={isForwarding}
                        isApprovedScope={isApprovedScope}
                        isMobile={isMobile}
                    />
                </div>
            )}

            {/* ── Mobile: floating action bar ── */}
            {isMobile && showActionPanel && (
                <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
                    <div className="pointer-events-auto rounded-2xl border border-border bg-white/98 p-3 shadow-[0_12px_28px_rgba(15,23,42,0.14)] empty:hidden">
                        <TaskActionPanel
                            detail={viewData}
                            onDecision={onDecision}
                            onForward={onForward}
                            onUndo={onUndo}
                            isExecuting={isExecuting}
                            isForwarding={isForwarding}
                            isApprovedScope={isApprovedScope}
                            isMobile={isMobile}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
