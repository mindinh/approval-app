import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertDialogCancel, Badge, Button, buttonVariants } from '@cnma/react-ui';
import { RefreshCw, RotateCcw } from 'lucide-react';
import { StatusDialog } from './StatusDialog';
import { resetAppCache } from '../../utils/pwa';

export interface StartupFailure {
    code: string;
    baseUrl: string;
}

export function StartupRecoveryDialog({ code, baseUrl }: StartupFailure) {
    const { t } = useTranslation();
    const [resetting, setResetting] = useState(false);

    async function handleReset() {
        setResetting(true);
        await resetAppCache(baseUrl);
        window.location.reload();
    }

    return (
        <StatusDialog
            open
            title={t('startupRecovery.title')}
            description={t('startupRecovery.message')}
            detail={<Badge id="startup-code" variant="outline" className="status-dialog__code">{t('startupRecovery.supportCode', { code })}</Badge>}
            actions={(
                <>
                    <AlertDialogCancel id="startup-retry" className={buttonVariants()} disabled={resetting} onClick={() => window.location.reload()}>
                        <RefreshCw aria-hidden />
                        {t('startupRecovery.retry')}
                    </AlertDialogCancel>
                    <Button id="startup-reset" variant="outline" disabled={resetting} onClick={handleReset}>
                        <RotateCcw aria-hidden />
                        {t(resetting ? 'startupRecovery.resetting' : 'startupRecovery.reset')}
                    </Button>
                </>
            )}
        />
    );
}
