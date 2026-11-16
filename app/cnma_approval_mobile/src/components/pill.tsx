import { View } from 'react-native';
import { radius, spacing, useColors, type ThemeColors } from '@/theme';
import { ThemedText } from './themed-text';

export type PillTone = 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

/** Foreground + soft background for a semantic tone. */
export function toneColors(colors: ThemeColors, tone: PillTone): { foreground: string; background: string } {
    switch (tone) {
        case 'accent':
            return { foreground: colors.accent, background: colors.accentSoft };
        case 'success':
            return { foreground: colors.success, background: colors.successSoft };
        case 'warning':
            return { foreground: colors.warning, background: colors.warningSoft };
        case 'danger':
            return { foreground: colors.danger, background: colors.dangerSoft };
        case 'info':
            return { foreground: colors.info, background: colors.infoSoft };
        default:
            return { foreground: colors.secondaryLabel, background: colors.fillBackground };
    }
}

/** Small soft-tinted label (status, CC…). `compact` is for inline use next to text. */
export function Pill({ label, tone = 'neutral', compact = false }: { label: string; tone?: PillTone; compact?: boolean }) {
    const colors = useColors();
    const { foreground, background } = toneColors(colors, tone);
    return (
        <View style={{ paddingHorizontal: compact ? spacing.xs + 2 : spacing.sm + 2, paddingVertical: compact ? 1 : 3, borderRadius: radius.full, backgroundColor: background }}>
            <ThemedText variant="caption" numberOfLines={1} style={{ color: foreground, fontWeight: '600', fontSize: compact ? 11 : 12 }}>
                {label}
            </ThemedText>
        </View>
    );
}
