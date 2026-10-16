import { useTranslation } from 'react-i18next';
import { Button } from '@cnma/react-ui';
import { ArrowLeft, AlertTriangle, RotateCcw, Info, FileQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseError } from '@/utils/parseError';

export interface TaskDetailErrorStateProps {
    error: unknown;
    isMobile?: boolean;
    onBack?: () => void;
    onRetry?: () => void;
    onLoadFirstTask?: () => void;
    hasTasks?: boolean;
    onShowErrorDialog?: (error: unknown) => void;
}

export function TaskDetailErrorState({
    error,
    isMobile = false,
    onBack,
    onRetry,
    onLoadFirstTask,
    hasTasks = false,
    onShowErrorDialog,
}: TaskDetailErrorStateProps) {
    const { t } = useTranslation();
    const parsed = parseError(error);

    const isNotFound = parsed.category === 'notFound' || parsed.details?.statusCode === 404;
    const isForbidden =
        parsed.category === 'auth' ||
        parsed.details?.statusCode === 403 ||
        parsed.details?.statusCode === 401;
    const isUnavailable = isNotFound || isForbidden;

    const errorTitle = isForbidden
        ? t('inbox.accessDenied', 'Access Denied')
        : isNotFound
          ? t('inbox.taskNotFound', 'Task Not Found')
          : parsed.title;

    const errorDesc = isForbidden
        ? t(
              'inbox.taskForbiddenDesc',
              'You do not have permission to view this task, or it belongs to another user.'
          )
        : isNotFound
          ? t(
                'inbox.taskNotFoundDesc',
                'The requested task does not exist in your worklist or has already been processed.'
            )
          : parsed.message;

    return (
        <div className="flex h-full min-w-0 w-full flex-col bg-background relative overflow-hidden">
            {isMobile && (
                <div className="bg-card border-b border-border/70 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 shadow-xs shrink-0">
                    <div className="flex items-center gap-2.5">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onBack}
                            className="shrink-0 size-9 p-0 rounded-xl hover:bg-muted active:scale-90 transition-all text-foreground"
                            aria-label="Back to task list"
                        >
                            <ArrowLeft className="size-5" />
                        </Button>
                        <h2 className="text-base font-bold text-foreground truncate">
                            {errorTitle}
                        </h2>
                    </div>
                </div>
            )}
            <div className="flex flex-1 flex-col items-center justify-center text-center p-8 max-w-md mx-auto space-y-4">
                <div
                    className={cn(
                        'flex size-14 items-center justify-center rounded-full',
                        isUnavailable
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-destructive/10 text-destructive'
                    )}
                >
                    {isUnavailable ? <FileQuestion className="size-8" /> : <AlertTriangle className="size-8" />}
                </div>
                <h3 className="text-base font-bold text-foreground">{errorTitle}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{errorDesc}</p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    {isUnavailable ? (
                        <>
                            {onLoadFirstTask && (
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={onLoadFirstTask}
                                    className="gap-1.5 text-xs"
                                >
                                    <RotateCcw className="size-3.5" />
                                    {hasTasks
                                        ? t('inbox.loadFirstTask', 'Reload')
                                        : t('common.backToList', 'Back to Task List')}
                                </Button>
                            )}
                            {onBack && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onBack}
                                    className="gap-1.5 text-xs"
                                >
                                    <ArrowLeft className="size-3.5" />
                                    {t('common.back', 'Back to List')}
                                </Button>
                            )}
                        </>
                    ) : (
                        <>
                            {onBack && (
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={onBack}
                                    className="gap-1.5 text-xs"
                                >
                                    <ArrowLeft className="size-3.5" />
                                    {t('common.back', 'Back to List')}
                                </Button>
                            )}
                            {onRetry && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onRetry}
                                    className="gap-1.5 text-xs"
                                >
                                    <RotateCcw className="size-3.5" />
                                    {t('common.retry', 'Retry')}
                                </Button>
                            )}
                            {onShowErrorDialog && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onShowErrorDialog(error)}
                                    className="gap-1.5 text-xs text-muted-foreground"
                                >
                                    <Info className="size-3.5" />
                                    {t('common.errorDetails', 'Details')}
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
