import { Badge } from '@cnma/react-ui';
import { STATUS_CONFIG, STATUS_FALLBACK } from '@/pages/Inbox/utils/constants';
import { useTranslation } from 'react-i18next';

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
        PENDING_APPROVAL: 'pendingApproval',
        PARTIALLY_APPROVED: 'partiallyApproved',
        STARTED: 'inApproving',
        COMPLETED: 'completed',
        COMPLETE: 'completed',
        APPROVED: 'approved',
        REJECTED: 'rejected',
        CANCELLED: 'cancelled',
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
