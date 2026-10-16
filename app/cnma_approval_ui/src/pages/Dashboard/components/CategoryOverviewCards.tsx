import { useTranslation } from 'react-i18next';
import { ChevronDown, X } from 'lucide-react';
import { Button, Card, Progress } from '@cnma/react-ui';

import type { CategoryType, CategoryCounts, TaskTypeCount } from '../use-dashboard-data';
import { cn } from '@/lib/utils';

/**
 * Theme tokens per category. These resolve to the same values the rest of the app
 * already uses for these business objects (see CATEGORY_COLORS in use-dashboard-data),
 * but expressed as semantic utilities so the palette stays owned by the theme.
 */
interface CategoryStyle {
    /** Solid badge carrying the category name */
    badge: string;
    /** Card surface + border while the category is selected */
    surface: string;
    /** Ring drawn around a selected card or document-type row */
    ring: string;
    /** Accent foreground for chevrons and selected labels */
    accent: string;
    /** Colours the Progress indicator for this category */
    bar: string;
}

/** Keeps a non-zero pending count visible even when its share rounds to almost nothing. */
const MIN_VISIBLE_RATIO = 4;

/**
 * The four business categories surfaced as overview cards, in display order.
 * `OTHER` is deliberately excluded — it is a catch-all bucket for unmapped
 * document categories and has no meaning as a card the user can drill into.
 */
const CARD_CATEGORIES: Array<{
    category: CategoryType;
    labelKey: string;
    fallbackLabel: string;
    style: CategoryStyle;
}> = [
    {
        category: 'PR',
        labelKey: 'dashboard.categories.pr',
        fallbackLabel: 'Purchase Requisition',
        style: {
            badge: 'bg-primary text-primary-foreground',
            surface: 'bg-marketing-negative-bg border-primary',
            ring: 'ring-2 ring-primary/20',
            accent: 'text-primary',
            bar: '[&>[data-slot=progress-indicator]]:bg-primary',
        },
    },
    {
        category: 'PO',
        labelKey: 'dashboard.categories.po',
        fallbackLabel: 'Purchase Order',
        style: {
            badge: 'bg-info text-white',
            surface: 'bg-info-bg border-info',
            ring: 'ring-2 ring-info/20',
            accent: 'text-info',
            bar: '[&>[data-slot=progress-indicator]]:bg-info',
        },
    },
    {
        category: 'CLAIM',
        labelKey: 'dashboard.categories.claim',
        fallbackLabel: 'Claim Form',
        style: {
            badge: 'bg-success text-white',
            surface: 'bg-success-bg border-success',
            ring: 'ring-2 ring-success/20',
            accent: 'text-success',
            bar: '[&>[data-slot=progress-indicator]]:bg-success',
        },
    },
    {
        category: 'RESV',
        labelKey: 'dashboard.categories.resv',
        fallbackLabel: 'Reservation',
        style: {
            badge: 'bg-warning text-white',
            surface: 'bg-warning-bg border-warning',
            ring: 'ring-2 ring-warning/20',
            accent: 'text-warning',
            bar: '[&>[data-slot=progress-indicator]]:bg-warning',
        },
    }
];

interface CategoryOverviewCardsProps {
    selectedCategory: CategoryType | '';
    onSelectCategory: (category: CategoryType | '') => void;
    selectedType: string;
    onSelectType: (type: string) => void;
    /** Active status filter, which decides which count each card leads with. */
    activeStatus: string | null;
    typesData: TaskTypeCount[];
    counts: CategoryCounts;
    pendingCounts: CategoryCounts;
    completedCounts: CategoryCounts;
}

/**
 * Four category roll-up cards. Tapping a card selects that category and reveals
 * the document types inside it; tapping a type narrows the dashboard further.
 */
export function CategoryOverviewCards({
    selectedCategory,
    onSelectCategory,
    selectedType,
    onSelectType,
    activeStatus,
    typesData,
    counts,
    pendingCounts,
    completedCounts,
}: CategoryOverviewCardsProps) {
    const { t } = useTranslation();

    // The lead figure follows the status filter above: filtering to Completed makes
    // the completed count the interesting one, otherwise it is the pending backlog.
    const showingCompleted = activeStatus === 'Completed';
    const statusLabel = showingCompleted
        ? t('dashboard.status.completed', 'Completed')
        : t('dashboard.status.inApproving', 'In Approving');
    const statusTextClass = showingCompleted ? 'text-success' : 'text-warning';
    const statusBadgeClass = showingCompleted ? 'border-success/60 bg-success-bg' : 'border-warning/60 bg-warning-bg';
    const statusChipClass = showingCompleted
        ? 'border-success/60 bg-success-bg text-success'
        : 'border-warning/60 bg-warning-bg text-warning';
    const leadCounts = showingCompleted ? completedCounts : pendingCounts;

    const activeCard = CARD_CATEGORIES.find((c) => c.category === selectedCategory);
    const activeTypes = selectedCategory ? typesData.filter((item) => item.category === selectedCategory) : [];

    const handleToggleCategory = (category: CategoryType) => {
        // Re-tapping the open card collapses it back to "all categories".
        onSelectCategory(selectedCategory === category ? '' : category);
        onSelectType('');
    };

    return (
        <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    {t('dashboard.categories.title', 'Categories Overview')}
                </h2>
                {/* Echoes whichever status the donut is filtered to, not just Completed */}
                {activeStatus && (
                    <span className={cn('rounded-full border px-2 py-0.5 text-xs font-semibold', statusChipClass)}>
                        {t('dashboard.categories.showingStatus', 'Showing {{status}}', { status: statusLabel })}
                    </span>
                )}
            </div>

            {/* ── The four category cards ─────────────────────────── */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {CARD_CATEGORIES.map(({ category, labelKey, fallbackLabel, style }) => {
                    const isSelected = selectedCategory === category;

                    return (
                        <Button
                            key={category}
                            variant="ghost"
                            aria-pressed={isSelected}
                            onClick={() => handleToggleCategory(category)}
                            className={cn(
                                'h-auto w-full flex-col items-stretch justify-between gap-0 whitespace-normal rounded-2xl border p-3.5 text-left',
                                isSelected
                                    ? cn(style.surface, style.ring, 'shadow-sm')
                                    : 'border-border bg-card shadow-2xs hover:bg-accent'
                            )}
                        >
                            {/* Full category name, carried by the coloured badge itself */}
                            <span className="mb-2 flex h-8 items-center">
                                <span
                                    className={cn(
                                        'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold leading-snug shadow-2xs',
                                        style.badge
                                    )}
                                >
                                    {t(labelKey, fallbackLabel)}
                                </span>
                            </span>

                            {/* Lead status count / Total */}
                            <span className="grid grid-cols-2 gap-1.5 rounded-xl border border-border bg-muted/80 p-2">
                                <span className="flex min-w-0 flex-col">
                                    <span className={cn('truncate text-xs font-semibold', statusTextClass)} title={statusLabel}>
                                        {statusLabel}
                                    </span>
                                    <span className={cn('mt-0.5 text-base font-bold leading-none tabular-nums', statusTextClass)}>
                                        {leadCounts[category]}
                                    </span>
                                </span>

                                <span className="flex min-w-0 flex-col border-l border-border pl-2">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {t('dashboard.categories.total', 'Total')}
                                    </span>
                                    <span className="mt-0.5 text-base font-bold leading-none tabular-nums text-foreground">
                                        {counts[category]}
                                    </span>
                                </span>
                            </span>

                            {/* Expand affordance, tinted with the category colour */}
                            <span className="mt-2.5 flex items-center justify-between border-t border-border/60 pt-2">
                                <span className={cn('text-xs font-bold', isSelected ? style.accent : 'text-muted-foreground')}>
                                    {isSelected
                                        ? t('dashboard.categories.hideDetail', 'Hide detail')
                                        : t('dashboard.categories.showDetail', 'Show detail')}
                                </span>
                                <ChevronDown
                                    className={cn(
                                        'size-3.5 transition-transform duration-200',
                                        isSelected ? cn('rotate-180', style.accent) : 'text-muted-foreground'
                                    )}
                                />
                            </span>
                        </Button>
                    );
                })}
            </div>

            {/* ── Document types inside the selected category ──────── */}
            {activeCard && (
                <Card className="gap-0 space-y-2.5 rounded-2xl border-border p-3.5 shadow-xs">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                        <div className="flex items-center gap-2">
                            <span className={cn('rounded-md px-2 py-0.5 text-xs font-bold', activeCard.style.badge)}>
                                {t(activeCard.labelKey, activeCard.fallbackLabel)}
                            </span>
                            <span className="text-xs font-semibold text-foreground">
                                {t('dashboard.categories.breakdown', 'Document Types Breakdown')}
                            </span>
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                onSelectCategory('');
                                onSelectType('');
                            }}
                            className="h-auto gap-1 rounded-lg bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground"
                        >
                            <span>{t('common.close', 'Close')}</span>
                            <X className="size-3" />
                        </Button>
                    </div>

                    {activeTypes.length === 0 ? (
                        <p className="py-3 text-center text-xs text-muted-foreground">
                            {t('dashboard.categories.noTypes', 'No document types in this category.')}
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {activeTypes.map((item) => {
                                const isTypeSelected = selectedType === item.rawDocType;
                                // Mirror whichever status the cards are leading with, so the
                                // row never reads "0 pending" while showing completed work.
                                const leadCount = showingCompleted ? item.completedCount : item.inApprovingCount;
                                const leadRatio = item.count > 0 ? (leadCount / item.count) * 100 : 0;
                                const hasLead = leadCount > 0;

                                return (
                                    <Button
                                        key={item.type}
                                        variant="ghost"
                                        aria-pressed={isTypeSelected}
                                        onClick={() => onSelectType(isTypeSelected ? '' : item.rawDocType)}
                                        className={cn(
                                            'h-auto w-full flex-col items-stretch gap-1.5 whitespace-normal rounded-xl border p-2.5 text-left shadow-2xs',
                                            isTypeSelected
                                                ? cn(activeCard.style.surface, activeCard.style.ring)
                                                : 'border-border bg-muted/40 hover:bg-muted'
                                        )}
                                    >
                                        <span className="flex items-center justify-between gap-2 text-xs">
                                            <span
                                                className={cn(
                                                    'truncate font-semibold',
                                                    isTypeSelected ? activeCard.style.accent : 'text-foreground'
                                                )}
                                                title={item.type}
                                            >
                                                {item.type}
                                            </span>

                                            {/* One combined badge: active status out of total */}
                                            <span
                                                className={cn(
                                                    'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs tabular-nums',
                                                    hasLead ? statusBadgeClass : 'border-border bg-muted'
                                                )}
                                            >
                                                <span className={cn('font-bold', hasLead ? statusTextClass : 'text-muted-foreground')}>
                                                    {t('dashboard.categories.nStatus', '{{count}} {{status}}', {
                                                        count: leadCount,
                                                        status: statusLabel,
                                                    })}
                                                </span>
                                                <span className="text-muted-foreground">/</span>
                                                <span className="font-medium text-foreground">
                                                    {t('dashboard.categories.nTotal', '{{count}} total', { count: item.count })}
                                                </span>
                                            </span>
                                        </span>

                                        {/* Share of this type still awaiting approval */}
                                        <Progress
                                            value={hasLead ? Math.max(MIN_VISIBLE_RATIO, leadRatio) : 0}
                                            className={cn('h-1.5 bg-accent', activeCard.style.bar)}
                                            aria-label={t('dashboard.categories.barTitle', '{{count}} {{status}} out of {{total}} total', {
                                                count: leadCount,
                                                status: statusLabel,
                                                total: item.count,
                                            })}
                                        />
                                    </Button>
                                );
                            })}
                        </div>
                    )}
                </Card>
            )}
        </section>
    );
}

export default CategoryOverviewCards;
