import * as SecureStore from 'expo-secure-store';

/** Only the refresh token is persisted (Keychain / Keystore). Access tokens stay in memory. */
const REFRESH_TOKEN_KEY = 'entra.refreshToken';

const options: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY };

export const tokenStore = {
    readRefreshToken: () => SecureStore.getItemAsync(REFRESH_TOKEN_KEY, options),
    saveRefreshToken: (token: string) => SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token, options),
    clear: () => SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY, options),
};
