import { useRouter } from 'expo-router';
import { useCallback } from 'react';

/**
 * Closes the current screen or sheet. A screen opened straight from a link (push notification, mail,
 * another app) has nothing to go back to: it then lands on Home instead of doing nothing.
 */
export function useDismiss(): () => void {
    const router = useRouter();
    return useCallback(() => {
        if (router.canGoBack()) router.back();
        else router.replace('/');
    }, [router]);
}
