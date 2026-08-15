import { useState } from 'react';
import { Button, Badge, Skeleton } from '@cnma/react-ui';
import { ArrowLeft, ExternalLink, RotateCcw, Loader2 } from 'lucide-react';
import { buildSapPrLaunchpadUrl, formatPrNumberForOData } from '@/utils/launchpad';
import { useTranslation } from 'react-i18next';

interface ReferencePrDetailViewProps {
    prNumber: string;
    parentDocumentId?: string;
    onBack: () => void;
    isMobile?: boolean;
}

export function ReferencePrDetailView({
    prNumber,
    parentDocumentId,
    onBack,
    isMobile = false,
}: ReferencePrDetailViewProps) {
    const { t } = useTranslation();
    const [isFrameLoading, setIsFrameLoading] = useState(true);
    const [frameKey, setFrameKey] = useState(0);

    const formattedPrNumber = prNumber.replace(/^0+/, '');
    const paddedPrNumber = formatPrNumberForOData(prNumber);
    const launchpadUrl = buildSapPrLaunchpadUrl(prNumber);

    const handleRefreshFrame = () => {
        setIsFrameLoading(true);
        setFrameKey((prev) => prev + 1);
    };

    return (
        <div className="flex flex-col h-full min-w-0 w-full max-w-full overflow-hidden bg-background relative">
            {/* Top Bar Navigation Header */}
            <div className="border-b border-border/60 bg-background px-4 py-3 shrink-0 flex items-center justify-between gap-3 z-10 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onBack}
                        className="gap-1.5 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 rounded-lg px-2.5 py-1.5 -ml-1 shrink-0"
                    >
                        <ArrowLeft className="size-4" />
                        <span>{parentDocumentId ? `Back to PO ${parentDocumentId}` : 'Back to PO Task'}</span>
                    </Button>
                    <h2 className="text-sm sm:text-base font-bold text-foreground truncate">
                        PR #{formattedPrNumber} <span className="text-xs text-muted-foreground font-normal hidden sm:inline">({paddedPrNumber})</span>
                    </h2>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefreshFrame}
                        className="h-8 px-2.5 text-xs gap-1.5"
                        title={t('common.refresh', 'Reload frame')}
                    >
                        <RotateCcw className="size-3.5" />
                        <span className="hidden sm:inline">{t('common.reload', 'Reload')}</span>
                    </Button>

                    {launchpadUrl && (
                        <a
                            href={launchpadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                            title={t('task.openInNewTab', 'Open in new browser tab')}
                        >
                            <ExternalLink className="size-3.5" />
                            <span className="hidden md:inline">{t('task.openInNewTab', 'New tab')}</span>
                        </a>
                    )}
                    <Badge variant="outline" className="gap-1.5 text-xs font-semibold bg-primary/5 text-primary border-primary/20 shrink-0">
                        <span>S/4HANA Live</span>
                    </Badge>
                </div>
            </div>

            {/* Embedded Live S/4HANA iFrame Container */}
            <div className="flex-1 min-h-0 w-full h-full relative bg-muted/20">
                {isFrameLoading && (
                    <div className="absolute inset-0 z-20 bg-background/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 space-y-4">
                        <Loader2 className="size-8 text-primary animate-spin" />
                        <div className="text-center space-y-1">
                            <h3 className="text-sm font-semibold text-foreground">
                                {t('task.loadingS4HanaScreen', 'Loading S/4HANA Purchase Requisition...')}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                PR #{formattedPrNumber}
                            </p>
                        </div>
                        <div className="w-64 max-w-full space-y-2 pt-2">
                            <Skeleton className="h-3 w-full rounded" />
                            <Skeleton className="h-3 w-4/5 mx-auto rounded" />
                        </div>
                    </div>
                )}

                {launchpadUrl ? (
                    <iframe
                        key={frameKey}
                        src={launchpadUrl}
                        onLoad={() => setIsFrameLoading(false)}
                        className="w-full h-full border-0 bg-white"
                        title={`S/4HANA Purchase Requisition ${formattedPrNumber}`}
                        allow="fullscreen"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
                        <p className="text-sm text-muted-foreground">
                            {t('error.invalidPrNumber', 'Invalid or missing PR number')}
                        </p>
                        <Button variant="outline" size="sm" onClick={onBack}>
                            {t('common.goBack', 'Go Back')}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
