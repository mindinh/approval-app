import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, usePathname, useRouter, type Href } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router/stack';
import { useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SessionProvider, useSession, type SessionStatus } from '@/lib/auth/session';
import { config, features, missingConfig } from '@/lib/config/env';
import { takePendingLink } from '@/lib/navigation/pending-link';
import { createQueryClient, subscribeAppStateFocus, subscribeNetworkStatus } from '@/lib/query/query-client';
import { ConfigMissingScreen } from '@/screens/config-missing';
import { restoreAppearance, restoreBrandTheme, useColors } from '@/theme';
import { commentDrafts } from '@/hooks/mutations/comment-drafts';
import { massSelection } from '@/hooks/mutations/mass-selection';
import { pendingComments } from '@/hooks/mutations/pending-comments';
import { usePendingDecisionCheck } from '@/hooks/mutations/use-pending-decision-check';
import { clearDownloadedAttachments } from '@/lib/api/attachments';
import { pendingDecisions } from '@/lib/api/pending-decisions';
import { useNavigationTheme } from '@/theme/navigation-theme';
import { AppLockGate, useOfferAppLock } from '@/components/app-lock-gate';
import { ToastHost } from '@/components/toast';
import { appLock, useAppLock } from '@/lib/security/app-lock';

void SplashScreen.preventAutoHideAsync();
// Apply the saved Light/Dark choice while the splash is still up, so the first frame is already themed.
void restoreAppearance();
void restoreBrandTheme();
// Read the Face ID lock choice while the splash is up: a locked app must open locked.
void appLock.restore();

/** Never keep the splash longer than this, even if session restore is slow (e.g. no network). */
const SPLASH_MAX_MS = 4_000;
const IS_IOS = process.env.EXPO_OS === 'ios';
/** iOS translucent header for screens pushed above the tabs (tab stacks configure their own). */
const IOS_HEADER = { headerTransparent: true, headerBlurEffect: 'systemMaterial' } as const;

/**
 * The app allows rotation (app.json "orientation": "default") so file previews can turn landscape; every
 * screen of our own stays portrait. Quick Look (PDF, Office) and the image viewer rotate with the device.
 */
const PORTRAIT = { orientation: 'portrait' } as const;
const ROOT_SCREEN_OPTIONS = IS_IOS ? { ...IOS_HEADER, ...PORTRAIT } : PORTRAIT;

/** In-app image viewer: full screen over everything, rotates, fades in. */
const IMAGE_VIEWER = { presentation: 'fullScreenModal', animation: 'fade', headerShown: false, orientation: 'all', contentStyle: { backgroundColor: '#000' }, statusBarStyle: 'light' } as const;

/**
 * Profile is a real OS sheet (UISheetPresentationController / Material bottom sheet): grabber, detents,
 * swipe to dismiss and liquid glass on iOS 26+ come for free. It draws its own title row.
 */
const PROFILE_SHEET = {
    presentation: 'formSheet' as const,
    sheetAllowedDetents: [0.75, 1],
    sheetGrabberVisible: true,
    sheetExpandsWhenScrolledToEdge: true,
    sheetCornerRadius: 28,
    sheetElevation: 24,
    headerShown: false,
};

/**
 * Task detail: pushed above the tabs so the tab bar hides and the screen gets the full height for content
 * and the decision buttons. It draws its own compact top bar (no native header); edge-swipe back works.
 */
const TASK_DETAIL = { headerShown: false } as const;

/** Decision confirmation (comment + confirm): a native sheet sized to its content. */
const DECISION_SHEET = { ...PROFILE_SHEET, sheetAllowedDetents: [0.55, 0.9] };

/** Tag people (CC): a tall sheet, since it has a search field and a long list. */
const TAG_SHEET = { ...PROFILE_SHEET, sheetAllowedDetents: [0.75, 1] };

/** Worklist filters: a native sheet that opens at half height and expands to full. */
const FILTER_SHEET = { ...PROFILE_SHEET, sheetAllowedDetents: [0.6, 1] };

/**
 * Sheets and the task detail are singular: a fast double tap (or a tap while the sheet is still animating in)
 * moves to the existing screen instead of stacking a second copy. Task details are keyed by task id.
 */
const taskIdOf = (_name: string, params: Record<string, unknown>) => (typeof params.id === 'string' ? params.id : undefined);

const queryClient = createQueryClient();

/** Keep the splash until the stored session is restored (or the timeout passes). */
function useSplashUntilRestored(status: SessionStatus) {
    useEffect(() => {
        const timer = setTimeout(() => void SplashScreen.hideAsync(), SPLASH_MAX_MS);
        return () => clearTimeout(timer);
    }, []);
    useEffect(() => {
        if (status !== 'restoring') void SplashScreen.hideAsync();
    }, [status]);
}

/** Business data lives in memory only and must not survive into another user's session. */
function useClearCacheOnSignOut(status: SessionStatus) {
    useEffect(() => {
        if (status !== 'signedOut') return;
        queryClient.clear();
        clearDownloadedAttachments();
        // Unconfirmed decisions belong to the signed-out user; never show them to the next one.
        void pendingDecisions.clear();
        pendingComments.clear();
        massSelection.end();
        commentDrafts.clear();
        // The next user chooses their own lock.
        appLock.reset();
    }, [status]);
}

/**
 * A task link opened while signed out lands on sign-in (auth gate). Once the user is signed in (sign-in or
 * session restore), open that task instead of leaving them on Home.
 */
function useOpenPendingLinkAfterSignIn(status: SessionStatus) {
    const router = useRouter();
    const pathname = usePathname();
    const pathnameRef = useRef(pathname);
    useEffect(() => {
        pathnameRef.current = pathname;
    }, [pathname]);
    const wasSignedIn = useRef(false);
    useEffect(() => {
        if (status !== 'signedIn') {
            if (status === 'signedOut') wasSignedIn.current = false;
            return;
        }
        const path = takePendingLink();
        const justSignedIn = !wasSignedIn.current;
        wasSignedIn.current = true;
        // Let the gate switch to the tabs first, then push the task above them.
        if (path && justSignedIn) setTimeout(() => pathnameRef.current !== path && router.push(path as Href), 0);
    }, [status, router]);
}

function AppStack() {
    const { status, signOut } = useSession();
    const colors = useColors();
    const signedIn = status === 'signedIn';
    const lock = useAppLock();
    const unlocked = signedIn && lock.ready && !lock.locked;
    useSplashUntilRestored(status);
    useClearCacheOnSignOut(status);
    useOpenPendingLinkAfterSignIn(status);
    // Alerts about unsent decisions wait until the app is unlocked.
    usePendingDecisionCheck(unlocked);
    useOfferAppLock(unlocked);

    return (
        <>
        <Stack screenOptions={ROOT_SCREEN_OPTIONS}>
            <Stack.Protected guard={signedIn}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="account" dangerouslySingular options={{ ...PROFILE_SHEET, contentStyle: { backgroundColor: colors.groupedBackground } }} />
                <Stack.Screen name="tasks/[id]" dangerouslySingular={taskIdOf} options={TASK_DETAIL} />
                <Stack.Screen name="reference-pr/[number]" options={TASK_DETAIL} />
                <Stack.Screen name="decision" dangerouslySingular options={{ ...DECISION_SHEET, contentStyle: { backgroundColor: colors.groupedBackground } }} />
                <Stack.Screen name="mass-decision" dangerouslySingular options={{ ...DECISION_SHEET, contentStyle: { backgroundColor: colors.groupedBackground } }} />
                <Stack.Protected guard={features.mentions}>
                    <Stack.Screen name="tag-people" dangerouslySingular options={{ ...TAG_SHEET, contentStyle: { backgroundColor: colors.groupedBackground } }} />
                </Stack.Protected>
                <Stack.Screen name="filters" dangerouslySingular options={{ ...FILTER_SHEET, contentStyle: { backgroundColor: colors.groupedBackground } }} />
                <Stack.Screen name="attachment-viewer" dangerouslySingular options={IMAGE_VIEWER} />
            </Stack.Protected>
            <Stack.Protected guard={!signedIn}>
                <Stack.Screen name="sign-in" options={{ headerShown: false, animation: 'fade' }} />
            </Stack.Protected>
            <Stack.Screen name="auth" options={{ headerShown: false, animation: 'none' }} />
        </Stack>
        <AppLockGate signedIn={signedIn} onSignOut={() => void signOut()} />
        <ToastHost />
        </>
    );
}

export default function RootLayout() {
    const navigationTheme = useNavigationTheme();
    useEffect(() => subscribeAppStateFocus(), []);
    useEffect(() => subscribeNetworkStatus(), []);
    useEffect(() => {
        if (!config) void SplashScreen.hideAsync();
    }, []);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
            <ThemeProvider value={navigationTheme}>
                {config ? (
                    <QueryClientProvider client={queryClient}>
                        <SessionProvider config={config}>
                            <AppStack />
                        </SessionProvider>
                    </QueryClientProvider>
                ) : (
                    <ConfigMissingScreen missing={missingConfig} />
                )}
            </ThemeProvider>
            </KeyboardProvider>
        </GestureHandlerRootView>
    );
}

/** Last line of defence: a crash in any screen without its own boundary (sheets, sign-in) shows the friendly panel. */
export { CrashScreen as ErrorBoundary } from '@/components/crash-screen';
