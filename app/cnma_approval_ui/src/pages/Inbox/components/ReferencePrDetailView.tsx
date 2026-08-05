import { useReferencePr } from '../hooks/useReferencePr';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Button,
    Badge,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@cnma/react-ui';
import {
    ArrowLeft,
    FileText,
    Building2,
    Calendar,
    User,
    DollarSign,
    Package,
    AlertTriangle,
    RotateCcw,
    ExternalLink,
    Tag,
    Layers,
} from 'lucide-react';
import { formatAmount, formatDate, EMPTY_VALUE } from '@/renderers/shared/formatters';
import { safe } from '../utils/formatters';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

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
    const { data: detail, isLoading, isError, error, refetch } = useReferencePr(prNumber);

    const formattedPrNumber = prNumber.replace(/^0+/, '');

    if (isLoading) {
        return (
            <div className="flex flex-col h-full bg-muted/30 w-full overflow-hidden">
                {/* Header Skeleton */}
                <div className="border-b border-border/60 bg-background p-4 space-y-3 shrink-0">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-xs font-medium">
                            <ArrowLeft className="size-4" />
                            <span>{parentDocumentId ? `Back to PO ${parentDocumentId}` : 'Back'}</span>
                        </Button>
                    </div>
                    <Skeleton className="h-7 w-64 rounded-md" />
                    <div className="flex gap-2">
                        <Skeleton className="h-5 w-24 rounded-full" />
                        <Skeleton className="h-5 w-32 rounded-full" />
                    </div>
                </div>
                {/* Body Skeleton */}
                <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                    <Skeleton className="h-44 w-full rounded-xl" />
                    <Skeleton className="h-64 w-full rounded-xl" />
                </div>
            </div>
        );
    }

    if (isError || !detail) {
        return (
            <div className="flex flex-col h-full bg-muted/30 w-full overflow-hidden">
                <div className="border-b border-border/60 bg-background p-4 shrink-0">
                    <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-xs font-medium">
                        <ArrowLeft className="size-4" />
                        <span>{parentDocumentId ? `Back to PO ${parentDocumentId}` : 'Back'}</span>
                    </Button>
                </div>
                <div className="flex flex-col items-center justify-center flex-1 p-8 text-center space-y-4 max-w-md mx-auto">
                    <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                        <AlertTriangle className="size-8" />
                    </div>
                    <h3 className="text-base font-bold text-foreground">
                        {t('error.failedLoadReferencePr', 'Failed to load Reference PR')}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {error?.message || t('error.unableToFetchPr', 'Unable to fetch details for PR')} #{formattedPrNumber}
                    </p>
                    <div className="flex items-center gap-3 pt-2">
                        <Button variant="default" size="sm" onClick={() => refetch()} className="gap-1.5 text-xs">
                            <RotateCcw className="size-3.5" />
                            {t('common.retry', 'Retry')}
                        </Button>
                        <Button variant="outline" size="sm" onClick={onBack} className="text-xs">
                            {t('common.goBack', 'Go Back')}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const { header, items = [] } = detail;
    const currency = header.currency || items[0]?.purReqnItemCurrency || 'VND';
    const totalAmountDisplay = header.totalAmount != null ? formatAmount(header.totalAmount, currency) : EMPTY_VALUE;

    const overviewFields = [
        { label: 'PR Number', value: header.purchaseRequisition, icon: FileText },
        { label: 'Document Type', value: header.purchaseRequisitionTypeDisplay || header.purchaseRequisitionType || EMPTY_VALUE, icon: Tag },
        { label: 'Requisitioner', value: header.createdByFullName || header.createdByUser || EMPTY_VALUE, icon: User },
        { label: 'Creation Date', value: formatDate(header.creationDate), icon: Calendar },
        { label: 'Status', value: header.purchaseRequisitionStatusText || header.purchaseRequisitionStatus || EMPTY_VALUE, icon: Layers },
        { label: 'Total Amount', value: totalAmountDisplay, icon: DollarSign, isHighlight: true },
        { label: 'Company Code', value: header.companyCodeName || header.companyCode || EMPTY_VALUE, icon: Building2 },
        { label: 'Purchasing Group', value: header.purchasingGroup || EMPTY_VALUE, icon: Package },
    ];

    return (
        <div className="flex flex-col h-full min-w-0 w-full max-w-full overflow-hidden bg-muted/30 relative">
            {/* Top Navigation Header */}
            <div className="border-b border-border/60 bg-background px-5 py-3.5 shrink-0 space-y-2">
                <div className="flex items-center justify-between gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onBack}
                        className="gap-1.5 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 rounded-lg px-2.5 py-1.5 -ml-2"
                    >
                        <ArrowLeft className="size-4" />
                        <span>{parentDocumentId ? `Back to PO ${parentDocumentId}` : 'Back to PO Task'}</span>
                    </Button>
                    <Badge variant="outline" className="gap-1.5 text-xs font-semibold bg-primary/5 text-primary border-primary/20 shrink-0">
                        <ExternalLink className="size-3" />
                        <span>Reference PR</span>
                    </Badge>
                </div>

                <div className="flex items-baseline justify-between gap-2">
                    <h2 className="text-xl font-bold text-foreground tracking-tight">
                        Purchase Requisition {header.purchaseRequisition}
                    </h2>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-1">
                    {header.purReqnDescription || `Reference Document details for PR ${header.purchaseRequisition}`}
                </p>
            </div>

            {/* Scrollable Content View */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-6">
                {/* Header Overview Card */}
                <Card className="gap-0 bg-white border-border/60 shadow-xs overflow-hidden">
                    <CardHeader className="pb-3 border-b border-border/30">
                        <CardTitle className="text-base font-bold text-foreground">
                            PR Overview & Header Facts
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5">
                        <div className={cn(
                            isMobile
                                ? "flex flex-col gap-3"
                                : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4"
                        )}>
                            {overviewFields.map((field) => (
                                <div key={field.label} className="flex flex-col gap-1">
                                    <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground opacity-80 flex items-center gap-1">
                                        <field.icon className="size-3" />
                                        <span>{field.label}</span>
                                    </span>
                                    <span className={cn(
                                        "text-sm font-semibold break-words",
                                        field.isHighlight ? "text-primary font-bold text-base" : "text-foreground"
                                    )}>
                                        {safe(field.value)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {header.headerNote && (
                            <div className="mt-4 pt-4 border-t border-border/30 space-y-1">
                                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground opacity-80">
                                    Header Notes / Purpose
                                </span>
                                <p className="text-sm font-medium text-foreground/90 bg-muted/20 p-3 rounded-lg border border-border/40 whitespace-pre-line leading-relaxed">
                                    {header.headerNote}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Line Items Section */}
                <Card className="gap-0 bg-white border-border/60 shadow-xs overflow-hidden">
                    <CardHeader className="pb-3 border-b border-border/30">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-bold text-foreground">
                                Line Items ({items.length})
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 sm:p-4">
                        {items.length === 0 ? (
                            <div className="p-8 text-center text-sm text-muted-foreground">
                                No line items available for this Reference PR.
                            </div>
                        ) : isMobile ? (
                            /* Mobile Stacked Items Card View */
                            <div className="divide-y divide-border/60 p-4">
                                {items.map((item) => {
                                    const itemCurr = item.purReqnItemCurrency || currency;
                                    const priceDisplay = item.purchaseRequisitionPrice != null ? formatAmount(item.purchaseRequisitionPrice, itemCurr) : EMPTY_VALUE;
                                    const totalDisplay = item.totalAmount != null ? formatAmount(item.totalAmount, itemCurr) : EMPTY_VALUE;

                                    return (
                                        <div key={item.purchaseRequisitionItem} className="py-4 first:pt-0 last:pb-0 space-y-2">
                                            <div className="flex items-center justify-between border-b border-border/30 pb-2">
                                                <Badge variant="outline" className="font-bold text-xs bg-muted/40">
                                                    Item #{item.purchaseRequisitionItem}
                                                </Badge>
                                                <span className="text-sm font-bold text-primary">
                                                    {totalDisplay}
                                                </span>
                                            </div>
                                            <div className="space-y-1.5 pt-1">
                                                <p className="text-sm font-semibold text-foreground leading-snug">
                                                    {item.purchaseRequisitionItemText || 'No description'}
                                                </p>
                                                {item.material && (
                                                    <p className="text-xs text-muted-foreground font-mono">
                                                        Material: {item.material}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/20">
                                                <div>
                                                    <span className="text-muted-foreground block text-[10px] uppercase">Quantity</span>
                                                    <span className="font-semibold text-foreground">{item.requestedQuantity ?? EMPTY_VALUE} {item.baseUnit || ''}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground block text-[10px] uppercase">Price</span>
                                                    <span className="font-semibold text-foreground">{priceDisplay}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground block text-[10px] uppercase">Plant</span>
                                                    <span className="font-semibold text-foreground">{item.plantName || item.plant || EMPTY_VALUE}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground block text-[10px] uppercase">Delivery Date</span>
                                                    <span className="font-semibold text-foreground">{formatDate(item.deliveryDate)}</span>
                                                </div>
                                                {item.costCenter && (
                                                    <div className="col-span-2">
                                                        <span className="text-muted-foreground block text-[10px] uppercase">Cost Center</span>
                                                        <span className="font-semibold text-foreground">{item.costCenterName || item.costCenter}</span>
                                                    </div>
                                                )}
                                                {item.glAccount && (
                                                    <div className="col-span-2">
                                                        <span className="text-muted-foreground block text-[10px] uppercase">G/L Account</span>
                                                        <span className="font-semibold text-foreground">{item.glAccountName || item.glAccount}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            /* Desktop Data Table View */
                            <div className="overflow-x-auto rounded-xl border border-border/60 bg-white">
                                <Table className="min-w-max">
                                    <TableHeader className="bg-muted/60">
                                        <TableRow className="border-border/60">
                                            <TableHead className="h-10 text-xs font-bold uppercase text-muted-foreground">Item</TableHead>
                                            <TableHead className="h-10 text-xs font-bold uppercase text-muted-foreground">Material / Description</TableHead>
                                            <TableHead className="h-10 text-xs font-bold uppercase text-muted-foreground">Plant</TableHead>
                                            <TableHead className="h-10 text-xs font-bold uppercase text-muted-foreground text-right">Quantity</TableHead>
                                            <TableHead className="h-10 text-xs font-bold uppercase text-muted-foreground text-right">Valuation Price</TableHead>
                                            <TableHead className="h-10 text-xs font-bold uppercase text-muted-foreground text-right">Total Value</TableHead>
                                            <TableHead className="h-10 text-xs font-bold uppercase text-muted-foreground">Delivery Date</TableHead>
                                            <TableHead className="h-10 text-xs font-bold uppercase text-muted-foreground">Cost Center / G/L</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map((item) => {
                                            const itemCurr = item.purReqnItemCurrency || currency;
                                            const priceDisplay = item.purchaseRequisitionPrice != null ? formatAmount(item.purchaseRequisitionPrice, itemCurr) : EMPTY_VALUE;
                                            const totalDisplay = item.totalAmount != null ? formatAmount(item.totalAmount, itemCurr) : EMPTY_VALUE;

                                            return (
                                                <TableRow key={item.purchaseRequisitionItem} className="border-border/50 hover:bg-muted/30">
                                                    <TableCell className="font-bold text-xs">{item.purchaseRequisitionItem}</TableCell>
                                                    <TableCell className="space-y-0.5 max-w-xs">
                                                        <div className="font-semibold text-sm text-foreground truncate">
                                                            {item.purchaseRequisitionItemText || 'Item'}
                                                        </div>
                                                        {item.material && (
                                                            <div className="text-xs text-muted-foreground font-mono">
                                                                {item.material}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-xs font-medium text-foreground">
                                                        {item.plantName || item.plant || EMPTY_VALUE}
                                                    </TableCell>
                                                    <TableCell className="text-xs font-semibold text-foreground text-right">
                                                        {item.requestedQuantity ?? EMPTY_VALUE} {item.baseUnit || ''}
                                                    </TableCell>
                                                    <TableCell className="text-xs font-semibold text-foreground text-right">
                                                        {priceDisplay}
                                                    </TableCell>
                                                    <TableCell className="text-xs font-bold text-primary text-right">
                                                        {totalDisplay}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {formatDate(item.deliveryDate)}
                                                    </TableCell>
                                                    <TableCell className="text-xs space-y-0.5">
                                                        {item.costCenter && (
                                                            <div className="text-foreground font-medium truncate max-w-xs">
                                                                CC: {item.costCenterName || item.costCenter}
                                                            </div>
                                                        )}
                                                        {item.glAccount && (
                                                            <div className="text-muted-foreground truncate max-w-xs">
                                                                GL: {item.glAccountName || item.glAccount}
                                                            </div>
                                                        )}
                                                        {!item.costCenter && !item.glAccount && <span className="text-muted-foreground">{EMPTY_VALUE}</span>}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Docked Action Footer Bar */}
            <div className="shrink-0 border-t border-border/60 bg-background px-5 py-3 flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                    <ExternalLink className="size-3.5 text-primary" />
                    <span>Viewing Reference PR #{header.purchaseRequisition}</span>
                </span>
                <Button variant="default" size="sm" onClick={onBack} className="gap-1.5 font-semibold text-xs">
                    <ArrowLeft className="size-3.5" />
                    <span>{parentDocumentId ? `Back to PO ${parentDocumentId}` : 'Back to PO Task'}</span>
                </Button>
            </div>
        </div>
    );
}
