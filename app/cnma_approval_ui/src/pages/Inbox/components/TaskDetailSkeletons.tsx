import { Button, Skeleton } from '@cnma/react-ui';
import { ArrowLeft } from 'lucide-react';

export function SecondaryTabSkeleton({ message }: { message: string }) {
    return (
        <div className="space-y-3 rounded-lg border border-border/70 bg-card p-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-20 w-full" />
            <p className="text-xs text-muted-foreground">{message}</p>
        </div>
    );
}

export function TaskDetailSkeleton({ onBack, isMobile }: { onBack: () => void; isMobile: boolean }) {
    return (
        <div className="flex flex-col h-full">
            {isMobile ? (
                <div className="px-4 pt-4 pb-2 bg-muted/30">
                    <div className="rounded-xl bg-white border border-border/40 shadow-sm px-4 py-4 space-y-2">
                        <div className="flex items-start gap-2">
                            <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 mt-0.5 size-8 p-0 rounded-md hover:bg-muted">
                                <ArrowLeft className="size-5 text-foreground" />
                            </Button>
                            <Skeleton className="h-6 w-2/3" />
                        </div>
                        <div className="flex gap-2 pl-7 mt-1.5">
                            <Skeleton className="h-5 w-24 rounded-md" />
                            <Skeleton className="h-5 w-16 rounded-md" />
                            <Skeleton className="h-5 w-16 rounded-md" />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex items-start gap-3 p-4 border-b border-border/50">
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-6 w-2/3" />
                        <div className="flex gap-2">
                            <Skeleton className="h-5 w-20 rounded-md" />
                            <Skeleton className="h-5 w-20 rounded-md" />
                            <Skeleton className="h-5 w-20 rounded-md" />
                        </div>
                    </div>
                </div>
            )}
            {isMobile ? (
                <>
                    <div className="flex gap-1 px-4 py-2 border-b border-border/50">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-9 w-20 rounded-lg" />
                        ))}
                    </div>
                    <div className="p-4 space-y-4">
                        <Skeleton className="h-14 w-full" />
                        <Skeleton className="h-40 w-full" />
                    </div>
                </>
            ) : (
                <div className="p-4 space-y-4">
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-56 w-full" />
                </div>
            )}
        </div>
    );
}
