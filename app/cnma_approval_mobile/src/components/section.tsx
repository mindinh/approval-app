import type { ReactNode } from 'react';
import { View } from 'react-native';
import { radius, spacing, useColors } from '@/theme';
import { ThemedText } from './themed-text';

/** Inset-grouped section: caption title (optional trailing accessory), a rounded card and a footer. */
export function Section({ title, accessory, footer, children }: { title?: string; accessory?: ReactNode; footer?: string; children: ReactNode }) {
    const colors = useColors();
    return (
        <View style={{ gap: spacing.sm }}>
            {title || accessory ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, minHeight: 20 }}>
                    <ThemedText variant="caption" style={{ flex: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {title}
                    </ThemedText>
                    {accessory}
                </View>
            ) : null}
            <View style={{ backgroundColor: colors.cardBackground, borderRadius: radius.card, borderCurve: 'continuous', borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden' }}>{children}</View>
            {footer ? (
                <ThemedText variant="footnote" style={{ paddingHorizontal: spacing.md }}>
                    {footer}
                </ThemedText>
            ) : null}
        </View>
    );
}

/** Hairline between rows inside a Section, inset to align with row text. */
export function RowSeparator({ inset = spacing.md }: { inset?: number }) {
    const colors = useColors();
    return <View style={{ height: 0.5, marginLeft: inset, backgroundColor: colors.separator }} />;
}
