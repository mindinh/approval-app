import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Badge,
    Button,
} from '@cnma/react-ui';
import {
    Terminal,
    CheckCircle2,
    AlertCircle,
    Globe,
    Shield,
    Check,
    Copy,
} from 'lucide-react';
import type { NotificationTestResponse } from '@/services/notification/notification.api';

interface NotificationDiagnosticsProps {
    result: NotificationTestResponse | null;
}

export const NotificationDiagnostics: React.FC<NotificationDiagnosticsProps> = ({ result }) => {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);

    const handleCopyDetails = () => {
        if (!result?.details) return;
        void navigator.clipboard.writeText(result.details);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                    <Terminal className="size-4 text-primary" />
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">
                        {t('notificationTester.liveResponseTitle')}
                    </CardTitle>
                </div>

                {result && (
                    <Badge
                        variant="outline"
                        className={
                            result.success
                                ? 'text-xs font-semibold gap-1 text-success border-success/30 bg-success-bg'
                                : 'text-xs font-semibold gap-1 text-destructive border-destructive/30 bg-error-bg'
                        }
                    >
                        {result.success ? (
                            <CheckCircle2 className="size-3 text-success" />
                        ) : (
                            <AlertCircle className="size-3 text-destructive" />
                        )}
                        <span>
                            {result.success
                                ? t('notificationTester.success')
                                : t('notificationTester.failed')}
                        </span>
                    </Badge>
                )}
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
                {result ? (
                    <div className="space-y-4">
                        {/* Primary Message */}
                        <div
                            className={
                                result.success
                                    ? 'p-3 rounded-lg border text-xs font-medium leading-relaxed bg-success-bg/30 border-success/20 text-foreground'
                                    : 'p-3 rounded-lg border text-xs font-medium leading-relaxed bg-error-bg/30 border-destructive/20 text-foreground'
                            }
                        >
                            {result.message}
                        </div>

                        {/* Destination & Auth info */}
                        {(result.url || result.authentication) && (
                            <div className="grid grid-cols-1 gap-2 bg-muted/30 p-3 rounded-lg border border-border text-xs">
                                {result.url && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Globe className="size-3.5 shrink-0 text-primary" />
                                        <span className="font-mono text-xs truncate" title={result.url}>
                                            {result.url}
                                        </span>
                                    </div>
                                )}
                                {result.authentication && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Shield className="size-3.5 shrink-0 text-primary" />
                                        <span className="font-mono text-xs">
                                            {t('notificationTester.authPrefix', 'Auth')}: {result.authentication}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* JSON Details */}
                        {result.details && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                                        <Terminal className="size-3" />
                                        {t('notificationTester.rawResponseTitle')}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleCopyDetails}
                                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="size-3 text-success" />
                                                <span>{t('error.copied')}</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="size-3" />
                                                <span>{t('error.copyDetails')}</span>
                                            </>
                                        )}
                                    </Button>
                                </div>
                                <pre className="text-xs font-mono bg-background p-3 rounded-lg border border-border max-h-96 overflow-y-auto text-muted-foreground whitespace-pre-wrap break-all shadow-inner">
                                    {result.details}
                                </pre>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="rounded-lg border border-dashed border-border p-8 text-center space-y-2 bg-muted/10">
                        <Terminal className="size-6 text-muted-foreground mx-auto" />
                        <p className="text-xs font-semibold text-foreground">
                            {t('notificationTester.awaitingTitle')}
                        </p>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                            {t('notificationTester.awaitingDesc')}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
