import { useState } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle
} from '@cnma/react-ui';
import type { TaskDetail } from '@/services/inbox/inbox.types';
import type { BusinessSectionModel } from '../renderers/TaskDetailSections.types';
import { cn } from '@/lib/utils';
import { safe, prettifyFieldLabel } from '@/pages/Inbox/utils/formatters';
import { useTranslation } from 'react-i18next';

export function DetailsPanel({
    model,
    detail,
    isMobile = false,
}: {
    model: BusinessSectionModel;
    detail: TaskDetail;
    isMobile?: boolean;
}) {
    const { t } = useTranslation();
    const [selectedRow, setSelectedRow] = useState<{
        tableTitle: string;
        rowId: string;
        fields: Array<{ label: string; value: string }>;
    } | null>(null);

    const filteredTables = model.tables
        .filter((table) => !['Header Facts', 'Custom Attributes', 'Related Objects'].includes(table.title));

    if (filteredTables.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
                {t('task.noDetailsAvailable', 'No detail items available for this task.')}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {filteredTables.map((table) => (
                    <Card key={table.id} className="gap-0 bg-card border-border/70 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">{table.title}</CardTitle>
                            {!isMobile && table.rows.length > 0 && (
                                <CardDescription>{t('task.clickRowDetails', 'Click a row to view complete details')}</CardDescription>
                            )}
                        </CardHeader>
                        <CardContent>
                            {isMobile ? (
                                <div className="divide-y divide-border/60">
                                    {table.rows.length === 0 && (
                                        <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
                                            {table.emptyMessage || t('common.noData', 'No data')}
                                        </div>
                                    )}
                                    {table.rows.map((row) => (
                                        <div key={row.id} className="py-4 first:pt-3 last:pb-3 space-y-2">
                                            {table.columns.map((column) => (
                                                <div
                                                    key={`${row.id}-${column.key}`}
                                                    className="flex items-start justify-between gap-3"
                                                >
                                                    <span className="text-sm font-medium text-muted-foreground pt-px w-5/12 shrink-0">
                                                        {column.label}
                                                    </span>
                                                    <span className="text-sm font-semibold text-foreground text-right break-words">
                                                        {safe(row.values[column.key])}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="max-h-96 overflow-auto rounded-xl border border-border/60 bg-white">
                                    <Table>
                                        <TableHeader className="bg-muted/90">
                                            <TableRow className="border-border/70 bg-transparent hover:bg-transparent">
                                                {table.columns.map((column) => (
                                                    <TableHead
                                                        key={column.key}
                                                        className={cn(
                                                            'h-11 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground',
                                                            column.align === 'right' && 'text-right'
                                                        )}
                                                    >
                                                        {column.label}
                                                    </TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {table.rows.length === 0 && (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={table.columns.length}
                                                        className="px-4 py-8 text-center text-muted-foreground whitespace-normal"
                                                    >
                                                        {table.emptyMessage || t('common.noData', 'No data')}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {table.rows.map((row) => (
                                                <TableRow
                                                    key={row.id}
                                                    onClick={() => {
                                                        const selectedFields = table.columns.map((column) => ({
                                                            label: column.label,
                                                            value: safe(row.values[column.key]),
                                                        }));
                                                        const knownKeys = new Set(table.columns.map((column) => column.key));
                                                        for (const [key, value] of Object.entries(row.values)) {
                                                            if (knownKeys.has(key)) continue;
                                                            selectedFields.push({
                                                                label: table.detailFieldLabels?.[key] || prettifyFieldLabel(key),
                                                                value: safe(value),
                                                            });
                                                        }
                                                        setSelectedRow({
                                                            tableTitle: table.title,
                                                            rowId: row.id,
                                                            fields: selectedFields,
                                                        });
                                                    }}
                                                    className="border-border/60 cursor-pointer hover:bg-primary/5"
                                                >
                                                    {table.columns.map((column) => (
                                                        <TableCell
                                                            key={`${row.id}-${column.key}`}
                                                            className={cn(
                                                                'px-4 py-3.5 text-sm whitespace-normal',
                                                                column.align === 'right' && 'text-right'
                                                            )}
                                                        >
                                                            {safe(row.values[column.key])}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}

            {!isMobile && (
                <Sheet
                    open={!!selectedRow}
                    onOpenChange={(open) => {
                        if (!open) setSelectedRow(null);
                    }}
                >
                    <SheetContent side="right" className="w-128 sm:max-w-128 p-0">
                        <SheetHeader className="border-b border-border/60 bg-muted/50">
                            <SheetTitle>{selectedRow?.tableTitle || t('task.details', 'Details')}</SheetTitle>
                            <SheetDescription>
                                {t('task.rowId', 'Row ID:')} {selectedRow?.rowId || '-'}
                            </SheetDescription>
                        </SheetHeader>
                        <div className="p-4 overflow-auto">
                            <div className="overflow-hidden rounded-xl border border-border/60 bg-white">
                                <Table>
                                    <TableBody>
                                        {(selectedRow?.fields || []).map((item) => (
                                            <TableRow key={`${item.label}-${item.value}`}>
                                                <TableCell className="w-[42%] bg-muted/30 px-4 py-3 text-muted-foreground whitespace-normal">
                                                    {item.label}
                                                </TableCell>
                                                <TableCell className="px-4 py-3 font-medium break-all whitespace-normal">
                                                    {item.value}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            )}
        </div>
    );
}
