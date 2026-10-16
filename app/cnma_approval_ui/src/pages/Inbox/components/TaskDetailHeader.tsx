import { Button, Skeleton } from '@cnma/react-ui';
import { ArrowLeft } from 'lucide-react';
import { StatusHeaderBadges } from './panels';

export interface TaskDetailHeaderProps {
    viewData: any;
    isMobile?: boolean;
    isSecondaryLoading?: boolean;
    onBack: () => void;
}

export function TaskDetailHeader({
    viewData,
    isMobile = false,
    isSecondaryLoading = false,
    onBack,
}: TaskDetailHeaderProps) {
    if (isMobile) {
        return (
            <div className="bg-card border-b border-border/70 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 shadow-xs shrink-0">
                <div className="flex items-start gap-2.5">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onBack}
                        className="shrink-0 size-9 p-0 rounded-xl hover:bg-muted active:scale-90 transition-all text-foreground"
                        aria-label="Back to task list"
                    >
                        <ArrowLeft className="size-5" />
                    </Button>
                    <div className="flex-1 min-w-0 space-y-1 pt-0.5">
                        {isSecondaryLoading ? (
                            <Skeleton className="h-6 w-3/4 rounded-md animate-pulse bg-muted/60" />
                        ) : (
                            <h2 className="text-base font-bold text-foreground leading-tight line-clamp-2">
                                {viewData?.title || 'Task Details'}
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
    );
}
