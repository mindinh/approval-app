/**
 * Shared micro-components for task detail panels.
 *
 * These are tiny presentational helpers used across multiple panel files.
 * Keeping them in one place avoids duplication.
 */
import { FileText, CheckCircle2, Circle } from 'lucide-react';
import { motion } from 'framer-motion';

// ─── Empty State ───────────────────────────────────────────

export function Empty({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-2 rounded-md border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
            <FileText className="size-4" />
            {message}
        </div>
    );
}

// ─── Activity Timeline ─────────────────────────────────────

export interface ActivityRow {
    id: string;
    timestamp: string;
    actor: string;
    action: string;
    details: string;
}

export function ActivityTimeline({
    rows,
    emptyMessage,
    accent,
}: {
    rows: ActivityRow[];
    emptyMessage: string;
    accent: 'processing' | 'workflow';
}) {
    if (rows.length === 0) {
        return (
            <div className="rounded-lg border border-dashed border-border/70 px-4 py-5 text-sm text-muted-foreground">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="relative pl-1">
            <div className="absolute left-3.5 top-1 bottom-1 w-px bg-border/80" />
            <div className="space-y-3">
                {rows.map((row, idx) => (
                    <motion.div
                        key={row.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.04 }}
                        className="relative pl-10"
                    >
                        <div className="absolute left-0 top-1">
                            {accent === 'processing' ? (
                                <CheckCircle2 className="size-6 rounded-full bg-success-bg p-1 text-success" />
                            ) : (
                                <Circle className="size-6 rounded-full bg-info-bg p-1 text-info" />
                            )}
                        </div>
                        <div className="rounded-lg border border-border/70 bg-background/95 px-3 py-2.5">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                <span>{row.timestamp}</span>
                                <span className="font-medium text-foreground/80">{row.actor}</span>
                            </div>
                            <div className="mt-1 text-sm font-semibold">{row.action}</div>
                            <div className="mt-0.5 text-sm text-muted-foreground">{row.details}</div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
