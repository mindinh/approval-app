import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';

/** Accent color set chosen in Profile › Appearance: Conarum red (default) or SAP blue. */
export type BrandTheme = 'conarum' | 'sap';

const STORAGE_KEY = 'ui.brand';
let current: BrandTheme = 'conarum';
const listeners = new Set<() => void>();

const isBrand = (value: unknown): value is BrandTheme => value === 'conarum' || value === 'sap';

function apply(brand: BrandTheme) {
    if (brand === current) return;
    current = brand;
    listeners.forEach((listener) => listener());
}

/** Restores the saved theme; call once at startup (while the splash is up, so the first frame is right). */
export async function restoreBrandTheme(): Promise<void> {
    try {
        const saved = await SecureStore.getItemAsync(STORAGE_KEY);
        if (isBrand(saved)) apply(saved);
    } catch {
        // Unreadable storage: keep the default.
    }
}

/** Switches the theme app-wide immediately and remembers it on this device. */
export function setBrandTheme(brand: BrandTheme) {
    apply(brand);
    void SecureStore.setItemAsync(STORAGE_KEY, brand).catch(() => undefined);
}

export function useBrandTheme(): BrandTheme {
    return useSyncExternalStore(
        (onChange) => {
            listeners.add(onChange);
            return () => listeners.delete(onChange);
        },
        () => current,
        () => current
    );
}
