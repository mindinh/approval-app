import type { BusinessSectionModel, DetailField } from '@approval-core/renderers';
import { isReferencePrField } from '@approval-core/status-predicates';
import { Fragment } from 'react';
import { View } from 'react-native';
import { EmptyState } from '@/components/empty-state';
import { RowSeparator, Section } from '@/components/section';
import { ThemedText } from '@/components/themed-text';
import { radius, spacing, useColors } from '@/theme';
import { FieldRow, isEmptyValue } from './field-row';

/** Labels the web always shows as long text, even without `isLongText`. */
const LONG_TEXT_LABELS = new Set(['description', 'header note', 'header text', 'purpose', 'paid by', 'bank details', 'note', 'notes', 'remarks']);

const isLongText = (field: DetailField) => field.isLongText || LONG_TEXT_LABELS.has(field.label.toLowerCase());

/** The web renames the generic summary card. */
const cardTitle = (title: string) => (title === 'Document Summary' ? 'Overview' : title);

function LongTextField({ field }: { field: DetailField }) {
    const colors = useColors();
    const empty = isEmptyValue(field.value);
    return (
        <View style={{ gap: spacing.xs + 2, padding: spacing.md }}>
            <ThemedText variant="footnote">{field.label}</ThemedText>
            <View style={{ padding: spacing.smd, borderRadius: radius.md, borderCurve: 'continuous', backgroundColor: colors.fillBackground }}>
                <ThemedText variant="subhead" selectable style={{ color: empty ? colors.tertiaryLabel : colors.label, lineHeight: 21 }}>
                    {empty ? '—' : field.value}
                </ThemedText>
            </View>
        </View>
    );
}

/** Overview cards from the shared renderers: key–value rows, then long texts (notes, purpose…) in full. */
export function OverviewTab({ model }: { model: BusinessSectionModel }) {
    const colors = useColors();
    if (model.cards.length === 0) {
        return (
            <EmptyState icon={{ ios: 'doc.text.magnifyingglass', android: 'find_in_page' }} tint={{ foreground: colors.secondaryLabel, background: colors.fillBackground }} title="No overview data" />
        );
    }

    return (
        <View style={{ gap: spacing.lg }}>
            {model.cards.map((card) => {
                const regular = card.fields.filter((field) => !isLongText(field));
                const long = card.fields.filter(isLongText);
                return (
                    <Section key={card.id} title={cardTitle(card.title)}>
                        {regular.map((field, index) => (
                            <Fragment key={field.key}>
                                {index > 0 ? <RowSeparator /> : null}
                                <FieldRow label={field.label} value={field.value} highlight={isReferencePrField(field.key, field.label)} />
                            </Fragment>
                        ))}
                        {long.map((field, index) => (
                            <Fragment key={field.key}>
                                {regular.length > 0 || index > 0 ? <RowSeparator /> : null}
                                <LongTextField field={field} />
                            </Fragment>
                        ))}
                    </Section>
                );
            })}
        </View>
    );
}
