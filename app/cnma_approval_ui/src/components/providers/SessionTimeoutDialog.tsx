import { AlertDialogAction, AlertDialogCancel, buttonVariants } from '@cnma/react-ui';
import { LogOut, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { StatusDialog } from '../common/StatusDialog';

interface SessionTimeoutDialogProps {
    state: 'hidden' | 'warning' | 'expired';
    countdown: number;
    onContinue: () => void;
    onLogout: () => void;
}

export function SessionTimeoutDialog({ state, countdown, onContinue, onLogout }: SessionTimeoutDialogProps) {
    const { t } = useTranslation();
    const warning = state === 'warning';
    return (
        <StatusDialog
            open={state !== 'hidden'}
            tone={warning ? 'warning' : 'destructive'}
            title={t(warning ? 'sessionTimeout.warningTitle' : 'sessionTimeout.expiredTitle')}
            description={warning ? t('sessionTimeout.warningMessage', { count: countdown }) : t('sessionTimeout.expiredMessage')}
            actions={warning ? (
                <>
                    <AlertDialogCancel className={buttonVariants()} onClick={onContinue}>
                        <RefreshCw aria-hidden />
                        {t('sessionTimeout.continueWorking')}
                    </AlertDialogCancel>
                    <AlertDialogAction className={buttonVariants({ variant: 'ghost' })} onClick={onLogout}>
                        {t('sessionTimeout.signOut')}
                    </AlertDialogAction>
                </>
            ) : (
                <AlertDialogCancel className={buttonVariants()} onClick={onLogout}>
                    <LogOut aria-hidden />
                    {t('sessionTimeout.signInAgain')}
                </AlertDialogCancel>
            )}
        />
    );
}
