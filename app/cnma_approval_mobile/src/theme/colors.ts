import { useColorScheme } from 'react-native';
import { useBrandTheme, type BrandTheme } from './brand';

/*
 * App palette = neutral base (surfaces, text, status, categories) + one brand accent set.
 *
 * Color roles are kept apart on purpose:
 * - brand accent (Conarum red or SAP blue): CTAs, active navigation, links, selection — used sparingly
 * - status, as on the web: In Approving is a fresh amber, done is green, overdue/CC orange; red (danger)
 *   only means something went wrong or was rejected
 * - categories keep the web's object-type colors (PR red, PO blue, Claim green, Reservation amber), in
 *   fresher, softer shades so they read as a type hint, not as a status
 * - text on a filled color is always white: filled surfaces use the *Fill tokens (deeper in dark mode,
 *   where accent/success/danger are pastels meant for text on dark cards)
 * The same palette is used on iOS and Android so both look identical.
 */
const BASE = {
    light: {
        label: '#1C1F23',
        secondaryLabel: '#5E6670',
        tertiaryLabel: '#8D949D',
        separator: '#E7E8EB',
        groupedBackground: '#F7F7F9',
        cardBackground: '#FFFFFF',
        fillBackground: '#F0F1F3',
        /** Hairline around cards; light mode leans on the shadow, so it is barely there. */
        cardBorder: '#1C1F230F',
        /** Raised control on a fill (selected segment). */
        elevatedBackground: '#FFFFFF',

        success: '#1F8A50',
        /** Filled success surface (Approve button, done badge); always carries white text. */
        successFill: '#1F8A50',
        /** Text and icons on a filled success surface. */
        onSuccess: '#FFFFFF',
        successSoft: '#1F8A5014',
        /** In Approving (web: Tailwind amber): a clear golden amber instead of the old ochre. */
        pending: '#F0A000',
        pendingSoft: '#F0A0001F',
        warning: '#E2601A',
        warningSoft: '#E2601A1A',
        danger: '#B42318',
        /** Filled danger surface (rejected badge); always carries white text. */
        dangerFill: '#B42318',
        dangerSoft: '#B4231812',
        info: '#2F6BEA',
        infoSoft: '#2F6BEA14',

        categoryPR: '#E5534B',
        categoryPO: '#3B82F6',
        categoryClaim: '#22A06B',
        categoryReservation: '#E8A317',
    },
    // Dark mode: a soft charcoal (never pure black); surfaces step up in lightness so cards stand out
    // without shadows, text is off-white to cut glare, and accents are lighter pastels above 4.5:1 on cards.
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

        success: '#6BD49A',
        // Pastel success reads well as text on dark cards; filled surfaces use a deeper green for white text.
        successFill: '#1F8A50',
        onSuccess: '#FFFFFF',
        successSoft: '#6BD49A29',
        pending: '#FFC94D',
        pendingSoft: '#FFC94D29',
        warning: '#F59A62',
        warningSoft: '#F59A6229',
        danger: '#F28D86',
        dangerFill: '#C2372D',
        dangerSoft: '#F28D8629',
        info: '#80AFFF',
        infoSoft: '#80AFFF29',

        categoryPR: '#F2837C',
        categoryPO: '#7FB0FA',
        categoryClaim: '#5FD1A0',
        categoryReservation: '#F5C451',
    },
} as const;

/** Brand accent sets: the only part that changes with the chosen theme. */
const BRANDS = {
    conarum: {
        light: {
            accent: '#D12F2A',
            accentStrong: '#A8211C',
            accentSoft: '#D12F2A12',
            /** Filled accent surface (primary button, selected check, badge); always carries white text. */
            accentFill: '#D12F2A',
            onAccent: '#FFFFFF',
            /** Hero gradient (Home summary, sign-in mark). */
            heroFrom: '#E5483F',
            heroTo: '#B01810',
            onHero: '#FFFFFF',
            /** Exact Conarum logo red (logo artwork only). */
            brand: '#CC0000',
        },
        dark: { accent: '#F07A71', accentStrong: '#F69A92', accentSoft: '#F07A7129', accentFill: '#C2443C', onAccent: '#FFFFFF', heroFrom: '#C2443C', heroTo: '#80211B', onHero: '#FFFFFF', brand: '#E02424' },
    },
    // SAP Fiori Horizon brand blue.
    sap: {
        light: { accent: '#0070F2', accentStrong: '#0057D2', accentSoft: '#0070F212', accentFill: '#0070F2', onAccent: '#FFFFFF', heroFrom: '#1B90FF', heroTo: '#0050C0', onHero: '#FFFFFF', brand: '#CC0000' },
        dark: { accent: '#4DB1FF', accentStrong: '#89D1FF', accentSoft: '#4DB1FF29', accentFill: '#0A6ED1', onAccent: '#FFFFFF', heroFrom: '#0A6ED1', heroTo: '#003C9E', onHero: '#FFFFFF', brand: '#E02424' },
    },
} as const;

type Scheme = 'light' | 'dark';
export type ThemeColors = (typeof BASE)[Scheme] & (typeof BRANDS)[BrandTheme][Scheme];

/** Built once: a stable object per brand and scheme, so memoized children do not re-render needlessly. */
const PALETTES = Object.fromEntries(
    (Object.keys(BRANDS) as BrandTheme[]).map((brand) => [brand, { light: { ...BASE.light, ...BRANDS[brand].light }, dark: { ...BASE.dark, ...BRANDS[brand].dark } }])
) as Record<BrandTheme, Record<Scheme, ThemeColors>>;

/** The app palette for the current brand theme and color scheme. Read it at render time. */
export function useColors(): ThemeColors {
    const brand = useBrandTheme();
    return PALETTES[brand][useColorScheme() === 'dark' ? 'dark' : 'light'];
}
