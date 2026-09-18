import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Button,
    Badge,
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from '@cnma/react-ui';
import { ListOrdered, RefreshCw, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import type { ParsedNotificationType } from '../useNotificationTester';

interface NotificationTypesTableProps {
    types: ParsedNotificationType[];
    activeTypeKey: string;
    isRefreshing: boolean;
    isDeleting: boolean;
    deletingId: string | null;
    onRefresh: () => void;
    onSelectType: (type: ParsedNotificationType) => void;
    onDeleteType: (type: ParsedNotificationType) => void;
}

export const NotificationTypesTable: React.FC<NotificationTypesTableProps> = ({
    types,
    activeTypeKey,
    isRefreshing,
    isDeleting,
    deletingId,
    onRefresh,
    onSelectType,
    onDeleteType,
}) => {
    const { t } = useTranslation();

    return (
        <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                    <ListOrdered className="size-4 text-primary" />
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">
                        {t('notificationTester.manageTypesTitle')}
                    </CardTitle>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="h-8 text-xs gap-1"
                >
                    <RefreshCw className={isRefreshing ? 'size-3.5 animate-spin' : 'size-3.5'} />
                    <span>{t('notificationTester.reload')}</span>
                </Button>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
                {types.length > 0 ? (
                    <div className="rounded-lg border border-border overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/40">
                                <TableRow>
                                    <TableHead className="text-xs font-bold py-2.5">
                                        {t('notificationTester.colTypeKey')}
                                    </TableHead>
                                    <TableHead className="text-xs font-bold py-2.5">
                                        {t('notificationTester.colVersion')}
                                    </TableHead>
                                    <TableHead className="text-xs font-bold py-2.5">
                                        {t('notificationTester.colId')}
                                    </TableHead>
                                    <TableHead className="text-xs font-bold py-2.5 text-right">
                                        {t('notificationTester.colActions')}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {types.map((item) => {
                                    const isDeletingThis = isDeleting && deletingId === item.id;
                                    const isCurrentActive = item.key === activeTypeKey;

                                    return (
                                        <TableRow key={item.id || item.key} className="hover:bg-muted/20">
                                            <TableCell className="py-2.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs font-semibold text-foreground">
                                                        {item.key}
                                                    </span>
                                                    {isCurrentActive && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs py-0 px-1 font-mono text-primary border-primary/30"
                                                        >
                                                            {t('notificationTester.activeBadge')}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-2.5 font-mono text-xs text-muted-foreground">
                                                {item.version}
                                            </TableCell>
                                            <TableCell
                                                className="py-2.5 font-mono text-xs text-muted-foreground max-w-44 truncate"
                                                title={item.id}
                                            >
                                                {item.id}
                                            </TableCell>
                                            <TableCell className="py-2.5 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => onSelectType(item)}
                                                        className="h-7 px-2 text-xs"
                                                    >
                                                        {t('notificationTester.use')}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => onDeleteType(item)}
                                                        disabled={isDeletingThis}
                                                        className="h-7 px-2 text-xs text-destructive hover:bg-error-bg hover:text-destructive"
                                                    >
                                                        {isDeletingThis ? (
                                                            <Loader2 className="size-3.5 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="size-3.5" />
                                                        )}
                                                        <span className="ml-1">{t('common.delete')}</span>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="rounded-lg border border-dashed border-border p-6 text-center space-y-2 bg-muted/10">
                        <AlertTriangle className="size-6 text-muted-foreground mx-auto" />
                        <p className="text-xs font-semibold text-foreground">
                            {t('notificationTester.noTypes')}
                        </p>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                            {t('notificationTester.noTypesHint', { key: activeTypeKey })}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
