import { useState, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    Button,
} from '@cnma/react-ui';
import {
    AlertTriangle,
    ShieldAlert,
    WifiOff,
    FileX,
    ChevronDown,
    ChevronUp,
    Copy,
    Check,
    RotateCcw,
    X,
} from 'lucide-react';
import { safeString, type AppError } from '@/utils/parseError';
import { useTranslation } from 'react-i18next';

interface ErrorModalProps {
    open: boolean;
    error: AppError | null;
    onClose: () => void;
    onRetry?: () => void;
}

export function ErrorModal({ open, error, onClose, onRetry }: ErrorModalProps) {
    const { t } = useTranslation();
    const [showDetails, setShowDetails] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopyMessage = useCallback(() => {
        if (!error) return;
        const text = [
            `Title: ${safeString(error.title)}`,
            `Message: ${safeString(error.message)}`,
            error.details?.rawMessage ? `Error Detail: ${safeString(error.details.rawMessage)}` : null,
            error.details?.statusCode ? `Status Code: ${safeString(error.details.statusCode)}` : null,
            error.details?.path ? `Endpoint: ${safeString(error.details.path)}` : null,
        ]
            .filter(Boolean)
            .join('\n');

        void navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    }, [error]);

    if (!error) return null;

    // Pick visual icon based on error category
    const renderIcon = () => {
        switch (error.category) {
            case 'auth':
                return <ShieldAlert className="size-5 text-amber-500" />;
            case 'network':
                return <WifiOff className="size-5 text-sky-500" />;
            case 'notFound':
                return <FileX className="size-5 text-slate-500" />;
            case 'business':
                return <AlertTriangle className="size-5 text-orange-500" />;
            case 'technical':
            default:
                return <AlertTriangle className="size-5 text-destructive" />;
        }
    };

    const hasTechnicalDetails = Boolean(
        error.details?.statusCode ||
            error.details?.path ||
            error.details?.rawMessage
    );

    const displayTitle = safeString(t(`error.titles.${error.category}`, { defaultValue: error.title }));
    const displayMessage = safeString(t(`error.messages.${error.category}`, { defaultValue: error.message }));

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-md w-[92vw] max-h-[85dvh] my-auto rounded-xl p-0 overflow-hidden flex flex-col border border-border shadow-2xl">
                {/* Header with visual icon & title */}
                <DialogHeader className="px-6 pt-5 pb-3 border-b border-border/40 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-full bg-muted shrink-0">
                            {renderIcon()}
                        </div>
                        <DialogTitle className="text-base font-bold text-foreground">
                            {displayTitle || 'Error'}
                        </DialogTitle>
                    </div>
                </DialogHeader>

                {/* Main Body with scroll container */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0 max-h-[55vh]">
                    <DialogDescription className="text-sm text-foreground/90 leading-relaxed font-normal">
                        {displayMessage || 'An error occurred while processing your request.'}
                    </DialogDescription>

                    {/* Collapsible Technical Diagnostics */}
                    {hasTechnicalDetails && (
                        <div className="rounded-lg border border-border/60 bg-muted/20 overflow-hidden">
                            <Button
                                variant="ghost"
                                type="button"
                                onClick={() => setShowDetails((prev) => !prev)}
                                className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
                            >
                                <span>{safeString(t('error.technicalDetails', { defaultValue: 'Technical Diagnostics (for Support)' }))}</span>
                                {showDetails ? (
                                    <ChevronUp className="size-4" />
                                ) : (
                                    <ChevronDown className="size-4" />
                                )}
                            </Button>

                            {showDetails && (
                                <div className="border-t border-border/40 px-3 py-2.5 text-xs font-mono space-y-1.5 bg-slate-950 text-slate-100 max-h-40 overflow-y-auto rounded-b-lg">
                                    {error.details?.statusCode && (
                                        <div>
                                            <span className="text-slate-400">Status Code:</span>{' '}
                                            <span className="text-amber-400">{safeString(error.details.statusCode)}</span>
                                        </div>
                                    )}
                                    {error.details?.path && (
                                        <div className="break-all">
                                            <span className="text-slate-400">Endpoint:</span>{' '}
                                            <span className="text-slate-300">{safeString(error.details.path)}</span>
                                        </div>
                                    )}
                                    {error.details?.rawMessage && (
                                        <div className="pt-1">
                                            <span className="text-slate-400">Raw Message:</span>
                                            <p className="mt-0.5 whitespace-pre-wrap text-slate-200 break-words leading-snug">
                                                {safeString(error.details.rawMessage)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <DialogFooter className="px-6 py-3.5 bg-muted/30 border-t border-border/50 shrink-0 flex sm:flex-row flex-col gap-2 sm:justify-between items-center">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyMessage}
                        className="w-full sm:w-auto text-xs gap-1.5 h-8"
                    >
                        {copied ? (
                            <>
                                <Check className="size-3.5 text-emerald-600" />
                                <span>{safeString(t('error.copied', { defaultValue: 'Copied' }))}</span>
                            </>
                        ) : (
                            <>
                                <Copy className="size-3.5" />
                                <span>{safeString(t('error.copyMessage', { defaultValue: 'Copy Message' }))}</span>
                            </>
                        )}
                    </Button>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="w-full sm:w-auto text-xs h-8"
                        >
                            <X className="size-3.5 mr-1" />
                            {safeString(t('common.close', { defaultValue: 'Close' }))}
                        </Button>

                        {error.canRetry && onRetry && (
                            <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                    onClose();
                                    onRetry();
                                }}
                                className="w-full sm:w-auto text-xs gap-1.5 h-8"
                            >
                                <RotateCcw className="size-3.5" />
                                <span>{safeString(t('common.retry', { defaultValue: 'Retry' }))}</span>
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
