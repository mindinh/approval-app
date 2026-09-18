import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Badge } from '@cnma/react-ui';
import { Bell, ArrowLeft, Radio, RefreshCw, Loader2 } from 'lucide-react';

interface NotificationHeaderProps {
    isPinging: boolean;
    isRefreshing: boolean;
    onPing: () => void;
    onRefresh: () => void;
}

export const NotificationHeader: React.FC<NotificationHeaderProps> = ({
    isPinging,
    isRefreshing,
    onPing,
    onRefresh,
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <header className="border-b border-border bg-card/75 backdrop-blur-md sticky top-0 z-20 px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/inbox')}
                        className="size-9 rounded-lg"
                        title={t('notificationTester.back')}
                        aria-label={t('notificationTester.back')}
                    >
                        <ArrowLeft className="size-4" />
                    </Button>

                    <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                        <Bell className="size-5" />
                    </div>

                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-bold text-foreground">
                                {t('notificationTester.title')}
                            </h1>
                            <Badge variant="outline" className="text-xs font-mono font-semibold text-primary border-primary/30">
                                {t('notificationTester.adminBadge')}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {t('notificationTester.subtitle')}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onPing}
                        disabled={isPinging}
                        className="text-xs gap-1.5 h-9"
                    >
                        {isPinging ? (
                            <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                            <Radio className="size-3.5 text-primary" />
                        )}
                        <span>{t('notificationTester.pingDestination')}</span>
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="text-xs gap-1.5 h-9"
                    >
                        {isRefreshing ? (
                            <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                            <RefreshCw className="size-3.5 text-muted-foreground" />
                        )}
                        <span>{t('notificationTester.refreshTypes')}</span>
                    </Button>
                </div>
            </div>
        </header>
    );
};
