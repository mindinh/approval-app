import { useEffect, useRef } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProconarumLogo } from '@/components/brand';
import { Button } from '@/components/button';
import { CopyableText } from '@/components/copyable-text';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { haptics } from '@/lib/haptics';
import { useSession } from '@/lib/auth/session';
import { fadeInContent, layout, radius, riseIn, spacing, useColors } from '@/theme';
import { FeatureList } from './feature-list';

const LOGO_SIZE = 52;
/** Entrance runs after the feature list (steps 2–4). */
const ACTIONS_STEP = 5;

/** Fires one error haptic when a new sign-in error appears (the visual banner is the primary feedback). */
function useErrorHaptic(error: string | null) {
    const previous = useRef(error);
    useEffect(() => {
        if (error && error !== previous.current) haptics.error();
        previous.current = error;
    }, [error]);
}

/** Sign-in with Microsoft Entra ID. Also shown (busy) while the stored session is being restored. */
export function SignInScreen() {
    const { status, error, signIn } = useSession();
    const colors = useColors();
    const reduceMotion = useReducedMotion();
    const restoring = status === 'restoring';
    useErrorHaptic(error);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.groupedBackground, experimental_backgroundImage: `linear-gradient(180deg, ${colors.accent}1F 0%, ${colors.accent}00 55%)` }}>
            {/* Scrolls only when it must (large text sizes, small phones), so the Sign in button stays reachable. */}
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false} showsVerticalScrollIndicator={false}>
            <View style={{ flex: 1, width: '100%', maxWidth: layout.maxFormWidth, alignSelf: 'center', padding: spacing.lg }}>
                <View style={{ flex: 1, justifyContent: 'center', gap: spacing.xl }}>
                    <Animated.View entering={riseIn(0, reduceMotion)} style={{ gap: spacing.md }}>
                        <ProconarumLogo size={LOGO_SIZE} />
                        <View style={{ gap: spacing.xs }}>
                            <ThemedText variant="largeTitle">My Approval</ThemedText>
                            <ThemedText variant="subhead">Your SAP approvals, in your pocket.</ThemedText>
                        </View>
                    </Animated.View>
                    <FeatureList />
                </View>

                <Animated.View entering={riseIn(ACTIONS_STEP, reduceMotion)} style={{ gap: spacing.smd }}>
                    {error ? (
                        <Animated.View
                            entering={fadeInContent}
                            style={{ flexDirection: 'row', gap: spacing.sm, padding: spacing.smd, borderRadius: radius.md, borderCurve: 'continuous', backgroundColor: colors.dangerSoft }}
                        >
                            <Icon name={{ ios: 'exclamationmark.triangle.fill', android: 'error' }} size={16} color={colors.danger} />
                            <View style={{ flex: 1, gap: 2 }}>
                                <ThemedText variant="footnote" style={{ color: colors.danger, fontWeight: '600' }}>
                                    Sign-in did not complete
                                </ThemedText>
                                <ThemedText variant="footnote" style={{ color: colors.danger }}>
                                    Check your connection and try again. If it keeps failing, contact IT and mention the details below.
                                </ThemedText>
                                <CopyableText variant="caption" numberOfLines={2} label="error details" style={{ color: colors.secondaryLabel }}>
                                    {error}
                                </CopyableText>
                            </View>
                        </Animated.View>
                    ) : null}
                    <Button title={restoring ? 'Restoring session…' : 'Sign in with Microsoft'} onPress={signIn} loading={restoring || status === 'signingIn'} />
                    <ThemedText variant="footnote" style={{ textAlign: 'center' }}>
                        Use your company Microsoft account. You stay signed in on this device.
                    </ThemedText>
                </Animated.View>
            </View>
            </ScrollView>
        </SafeAreaView>
    );
}
