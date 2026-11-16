import { Platform, type TextStyle, type ViewStyle } from 'react-native';
import type { ThemeColors } from './colors';

export { useColors, type ThemeColors } from './colors';
export { restoreAppearance, useAppearancePreference, type AppearancePreference } from './appearance';
export { cssEasing, duration, easing, fadeInContent, messageIn, riseIn } from './motion';

/** 4-pt spacing grid. `smd` (12) is the vertical padding of list rows. */
export const spacing = { xs: 4, sm: 8, smd: 12, md: 16, lg: 24, xl: 32 } as const;

/** `card` is the one corner radius of every surface card (sections, task cards, tiles). */
export const radius = { sm: 8, md: 12, lg: 16, card: 20, xl: 24, full: 9999 } as const;

/**
 * Content width caps: single column never stretches past `maxContentWidth` (it centers);
 * two-column layouts on expanded windows (tablet, unfolded phone) cap at `maxWideContentWidth`.
 */
export const layout = { maxFormWidth: 520, maxContentWidth: 720, maxWideContentWidth: 1100, sideColumnWidth: 340 } as const;

/** Text ramp mirroring Apple text styles. Colors are applied by ThemedText (see `secondaryTextVariants`). */
export const type = {
    largeTitle: { fontSize: 34, fontWeight: '700', letterSpacing: -0.4 },
    /** Tab root titles (in-content header). */
    screenTitle: { fontSize: 30, fontWeight: '700', letterSpacing: -0.4 },
    title: { fontSize: 22, fontWeight: '600', letterSpacing: -0.2 },
    /** Panel titles (error panel). */
    title2: { fontSize: 20, fontWeight: '600', letterSpacing: -0.2 },
    /** Section titles on Home. */
    title3: { fontSize: 19, fontWeight: '600' },
    headline: { fontSize: 17, fontWeight: '600' },
    body: { fontSize: 17, fontWeight: '400' },
    callout: { fontSize: 16, fontWeight: '400' },
    subhead: { fontSize: 15, fontWeight: '400' },
    footnote: { fontSize: 13, fontWeight: '400' },
    caption: { fontSize: 12, fontWeight: '500' },
    /** Big numbers (KPI tiles, chart centers). */
    stat: { fontSize: 26, lineHeight: 30, fontWeight: '700', fontVariant: ['tabular-nums'] },
    statLarge: { fontSize: 30, lineHeight: 34, fontWeight: '700', fontVariant: ['tabular-nums'] },
    mono: { fontSize: 12, fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }) },
} as const satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;

/** Variants drawn in the secondary label color; the rest use the primary label color. */
export const secondaryTextVariants: ReadonlySet<TypeVariant> = new Set(['subhead', 'footnote', 'caption']);

/** Elevation as boxShadow strings (light mode reads them; dark mode relies on surface contrast). */
export const shadows = {
    card: '0 1px 2px rgba(28, 31, 35, 0.04), 0 4px 12px rgba(28, 31, 35, 0.05)',
    raised: '0 10px 30px rgba(28, 31, 35, 0.12)',
    /** Soft colored glow under the red hero surface. */
    hero: '0 12px 28px rgba(176, 24, 16, 0.22)',
} as const;

/**
 * The one raised card surface (task cards, line items, workflow, KPI tiles, error panel): card background,
 * hairline border, card radius and shadow. Grouped lists (Section) stay flat on purpose, like iOS settings.
 */
export function cardSurface(colors: ThemeColors): ViewStyle {
    return { borderRadius: radius.card, borderCurve: 'continuous', backgroundColor: colors.cardBackground, borderWidth: 1, borderColor: colors.cardBorder, boxShadow: shadows.card };
}
