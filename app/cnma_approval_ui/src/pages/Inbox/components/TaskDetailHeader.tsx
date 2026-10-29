import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import { Button, Skeleton } from '@cnma/react-ui';
import { ArrowLeft } from 'lucide-react';
import { StatusHeaderBadges } from './panels';

export interface TaskDetailHeaderProps {
    viewData: any;
    isMobile?: boolean;
    isSecondaryLoading?: boolean;
    onBack: () => void;
    children?: ReactNode;
}

export function TaskDetailHeader({
    viewData,
    isMobile = false,
    isSecondaryLoading = false,
    onBack,
    children,
}: TaskDetailHeaderProps) {
    const { t } = useTranslation();
    if (isMobile) {
        return (
            <div className="mobile-page-header bg-card border-b border-border px-3 pb-2 shrink-0">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onBack}
                        className="shrink-0 size-11 p-0 rounded-full text-foreground"
                        aria-label={t('task.backToList')}
                    >
                        <ArrowLeft className="size-5" />
                    </Button>
                    <div className="flex-1 min-w-0 space-y-1 pt-0.5">
                        {isSecondaryLoading ? (
                            <Skeleton className="h-6 w-3/4 rounded-md animate-pulse bg-muted/60" />
                        ) : (
                            <h2 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                                {viewData?.title || t('task.detailTitle')}
                            </h2>
                        )}
                        <div className="pt-0.5">
                            <StatusHeaderBadges detail={viewData} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="task-detail-header">
            <div className="flex items-start gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1 space-y-1">
                    {isSecondaryLoading ? (
                        <Skeleton className="h-7 w-80 my-0.5 rounded-md animate-pulse bg-muted/60" />
                    ) : (
                        <h2 className="text-base font-semibold text-foreground truncate">
                            {viewData?.title || 'Task Details'}
                        </h2>
                    )}
                    <StatusHeaderBadges detail={viewData} />
                </div>
            </div>
            {children}
        </div>
    );
}
