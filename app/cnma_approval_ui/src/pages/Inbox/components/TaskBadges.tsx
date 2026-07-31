import { Badge } from '@cnma/react-ui';
import { PRIORITY_CONFIG, PRIORITY_FALLBACK, STATUS_CONFIG, STATUS_FALLBACK } from '@/pages/Inbox/utils/constants';
import { useTranslation } from 'react-i18next';

export function PriorityBadge({ priority }: { priority?: string }) {
    const { t } = useTranslation();
    if (!priority) return null;

    // Handle SAP OData NOT_VALID unmapped values
    const cleanPriority = (priority.toUpperCase().includes('NOT_VALID') || priority.toUpperCase().includes('NOT VALID'))
        ? 'MEDIUM'
        : priority;

    const normalizedPriority = cleanPriority.toUpperCase().replace(/\s+/g, '_');

    const priorityKeyMap: Record<string, string> = {
        VERY_HIGH: 'veryHigh',
        HIGH: 'high',
        MEDIUM: 'medium',
        LOW: 'low'
    };

    const config = PRIORITY_CONFIG[normalizedPriority] || {
        ...PRIORITY_FALLBACK,
        label: 'Medium',
    };
    const { variant, label: defaultLabel } = config;

    const mappedKey = priorityKeyMap[normalizedPriority];
    const rawTranslation = mappedKey ? (t(`priority.${mappedKey}`, { defaultValue: defaultLabel }) as string) : defaultLabel;
    const finalLabel = !rawTranslation || rawTranslation === `priority.${mappedKey}` || rawTranslation.toUpperCase().includes('NOT_VALID')
        ? defaultLabel || 'Medium'
        : rawTranslation;

    return (
        <Badge variant={variant as any} className="px-2.5 py-0.5 text-xs font-normal">
            {finalLabel}
        </Badge>
    );
}

export function StatusBadge({ status }: { status?: string }) {
    const { t } = useTranslation();
    if (!status) return null;

    // Handle SAP OData NOT_VALID unmapped values
    const cleanStatus = (status.toUpperCase().includes('NOT_VALID') || status.toUpperCase().includes('NOT VALID'))
        ? 'IN_APPROVING'
        : status;

    const normalizedStatus = cleanStatus.toUpperCase().replace(/\s+/g, '_');

    let config = STATUS_CONFIG[normalizedStatus];

    if (!config) {
        if (normalizedStatus === 'IN_PROCESS' || normalizedStatus === 'STARTED' || normalizedStatus === 'IN_PROCESSING') {
            config = STATUS_CONFIG['NEW'];
        } else if (normalizedStatus === 'COMPLETE') {
            config = STATUS_CONFIG['COMPLETED'];
        }
    }

    const { variant, label: defaultLabel } = config || {
        ...STATUS_FALLBACK,
        label: 'In Approving',
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
    const rawTranslation = mappedKey ? (t(`status.${mappedKey}`, { defaultValue: defaultLabel }) as string) : defaultLabel;
    const finalLabel = !rawTranslation || rawTranslation === `status.${mappedKey}` || rawTranslation.toUpperCase().includes('NOT_VALID')
        ? defaultLabel || 'In Approving'
        : rawTranslation;

    return (
        <Badge variant={variant as any} className="px-2.5 py-0.5 text-xs font-normal">
            {finalLabel}
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
