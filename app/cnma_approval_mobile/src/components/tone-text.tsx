import type { Tone as ModuleTone } from '@approval-core/renderers';
import { useColors, type ThemeColors } from '@/theme';
import { ThemedText } from './themed-text';

export type TextTone = 'accent' | 'success' | 'pending' | 'warning' | 'danger' | 'info' | 'neutral';

/** Foreground + soft background of a semantic tone (backgrounds only for real surfaces, e.g. timeline dots). */
export function toneColors(colors: ThemeColors, tone: TextTone): { foreground: string; background: string } {
    switch (tone) {
        case 'accent':
            return { foreground: colors.accent, background: colors.accentSoft };
        case 'success':
            return { foreground: colors.success, background: colors.successSoft };
        case 'pending':
            return { foreground: colors.pending, background: colors.pendingSoft };
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

/**
 * The color of a renderer module tone (PR, PO, Claim, Reservation): red, blue, green, amber like the web, in
 * softer shades. Used for category icons and accent edges only, never as a filled shape.
 */
export function categoryColor(colors: ThemeColors, tone: ModuleTone): string {
    switch (tone) {
        case 'info':
            return colors.categoryPO;
        case 'success':
            return colors.categoryClaim;
        case 'warning':
            return colors.categoryReservation;
        default:
            return colors.categoryPR;
    }
}

/**
 * Status and short labels (In Approving, Completed, CC, Overdue…) as colored semibold text, without a badge
 * shape: hierarchy comes from color and weight, so cards stay calm and easy to scan.
 */
export function ToneText({ label, tone = 'neutral', size = 'caption' }: { label: string; tone?: TextTone; size?: 'caption' | 'footnote' }) {
    const colors = useColors();
    return (
        <ThemedText variant={size} numberOfLines={1} style={{ color: toneColors(colors, tone).foreground, fontWeight: '600' }}>
            {label}
        </ThemedText>
    );
}
