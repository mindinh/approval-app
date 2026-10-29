import { useTranslation } from 'react-i18next';
import {
    ActivityPanel,
    AttachmentsPanel,
    CommentsPanel,
    DetailsPanel,
    OverviewPanel,
    WorkflowApprovalPanel,
} from './panels';
import { SecondaryTabSkeleton } from './TaskDetailSkeletons';

export interface TaskDetailTabContentProps {
    tabValue: string;
    mobile: boolean;
    businessModel: any;
    viewData: any;
    isSecondaryLoading: boolean;
    isPrAttachmentsLoading?: boolean;
    workflowData: any;
    workflowError?: unknown;
    isApprovedScope: boolean;
    onSelectReferencePr: (prNumber: string) => void;
}

export function TaskDetailTabContent({
    tabValue,
    mobile,
    businessModel,
    viewData,
    isSecondaryLoading,
    isPrAttachmentsLoading = false,
    workflowData,
    workflowError,
    isApprovedScope,
    onSelectReferencePr,
}: TaskDetailTabContentProps) {
    const { t } = useTranslation();

    switch (tabValue) {
        case 'overview':
            return businessModel ? (
                <OverviewPanel
                    model={businessModel}
                    detail={viewData}
                    isMobile={mobile}
                    isSecondaryLoading={isSecondaryLoading}
                    onSelectReferencePr={onSelectReferencePr}
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
                    onSelectReferencePr={onSelectReferencePr}
                />
            ) : null;

        case 'workflow':
            return (
                <WorkflowApprovalPanel
                    data={workflowData}
                    isLoading={false}
                    error={workflowError instanceof Error ? workflowError.message : typeof workflowError === 'string' ? workflowError : undefined}
                    taskDetail={viewData?.task}
                />
            );

        case 'attachments':
            if (isPrAttachmentsLoading || (isSecondaryLoading && (viewData?.attachments?.length || 0) === 0)) {
                return <SecondaryTabSkeleton message={t('task.loadingAttachments', 'Loading attachments...')} />;
            }
            return <AttachmentsPanel detail={viewData} isMobile={mobile} />;

        case 'comments':
            if (isSecondaryLoading && (viewData?.comments?.length || 0) === 0) {
                return <SecondaryTabSkeleton message={t('task.loadingComments', 'Loading comments...')} />;
            }
            return (
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
}
