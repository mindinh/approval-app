import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Button } from '@cnma/react-ui';

import { STATUS_LABELS } from '../use-dashboard-data';
import type { DonutSegment } from '../use-dashboard-data';
import { cn } from '@/lib/utils';

/** Theme-token classes per status. The ring itself is coloured by STATUS_COLORS via segments. */
const STATUS_STYLE: Record<string, { dot: string; text: string; selected: string }> = {
    'In Approving': {
        dot: 'bg-warning',
        text: 'text-warning',
        selected: 'bg-warning-bg border-warning ring-2 ring-warning/40',
    },
    Completed: {
        dot: 'bg-success',
        text: 'text-success',
        selected: 'bg-success-bg border-success ring-2 ring-success/40',
    },
};

const DIMMED_OPACITY = 0.3;

interface StatusDonutCardProps {
    segments: DonutSegment[];
    counts: Record<string, number>;
    total: number;
    /** The single active status, or null when no status filter is applied. */
    activeStatus: string | null;
    /** Passing null clears the status filter. */
    onSelectStatus: (status: string | null) => void;
}

/**
 * Tasks-by-status donut. Selection is single-choice: picking a status replaces the
 * previous one, picking the active status again clears it. The centre of the ring
 * reports whichever slice is selected, falling back to the overall total.
 */
export function StatusDonutCard({ segments, counts, total, activeStatus, onSelectStatus }: StatusDonutCardProps) {
    const { t } = useTranslation();

    const data = segments.filter((seg) => seg.value > 0);
    const activeStyle = activeStatus ? STATUS_STYLE[activeStatus] : undefined;

    const toggle = (status: string) => onSelectStatus(activeStatus === status ? null : status);

    return (
        <div className="flex flex-col gap-4">
            {/* Header — carries the reset affordance once a status is active */}
            <div className="flex shrink-0 items-center justify-between gap-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-foreground md:text-sm">
                    {t('dashboard.charts.tasksByStatus')}
                </h3>
                {activeStatus && (
                    <Button
                        variant="link"
                        size="sm"
                        onClick={() => onSelectStatus(null)}
                        className="h-auto p-0 text-xs font-semibold text-primary"
                    >
                        {t('dashboard.status.reset', 'Reset status')}
                    </Button>
                )}
            </div>

            <div className="flex flex-1 items-center gap-3 sm:gap-4 sm:justify-between">
                {/* Ring */}
                {/* Recharts marks each sector focusable (tabIndex -1), so clicking one paints
                    a UA focus rectangle. They are not keyboard-reachable, so suppressing that
                    outline costs no accessibility — the legend buttons keep their focus rings. */}
                <div className="relative flex size-32 shrink-0 items-center justify-center sm:size-56 [&_.recharts-pie-sector]:outline-none [&_.recharts-surface]:outline-none [&_.recharts-wrapper]:outline-none">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius="65%"
                                outerRadius="85%"
                                paddingAngle={3}
                                dataKey="value"
                                nameKey="label"
                                onClick={(entry) => toggle(entry.label)}
                                cursor="pointer"
                            >
                                {data.map((entry) => (
                                    <Cell
                                        key={entry.label}
                                        fill={entry.color}
                                        opacity={activeStatus && activeStatus !== entry.label ? DIMMED_OPACITY : 1}
                                        className="transition-all duration-500 ease-in-out"
                                    >
                                        <title>
                                            {t('dashboard.status.arcTitle', '{{status}}: {{count}} requests', {
                                                status: entry.label,
                                                count: entry.value,
                                            })}
                                        </title>
                                    </Cell>
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Centre reports the selected slice, or the overall total.
                        The wrapper must not swallow pointer events — it sits on top of the
                        ring, and the arcs underneath have to stay clickable. Only the
                        button itself, sized to the hole, takes clicks. */}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <Button
                        variant="ghost"
                        onClick={() => onSelectStatus(null)}
                        title={t('dashboard.status.showAll', 'Show all statuses')}
                        className="pointer-events-auto size-20 flex-col gap-0 rounded-full bg-transparent px-1 text-center hover:bg-transparent sm:size-28"
                    >
                        <span
                            className={cn(
                                'text-xl font-black leading-none tracking-tight tabular-nums sm:text-2xl',
                                activeStyle ? activeStyle.text : 'text-foreground'
                            )}
                        >
                            {activeStatus ? counts[activeStatus] ?? 0 : total}
                        </span>
                        <span
                            className={cn(
                                'mt-1 text-xs font-semibold tracking-tight',
                                activeStyle ? activeStyle.text : 'font-bold uppercase tracking-widest text-muted-foreground'
                            )}
                        >
                            {activeStatus ?? t('dashboard.charts.tasks')}
                        </span>
                    </Button>
                    </div>
                </div>

                {/* Status selector rows */}
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    {STATUS_LABELS.map((status) => {
                        const style = STATUS_STYLE[status];
                        const isSelected = activeStatus === status;

                        return (
                            <Button
                                key={status}
                                variant="ghost"
                                aria-pressed={isSelected}
                                onClick={() => toggle(status)}
                                className={cn(
                                    'h-auto w-full justify-between rounded-xl border p-2.5 text-left',
                                    isSelected ? cn(style.selected, 'shadow-xs') : 'border-border bg-muted/60 hover:bg-accent'
                                )}
                            >
                                <span className="flex items-center gap-2.5">
                                    <span className={cn('size-3 shrink-0 rounded-full shadow-xs', style.dot)} />
                                    <span className="text-xs font-semibold text-foreground">{status}</span>
                                </span>
                                <span className={cn('text-xs font-bold tabular-nums', style.text)}>{counts[status] ?? 0}</span>
                            </Button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default StatusDonutCard;
