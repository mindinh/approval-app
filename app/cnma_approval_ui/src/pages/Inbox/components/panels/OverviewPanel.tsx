import { Textarea, Skeleton } from '@cnma/react-ui';
import type { TaskDetail } from '@/services/inbox/inbox.types';
import type { BusinessSectionModel, DetailField } from '@/renderers/TaskDetailSections.types';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function OverviewPanel({
    model,
    isMobile = false,
    isSecondaryLoading = false,
}: {
    model: BusinessSectionModel;
    detail?: TaskDetail;
    isMobile?: boolean;
    isSecondaryLoading?: boolean;
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
                            {section.title === 'Document Summary' ? 'Overview' : section.title}
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
                                    const isPendingValue = isSecondaryLoading && (val === '-' || val === '');

                                    return isMobile ? (
                                        <div key={item.key} className="flex items-start justify-between gap-3 py-2 border-b border-border/20 last:border-b-0 min-h-[2.25rem]">
                                            <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium shrink-0 w-5/12">
                                                {item.label}
                                            </span>
                                            <div className="flex-1 flex justify-end">
                                                {isPendingValue ? (
                                                    <Skeleton className="h-4 w-24 animate-pulse rounded bg-muted/60" />
                                                ) : (
                                                    <AnimatePresence mode="wait">
                                                        <motion.span
                                                            key={val}
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            exit={{ opacity: 0 }}
                                                            transition={{ duration: 0.18 }}
                                                            className="font-semibold text-foreground text-sm text-right break-words whitespace-pre-line"
                                                        >
                                                            {val}
                                                        </motion.span>
                                                    </AnimatePresence>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div key={item.key} className="flex flex-col gap-1 min-h-[3rem]">
                                            <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold opacity-80">
                                                {item.label}
                                            </span>
                                            <div className="flex items-start min-h-[1.5rem]">
                                                {isPendingValue ? (
                                                    <Skeleton className="h-4 w-28 animate-pulse rounded bg-muted/60" />
                                                ) : (
                                                    <AnimatePresence mode="wait">
                                                        <motion.span
                                                            key={val}
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            exit={{ opacity: 0 }}
                                                            transition={{ duration: 0.18 }}
                                                            className="font-semibold text-sm text-foreground break-words whitespace-pre-line"
                                                        >
                                                            {val}
                                                        </motion.span>
                                                    </AnimatePresence>
                                                )}
                                            </div>
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
                                    const isPendingLongText = isSecondaryLoading && (val === '-' || val === '');

                                    return (
                                        <div key={item.key} className="flex flex-col gap-1.5 min-h-[4.5rem]">
                                            <label className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold opacity-80">
                                                {item.label}
                                            </label>
                                            {isPendingLongText ? (
                                                <Skeleton className="h-16 w-full animate-pulse rounded-lg bg-muted/40" />
                                            ) : (
                                                <Textarea
                                                    readOnly
                                                    value={val}
                                                    rows={Math.max(2, Math.min(6, val.split('\n').length))}
                                                    className="bg-muted/20 border-border/60 text-foreground text-sm resize-none focus-visible:ring-0 cursor-default font-normal leading-relaxed transition-opacity duration-200"
                                                />
                                            )}
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
