import { Skeleton } from '@cnma/react-ui';

export default function InboxSkeleton() {
    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            {/* Left sidebar skeleton (visible on desktop) */}
            <aside className="hidden md:flex relative w-80 shrink-0 flex-col overflow-hidden border-r border-border/60 bg-background">
                <div className="space-y-3 border-b border-border/50 p-4">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
                <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="space-y-2 rounded-xl border border-border/50 bg-card p-4">
                            <Skeleton className="h-4 w-3/4" />
                            <div className="flex gap-1.5">
                                <Skeleton className="h-4 w-14 rounded-md" />
                                <Skeleton className="h-4 w-12 rounded-md" />
                            </div>
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    ))}
                </div>
            </aside>

            {/* Right details skeleton (desktop) or full list (mobile) */}
            <main className="flex-1 flex flex-col overflow-hidden bg-muted/30">
                {/* Mobile view: List skeleton only */}
                <div className="md:hidden flex h-full flex-col">
                    <div className="space-y-3 border-b border-border/50 p-4 bg-background">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                    <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-background">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="space-y-2 rounded-xl border border-border/50 bg-card p-4">
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

                {/* Desktop view: Task Detail skeleton */}
                <div className="hidden md:flex flex-1 flex-col p-6 space-y-6 overflow-y-auto">
                    <div className="flex justify-between items-start border-b border-border/50 pb-5">
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-7 w-2/3" />
                            <div className="flex gap-2">
                                <Skeleton className="h-5 w-20 rounded" />
                                <Skeleton className="h-5 w-24 rounded" />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Skeleton className="h-9 w-20 rounded-lg" />
                            <Skeleton className="h-9 w-20 rounded-lg" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <div className="border border-border/50 rounded-xl p-5 space-y-3 bg-card">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                        </div>
                        <div className="border border-border/50 rounded-xl p-5 space-y-3 bg-card">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-4/5" />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
