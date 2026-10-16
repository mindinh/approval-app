import { Skeleton } from '@cnma/react-ui';

export default function HomeSkeleton() {
    return (
        <div className="h-full overflow-y-auto bg-background animate-pulse">
            {/* =========================================================================
                MOBILE SKELETON (< 768px / md:hidden)
               ========================================================================= */}
            <div className="md:hidden">
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

            {/* =========================================================================
                TABLET & DESKTOP SKELETON (>= 768px / hidden md:block)
               ========================================================================= */}
            <div className="hidden md:block">
                {/* Header placeholder */}
                <div className="bg-muted/40 pb-14 lg:pb-16 pt-6 lg:pt-8">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="space-y-2">
                            <Skeleton className="h-7 w-60 bg-muted/60" />
                            <Skeleton className="h-3.5 w-40 bg-muted/60" />
                        </div>
                    </div>
                </div>

                {/* KPI Cards placeholder */}
                <div className="max-w-7xl mx-auto px-6 lg:px-8 -mt-7 lg:-mt-8">
                    <div className="grid grid-cols-3 gap-3.5 lg:gap-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="rounded-xl bg-card border border-border p-3.5 lg:p-4 flex items-center justify-between gap-3">
                                <div className="space-y-1.5 flex-1">
                                    <Skeleton className="h-3.5 w-20" />
                                    <Skeleton className="h-7 w-14" />
                                </div>
                                <Skeleton className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl shrink-0" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content area placeholder */}
                <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-8 pb-16">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Left: List placeholder */}
                        <div className="lg:col-span-8 space-y-4">
                            <div className="flex justify-between items-center pb-1 border-b border-border/60">
                                <Skeleton className="h-6 w-36 rounded-lg" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                            <div className="space-y-3.5">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="h-32 rounded-2xl border border-border p-5 space-y-3 bg-card">
                                        <div className="flex justify-between">
                                            <Skeleton className="h-4 w-1/3" />
                                            <Skeleton className="h-4 w-20 rounded-full" />
                                        </div>
                                        <Skeleton className="h-4 w-2/3" />
                                        <div className="flex gap-2 pt-1">
                                            <Skeleton className="h-5 w-20 rounded-full" />
                                            <Skeleton className="h-5 w-16 rounded-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right: Quick access placeholder */}
                        <div className="lg:col-span-4 space-y-3">
                            <div className="pb-1 border-b border-border/60">
                                <Skeleton className="h-6 w-28 rounded-lg" />
                            </div>
                            <div className="flex flex-col gap-3">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="h-20 rounded-2xl border border-border p-4 flex items-center gap-3.5 bg-card">
                                        <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
                                        <div className="space-y-1.5 flex-1">
                                            <Skeleton className="h-4 w-28" />
                                            <Skeleton className="h-3 w-40" />
                                        </div>
                                        <Skeleton className="size-4 rounded-full shrink-0" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
