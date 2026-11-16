import { FieldGroup } from '@expo/ui';
import { SegmentedControl } from '@expo/ui/community/segmented-control';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Alert, View } from 'react-native';
import { InlineErrorRow } from '@/components/error-state';
import { useBiometry } from '@/components/app-lock-gate';
import { contentRow, NativeList, row, sectionFooter, toggleRow } from '@/components/native-list';
import { SheetHeader } from '@/components/sheet-header';
import { Skeleton } from '@/components/skeleton';
import { useCurrentUser, useSapUser } from '@/hooks/queries/use-user-queries';
import { useDismiss } from '@/hooks/use-dismiss';
import { userNameOf } from '@/lib/auth/jwt';
import { isExpoGo } from '@/lib/auth/redirect';
import { useSession } from '@/lib/auth/session';
import { config } from '@/lib/config/env';
import { haptics } from '@/lib/haptics';
import { appLock, useAppLock } from '@/lib/security/app-lock';
import { spacing, useAppearancePreference, useColors, type AppearancePreference } from '@/theme';
import { ProfileHeader } from './profile-header';

const APPEARANCE: { label: string; value: AppearancePreference }[] = [
    { label: 'System', value: 'system' },
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
];

const loading = <Skeleton width={96} height={16} />;

function formatTime(epochMs: number): string {
    return new Date(epochMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function serverLabel(apiBaseUrl: string | undefined): string {
    if (!apiBaseUrl) return '—';
    try {
        return new URL(apiBaseUrl).host;
    } catch {
        return apiBaseUrl;
    }
}

/** System / Light / Dark; applied app-wide immediately and remembered on this device. */
function AppearancePicker() {
    const colors = useColors();
    const [preference, setPreference] = useAppearancePreference();
    return (
        <View style={{ paddingVertical: spacing.xs }}>
            <SegmentedControl
                values={APPEARANCE.map((option) => option.label)}
                selectedIndex={APPEARANCE.findIndex((option) => option.value === preference)}
                tintColor={colors.accent}
                accessibilityLabel="Appearance"
                onChange={(event) => {
                    const next = APPEARANCE[event.nativeEvent.selectedSegmentIndex]?.value;
                    if (!next || next === preference) return;
                    haptics.selection();
                    setPreference(next);
                }}
            />
        </View>
    );
}

/**
 * Profile sheet as a native settings list (@expo/ui: SwiftUI Form / Material 3 list): identity, SAP account,
 * appearance, session, app info, diagnostics and sign out.
 */
export function AccountScreen() {
    const router = useRouter();
    const dismiss = useDismiss();
    const colors = useColors();
    const { user, signOut } = useSession();
    const me = useCurrentUser();
    const sapUser = useSapUser();
    const sapError = me.error ?? sapUser.error;
    const lock = useAppLock();
    const biometry = useBiometry();
    const lockLabel = biometry?.label ?? 'Face ID';

    // The switch only moves once the face/finger is confirmed (the system prompt opens first).
    const toggleLock = (next: boolean) => {
        void appLock.setEnabled(next, lockLabel).then((changed) => changed && haptics.selection());
    };

    const claims = user?.claims ?? null;
    const email = userNameOf(claims);
    const name = claims?.name || email || 'Signed in';
    const version = Constants.expoConfig?.version ?? '—';

    const openDiagnostics = () => {
        // Close the sheet first, then push onto the main stack.
        router.back();
        router.push('/diagnostics');
    };

    const confirmSignOut = () =>
        Alert.alert('Sign out?', 'You will need to sign in with Microsoft again on this device.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign out',
                style: 'destructive',
                onPress: () => {
                    haptics.light();
                    void signOut();
                },
            },
        ]);

    return (
        <View style={{ flex: 1, backgroundColor: colors.groupedBackground }}>
            <View style={{ paddingHorizontal: spacing.md }}>
                <SheetHeader title="Profile" onDone={dismiss} />
            </View>
            <NativeList>
                <FieldGroup.Section>{contentRow(colors, 'profile', <ProfileHeader name={name} email={email} />)}</FieldGroup.Section>

                <FieldGroup.Section title="SAP account">
                    {row(colors, { key: 'sap-user', icon: { ios: 'person.text.rectangle', android: 'badge' }, title: 'SAP user', value: sapUser.data?.sapUsername || '—', accessory: sapUser.isPending ? loading : undefined })}
                    {row(colors, { key: 'role', icon: { ios: 'person.badge.shield.checkmark', android: 'verified_user' }, title: 'Role', value: me.data?.role || '—', accessory: me.isPending ? loading : undefined })}
                    {sapError
                        ? contentRow(
                              colors,
                              'sap-error',
                              <InlineErrorRow
                                  title="Could not load SAP account"
                                  error={sapError}
                                  onRetry={() => {
                                      void me.refetch();
                                      void sapUser.refetch();
                                  }}
                              />
                          )
                        : null}
                    {sectionFooter(colors, 'SAP user is the account your approvals are recorded under.')}
                </FieldGroup.Section>

                <FieldGroup.Section title="Appearance">
                    {contentRow(colors, 'appearance', <AppearancePicker />)}
                    {sectionFooter(colors, 'System follows the light or dark setting of your device.')}
                </FieldGroup.Section>

                {biometry?.available || lock.enabled ? (
                    <FieldGroup.Section title="Security">
                        {toggleRow(colors, { key: 'app-lock', icon: { ios: lockLabel === 'Touch ID' ? 'touchid' : 'faceid', android: 'fingerprint' }, title: `Unlock with ${lockLabel}`, value: lock.enabled, onValueChange: toggleLock, disabled: lock.authenticating })}
                        {sectionFooter(colors, `Asks for ${lockLabel} (or your device passcode) when you open the app or return after 5 minutes. Your Microsoft sign-in is not affected.`)}
                    </FieldGroup.Section>
                ) : null}

                <FieldGroup.Section title="Session">
                    {row(colors, { key: 'account', icon: { ios: 'person.badge.key.fill', android: 'key' }, title: 'Account', value: 'Microsoft Entra ID' })}
                    {row(colors, { key: 'token', icon: { ios: 'clock', android: 'schedule' }, title: 'Token valid until', value: user ? formatTime(user.expiresAt) : '—' })}
                    {sectionFooter(colors, 'Your session renews automatically in the background, so you stay signed in on this device.')}
                </FieldGroup.Section>

                <FieldGroup.Section title="App">
                    {row(colors, { key: 'version', icon: { ios: 'info.circle', android: 'info' }, title: 'Version', value: `${version}${isExpoGo ? ' · Expo Go' : ''}` })}
                    {row(colors, { key: 'server', icon: { ios: 'server.rack', android: 'dns' }, title: 'Server', value: serverLabel(config?.apiBaseUrl) })}
                    {row(colors, { key: 'diagnostics', icon: { ios: 'stethoscope', android: 'monitor_heart' }, title: 'Connection diagnostics', onPress: openDiagnostics })}
                </FieldGroup.Section>

                <FieldGroup.Section>
                    {row(colors, { key: 'sign-out', icon: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout' }, title: 'Sign out', destructive: true, onPress: confirmSignOut })}
                </FieldGroup.Section>
            </NativeList>
        </View>
    );
}
