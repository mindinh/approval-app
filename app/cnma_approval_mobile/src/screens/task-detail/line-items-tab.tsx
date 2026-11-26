import type { BusinessSectionModel, DetailTableColumn, DetailTableRow } from '@approval-core/renderers';
import { Fragment, memo, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { EmptyState } from '@/components/empty-state';
import { Icon } from '@/components/icon';
import { ToneText } from '@/components/tone-text';
import { RowSeparator } from '@/components/section';
import { ThemedText } from '@/components/themed-text';
import { cardSurface, cssEasing, duration, radius, spacing, useColors } from '@/theme';
import { FieldRow, useReferencePrLink } from './field-row';

/** Columns shown on a collapsed item card (the first, highest-priority columns of the table). */
const SUMMARY_COLUMNS = 3;
/** Documents with up to this many items open every card (like the web); longer ones start collapsed. */
const EXPAND_ALL_UP_TO = 10;
/** Items rendered at first per table; the rest come in pages behind a "Show more" button. */
const ITEMS_PAGE = 20;

/**
 * One line item as a collapsible card (guide §5.7): open by default with every column for short documents,
 * like the web; tapping collapses it to the first columns. The chevron rotates; rows revealed by a tap fade
 * in (never on first mount, so a long document does not start dozens of animations at once).
 */
const LineItemCard = memo(function LineItemCard({ index, row, columns, startExpanded }: { index: number; row: DetailTableRow; columns: readonly DetailTableColumn[]; startExpanded: boolean }) {
    const colors = useColors();
    const reduceMotion = useReducedMotion();
    const referencePrLink = useReferencePrLink();
    const [expanded, setExpanded] = useState(startExpanded);
    const [toggled, setToggled] = useState(false);
    const summary = columns.slice(0, SUMMARY_COLUMNS);
    const rest = columns.slice(SUMMARY_COLUMNS);
    const shownColumns = expanded ? columns : summary;

    return (
        // Web: a deleted item gets a red-tinted card edge and an "Item Deleted" pill with a trash icon.
        <View style={{ ...cardSurface(colors), overflow: 'hidden', ...(row.isDeleted ? { borderColor: `${colors.danger}66` } : null) }}>
            <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                accessibilityLabel={`Item ${index + 1}${row.isDeleted ? ', item deleted' : ''}`}
                disabled={rest.length === 0}
                onPress={() => {
                    setToggled(true);
                    setExpanded((value) => !value);
                }}
                style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.sm,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.smd,
                    backgroundColor: pressed ? colors.fillBackground : 'transparent',
                })}
            >
                <ToneText label={`Item ${index + 1}`} tone={row.isDeleted ? 'danger' : 'neutral'} />
                {row.isDeleted ? <DeletedPill /> : null}
                <View style={{ flex: 1 }} />
                {rest.length > 0 ? (
                    <Animated.View
                        style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }], transitionProperty: 'transform', transitionDuration: duration.base, transitionTimingFunction: cssEasing.out }}
                    >
                        <Icon name={{ ios: 'chevron.down', android: 'expand_more' }} size={16} color={colors.secondaryLabel} />
                    </Animated.View>
                ) : null}
            </Pressable>
            {shownColumns.map((column, columnIndex) => {
                const revealed = columnIndex >= SUMMARY_COLUMNS;
                const content = (
                    <>
                        <RowSeparator />
                        <FieldRow
                            label={column.label}
                            value={row.values[column.key] ?? ''}
                            onOpen={referencePrLink(column.key, column.label, row.values[column.key] ?? '')}
                            openLabel="View Reference PR"
                        />
                    </>
                );
                return revealed && toggled && !reduceMotion ? (
                    <Animated.View key={column.key} entering={FadeIn.duration(duration.base)}>
                        {content}
                    </Animated.View>
                ) : (
                    <Fragment key={column.key}>{content}</Fragment>
                );
            })}
        </View>
    );
});

/** Web "Item Deleted" pill: trash icon and label on a soft danger tint. */
function DeletedPill() {
    const colors = useColors();
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full, backgroundColor: colors.dangerSoft }}>
            <Icon name={{ ios: 'trash', android: 'delete' }} size={11} color={colors.danger} />
            <ThemedText variant="caption" style={{ color: colors.danger, fontWeight: '600' }}>
                Item Deleted
            </ThemedText>
        </View>
    );
}

/** Line-item tables from the shared renderers, one expandable card per row. */
export function LineItemsTab({ model }: { model: BusinessSectionModel }) {
    const colors = useColors();
    const [shown, setShown] = useState(ITEMS_PAGE);
    const tables = model.tables.filter((table) => table.rows.length > 0);
    const startExpanded = tables.reduce((sum, table) => sum + table.rows.length, 0) <= EXPAND_ALL_UP_TO;
    if (tables.length === 0) {
        return <EmptyState icon={{ ios: 'list.bullet.rectangle', android: 'list_alt' }} tint={{ foreground: colors.secondaryLabel, background: colors.fillBackground }} title="No line items" />;
    }

    return (
        <View style={{ gap: spacing.lg }}>
            {tables.map((table) => {
                const columns = table.columns;
                return (
                    <View key={table.id} style={{ gap: spacing.smd }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xs }}>
                            <ThemedText variant="headline" style={{ flex: 1 }}>
                                {table.title}
                            </ThemedText>
                        </View>
                        {table.rows.slice(0, shown).map((row, index) => (
                            <LineItemCard key={row.id} index={index} row={row} columns={columns} startExpanded={startExpanded} />
                        ))}
                        {table.rows.length > shown ? (
                            <Pressable
                                accessibilityRole="button"
                                onPress={() => setShown((count) => count + ITEMS_PAGE)}
                                style={({ pressed }) => ({ alignItems: 'center', paddingVertical: spacing.smd, borderRadius: radius.card, backgroundColor: pressed ? colors.fillBackground : colors.cardBackground, borderWidth: 1, borderColor: colors.cardBorder })}
                            >
                                <ThemedText variant="headline" style={{ color: colors.accent }}>
                                    Show {Math.min(ITEMS_PAGE, table.rows.length - shown)} more of {table.rows.length - shown}
                                </ThemedText>
                            </Pressable>
                        ) : null}
                    </View>
                );
            })}
        </View>
    );
}
