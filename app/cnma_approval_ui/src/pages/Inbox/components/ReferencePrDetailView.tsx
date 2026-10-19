import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Button, Badge, Card, Tabs, TabsList, TabsTrigger } from '@cnma/react-ui';
import { ArrowLeft, RotateCcw, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useReferencePrDetail } from '@/pages/Inbox/hooks/inboxQueries';
import { normalizeDetailForView } from '../utils/normalizeTaskDetail';
import { resolveBusinessSectionModel } from '@/renderers';
import { TaskDetailSkeleton } from './TaskDetailSkeletons';
import {
    OverviewPanel,
    DetailsPanel,
    WorkflowApprovalPanel,
    AttachmentsPanel,
    CommentsPanel,
    makeTabDefinitions,
} from './panels';

interface ReferencePrDetailViewProps {
    prNumber: string;
    parentDocumentId?: string;
    onBack: () => void;
    isMobile?: boolean;
}

export function ReferencePrDetailView({
    prNumber,
    parentDocumentId,
    onBack,
    isMobile = false,
}: ReferencePrDetailViewProps) {
    const { t } = useTranslation();

    // Support nested PR navigation history if user clicks a reference PR inside
    const [prHistory, setPrHistory] = useState<string[]>([prNumber]);
    const currentPr = prHistory[prHistory.length - 1] || prNumber;

    useEffect(() => {
        setPrHistory([prNumber]);
    }, [prNumber]);

    const formattedPrNumber = currentPr.replace(/^0+/, '');

    const {
        data: rawDetail,
        isLoading,
        isError,
        error,
        refetch,
    } = useReferencePrDetail(currentPr);

    const [activeTab, setActiveTab] = useState<string>('overview');
    const prevTabIndexRef = useRef(0);

    // Reset tab to overview when current PR changes
    useEffect(() => {
        setActiveTab('overview');
        prevTabIndexRef.current = 0;
    }, [currentPr]);

    const viewData = useMemo(() => normalizeDetailForView(rawDetail), [rawDetail]);
    const businessModel = useMemo(
        () => (rawDetail ? resolveBusinessSectionModel(rawDetail) : null),
        [rawDetail]
    );

    const detailsCount = useMemo(() => {
        if (!businessModel || !Array.isArray(businessModel.tables)) return 0;
        const filteredTables = businessModel.tables.filter(
            (table) => table && !['Header Facts', 'Custom Attributes', 'Related Objects'].includes(table.title)
        );
        return filteredTables.reduce((acc, table) => acc + (Array.isArray(table?.rows) ? table.rows.length : 0), 0);
    }, [businessModel]);

    const tabs = useMemo(
        () =>
            viewData
                ? makeTabDefinitions({
                      detail: viewData,
                      workflowCount: viewData.workflowData?.steps?.length || 0,
                      detailsCount,
                      attachmentCount: viewData.attachments?.length || 0,
                      t,
                  }) || []
                : [],
        [viewData, detailsCount, t]
    );

    const currentTabIndex = tabs.findIndex((t) => t.value === activeTab);
    const animationDirection = currentTabIndex >= prevTabIndexRef.current ? 1 : -1;

    const handleMobileTabChange = (nextTab: string) => {
        prevTabIndexRef.current = tabs.findIndex((t) => t.value === activeTab);
        setActiveTab(nextTab);
    };

    const handleBack = useCallback(() => {
        if (prHistory.length > 1) {
            setPrHistory((prev) => prev.slice(0, -1));
        } else {
            onBack();
        }
    }, [prHistory.length, onBack]);

    const handleSelectNestedPr = useCallback((nextPr: string) => {
        if (nextPr && nextPr.trim() !== '') {
            setPrHistory((prev) => [...prev, nextPr.trim()]);
        }
    }, []);

    // Render individual panel content
    const renderTabContent = (tabValue: string, mobile: boolean) => {
        if (!viewData) return null;
        switch (tabValue) {
            case 'overview':
                return businessModel ? (
                    <OverviewPanel
                        model={businessModel}
                        detail={viewData}
                        isMobile={mobile}
                        onSelectReferencePr={handleSelectNestedPr}
                    />
                ) : null;
            case 'details':
                return businessModel ? (
                    <DetailsPanel
                        model={businessModel}
                        detail={viewData}
                        isMobile={mobile}
                        onSelectReferencePr={handleSelectNestedPr}
                    />
                ) : null;
            case 'workflow':
                return (
                    <WorkflowApprovalPanel
                        data={viewData?.workflowData}
                        isLoading={false}
                        taskDetail={viewData?.task}
                    />
                );
            case 'attachments':
                return <AttachmentsPanel detail={viewData} isMobile={mobile} />;
            case 'comments':
                return (
                    <CommentsPanel
                        detail={viewData}
                        instanceId={viewData?.instanceId}
                        allowAddComment={false}
                        context={{
                            documentId: viewData?.documentId,
                            businessObjectType: viewData?.docCategory,
                        }}
                    />
                );
            default:
                return null;
        }
    };

    if (isLoading) {
        return <TaskDetailSkeleton onBack={handleBack} isMobile={isMobile} />;
    }

    if (isError || !rawDetail) {
        return (
            <div className="flex h-full min-w-0 w-full flex-col bg-background relative overflow-hidden">
                {isMobile && (
                    <div className="bg-card border-b border-border/70 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 shadow-xs shrink-0">
                        <div className="flex items-center gap-2.5">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleBack}
                                className="shrink-0 size-9 p-0 rounded-xl hover:bg-muted active:scale-90 transition-all text-foreground"
                                aria-label="Back"
                            >
                                <ArrowLeft className="size-5" />
                            </Button>
                            <h2 className="text-base font-bold text-foreground truncate">
                                {t('error.failedToLoadPr', 'Failed to load Purchase Requisition')}
                            </h2>
                        </div>
                    </div>
                )}
                <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <div className="size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                        <AlertCircle className="size-6" />
                    </div>
                    <div className="space-y-1 max-w-md">
                        <h3 className="text-base font-semibold text-foreground">
                            {t('error.failedToLoadPr', 'Failed to load Purchase Requisition')}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            {error?.message ||
                                t(
                                    'error.prNotFound',
                                    'Reference PR {{id}} could not be loaded or was not found.',
                                    { id: formattedPrNumber }
                                )}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={() => void refetch()} className="gap-1.5 text-xs">
                            <RotateCcw className="size-3.5" />
                            <span>{t('common.retry', 'Retry')}</span>
                        </Button>
                        <Button variant="default" size="sm" onClick={handleBack} className="text-xs">
                            <span>{t('common.goBack', 'Go Back')}</span>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full min-w-0 w-full max-w-full overflow-hidden flex-col bg-muted/30 relative">
            {/* ── Header ── */}
            {isMobile && (
                <div className="bg-card border-b border-border/70 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 shadow-xs shrink-0">
                    <div className="flex items-start gap-2.5">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleBack}
                            className="shrink-0 size-9 p-0 rounded-xl hover:bg-muted active:scale-90 transition-all text-foreground"
                            aria-label="Back"
                        >
                            <ArrowLeft className="size-5" />
                        </Button>
                        <div className="flex-1 min-w-0 space-y-1 pt-0.5">
                            <h2 className="text-base font-bold text-foreground leading-tight line-clamp-2">
                                PR #{formattedPrNumber}
                            </h2>
                            <div className="pt-0.5 flex items-center gap-2 overflow-hidden">
                                <Badge
                                    variant="outline"
                                    className="gap-1 text-xs font-semibold bg-primary/5 text-primary border-primary/20 shrink-0"
                                >
                                    <span>Reference PR</span>
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Desktop Tabs ── */}
            {!isMobile && (
                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="flex-1 min-h-0 w-full flex flex-col gap-0"
                >
                    <Card className="task-detail-header rounded-none border-x-0 border-t-0 gap-0 py-0 shadow-none">
                        <div className="bg-background px-4 py-4 shrink-0">
                            <div className="flex items-start gap-3">
                                <div className="min-w-0 flex-1 space-y-2">
                                    <div className="flex items-center gap-3">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleBack}
                                            className="gap-1.5 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 rounded-lg px-2.5 py-1.5 -ml-1 shrink-0"
                                        >
                                            <ArrowLeft className="size-4" />
                                            <span>
                                                {prHistory.length > 1
                                                    ? t('common.back', 'Back')
                                                    : parentDocumentId
                                                    ? t('task.backToPo', 'Back to PO {{id}}', { id: parentDocumentId })
                                                    : t('task.backToPoTask', 'Back to PO Task')}
                                            </span>
                                        </Button>
                                        <div className="h-4 w-px bg-border/60" />
                                        <h2 className="text-xl font-semibold text-foreground truncate">
                                            PR #{formattedPrNumber}
                                        </h2>
                                    </div>
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <Badge
                                            variant="outline"
                                            className="gap-1 text-xs font-semibold bg-primary/5 text-primary border-primary/20 shrink-0"
                                        >
                                            <span>Reference PR</span>
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
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
                    </Card>
                    <div className={cn("flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-5 space-y-4 pb-6 bg-background", activeTab === 'comments' && "task-chat-host overflow-hidden")}>
                        {renderTabContent(activeTab, false)}
                    </div>
                </Tabs>
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
                                        onClick={() => handleMobileTabChange(tab.value)}
                                        className={cn(
                                            'relative shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 mt-1 mb-1 mx-1 text-sm font-medium transition-all rounded-full min-h-11 h-auto',
                                            'focus-visible:outline-none',
                                            isActive
                                                ? 'bg-primary text-white shadow-sm'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted/70'
                                        )}
                                    >
                                        <tab.icon className={cn('size-3.5', isActive ? 'text-white' : 'text-muted-foreground/60')} />
                                        <span>{tab.label}</span>
                                        {tab.count !== undefined && tab.count > 0 && (
                                            <span
                                                className={cn(
                                                    'ml-0.5 rounded-full px-1.5 py-0 text-xs font-semibold',
                                                    isActive
                                                        ? 'bg-white/20 text-white'
                                                        : 'bg-muted text-muted-foreground'
                                                )}
                                            >
                                                {tab.count}
                                            </span>
                                        )}
                                        {isActive && (
                                            <motion.div
                                                layoutId={`mobile-tab-indicator-ref-pr-${currentPr}`}
                                                className="absolute inset-0 rounded-full bg-primary -z-10"
                                                transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                                            />
                                        )}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>

                    <div className={cn("flex-1 min-h-0 w-full min-w-0 overflow-y-auto overflow-x-hidden relative bg-background", activeTab === 'comments' && "flex flex-col overflow-hidden")}>
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
                                    {renderTabContent(activeTab, true)}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </>
            )}
        </div>
    );
}
