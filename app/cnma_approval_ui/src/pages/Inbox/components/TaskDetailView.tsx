import { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollArea, Skeleton, Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@cnma/react-ui';

import { DecisionPanel } from './DecisionPanel';
import type { TaskDetail as TaskDetailType } from '@/services/inbox/inbox.types';
import { ArrowLeft, FileText, Undo2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkflowApprovalTree, usePrAttachments } from '@/pages/Inbox/hooks/useInbox';
import { invalidateAfterComment } from '@/pages/Inbox/hooks/inboxInvalidation';
import { useQueryClient } from '@tanstack/react-query';
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
import { resolveBusinessSectionModel } from './renderers';
import { useTranslation } from 'react-i18next';

interface TaskDetailViewProps {
    detail: TaskDetailType | undefined;
    isLoading: boolean;
    isSecondaryLoading?: boolean;
    onBack: () => void;
    onDecision: (decisionKey: string, comment: string) => void;
    isExecuting: boolean;
    isMobile?: boolean;
    isApprovedScope?: boolean;
    showActionPanel?: boolean;
}

export function TaskDetailView({
    detail,
    isLoading,
    isSecondaryLoading = false,
    onBack,
    onDecision,
    isExecuting,
    isMobile = false,
    isApprovedScope = false,
    showActionPanel = true,
}: TaskDetailViewProps) {
    const businessModel = useMemo(
        () => (detail ? resolveBusinessSectionModel(detail) : null),
        [detail]
    );
    const [tabState, setTabState] = useState<{ taskId: string; tab: string }>({
        taskId: '',
        tab: 'overview',
    });
    // Track direction for mobile tab animation
    const prevTabIndexRef = useRef(0);
    const { t } = useTranslation();

    const queryClient = useQueryClient();
    const handleCommentAdded = useCallback(() => {
        if (!detail) return;
        invalidateAfterComment(queryClient, detail.task.instanceId);
    }, [detail, queryClient]);

    const activeTab =
        detail && tabState.taskId === detail.task.instanceId ? tabState.tab : 'overview';

    const docType = detail?.task.businessContext?.type;
    const supportsApproval = docType === 'PR' || docType === 'PO';
    const supportsStandaloneAttach = docType === 'PR';
    const documentId = detail?.task.businessContext?.documentId;

    const workflowQuery = useWorkflowApprovalTree(
        detail?.task.instanceId ?? null,
        documentId,
        detail?.task.sapOrigin,
        docType,
        { enabled: !!detail && supportsApproval }
    );
    const workflowError = workflowQuery.error
        ? 'Failed to load workflow approval tree.'
        : undefined;

    // Standalone attachment count for the tab badge (e.g. for PR)
    const prAttachmentsQuery = usePrAttachments(
        supportsStandaloneAttach ? documentId : null,
        detail?.task.sapOrigin,
        { enabled: !!detail && supportsStandaloneAttach }
    );
    const prAttachmentCount = supportsStandaloneAttach
        ? (prAttachmentsQuery.data?.attachments?.length ?? undefined)
        : undefined;
    const isPrAttachmentsLoading = supportsStandaloneAttach && prAttachmentsQuery.isLoading;

    const detailsCount = useMemo(() => {
        if (!businessModel) return undefined;
        const filteredTables = businessModel.tables.filter(
            (table) => !['Header Facts', 'Custom Attributes', 'Related Objects'].includes(table.title)
        );
        return filteredTables.reduce((acc, t) => acc + t.rows.length, 0);
    }, [businessModel]);

    const tabs = useMemo(
        () =>
            detail
                ? makeTabDefinitions({
                      detail,
                      workflowCount: workflowQuery.data?.steps?.length || 0,
                      workflowComments: workflowQuery.data?.comments,
                      detailsCount,
                      attachmentCount: prAttachmentCount,
                      t,
                  })
                : [],
        [detail, workflowQuery.data?.steps?.length, workflowQuery.data?.comments, detailsCount, prAttachmentCount, t]
    );

    if (isLoading) {
        return <TaskDetailSkeleton onBack={onBack} isMobile={isMobile} />;
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
                    <OverviewPanel model={businessModel} detail={detail} isMobile={mobile} />
                ) : null;
            case 'details':
                if (isSecondaryLoading && businessModel && businessModel.tables.length === 0) {
                    return <SecondaryTabSkeleton message={t('task.loadingDetails', 'Loading details...')} />;
                }
                return businessModel ? (
                    <DetailsPanel model={businessModel} detail={detail} isMobile={mobile} />
                ) : null;
            case 'workflow':
                return (
                    <WorkflowApprovalPanel
                        data={workflowQuery.data}
                        isLoading={workflowQuery.isLoading || workflowQuery.isFetching}
                        error={workflowError}
                        taskDetail={detail.task}
                    />
                );
            case 'attachments':
                if (isPrAttachmentsLoading || (isSecondaryLoading && detail.attachments.length === 0)) {
                    return <SecondaryTabSkeleton message={t('task.loadingAttachments', 'Loading attachments...')} />;
                }
                return <AttachmentsPanel detail={detail} isMobile={mobile} allowUpload={showActionPanel} />;
            case 'comments':
                if (isSecondaryLoading && detail.comments.length === 0) {
                    return <SecondaryTabSkeleton message={t('task.loadingComments', 'Loading comments...')} />;
                }
                return (
                    <CommentsPanel
                        detail={detail}
                        instanceId={detail.task.instanceId}
                        onCommentAdded={handleCommentAdded}
                        allowAddComment={showActionPanel}
                        context={{
                            sapOrigin: detail.task.sapOrigin,
                            documentId: detail.task.businessContext?.documentId,
                            businessObjectType: detail.task.businessContext?.type,
                        }}
                        workflowComments={workflowQuery.data?.comments}
                        isLoadingWorkflowComments={workflowQuery.isLoading || workflowQuery.isFetching}
                    />
                );
            case 'activity':
                if (
                    isSecondaryLoading &&
                    detail.processingLogs.length === 0 &&
                    detail.workflowLogs.length === 0
                ) {
                    return <SecondaryTabSkeleton message={t('task.loadingActivity', 'Loading activity...')} />;
                }
                return <ActivityPanel detail={detail} />;
            default:
                return null;
        }
    };

    // Compute mobile animation direction
    const currentTabIndex = tabs.findIndex((t) => t.value === activeTab);
    const animationDirection = currentTabIndex >= prevTabIndexRef.current ? 1 : -1;

    const handleMobileTabChange = (nextTab: string) => {
        prevTabIndexRef.current = tabs.findIndex((t) => t.value === activeTab);
        setTabState({ taskId: detail.task.instanceId, tab: nextTab });
    };

    return (
        <div className="flex h-full min-w-0 w-full max-w-full overflow-hidden flex-col bg-muted/30">
            {/* ── Header ── */}
            {isMobile ? (
                <div className="px-4 pt-4 pb-0 bg-muted/30 shrink-0">
                    <div className="rounded-t-xl bg-white border border-x-border/40 border-t-border/40 border-b-border/40 px-4 py-4 space-y-2 relative z-10">
                        <div className="flex items-start gap-1.5">
                            <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 mt-0.5 size-8 p-0 rounded-md hover:bg-muted transition-colors">
                                <ArrowLeft className="size-5 text-foreground" />
                            </Button>
                            <h2 className="text-lg font-bold text-foreground leading-snug line-clamp-2 flex-1">
                                {detail.task.title}
                            </h2>
                        </div>
                        <div className="pl-7">
                            <StatusHeaderBadges detail={detail} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="border-b border-border/60 bg-background px-5 py-4">
                    <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1 space-y-2">
                            <h2 className="text-xl font-semibold text-foreground truncate">
                                {detail.task.title}
                            </h2>
                            <StatusHeaderBadges detail={detail} />
                        </div>
                    </div>
                </div>
            )}

            {/* ── Desktop Tabs (unchanged) ── */}
            {!isMobile && (
                <Tabs
                    value={activeTab}
                    onValueChange={(nextTab) =>
                        setTabState({
                            taskId: detail.task.instanceId,
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

                    <ScrollArea className={cn(
                        "flex-1 min-h-0",
                        activeTab === 'attachments' && "hidden"
                    )}>
                        <div className="w-full px-5 py-4 space-y-4 pb-6">
                            <TabsContent value="overview" className="mt-0 w-full">
                                {businessModel && (
                                    <OverviewPanel model={businessModel} detail={detail} isMobile={false} />
                                )}
                            </TabsContent>
                            <TabsContent value="details" className="mt-0 w-full">
                                {isSecondaryLoading && businessModel && businessModel.tables.length === 0 ? (
                                    <SecondaryTabSkeleton message={t('task.loadingDetails', 'Loading details...')} />
                                ) : (
                                    businessModel && <DetailsPanel model={businessModel} detail={detail} isMobile={false} />
                                )}
                            </TabsContent>
                            <TabsContent value="workflow" className="mt-0 w-full">
                                <WorkflowApprovalPanel
                                    data={workflowQuery.data}
                                    isLoading={workflowQuery.isLoading || workflowQuery.isFetching}
                                    error={workflowError}
                                    taskDetail={detail.task}
                                />
                            </TabsContent>
                            <TabsContent value="comments" className="mt-0 w-full">
                                {isSecondaryLoading && detail.comments.length === 0 ? (
                                    <SecondaryTabSkeleton message={t('task.loadingComments', 'Loading comments...')} />
                                ) : (
                                    <CommentsPanel
                                        detail={detail}
                                        instanceId={detail.task.instanceId}
                                        onCommentAdded={handleCommentAdded}
                                        allowAddComment={showActionPanel}
                                        context={{
                                            sapOrigin: detail.task.sapOrigin,
                                            documentId: detail.task.businessContext?.documentId,
                                            businessObjectType: detail.task.businessContext?.type,
                                        }}
                                        workflowComments={workflowQuery.data?.comments}
                                        isLoadingWorkflowComments={workflowQuery.isLoading || workflowQuery.isFetching}
                                    />
                                )}
                            </TabsContent>
                            <TabsContent value="activity" className="mt-0 w-full">
                                {isSecondaryLoading &&
                                    detail.processingLogs.length === 0 &&
                                    detail.workflowLogs.length === 0 ? (
                                    <SecondaryTabSkeleton message={t('task.loadingActivity', 'Loading activity...')} />
                                ) : (
                                    <ActivityPanel detail={detail} />
                                )}
                            </TabsContent>
                        </div>
                    </ScrollArea>

                    <TabsContent value="attachments" className="mt-0 w-full flex-1 min-h-0 px-5 py-4 data-[state=active]:flex data-[state=active]:flex-col">
                        <AttachmentsPanel 
                            detail={detail} 
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
                    {/* Scrollable tab bar */}
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
                                                layoutId={`mobile-tab-indicator-${detail.task.instanceId}`}
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

                    {/* Animated tab content */}
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
                                <div className="h-full w-full overflow-y-auto overflow-x-hidden scroll-smooth">
                                    <div className="px-4 py-4 pb-24 space-y-4 w-full min-w-0">
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
                        detail={detail}
                        onDecision={onDecision}
                        isExecuting={isExecuting}
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
                            detail={detail}
                            onDecision={onDecision}
                            isExecuting={isExecuting}
                            isApprovedScope={isApprovedScope}
                            isMobile={isMobile}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function TaskActionPanel({
    detail,
    onDecision,
    isExecuting,
    isApprovedScope,
    isMobile,
}: {
    detail: TaskDetailType;
    onDecision: (decisionKey: string, comment: string) => void;
    isExecuting: boolean;
    isApprovedScope?: boolean;
    isMobile?: boolean;
}) {
    if (isApprovedScope) {
        const { t } = useTranslation();
        return (
            <div className="flex w-full items-center justify-end">
                <Button variant="outline" className="font-semibold text-foreground/80" size="sm" onClick={() => { }} disabled={isExecuting}>
                    <Undo2 className="size-4 mr-1.5" />
                    {t('decision.undo', 'Undo')}
                </Button>
            </div>
        );
    }

    const hasAction = detail.decisions.length > 0;
    if (!hasAction) return null;

    return (
        <div className="flex w-full items-center justify-end gap-2">
            {detail.decisions.length > 0 && (
                <DecisionPanel
                    decisions={detail.decisions}
                    onExecute={onDecision}
                    isExecuting={isExecuting}
                    isMobile={isMobile}
                />
            )}
        </div>
    );
}
function SecondaryTabSkeleton({ message }: { message: string }) {
    return (
        <div className="space-y-3 rounded-lg border border-border/70 bg-card p-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-20 w-full" />
            <p className="text-xs text-muted-foreground">{message}</p>
        </div>
    );
}

function TaskDetailSkeleton({ onBack, isMobile }: { onBack: () => void; isMobile: boolean }) {
    return (
        <div className="flex flex-col h-full">
            {isMobile ? (
                <div className="px-4 pt-4 pb-2 bg-muted/30">
                    <div className="rounded-xl bg-white border border-border/40 shadow-sm px-4 py-4 space-y-2">
                        <div className="flex items-start gap-2">
                            <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 mt-0.5 size-8 p-0 rounded-md hover:bg-muted">
                                <ArrowLeft className="size-5 text-foreground" />
                            </Button>
                            <Skeleton className="h-6 w-2/3" />
                        </div>
                        <div className="flex gap-2 pl-7 mt-1.5">
                            <Skeleton className="h-5 w-24 rounded-md" />
                            <Skeleton className="h-5 w-16 rounded-md" />
                            <Skeleton className="h-5 w-16 rounded-md" />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex items-start gap-3 p-4 border-b border-border/50">
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-6 w-2/3" />
                        <div className="flex gap-2">
                            <Skeleton className="h-5 w-20 rounded-md" />
                            <Skeleton className="h-5 w-20 rounded-md" />
                            <Skeleton className="h-5 w-20 rounded-md" />
                        </div>
                    </div>
                </div>
            )}
            {isMobile ? (
                <>
                    <div className="flex gap-1 px-4 py-2 border-b border-border/50">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-9 w-20 rounded-lg" />
                        ))}
                    </div>
                    <div className="p-4 space-y-4">
                        <Skeleton className="h-14 w-full" />
                        <Skeleton className="h-40 w-full" />
                    </div>
                </>
            ) : (
                <div className="p-4 space-y-4">
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-56 w-full" />
                </div>
            )}
        </div>
    );
}
