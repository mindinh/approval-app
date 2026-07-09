import { Skeleton } from '@cnma/react-ui';

export default function HomeSkeleton() {
    return (
        <div className="min-h-screen bg-background animate-pulse">
            {/* Header placeholder */}
            <div className="px-5 pt-5 pb-16 bg-muted/40 h-32 flex flex-col justify-end gap-2">
                <Skeleton className="h-6 w-48 bg-muted/60" />
                <Skeleton className="h-4 w-32 bg-muted/60" />
            </div>
            
            {/* Stats placeholder */}
            <div className="px-4 -mt-8 space-y-3">
                <div className="h-20 rounded-2xl bg-card border border-border p-4 flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-6 w-12" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="h-18 rounded-2xl bg-card border border-border p-4 flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="space-y-1">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-5 w-8" />
                        </div>
                    </div>
                    <div className="h-18 rounded-2xl bg-card border border-border p-4 flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="space-y-1">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-5 w-8" />
                        </div>
                    </div>
                </div>
            </div>

            {/* List placeholder */}
            <div className="px-4 mt-6 space-y-3">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-4 w-12" />
                </div>
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-24 rounded-xl border border-border p-4 space-y-2 bg-card">
                            <Skeleton className="h-4 w-2/3" />
                            <Skeleton className="h-3 w-1/3" />
                            <div className="flex gap-2 pt-1">
                                <Skeleton className="h-4 w-16 rounded" />
                                <Skeleton className="h-4 w-12 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick access placeholder */}
            <div className="px-4 mt-6 pb-8 space-y-3">
                <Skeleton className="h-5 w-24" />
                <div className="grid grid-cols-3 gap-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-24 rounded-xl border border-border p-4 flex flex-col items-center justify-center gap-3 bg-card">
                            <Skeleton className="w-10 h-10 rounded-xl" />
                            <Skeleton className="h-3 w-14" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
