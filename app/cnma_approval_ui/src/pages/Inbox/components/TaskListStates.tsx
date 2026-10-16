import { useTranslation } from 'react-i18next';
import { Skeleton, Button } from '@cnma/react-ui';
import { AlertTriangle, RefreshCw, Inbox, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseError } from '@/utils/parseError';

export function ListErrorState({
    error,
    onRefresh,
    isRefreshing,
}: {
    error: unknown;
    onRefresh: () => void;
    isRefreshing: boolean;
}) {
    const { t } = useTranslation();
    const parsed = parseError(error);

    return (
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center space-y-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="size-6" />
            </div>
            <h3 className="text-sm font-bold text-foreground">{parsed.title}</h3>
            <p className="max-w-60 text-xs text-muted-foreground leading-relaxed">
                {parsed.message}
            </p>
            <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="gap-1.5 text-xs mt-1"
            >
                <RefreshCw className={cn('size-3.5', isRefreshing && 'animate-spin')} />
                <span>{t('common.retry', 'Retry')}</span>
            </Button>
        </div>
    );
}

export function EmptyState({
    hasSearch,
    hasFilters,
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
}: {
    hasSearch: boolean;
    hasFilters: boolean;
    hasNextPage?: boolean;
    isFetchingNextPage?: boolean;
    onLoadMore?: () => void;
}) {
    const { t } = useTranslation();
    const message =
        hasSearch || hasFilters
            ? t('inbox.noMatchingTasks', 'No matching tasks')
            : t('inbox.inboxEmpty', 'Inbox is empty');
    const sub =
        hasSearch || hasFilters
            ? isFetchingNextPage
                ? t('inbox.searchingServerTasks', 'Searching remaining tasks on server...')
                : t('inbox.tryAdjusting', 'Try adjusting your search or filter criteria.')
            : t('inbox.noPendingTasks', 'No pending tasks assigned to you.');

    return (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center space-y-3">
            <div className="mb-1 rounded-full bg-muted p-4">
                {isFetchingNextPage ? (
                    <Loader2 className="size-8 animate-spin text-primary" />
                ) : (
                    <Inbox className="size-8 text-muted-foreground" />
                )}
            </div>
            <h3 className="text-sm font-medium text-foreground">{message}</h3>
            <p className="max-w-56 text-xs text-muted-foreground">{sub}</p>

            {hasNextPage && (hasSearch || hasFilters) && onLoadMore && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onLoadMore}
                    disabled={isFetchingNextPage}
                    className="mt-2 text-xs gap-1.5 rounded-lg"
                >
                    {isFetchingNextPage ? (
                        <>
                            <Loader2 className="size-3.5 animate-spin text-primary" />
                            <span>{t('inbox.searchingServer', 'Searching server...')}</span>
                        </>
                    ) : (
                        <span>{t('inbox.loadMoreToSearch', 'Load more tasks to search')}</span>
                    )}
                </Button>
            )}
        </div>
    );
}

export function TaskListSkeleton() {
    return (
        <div className="flex h-full flex-col">
            <div className="space-y-3 border-b border-border/50 p-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>
            <div className="flex-1 p-0">
                {Array.from({ length: 6 }).map((_, index) => (
                    <div
                        key={index}
                        className="mx-3 my-2 space-y-2 rounded-xl border border-border/50 bg-card/95 p-4"
                    >
                        <Skeleton className="h-4 w-3/4" />
                        <div className="flex gap-1.5">
                            <Skeleton className="h-4 w-14 rounded-md" />
                            <Skeleton className="h-4 w-12 rounded-md" />
                        </div>
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                ))}
            </div>
        </div>
    );
}
