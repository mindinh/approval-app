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
    SheetTitle,
    Skeleton,
    Button,
} from '@cnma/react-ui';
import { ExternalLink } from 'lucide-react';
import type { TaskDetail } from '@/services/inbox/inbox.types';
import type { BusinessSectionModel } from '@/renderers/TaskDetailSections.types';
import { cn } from '@/lib/utils';
import { safe, prettifyFieldLabel } from '@/pages/Inbox/utils/formatters';
import { normalizeAndOrderTableColumns } from '@/renderers/shared/formatters';
import { useTranslation } from 'react-i18next';
import { buildSapPrLaunchpadUrl } from '@/utils/launchpad';

export function DetailsPanel({
    model,
    detail,
    isMobile = false,
    isSecondaryLoading = false,
    onSelectReferencePr,
}: {
    model: BusinessSectionModel;
    detail: TaskDetail;
    isMobile?: boolean;
    isSecondaryLoading?: boolean;
    onSelectReferencePr?: (prNumber: string) => void;
}) {
    const { t } = useTranslation();
    const [selectedRow, setSelectedRow] = useState<{
        tableTitle: string;
        rowId: string;
        fields: Array<{ label: string; value: string }>;
    } | null>(null);

    const filteredTables = model.tables
        .filter((table) => !['Header Facts', 'Custom Attributes', 'Related Objects'].includes(table.title))
        .map(normalizeAndOrderTableColumns);

    if (filteredTables.length === 0) {
        if (isSecondaryLoading) {
            return (
                <div className="space-y-4">
                    <Card className="gap-0 bg-card border-border/70 shadow-sm w-full overflow-hidden">
                        <CardHeader className="pb-3">
                            <Skeleton className="h-5 w-40" />
                        </CardHeader>
                        <CardContent className="space-y-3 p-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                </div>
            );
        }
        return (
            <div className="rounded-xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
                {t('task.noDetailsAvailable', 'No detail items available for this task.')}
            </div>
        );
    }

    const isReferencePrField = (key: string, label: string) => {
        const k = key.toLowerCase();
        const l = label.toLowerCase();
        return k === 'referencepr' || k === 'refpr' || l.includes('reference pr') || l.includes('ref pr');
    };

    const renderCellValue = (key: string, label: string, rawVal: any) => {
        const displayVal = safe(rawVal);
        if (isReferencePrField(key, label) && displayVal !== '-' && displayVal.trim() !== '') {
            const launchpadUrl = buildSapPrLaunchpadUrl(displayVal);
            if (launchpadUrl) {
                return (
                    <a
                        href={launchpadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 font-bold text-primary hover:underline text-sm"
                        title={t('task.openInS4Hana', 'Open in S/4HANA Fiori Launchpad')}
                    >
                        <span>{displayVal}</span>
                        <ExternalLink className="size-3.5 shrink-0" />
                    </a>
                );
            }
            return <span className="font-bold text-primary text-sm">{displayVal}</span>;
        }
        return displayVal;
    };

    return (
        <div className="space-y-6 w-full max-w-full overflow-hidden">
            {filteredTables.map((table) => (
                    <Card key={table.id} className="gap-0 bg-card border-border/70 shadow-sm w-full overflow-hidden">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">{table.title}</CardTitle>
                            {!isMobile && table.rows.length > 0 && (
                                <CardDescription>{t('task.clickRowDetails', 'Click a row to view complete details')}</CardDescription>
                            )}
                        </CardHeader>
                        <CardContent className="w-full overflow-hidden">
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
                                                        {renderCellValue(column.key, column.label, row.values[column.key])}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-xl border border-border/60 bg-white w-full">
                                    <Table className="min-w-max">
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
                                                        const selectedFields: Array<{ key?: string; label: string; value: string }> = [];
                                                        const displayedKeys = new Set<string>();

                                                        const normalizeKey = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, '');

                                                        const ALIAS_GROUPS: string[][] = [
                                                            ['material', 'materialnumber', 'matnr'],
                                                            ['commitmentitem', 'commitmentitemshortid'],
                                                            ['plant', 'plantcode', 'werke'],
                                                            ['storagelocation', 'storloc', 'lgort'],
                                                            ['referencepr', 'referencedocumentnumber', 'purchaserequisition', 'refdocnumber', 'refdocumentnumber', 'banfn'],
                                                            ['quantity', 'unit', 'uom', 'baseunit', 'meins', 'purchaseorderquantityunit', 'purreqnquantityunit'],
                                                        ];

                                                        const markKeyAndAliasesProcessed = (rawKey: string) => {
                                                            const norm = normalizeKey(rawKey);
                                                            displayedKeys.add(rawKey);
                                                            displayedKeys.add(norm);
                                                            for (const group of ALIAS_GROUPS) {
                                                                if (group.includes(norm)) {
                                                                    for (const alias of group) {
                                                                        displayedKeys.add(alias);
                                                                    }
                                                                }
                                                            }
                                                        };

                                                        for (const column of table.columns) {
                                                            selectedFields.push({
                                                                key: column.key,
                                                                label: column.label,
                                                                value: safe(row.values[column.key]),
                                                            });
                                                            markKeyAndAliasesProcessed(column.key);
                                                        }

                                                        for (const [key, value] of Object.entries(row.values)) {
                                                            const norm = normalizeKey(key);
                                                            if (displayedKeys.has(key) || displayedKeys.has(norm)) continue;

                                                            selectedFields.push({
                                                                key,
                                                                label: table.detailFieldLabels?.[key] || prettifyFieldLabel(key),
                                                                value: safe(value),
                                                            });
                                                            markKeyAndAliasesProcessed(key);
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
                                                            {renderCellValue(column.key, column.label, row.values[column.key])}
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
                                        {(selectedRow?.fields || []).map((item, idx) => (
                                            <TableRow key={`${item.key || item.label}-${idx}`}>
                                                <TableCell className="w-[42%] bg-muted/30 px-4 py-3 text-muted-foreground whitespace-normal">
                                                    {item.label}
                                                </TableCell>
                                                <TableCell className="px-4 py-3 font-medium break-all whitespace-normal">
                                                    {renderCellValue(item.key || '', item.label, item.value)}
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
