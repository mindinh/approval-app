import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { makeRedirectUri } from 'expo-auth-session';

const APP_SCHEME = 'cnmaapproval';
const REDIRECT_PATH = 'auth';
/** Application ids of the Expo Go client (Android, iOS). */
const EXPO_GO_APP_IDS = ['host.exp.exponent', 'host.exp.Exponent'];

/** True when the bundle runs inside the Expo Go client rather than this app's own native build. */
export const isExpoGo = EXPO_GO_APP_IDS.includes(Application.applicationId ?? '');

/**
 * Redirect URI the OS can hand back to this runtime:
 * - Expo Go only receives links on its own `exp://<dev-server>/--/…` URL (in SDK 58 `makeRedirectUri`
 *   returns the app scheme there, which Expo Go does not handle);
 * - native builds receive `cnmaapproval://auth` (scheme from app.json).
 * Each value must be registered on the Entra app registration (Mobile and desktop applications).
 */
export function resolveRedirectUri(): string {
    const devServerHost = Constants.expoConfig?.hostUri;
    if (isExpoGo && devServerHost) return `exp://${devServerHost}/--/${REDIRECT_PATH}`;
    return makeRedirectUri({ scheme: APP_SCHEME, path: REDIRECT_PATH });
}
