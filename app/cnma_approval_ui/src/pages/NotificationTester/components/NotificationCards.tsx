import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@cnma/react-ui';
import { Radio, ListOrdered, Sparkles } from 'lucide-react';

interface NotificationCardsProps {
    typesCount: number;
    hasLoadedTypes: boolean;
}

export const NotificationCards: React.FC<NotificationCardsProps> = ({
    typesCount,
    hasLoadedTypes,
}) => {
    const { t } = useTranslation();

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-border bg-card">
                <CardContent className="p-4 flex items-start gap-3">
                    <div className="size-9 rounded-lg bg-info-bg text-info flex items-center justify-center shrink-0 mt-0.5">
                        <Radio className="size-4" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {t('notificationTester.targetDestination')}
                        </h3>
                        <p className="text-sm font-bold font-mono text-foreground">SAP_Notifications</p>
                        <p className="text-xs text-muted-foreground">
                            {t('notificationTester.targetDestinationDesc')}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-border bg-card">
                <CardContent className="p-4 flex items-start gap-3">
                    <div className="size-9 rounded-lg bg-success-bg text-success flex items-center justify-center shrink-0 mt-0.5">
                        <ListOrdered className="size-4" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {t('notificationTester.registeredTypes')}
                        </h3>
                        <p className="text-sm font-bold text-foreground">
                            {hasLoadedTypes
                                ? t('notificationTester.typesCount', { count: typesCount })
                                : t('common.loading')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {t('notificationTester.registeredTypesDesc')}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-border bg-card">
                <CardContent className="p-4 flex items-start gap-3">
                    <div className="size-9 rounded-lg bg-muted text-foreground flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="size-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {t('notificationTester.serviceProtocol')}
                        </h3>
                        <p className="text-sm font-bold text-foreground">
                            {t('notificationTester.protocolValue')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {t('notificationTester.serviceProtocolDesc')}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
