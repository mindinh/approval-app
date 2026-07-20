import { Badge } from '@cnma/react-ui';
import { PRIORITY_CONFIG, PRIORITY_FALLBACK, STATUS_CONFIG, STATUS_FALLBACK } from '@/pages/Inbox/utils/constants';
import { useTranslation } from 'react-i18next';

export function PriorityBadge({ priority }: { priority?: string }) {
    const { t } = useTranslation();
    if (!priority) return null;

    // Normalize input to handle different cases
    const normalizedPriority = priority.toUpperCase().replace(/\s+/g, '_');

    const priorityKeyMap: Record<string, string> = {
        VERY_HIGH: 'veryHigh',
        HIGH: 'high',
        MEDIUM: 'medium',
        LOW: 'low'
    };

    const { variant, label: fallbackLabel } = PRIORITY_CONFIG[normalizedPriority] || {
        ...PRIORITY_FALLBACK,
        label: priority,
    };

    const mappedKey = priorityKeyMap[normalizedPriority];
    // Cast translated value to string
    const translatedLabel = mappedKey ? (t(`priority.${mappedKey}`) as string) : fallbackLabel;

    return (
        <Badge variant={variant as any} className="px-2.5 py-0.5 text-xs font-normal">
            {translatedLabel}
        </Badge>
    );
}

export function StatusBadge({ status }: { status?: string }) {
    const { t } = useTranslation();
    if (!status) return null;

    // Normalize: try uppercase underscore form first
    const normalizedStatus = status.toUpperCase().replace(/\s+/g, '_');

    let config = STATUS_CONFIG[normalizedStatus];

    // Fallbacks for mapping dashboard text formats internally
    if (!config) {
        if (normalizedStatus === 'IN_PROCESS' || normalizedStatus === 'STARTED' || normalizedStatus === 'IN_PROCESSING') {
            config = STATUS_CONFIG['NEW'];
        } else if (normalizedStatus === 'COMPLETE') {
            config = STATUS_CONFIG['COMPLETED'];
        }
    }

    const { variant, label: fallbackLabel } = config || {
        ...STATUS_FALLBACK,
        label: status, // Render whatever text was given if unknown
    };

    const statusKeyMap: Record<string, string> = {
        NEW: 'inApproving',
        READY: 'inApproving',
        RESERVED: 'inApproving',
        IN_PROGRESS: 'inApproving',
        IN_PROCESS: 'inApproving',
        IN_PROCESSING: 'inApproving',
        IN_APPROVING: 'inApproving',
        STARTED: 'inApproving',
        COMPLETED: 'completed',
        COMPLETE: 'completed',
        APPROVED: 'approved',
        REJECTED: 'rejected',
        DRAFT: 'draft',
        SUBMITTED: 'submitted',
    };

    const mappedKey = statusKeyMap[normalizedStatus];
    // Cast translated value to string
    const translatedLabel = mappedKey ? (t(`status.${mappedKey}`) as string) : fallbackLabel;

    return (
        <Badge variant={variant as any} className="px-2.5 py-0.5 text-xs font-normal">
            {translatedLabel}
        </Badge>
    );
}

export function TaskTypeBadge({ normalTask }: { normalTask?: boolean }) {
    const { t } = useTranslation();
    if (normalTask !== false) return null;
    return (
        <Badge variant="outline" className="px-2.5 py-0.5 text-xs font-normal border-amber-300/40 bg-amber-500/10 text-amber-600 dark:text-amber-500">
            {t('taskType.tagged', 'CC')}
        </Badge>
    );
}
