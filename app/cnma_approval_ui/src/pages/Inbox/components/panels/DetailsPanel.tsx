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
    ToggleGroup,
    ToggleGroupItem,
} from '@cnma/react-ui';
import { ExternalLink, Trash2, Table as TableIcon, LayoutGrid, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import type { TaskDetail } from '@/services/inbox/inbox.types';
import type { BusinessSectionModel, DetailTableModel, DetailTableRow } from '@/renderers/TaskDetailSections.types';
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
}: {
    model: BusinessSectionModel;
    detail: TaskDetail;
    isMobile?: boolean;
    isSecondaryLoading?: boolean;
}) {
    const { t } = useTranslation();
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [collapsedCardIds, setCollapsedCardIds] = useState<Set<string>>(new Set());
    const [selectedRow, setSelectedRow] = useState<{
        tableTitle: string;
        rowId: string;
        fields: Array<{ label: string; value: string }>;
    } | null>(null);

    const toggleCardCollapse = (rowId: string) => {
        setCollapsedCardIds((prev) => {
            const next = new Set(prev);
            if (next.has(rowId)) {
                next.delete(rowId);
            } else {
                next.add(rowId);
            }
            return next;
        });
    };

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

    const checkIsDeleted = (row: { isDeleted?: boolean; values: Record<string, string> }) => {
        if (row.isDeleted) return true;
        const delVal = row.values.deleted ?? row.values.Deleted ?? row.values.LOEKZ ?? row.values.DeletedFlag ?? row.values.deletionFlag;
        if (delVal == null) return false;
        const strVal = String(delVal).trim();
        return strVal !== '' && strVal !== '-' && strVal !== '0' && strVal.toLowerCase() !== 'false';
    };

    const handleRowClick = (table: DetailTableModel, row: DetailTableRow) => {
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
    };

    return (
        <div className="space-y-6 w-full max-w-full overflow-hidden">
            {filteredTables.map((table) => (
                <Card key={table.id} className="gap-0 bg-card border-border/70 shadow-sm w-full overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
                        <div className="space-y-1">
                            <CardTitle className="text-base">{table.title}</CardTitle>
                            {!isMobile && table.rows.length > 0 && (
                                <CardDescription>
                                    {viewMode === 'table'
                                        ? t('task.clickRowDetails', 'Click a row to view complete details')
                                        : t('task.cardViewDesc', 'Full line items card view')}
                                </CardDescription>
                            )}
                        </div>
                        {!isMobile && table.rows.length > 0 && (
                            <ToggleGroup
                                type="single"
                                value={viewMode}
                                onValueChange={(val) => {
                                    if (val) setViewMode(val as 'table' | 'grid');
                                }}
                                className="inline-flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/40 shrink-0 shadow-2xs"
                                aria-label={t('task.switchViewMode', 'Switch view mode')}
                            >
                                <ToggleGroupItem
                                    value="table"
                                    aria-label={t('task.tableView', 'Table View')}
                                    className={cn(
                                        "h-8 px-3 py-1.5 text-xs font-semibold flex items-center gap-2 rounded-lg transition-all duration-150 border-0 cursor-pointer",
                                        "data-[state=on]:bg-white data-[state=on]:text-primary data-[state=on]:shadow-sm",
                                        "data-[state=off]:text-muted-foreground data-[state=off]:hover:text-foreground data-[state=off]:bg-transparent"
                                    )}
                                >
                                    <TableIcon className="size-4 shrink-0" />
                                    <span>{t('task.tableViewShort', 'Table')}</span>
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                    value="grid"
                                    aria-label={t('task.gridView', 'Card View')}
                                    className={cn(
                                        "h-8 px-3 py-1.5 text-xs font-semibold flex items-center gap-2 rounded-lg transition-all duration-150 border-0 cursor-pointer",
                                        "data-[state=on]:bg-white data-[state=on]:text-primary data-[state=on]:shadow-sm",
                                        "data-[state=off]:text-muted-foreground data-[state=off]:hover:text-foreground data-[state=off]:bg-transparent"
                                    )}
                                >
                                    <LayoutGrid className="size-4 shrink-0" />
                                    <span>{t('task.gridViewShort', 'Card')}</span>
                                </ToggleGroupItem>
                            </ToggleGroup>
                        )}
                    </CardHeader>
                    <CardContent className="w-full overflow-hidden">
                        {isMobile ? (
                            <div className="space-y-3.5 -mx-2">
                                {table.rows.length === 0 && (
                                    <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
                                        {table.emptyMessage || t('common.noData', 'No data')}
                                    </div>
                                )}
                                {table.rows.map((row, index) => {
                                    const isDeleted = checkIsDeleted(row);
                                    return (
                                        <div
                                            key={row.id}
                                            className={cn(
                                                "p-4 space-y-3 rounded-2xl border bg-background shadow-xs transition-all w-full",
                                                isDeleted
                                                    ? "bg-red-50/20 border-destructive/30"
                                                    : "border-border/70"
                                            )}
                                        >
                                            <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-md tracking-wider uppercase",
                                                    isDeleted ? "text-destructive bg-destructive/10" : "text-primary bg-primary/10"
                                                )}>
                                                    {t('task.itemNum', 'Item #{{num}}', { num: index + 1 })}
                                                </span>
                                                {isDeleted && (
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 px-2.5 py-0.5 rounded-full">
                                                        <Trash2 className="size-3.5 shrink-0" />
                                                        <span>{t('task.itemDeleted', 'Item Deleted')}</span>
                                                    </span>
                                                )}
                                            </div>
                                            <div className="space-y-2.5 text-xs">
                                                {table.columns.map((column) => (
                                                    <div
                                                        key={`${row.id}-${column.key}`}
                                                        className="flex items-start justify-between gap-3 border-b border-border/20 last:border-b-0 pb-1.5 last:pb-0"
                                                    >
                                                        <span className="text-xs font-medium text-muted-foreground pt-px w-4/12 shrink-0">
                                                            {column.label}
                                                        </span>
                                                        <span className="text-xs font-semibold text-foreground text-right break-words max-w-[66%] flex-1">
                                                            {renderCellValue(column.key, column.label, row.values[column.key])}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : viewMode === 'grid' ? (
                            <div className="space-y-3.5 w-full py-3">
                                {table.rows.length === 0 && (
                                    <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-center text-xs text-muted-foreground">
                                        {table.emptyMessage || t('common.noData', 'No data')}
                                    </div>
                                )}
                                {table.rows.map((row, index) => {
                                    const isDeleted = checkIsDeleted(row);
                                    const isCollapsed = collapsedCardIds.has(row.id);
                                    return (
                                        <Card
                                            key={row.id}
                                            className={cn(
                                                "group relative gap-0 rounded-xl border bg-white overflow-hidden w-full shadow-2xs transition-all duration-200 hover:shadow-md",
                                                isDeleted
                                                    ? "bg-red-50/20 border-destructive/30"
                                                    : "border-border/70 hover:border-border/90"
                                            )}
                                        >
                                            <div
                                                onClick={() => toggleCardCollapse(row.id)}
                                                className={cn(
                                                    "px-4.5 py-3 bg-muted/40 flex items-center justify-between cursor-pointer select-none transition-colors hover:bg-muted/70",
                                                    !isCollapsed && "border-b border-border/50"
                                                )}
                                            >
                                                <span className={cn(
                                                    "inline-flex items-center gap-1.5 text-xs font-bold tracking-tight px-2.5 py-1 rounded-md",
                                                    isDeleted ? "text-destructive bg-destructive/10" : "text-primary bg-primary/10"
                                                )}>
                                                    {t('task.itemNum', 'Item #{{num}}', { num: index + 1 })}
                                                </span>
                                                <div className="flex items-center gap-2.5">
                                                    {isDeleted && (
                                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 px-2.5 py-1 rounded-full">
                                                            <Trash2 className="size-3.5 shrink-0" />
                                                            <span>{t('task.itemDeleted', 'Item Deleted')}</span>
                                                        </span>
                                                    )}
                                                    <div className="flex items-center justify-center p-1 rounded-md text-muted-foreground group-hover:text-foreground transition-colors">
                                                        {isCollapsed ? (
                                                            <ChevronDown className="size-4 shrink-0" />
                                                        ) : (
                                                            <ChevronUp className="size-4 shrink-0" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {!isCollapsed && (
                                                <div className="p-4.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3.5 text-sm">
                                                    {table.columns.map((column) => (
                                                        <div
                                                            key={`${row.id}-${column.key}`}
                                                            className="flex items-center justify-between gap-3 border-b border-border/30 pb-2"
                                                        >
                                                            <span className="text-xs font-medium text-muted-foreground shrink-0 w-5/12 truncate" title={column.label}>
                                                                {column.label}
                                                            </span>
                                                            <span className="text-sm font-semibold text-foreground text-right break-words max-w-[58%]">
                                                                {renderCellValue(column.key, column.label, row.values[column.key])}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </Card>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-xl border border-border/60 bg-white w-full">
                                <Table className="min-w-max">
                                    <TableHeader className="bg-muted/90">
                                        <TableRow className="border-border/70 bg-transparent hover:bg-transparent">
                                            <TableHead className="h-11 w-10 px-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
                                                <span className="sr-only">{t('task.status', 'Status')}</span>
                                            </TableHead>
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
                                                    colSpan={table.columns.length + 1}
                                                    className="px-4 py-8 text-center text-muted-foreground whitespace-normal"
                                                >
                                                    {table.emptyMessage || t('common.noData', 'No data')}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {table.rows.map((row) => {
                                            const isDeleted = checkIsDeleted(row);
                                            return (
                                                <TableRow
                                                    key={row.id}
                                                    onClick={() => handleRowClick(table, row)}
                                                    className={cn(
                                                        'border-border/60 cursor-pointer transition-colors',
                                                        isDeleted
                                                            ? 'bg-muted/40 text-foreground hover:bg-muted/60'
                                                            : 'hover:bg-primary/5'
                                                    )}
                                                >
                                                    <TableCell className="w-10 px-2 text-center align-middle shrink-0 no-underline">
                                                        {isDeleted && (
                                                            <Trash2
                                                                className="size-4 text-destructive/90 inline-block align-middle shrink-0"
                                                                title={t('task.itemDeleted', 'Item Deleted')}
                                                            />
                                                        )}
                                                    </TableCell>
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
                                            );
                                        })}
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
