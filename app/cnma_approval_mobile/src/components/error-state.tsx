import { useState } from 'react';
import { Pressable, Share, View } from 'react-native';
import { useOptionalSession } from '@/lib/auth/session';
import { haptics } from '@/lib/haptics';
import { layout, radius, shadows, spacing, useColors } from '@/theme';
import { describeError, type AppErrorInfo } from '@/utils/app-error';
import { CopyableText } from './copyable-text';
import { Button } from './button';
import { Icon } from './icon';
import { ThemedText } from './themed-text';

/** Opens the share sheet with the error report, so the user can send it to IT by mail or Teams. */
function shareReport(info: AppErrorInfo) {
    haptics.light();
    void Share.share({ title: 'My Approval – error report', message: info.report }).catch(() => undefined);
}

function useErrorActions(info: AppErrorInfo, onRetry?: () => void) {
    const session = useOptionalSession();
    const [retrying, setRetrying] = useState(false);
    const retry = onRetry
        ? async () => {
              haptics.light();
              setRetrying(true);
              try {
                  await Promise.resolve(onRetry());
              } finally {
                  setRetrying(false);
              }
          }
        : undefined;
    // Signing out returns to the sign-in screen (protected routes), which signs the user in again.
    const signInAgain = info.needsSignIn && session ? () => void session.signOut() : undefined;
    return { retry, retrying, signInAgain };
}

/** Small "Code HTTP-503" chip the user can quote to IT. */
function CodeChip({ code }: { code: string }) {
    const colors = useColors();
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm, backgroundColor: colors.fillBackground }}>
            <CopyableText variant="caption" copyValue={code} label="error code" style={{ fontVariant: ['tabular-nums'], color: colors.secondaryLabel }}>
                Error code {code}
            </CopyableText>
        </View>
    );
}

/**
 * Full error panel for a screen or tab that could not load: illustration, plain-language title and
 * explanation, the error code, and the actions that help — Try again, Sign in again (expired session) and
 * "Send details to IT" (share sheet with a technical report). Centered and width-capped on tablets.
 *
 * @param context what the user was doing, included in the IT report ("Loading the inbox")
 */
export function ErrorState({ error, context, onRetry }: { error: unknown; context?: string; onRetry?: () => void | Promise<unknown> }) {
    const colors = useColors();
    const info = describeError(error, context);
    const { retry, retrying, signInAgain } = useErrorActions(info, onRetry);
    const tint = info.kind === 'session' || info.kind === 'forbidden' ? colors.warning : info.kind === 'offline' || info.kind === 'timeout' ? colors.info : colors.danger;

    return (
        <View
            accessibilityRole="alert"
            style={{
                width: '100%',
                maxWidth: layout.maxFormWidth,
                alignSelf: 'center',
                alignItems: 'center',
                gap: spacing.md,
                paddingVertical: spacing.xl,
                paddingHorizontal: spacing.lg,
                borderRadius: radius.card,
                borderCurve: 'continuous',
                backgroundColor: colors.cardBackground,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                boxShadow: shadows.card,
            }}
        >
            <View style={{ width: 72, height: 72, borderRadius: radius.full, backgroundColor: `${tint}1F`, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={info.icon} size={32} color={tint} />
            </View>
            <View style={{ alignItems: 'center', gap: spacing.sm }}>
                <ThemedText variant="title2" style={{ textAlign: 'center' }}>
                    {info.title}
                </ThemedText>
                <ThemedText variant="subhead" style={{ textAlign: 'center', lineHeight: 21 }}>
                    {info.message}
                </ThemedText>
            </View>
            <CodeChip code={info.code} />
            <View style={{ alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.xs }}>
                {signInAgain ? <Button title="Sign in again" onPress={signInAgain} style={{ alignSelf: 'stretch' }} /> : null}
                {retry && !info.needsSignIn ? <Button title="Try again" loading={retrying} onPress={retry} style={{ alignSelf: 'stretch' }} /> : null}
                <Button title="Send details to IT" variant="secondary" onPress={() => shareReport(info)} style={{ alignSelf: 'stretch' }} />
            </View>
        </View>
    );
}

/**
 * Compact error row inside a Section or list (a part of the screen failed, the rest still works): icon,
 * plain-language title and reason, Retry, and a "Details for IT" link.
 */
export function InlineErrorRow({ title, error, context, onRetry }: { title?: string; error: unknown; context?: string; onRetry?: () => void | Promise<unknown> }) {
    const colors = useColors();
    const info = describeError(error, context ?? title);
    const { retry, retrying, signInAgain } = useErrorActions(info, onRetry);
    const action = signInAgain ? { label: 'Sign in', onPress: signInAgain } : retry ? { label: retrying ? 'Retrying…' : 'Retry', onPress: () => void retry() } : null;

    return (
        <View accessibilityRole="alert" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.smd, padding: spacing.md }}>
            <View style={{ paddingTop: 2 }}>
                <Icon name={info.icon} size={20} color={info.kind === 'session' ? colors.warning : colors.danger} />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
                <ThemedText variant="headline">{title ?? info.title}</ThemedText>
                <ThemedText variant="footnote" numberOfLines={3}>
                    {title ? `${info.title}. ${info.message}` : info.message}
                </ThemedText>
                <Pressable accessibilityRole="button" hitSlop={6} onPress={() => shareReport(info)} style={({ pressed }) => ({ alignSelf: 'flex-start', opacity: pressed ? 0.6 : 1 })}>
                    <ThemedText variant="caption" style={{ color: colors.secondaryLabel, textDecorationLine: 'underline' }}>
                        {info.code} · Details for IT
                    </ThemedText>
                </Pressable>
            </View>
            {action ? (
                <Pressable
                    accessibilityRole="button"
                    onPress={action.onPress}
                    disabled={retrying}
                    hitSlop={8}
                    style={({ pressed }) => ({ paddingHorizontal: spacing.smd, paddingVertical: spacing.xs, borderRadius: radius.sm, backgroundColor: pressed ? colors.fillBackground : 'transparent' })}
                >
                    <ThemedText variant="headline" style={{ color: colors.accent }}>
                        {action.label}
                    </ThemedText>
                </Pressable>
            ) : null}
        </View>
    );
}
