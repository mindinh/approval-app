import { useColorScheme } from 'react-native';

/**
 * App palette: quiet neutral surfaces with the Conarum red (#CC0000) as the single brand accent, softened
 * for a calm, clean look — the full-strength red is kept for the hero gradient and the logo; everyday
 * tints (selection, links, toggles) use a lighter, slightly warmer red so screens never feel loud.
 * Status colors are muted and distinct from the brand red (danger is deeper and darker). The same palette
 * is used on iOS and Android so both look identical (no Material You wallpaper tint).
 */
const PALETTES = {
    light: {
        label: '#1C1F23',
        secondaryLabel: '#5E6670',
        tertiaryLabel: '#8D949D',
        separator: '#E7E8EB',
        groupedBackground: '#F6F6F8',
        cardBackground: '#FFFFFF',
        fillBackground: '#F0F1F3',
        /** Hairline around cards; light mode leans on the shadow, so it is barely there. */
        cardBorder: '#1C1F230D',
        /** Raised control on a fill (selected segment). */
        elevatedBackground: '#FFFFFF',

        accent: '#D12F2A',
        accentStrong: '#A8211C',
        accentSoft: '#D12F2A14',
        onAccent: '#FFFFFF',
        /** Hero gradient (Home summary, sign-in mark): the Conarum red, from bright to deep. */
        heroFrom: '#E5483F',
        heroTo: '#B01810',
        onHero: '#FFFFFF',
        /** Exact Conarum logo red (logo artwork only). */
        brand: '#CC0000',

        success: '#2F855A',

        /** Text and icons on a filled success button (Approve). */

        onSuccess: '#FFFFFF',
        successSoft: '#2F855A14',
        warning: '#B7791F',
        warningSoft: '#D69E2E1F',
        danger: '#9B1C1C',
        dangerSoft: '#9B1C1C12',
        info: '#2B6CB0',
        infoSoft: '#2B6CB014',
    },
    // Dark mode: a soft charcoal (never pure black) that is easier on the eyes. Surfaces step up clearly in
    // lightness (background → card → fill → raised) so cards stand out without shadows, text is off-white
    // rather than #FFF to cut glare, and accent/status colors are slightly desaturated pastels that stay
    // above 4.5:1 on cards.
    dark: {
        label: '#ECEEF1',
        secondaryLabel: '#B3B9C2',
        tertiaryLabel: '#8D949E',
        separator: '#3A3E46',
        groupedBackground: '#181A1E',
        cardBackground: '#23262B',
        fillBackground: '#2F333A',
        cardBorder: '#FFFFFF14',
        elevatedBackground: '#40454D',

        accent: '#F07A71',
        accentStrong: '#F69A92',
        accentSoft: '#F07A7129',
        onAccent: '#2B0907',
        heroFrom: '#C2443C',
        heroTo: '#80211B',
        onHero: '#FFFFFF',
        brand: '#E02424',

        success: '#72CF9A',

        onSuccess: '#0E2A1B',
        successSoft: '#72CF9A29',
        warning: '#EBC271',
        warningSoft: '#EBC27129',
        danger: '#F28D86',
        dangerSoft: '#F28D8629',
        info: '#8DB9F0',
        infoSoft: '#8DB9F029',
    },
} as const;

export type ThemeColors = (typeof PALETTES)['light' | 'dark'];

/** The app palette for the current color scheme (stable object per scheme). Read it at render time. */
export function useColors(): ThemeColors {
    return PALETTES[useColorScheme() === 'dark' ? 'dark' : 'light'];
}
