import { View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { spacing, useColors } from '@/theme';

/** Treats "-", "", " - " as no value (the renderers use "-" for empty fields). */
export function isEmptyValue(value: string | undefined): boolean {
    return !value || value.replace(/[\s-]/g, '') === '';
}

/**
 * Label on the left, value on the right (wrapping, multi-line aware) — the web's mobile field layout.
 * `highlight` colors the value with the accent (e.g. a reference PR number).
 */
export function FieldRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
    const colors = useColors();
    const empty = isEmptyValue(value);
    return (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.smd }}>
            <ThemedText variant="footnote" style={{ width: '40%' }}>
                {label}
            </ThemedText>
            <ThemedText
                variant="subhead"
                selectable
                style={{ flex: 1, textAlign: 'right', color: empty ? colors.tertiaryLabel : highlight ? colors.accent : colors.label, fontWeight: empty ? '400' : '500' }}
            >
                {empty ? '—' : value}
            </ThemedText>
        </View>
    );
}
