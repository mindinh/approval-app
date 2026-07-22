import { Card, CardContent, CardHeader, CardTitle } from '@cnma/react-ui';
import type { TaskDetail } from '@/services/inbox/inbox.types';
import type { BusinessSectionModel } from '../renderers/TaskDetailSections.types';
import { formatDate, formatAmountWithCurrency } from '@/pages/Inbox/utils/formatters';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { DollarSign, ShieldAlert, User, CalendarDays } from 'lucide-react';

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

    const isHighPriority = detail.task.priority === 'HIGH' || detail.task.priority === 'VERY_HIGH';

    return (
        <div className="space-y-6">
            {/* KPI Summary Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                <Card className="bg-white border-border/60 shadow-sm gap-0 py-3 px-4 flex flex-row items-center gap-3">
                    <div className="size-9 bg-primary/10 text-primary flex items-center justify-center rounded-xl shrink-0">
                        <DollarSign className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{t('task.totalValue', 'Total Value')}</div>
                        <div className="text-sm font-bold text-foreground truncate mt-0.5">
                            {detail.task.total !== undefined ? formatAmountWithCurrency(detail.task.total, detail.task.curr_vnd || detail.task.doc_curr || 'VND') : '-'}
                        </div>
                    </div>
                </Card>
                
                <Card className="bg-white border-border/60 shadow-sm gap-0 py-3 px-4 flex flex-row items-center gap-3">
                    <div className={cn(
                        "size-9 flex items-center justify-center rounded-xl shrink-0",
                        isHighPriority
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-info/10 text-info'
                    )}>
                        <ShieldAlert className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{t('task.priority', 'Priority')}</div>
                        <div className="text-sm font-bold text-foreground truncate mt-0.5">{detail.task.priority || 'MEDIUM'}</div>
                    </div>
                </Card>

                <Card className="bg-white border-border/60 shadow-sm gap-0 py-3 px-4 flex flex-row items-center gap-3">
                    <div className="size-9 bg-success/10 text-success flex items-center justify-center rounded-xl shrink-0">
                        <User className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{t('task.requestor', 'Requestor')}</div>
                        <div className="text-sm font-bold text-foreground truncate mt-0.5">{detail.task.requestorName || '-'}</div>
                    </div>
                </Card>

                <Card className="bg-white border-border/60 shadow-sm gap-0 py-3 px-4 flex flex-row items-center gap-3">
                    <div className="size-9 bg-warning/10 text-warning flex items-center justify-center rounded-xl shrink-0">
                        <CalendarDays className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{t('task.createdOn', 'Created On')}</div>
                        <div className="text-sm font-bold text-foreground truncate mt-0.5">
                            {detail.task.createdOn ? new Date(detail.task.createdOn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                        </div>
                    </div>
                </Card>
            </div>

            {/* CARD Sections */}
            <div className="space-y-4 lg:space-y-5">
                {model.cards.map((card) => {
                    const regularFields = card.fields.filter(f => f.label !== 'Description' && f.label !== 'Header Note');
                    const descriptionFields = card.fields.filter(f => f.label === 'Description' || f.label === 'Header Note');

                    let cardFields = [...regularFields];
                    if (card.id === 'basic') {
                        cardFields = [
                            { key: 'sys_created_on', label: t('task.createdOn', 'Created On'), value: formatDate(detail.task.createdOn) },
                            ...cardFields
                        ];
                    }

                    return (
                        <Card key={card.id} className="gap-0 bg-card border-border/70 shadow-sm">
                            <CardHeader className="pb-3 border-b border-border/40">
                                <CardTitle className="text-base font-bold text-foreground">{card.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {isMobile ? (
                                    <div className="flex flex-col gap-1">
                                        {cardFields.map((item) => (
                                            <div key={item.key} className="flex items-start justify-between gap-3 py-2 border-b border-border/30 last:border-b-0">
                                                <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium pt-px w-5/12 shrink-0">{item.label}</span>
                                                <span className="font-semibold text-foreground text-sm text-right break-words">{item.value}</span>
                                            </div>
                                        ))}
                                        {descriptionFields.map((item) => (
                                            <div key={item.key} className="flex flex-col gap-1.5 py-2">
                                                <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">{item.label}</span>
                                                <div className="font-medium text-foreground border border-border bg-muted/30 rounded-lg p-3.5 mt-1 text-sm whitespace-pre-wrap leading-relaxed break-words">
                                                    {item.value || <span className="text-muted-foreground/60 italic">{t('common.noValue', 'No value')}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid gap-x-6 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
                                        {cardFields.map((item) => (
                                            <div key={item.key} className="flex flex-col gap-1">
                                                <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold opacity-80">{item.label}</span>
                                                <span className="font-semibold text-sm text-foreground">{item.value}</span>
                                            </div>
                                        ))}
                                        {descriptionFields.map((item) => (
                                            <div key={item.key} className="flex flex-col gap-1.5 col-span-full pt-2">
                                                <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold opacity-80">{item.label}</span>
                                                <div className="font-medium text-foreground border border-border bg-muted/30 rounded-lg p-3.5 mt-1 text-sm whitespace-pre-wrap leading-relaxed">
                                                    {item.value || <span className="text-muted-foreground/60 italic">{t('common.noValue', 'No value')}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

