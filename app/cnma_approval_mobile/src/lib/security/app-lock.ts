import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';

/*
 * App lock: after Microsoft sign-in, the app can be locked with Face ID / Touch ID / fingerprint (falling
 * back to the device passcode). It guards opening the app, not the session: tokens stay as they are, so a
 * new face or finger on the device never signs the user out. Off by default, offered once after sign-in.
 */

/** Coming back within this time does not ask again (a quick look at another app). */
export const RELOCK_AFTER_MS = 5 * 60_000;

const ENABLED_KEY = 'app-lock-enabled';
const OFFERED_KEY = 'app-lock-offered';
const STORE_OPTIONS = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY };

export interface AppLockState {
    /** The saved choice has been read (until then a signed-in app shows only the cover). */
    ready: boolean;
    enabled: boolean;
    locked: boolean;
    /** The "Use Face ID?" offer was already shown on this device. */
    offered: boolean;
    /** A system prompt is open (its own inactive state must not count as leaving the app). */
    authenticating: boolean;
}

let state: AppLockState = { ready: false, enabled: false, locked: false, offered: false, authenticating: false };
const listeners = new Set<() => void>();

function update(patch: Partial<AppLockState>) {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
}

async function save(key: string, value: boolean) {
    try {
        await SecureStore.setItemAsync(key, value ? '1' : '0', STORE_OPTIONS);
    } catch {
        // Not persisted: the choice still applies until the app is closed.
    }
}

export interface Biometry {
    /** Hardware present and something enrolled (a face, a finger). */
    available: boolean;
    /** Name of the method as the platform calls it: Face ID, Touch ID, Fingerprint… */
    label: string;
}

/** What this device can unlock with. */
export async function getBiometry(): Promise<Biometry> {
    try {
        const [hardware, enrolled, types] = await Promise.all([LocalAuthentication.hasHardwareAsync(), LocalAuthentication.isEnrolledAsync(), LocalAuthentication.supportedAuthenticationTypesAsync()]);
        return { available: hardware && enrolled, label: biometryLabel(types, process.env.EXPO_OS === 'ios') };
    } catch {
        return { available: false, label: 'Biometrics' };
    }
}

export function biometryLabel(types: readonly LocalAuthentication.AuthenticationType[], ios: boolean): string {
    const face = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
    const finger = types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
    if (ios) return face ? 'Face ID' : finger ? 'Touch ID' : 'Passcode';
    if (face && finger) return 'Biometrics';
    return face ? 'Face unlock' : finger ? 'Fingerprint' : 'Biometrics';
}

export type UnlockResult = 'unlocked' | 'cancelled' | 'failed' | 'unavailable';

/** Shows the system prompt (biometrics, then the device passcode after failed tries). */
async function authenticate(promptMessage: string): Promise<UnlockResult> {
    update({ authenticating: true });
    try {
        const result = await LocalAuthentication.authenticateAsync({ promptMessage, cancelLabel: 'Cancel', disableDeviceFallback: false });
        if (result.success) return 'unlocked';
        if (result.error === 'user_cancel' || result.error === 'system_cancel' || result.error === 'app_cancel') return 'cancelled';
        // No passcode or biometrics left on the device: a lock that can never open would only lock the user out.
        if (result.error === 'passcode_not_set' || result.error === 'not_available') return 'unavailable';
        return 'failed';
    } catch {
        return 'failed';
    } finally {
        update({ authenticating: false });
    }
}

export const appLock = {
    /** Reads the saved choice; call once at startup (the app opens locked when the lock is on). */
    restore: async () => {
        try {
            const [enabled, offered] = await Promise.all([SecureStore.getItemAsync(ENABLED_KEY), SecureStore.getItemAsync(OFFERED_KEY)]);
            update({ ready: true, enabled: enabled === '1', locked: enabled === '1', offered: offered === '1' });
        } catch {
            update({ ready: true });
        }
    },
    unlock: async (label: string): Promise<UnlockResult> => {
        const result = await authenticate(`Unlock with ${label}`);
        if (result === 'unlocked') update({ locked: false });
        if (result === 'unavailable') {
            update({ locked: false, enabled: false });
            void save(ENABLED_KEY, false);
        }
        return result;
    },
    /** Turning the lock on or off asks for the face/finger first, so nobody else can change it. */
    setEnabled: async (enabled: boolean, label: string): Promise<boolean> => {
        const result = await authenticate(enabled ? `Use ${label} to unlock My Approval` : `Turn off ${label} lock`);
        if (result !== 'unlocked') return false;
        update({ enabled, locked: false, offered: true });
        await Promise.all([save(ENABLED_KEY, enabled), save(OFFERED_KEY, true)]);
        return true;
    },
    markOffered: () => {
        update({ offered: true });
        void save(OFFERED_KEY, true);
    },
    lock: () => {
        if (state.enabled && !state.locked) update({ locked: true });
    },
    /** Sign-out: the next user decides for themselves. */
    reset: () => {
        update({ enabled: false, locked: false, offered: false });
        void Promise.all([save(ENABLED_KEY, false), save(OFFERED_KEY, false)]);
    },
    get: () => state,
};

export function useAppLock(): AppLockState {
    return useSyncExternalStore(
        (onChange) => {
            listeners.add(onChange);
            return () => listeners.delete(onChange);
        },
        () => state,
        () => state
    );
}
