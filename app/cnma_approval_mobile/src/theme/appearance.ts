import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';
import { Appearance } from 'react-native';

/** User choice in Account › Appearance. `system` follows the device setting. */
export type AppearancePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'ui.appearance';
const listeners = new Set<(preference: AppearancePreference) => void>();
let current: AppearancePreference = 'system';

const isPreference = (value: unknown): value is AppearancePreference => value === 'system' || value === 'light' || value === 'dark';

/**
 * Applies the preference app-wide. `Appearance.setColorScheme` overrides the scheme natively, so
 * `useColorScheme()`, native headers, tab bars, sheets and @expo/ui controls all switch together.
 */
function apply(preference: AppearancePreference) {
    current = preference;
    Appearance.setColorScheme(preference === 'system' ? 'auto' : preference);
    listeners.forEach((listener) => listener(preference));
}

/** Restores the saved preference; call once at startup (before the splash hides, to avoid a flash). */
export async function restoreAppearance(): Promise<void> {
    try {
        const saved = await SecureStore.getItemAsync(STORAGE_KEY);
        if (isPreference(saved) && saved !== 'system') apply(saved);
    } catch {
        // Unreadable storage: keep following the system.
    }
}

/** Current preference plus a setter that applies and persists it. */
export function useAppearancePreference(): [AppearancePreference, (preference: AppearancePreference) => void] {
    const [preference, setPreference] = useState(current);

    useEffect(() => {
        listeners.add(setPreference);
        return () => {
            listeners.delete(setPreference);
        };
    }, []);

    const update = useCallback((next: AppearancePreference) => {
        apply(next);
        void SecureStore.setItemAsync(STORAGE_KEY, next).catch(() => undefined);
    }, []);

    return [preference, update];
}
