import { useEffect, useRef, useState } from 'react';
import { Alert, AppState, Modal, Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { ProconarumMark } from '@/components/brand';
import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { haptics } from '@/lib/haptics';
import { appLock, getBiometry, RELOCK_AFTER_MS, useAppLock, type Biometry } from '@/lib/security/app-lock';
import { fadeInContent, spacing, useColors } from '@/theme';

/** Face ID on iPhone, fingerprint/face on Android; the label follows what the device has. */
export function useBiometry(): Biometry | null {
    const [biometry, setBiometry] = useState<Biometry | null>(null);
    useEffect(() => {
        let alive = true;
        void getBiometry().then((result) => alive && setBiometry(result));
        return () => {
            alive = false;
        };
    }, []);
    return biometry;
}

/**
 * Leaving the app: the app switcher shows a cover instead of approvals and amounts. Coming back after
 * RELOCK_AFTER_MS locks the app. The system prompt's own "inactive" phase is ignored.
 */
function useCoverAndRelock(active: boolean): boolean {
    const [covered, setCovered] = useState(false);
    const leftAt = useRef<number | null>(null);
    useEffect(() => {
        if (!active) return;
        const subscription = AppState.addEventListener('change', (next) => {
            if (next === 'active') {
                if (leftAt.current !== null && Date.now() - leftAt.current >= RELOCK_AFTER_MS) appLock.lock();
                leftAt.current = null;
                setCovered(false);
                return;
            }
            if (appLock.get().authenticating) return;
            if (next === 'background' && leftAt.current === null) leftAt.current = Date.now();
            setCovered(true);
        });
        return () => subscription.remove();
    }, [active]);
    return covered;
}

/**
 * Lock screen and privacy cover above everything, native sheets included (a React Native Modal is
 * presented by the top-most screen). Only while signed in with the lock turned on.
 */
export function AppLockGate({ signedIn, onSignOut }: { signedIn: boolean; onSignOut: () => void }) {
    const colors = useColors();
    const lock = useAppLock();
    const biometry = useBiometry();
    const protecting = signedIn && lock.enabled;
    const covered = useCoverAndRelock(protecting);
    const [failed, setFailed] = useState(false);
    const prompted = useRef(false);
    const label = biometry?.label ?? 'Face ID';

    const visible = signedIn && (!lock.ready || (lock.enabled && (lock.locked || covered)));
    const showLock = protecting && lock.locked;

    const unlock = async () => {
        const result = await appLock.unlock(label);
        setFailed(result === 'failed');
        if (result === 'unlocked') haptics.success();
        else if (result === 'failed') haptics.error();
    };

    // Ask right away when the lock appears with the app in front (once per lock; the button asks again).
    useEffect(() => {
        if (!showLock) {
            prompted.current = false;
            return;
        }
        if (prompted.current || covered || AppState.currentState !== 'active') return;
        prompted.current = true;
        void unlock();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- run when the lock shows or the cover lifts
    }, [showLock, covered]);

    const confirmSignOut = () =>
        Alert.alert('Sign out?', 'You can sign in again with Microsoft.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign out', style: 'destructive', onPress: onSignOut },
        ]);

    return (
        <Modal visible={visible} animationType="none" presentationStyle="overFullScreen" transparent statusBarTranslucent navigationBarTranslucent onRequestClose={() => undefined}>
            <View style={{ flex: 1, backgroundColor: colors.groupedBackground, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.lg }}>
                <ProconarumMark size={72} />
                {showLock ? (
                    <Animated.View entering={fadeInContent} style={{ alignSelf: 'stretch', alignItems: 'center', gap: spacing.md }}>
                        <View style={{ alignItems: 'center', gap: spacing.xs }}>
                            <ThemedText variant="title" style={{ textAlign: 'center' }}>
                                My Approval is locked
                            </ThemedText>
                            <ThemedText variant="footnote" style={{ textAlign: 'center', color: failed ? colors.danger : colors.secondaryLabel }} accessibilityLiveRegion="polite">
                                {failed ? `${label} did not match. Try again or use your device passcode.` : `Use ${label} to continue.`}
                            </ThemedText>
                        </View>
                        <Button title={`Unlock with ${label}`} onPress={() => void unlock()} loading={lock.authenticating} style={{ alignSelf: 'stretch', maxWidth: 360 }} />
                        <Pressable accessibilityRole="button" onPress={confirmSignOut} hitSlop={12} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, padding: spacing.sm }}>
                            <Icon name={{ ios: 'rectangle.portrait.and.arrow.right', android: 'logout' }} size={14} color={colors.secondaryLabel} />
                            <ThemedText variant="footnote" style={{ color: colors.secondaryLabel, fontWeight: '600' }}>
                                Sign out
                            </ThemedText>
                        </Pressable>
                    </Animated.View>
                ) : null}
            </View>
        </Modal>
    );
}

/**
 * After the first sign-in on a device with Face ID / fingerprint, asks once whether to lock the app with
 * it. Saying no is remembered; it can be turned on later in Profile.
 */
export function useOfferAppLock(signedIn: boolean) {
    const lock = useAppLock();
    useEffect(() => {
        if (!signedIn || !lock.ready || lock.offered || lock.enabled) return;
        let cancelled = false;
        // Let the home screen settle first; never stack this over the sign-in transition.
        const timer = setTimeout(async () => {
            const biometry = await getBiometry();
            if (cancelled || !biometry.available) return;
            Alert.alert(`Unlock with ${biometry.label}?`, `Ask for ${biometry.label} when you open My Approval, so only you can see and approve requests. You can change this in Profile.`, [
                { text: 'Not now', style: 'cancel', onPress: appLock.markOffered },
                { text: `Use ${biometry.label}`, onPress: () => void appLock.setEnabled(true, biometry.label).then((on) => !on && appLock.markOffered()) },
            ]);
        }, 1500);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [signedIn, lock.ready, lock.offered, lock.enabled]);
}
