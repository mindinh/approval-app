import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@cnma/react-ui';
import type { TaskDetail } from '@/services/inbox/inbox.types';
import { useTranslation } from 'react-i18next';
import { formatDate, safe } from '@/pages/Inbox/utils/formatters';
import { ActivityTimeline } from '@/pages/Inbox/utils/shared';

export function ActivityPanel({ detail }: { detail: TaskDetail }) {
    const { t } = useTranslation();
    const processingRows = (detail.processingLogs || []).map((log, idx) => ({
        id: `proc-${log.orderId ?? idx}`,
        timestamp: formatDate(log.timestamp),
        actor: safe(log.performedByName || log.performedBy),
        action: safe(log.actionName || log.taskStatus),
        details: safe(log.comments),
    }));

    const workflowRows = (detail.workflowLogs || []).map((log, idx) => ({
        id: `wf-${log.id || idx}`,
        timestamp: formatDate(log.timestamp),
        actor: safe(log.userName || log.user),
        action: safe(log.action),
        details: safe(log.details),
    }));

    return (
        <div className="space-y-6">
            <Card className="gap-0 bg-card border-border/70 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base">{t('task.processingLog', 'Processing Log')}</CardTitle>
                    <CardDescription>{t('task.actionsTaken', 'Actions taken on this task')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <ActivityTimeline
                        rows={processingRows}
                        emptyMessage={t('task.noProcessingLog', 'No processing log entries found.')}
                        accent="processing"
                    />
                </CardContent>
            </Card>

            <Card className="gap-0 bg-card border-border/70 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base">{t('task.workflowLog', 'Workflow Log')}</CardTitle>
                    <CardDescription>{t('task.workflowExecution', 'Workflow execution history')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <ActivityTimeline
                        rows={workflowRows}
                        emptyMessage={t('task.noWorkflowLog', 'No workflow log entries found.')}
                        accent="workflow"
                    />
                </CardContent>
            </Card>
        </div>
    );
}
