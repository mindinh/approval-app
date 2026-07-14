import { Card, CardContent, CardHeader, CardTitle } from '@cnma/react-ui';
import type { TaskDetail } from '@/services/inbox/inbox.types';
import type { BusinessSectionModel } from '../renderers/TaskDetailSections.types';
import { formatDate } from '@/pages/Inbox/utils/formatters';
import { useTranslation } from 'react-i18next';

export function OverviewPanel({
    model,
    detail,
    isMobile = false,
}: {
    model: BusinessSectionModel;
    detail: TaskDetail;
    isMobile?: boolean;
}) {
    const { t } = useTranslation();
    const allFields = [
        { key: 'sys_created_on', label: t('task.createdOn', 'Created On'), value: formatDate(detail.task.createdOn) },
        ...model.cards.flatMap((card) => card.fields).filter(f => f.label !== 'Created On' && f.label !== 'Creation Date')
    ];

    const regularFields = allFields.filter(f => f.label !== 'Description' && f.label !== 'Header Note');
    const descriptionFields = allFields.filter(f => f.label === 'Description' || f.label === 'Header Note');

    return (
        <div className="space-y-6">
            {isMobile ? (
                <Card className="gap-0 bg-card border-border/70 shadow-sm">
                    <CardHeader className="pb-2 border-b border-border/40">
                        <CardTitle className="text-lg">{model.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="flex flex-col gap-1 px-4 py-3">
                            {regularFields.map((item) => (
                                <div key={item.key} className="flex items-start justify-between gap-3 py-3">
                                    <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium pt-px w-5/12 shrink-0">{item.label}</span>
                                    <span className="font-medium text-foreground text-sm text-right break-words">{item.value}</span>
                                </div>
                            ))}
                            {descriptionFields.map((item) => (
                                <div key={item.key} className="flex flex-col gap-1.5 py-3">
                                    <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">{item.label}</span>
                                    <div className="font-medium text-foreground border border-border bg-muted/30 rounded-lg p-3.5 mt-1 text-sm whitespace-pre-wrap leading-relaxed break-words">
                                        {item.value || <span className="text-muted-foreground/60 italic">{t('common.noValue', 'No value')}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className="gap-0 bg-card border-border/70 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base">{model.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-x-6 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
                        {regularFields.map((item) => (
                            <div key={item.key} className="flex flex-col gap-1">
                                <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">{item.label}</span>
                                <span className="font-medium text-sm text-foreground">{item.value}</span>
                            </div>
                        ))}
                        {descriptionFields.map((item) => (
                            <div key={item.key} className="flex flex-col gap-1.5 col-span-full pt-2">
                                <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">{item.label}</span>
                                <div className="font-medium text-foreground border border-border bg-muted/30 rounded-lg p-3.5 mt-1 text-sm whitespace-pre-wrap leading-relaxed">
                                    {item.value || <span className="text-muted-foreground/60 italic">{t('common.noValue', 'No value')}</span>}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
