import { Textarea } from '@cnma/react-ui';
import type { TaskDetail } from '@/services/inbox/inbox.types';
import type { BusinessSectionModel, DetailField } from '../renderers/TaskDetailSections.types';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export function OverviewPanel({
    model,
    isMobile = false,
}: {
    model: BusinessSectionModel;
    detail?: TaskDetail;
    isMobile?: boolean;
}) {
    const { t } = useTranslation();

    if (!model || !model.cards || model.cards.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
                {t('task.noOverviewAvailable', 'No overview data available.')}
            </div>
        );
    }

    const checkIsLongText = (f: DetailField) =>
        f.isLongText ||
        f.dataType === 'LONG_TEXT' ||
        f.dataType === 'TEXTAREA' ||
        ['description', 'header note', 'header text', 'purpose', 'paid by', 'bank details', 'notes', 'remarks'].includes(f.label.toLowerCase());

    return (
        <div className="space-y-6">
            {model.cards.map((section) => {
                const regularFields = section.fields.filter((f) => !checkIsLongText(f));
                const longTextFields = section.fields.filter((f) => checkIsLongText(f));

                return (
                    <div key={section.id} className="bg-white rounded-xl border border-border/50 p-6 shadow-xs space-y-5">
                        <h3 className="text-base font-bold text-foreground tracking-tight border-b border-border/30 pb-3">
                            {section.title}
                        </h3>

                        {/* Dynamic Regular Key-Value Pairs */}
                        {regularFields.length > 0 && (
                            <div className={cn(
                                isMobile
                                    ? "flex flex-col gap-3"
                                    : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5"
                            )}>
                                {regularFields.map((item) => {
                                    const val = item.value && item.value.trim() !== '' ? item.value : '-';
                                    return isMobile ? (
                                        <div key={item.key} className="flex items-start justify-between gap-3 py-2 border-b border-border/20 last:border-b-0">
                                            <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium shrink-0 w-5/12">
                                                {item.label}
                                            </span>
                                            <span className="font-semibold text-foreground text-sm text-right break-words">
                                                {val}
                                            </span>
                                        </div>
                                    ) : (
                                        <div key={item.key} className="flex flex-col gap-1">
                                            <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold opacity-80">
                                                {item.label}
                                            </span>
                                            <span className="font-semibold text-sm text-foreground break-words">
                                                {val}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Dynamic Long Text Input Area Fields */}
                        {longTextFields.length > 0 && (
                            <div className="space-y-4 pt-2 border-t border-border/20">
                                {longTextFields.map((item) => {
                                    const val = item.value && item.value.trim() !== '' ? item.value : '-';
                                    return (
                                        <div key={item.key} className="flex flex-col gap-1.5">
                                            <label className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold opacity-80">
                                                {item.label}
                                            </label>
                                            <Textarea
                                                readOnly
                                                value={val}
                                                rows={Math.max(2, Math.min(6, val.split('\n').length))}
                                                className="bg-muted/20 border-border/60 text-foreground text-sm resize-none focus-visible:ring-0 cursor-default font-normal leading-relaxed"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
