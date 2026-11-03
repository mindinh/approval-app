/**
 * Marketing colour tones used by the Home stat / KPI cards.
 * Class names are spelled out in full so Tailwind can detect them.
 */
export interface StatTone {
    /** Card background + 2px border. */
    card: string;
    /** Icon bubble background. */
    iconBg: string;
    /** Foreground text / icon colour. */
    text: string;
}

export const STAT_TONES = {
    total: {
        card: 'bg-marketing-info-blue-bg border-2 border-marketing-info-blue-border',
        iconBg: 'bg-marketing-info-blue-border',
        text: 'text-marketing-info-blue',
    },
    inApproving: {
        card: 'bg-marketing-attention-bg border-2 border-marketing-attention-border',
        iconBg: 'bg-marketing-attention-border',
        text: 'text-marketing-attention',
    },
    completed: {
        card: 'bg-marketing-positive-bg border-2 border-marketing-positive-border',
        iconBg: 'bg-marketing-positive-border',
        text: 'text-marketing-positive',
    },
} satisfies Record<string, StatTone>;

/** Number of placeholder rows rendered while the newest tasks are loading. */
export const TASK_SKELETON_ROWS = 3;
