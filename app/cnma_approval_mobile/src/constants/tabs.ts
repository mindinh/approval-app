import type { SymbolViewProps } from 'expo-symbols';

/**
 * The four top-level destinations, one route group each. Hrefs keep the full group path so a tab press
 * always targets its own stack.
 */
export const TABS = [
    {
        name: '(home)',
        href: '/(tabs)/(home)',
        label: 'Home',
        sf: { default: 'house', selected: 'house.fill' },
        md: 'home',
        icon: { ios: 'house', android: 'home' },
        activeIcon: { ios: 'house.fill', android: 'home' },
    },
    {
        name: '(inbox)',
        href: '/(tabs)/(inbox)/inbox',
        label: 'Inbox',
        sf: { default: 'tray', selected: 'tray.fill' },
        md: 'inbox',
        icon: { ios: 'tray', android: 'inbox' },
        activeIcon: { ios: 'tray.fill', android: 'inbox' },
    },
    {
        name: '(approved)',
        href: '/(tabs)/(approved)/approved',
        label: 'Approved',
        sf: { default: 'checkmark.circle', selected: 'checkmark.circle.fill' },
        md: 'task_alt',
        icon: { ios: 'checkmark.circle', android: 'task_alt' },
        activeIcon: { ios: 'checkmark.circle.fill', android: 'task_alt' },
    },
    {
        name: '(dashboard)',
        href: '/(tabs)/(dashboard)/dashboard',
        label: 'Dashboard',
        sf: { default: 'chart.pie', selected: 'chart.pie.fill' },
        md: 'donut_large',
        icon: { ios: 'chart.pie', android: 'donut_large' },
        activeIcon: { ios: 'chart.pie.fill', android: 'donut_large' },
    },
] as const satisfies readonly {
    name: string;
    href: string;
    label: string;
    sf: { default: string; selected: string };
    md: string;
    icon: SymbolViewProps['name'];
    activeIcon: SymbolViewProps['name'];
}[];

export type TabName = (typeof TABS)[number]['name'];

export const INBOX_HREF = TABS[1].href;
export const APPROVED_HREF = TABS[2].href;

/** Badges beyond this read as "99+" so the tab bar never grows. */
const MAX_BADGE = 99;

export function badgeText(count: number | undefined): string | null {
    if (!count) return null;
    return count > MAX_BADGE ? `${MAX_BADGE}+` : String(count);
}
