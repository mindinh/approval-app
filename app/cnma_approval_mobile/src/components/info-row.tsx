import type { SymbolViewProps } from 'expo-symbols';
import { View } from 'react-native';
import { spacing, useColors } from '@/theme';
import { CopyableText } from './copyable-text';
import { Icon } from './icon';
import { ThemedText } from './themed-text';

/** Label above a value that copies on long press, with an optional leading icon. */
export function InfoRow({ label, value, icon, mono = false }: { label: string; value?: string; icon?: SymbolViewProps['name']; mono?: boolean }) {
    const colors = useColors();
    return (
        <View style={{ flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.smd }}>
            {icon ? (
                <View style={{ paddingTop: 2 }}>
                    <Icon name={icon} size={20} color={colors.secondaryLabel} />
                </View>
            ) : null}
            <View style={{ flex: 1, gap: 2 }}>
                <ThemedText variant="footnote">{label}</ThemedText>
                <CopyableText variant={mono ? 'mono' : 'body'} label={label} copyValue={value ?? ''}>
                    {value || '—'}
                </CopyableText>
            </View>
        </View>
    );
}
