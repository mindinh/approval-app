import { Redirect } from 'expo-router';
import { useSession } from '@/lib/auth/session';

/**
 * Landing route for the OAuth redirect (`…/auth?code=…`). expo-auth-session reads the code from
 * the browser session itself; Expo Router also receives the deep link, so leave this route at once.
 * While the code is still being exchanged, "/" is behind the auth gate: go to sign-in (it shows the
 * busy state) and let the gate move to Home when the session is ready. Redirecting to a guarded
 * route here would bounce back and loop.
 */
export default function AuthRedirectRoute() {
    const { status } = useSession();
    return <Redirect href={status === 'signedIn' ? '/' : '/sign-in'} />;
}
