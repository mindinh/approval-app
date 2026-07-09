import { Skeleton } from '@cnma/react-ui';

export default function DashboardSkeleton() {
    return (
        <div className="flex flex-col min-h-screen bg-background animate-pulse">
            {/* Header */}
            <div className="px-4 pt-5 pb-3 md:px-8 md:pt-8 md:pb-5">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-7 w-48 md:w-64" />
                        <Skeleton className="h-4 w-64 md:w-80" />
                    </div>
                    <Skeleton className="h-8 w-24 rounded-full" />
                </div>
            </div>

            {/* Content */}
            <div className="px-4 pb-8 md:px-8 space-y-5">
                {/* Grid of charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
                    {/* Donut chart card */}
                    <div className="p-5 md:p-6 rounded-2xl border border-border bg-card shadow-sm flex flex-col items-center">
                        <Skeleton className="h-4 w-36 mb-6" />
                        {/* Circle skeleton */}
                        <div className="relative w-44 h-44 rounded-full border-[20px] border-muted flex items-center justify-center">
                            <div className="space-y-1 flex flex-col items-center">
                                <Skeleton className="h-6 w-10" />
                                <Skeleton className="h-3 w-12" />
                            </div>
                        </div>
                        {/* Legend items */}
                        <div className="mt-6 w-full max-w-64 space-y-3">
                            <Skeleton className="h-10 w-full rounded-lg" />
                            <Skeleton className="h-10 w-full rounded-lg" />
                            <Skeleton className="h-10 w-full rounded-lg" />
                        </div>
                    </div>

                    {/* Stacked bar chart card */}
                    <div className="p-5 md:p-6 rounded-2xl border border-border bg-card shadow-sm flex flex-col justify-between h-full">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3.5 w-60" />
                        </div>
                        {/* Bar chart rows */}
                        <div className="my-8 space-y-6">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <Skeleton className="h-4 w-24 shrink-0" />
                                    <Skeleton className="h-5 flex-1 rounded-sm" />
                                </div>
                            ))}
                        </div>
                        {/* Bottom legend */}
                        <div className="pt-4 flex items-center gap-6 border-t border-border">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                    </div>
                </div>

                {/* Table card */}
                <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="p-5 md:p-6 border-b border-border">
                        <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="p-5 space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex justify-between items-center py-1">
                                <Skeleton className="h-4 w-8" />
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-5 w-20 rounded-full" />
                                <Skeleton className="h-4 w-28" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
