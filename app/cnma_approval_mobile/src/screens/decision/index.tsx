import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { Section } from '@/components/section';
import { SheetHeader } from '@/components/sheet-header';
import { ThemedText } from '@/components/themed-text';
import { MAX_COMMENT_LENGTH } from '@/constants/limits';
import { DecisionFailure, useDecideTask } from '@/hooks/mutations/use-decide-task';
import { useTaskDetailView } from '@/hooks/queries/use-task-queries';
import { useDismiss } from '@/hooks/use-dismiss';
import { useIsOnline } from '@/hooks/use-is-online';
import { isTaskOpen } from '@/lib/api/write-outcome';
import { haptics } from '@/lib/haptics';
import { fadeInContent, layout, radius, spacing, type, useColors } from '@/theme';
import { describeError } from '@/utils/app-error';
import { DecisionSuccess } from './decision-success';

/** What to tell the user after a failed decision, by outcome. */
function failureCopy(error: unknown): { title: string; message: string; canRetry: boolean; closed: boolean } {
    if (error instanceof DecisionFailure) {
        switch (error.outcome) {
            case 'closedElsewhere':
                return { title: 'Already decided', message: 'This request was completed in the meantime (for example on the web). Nothing was sent.', canRetry: false, closed: true };
            case 'unknown':
                return {
                    title: 'Could not confirm your decision',
                    message: 'The connection dropped while sending. The app checks with SAP when you are back online and tells you if it did not go through. Please do not decide again until then.',
                    canRetry: false,
                    closed: false,
                };
            case 'notSent': {
                const info = describeError(error.cause, 'Sending a decision');
                return { title: `Not sent: ${info.title}`, message: `${info.message} Your comment is kept, so you can try again.`, canRetry: true, closed: false };
            }
        }
    }
    const info = describeError(error, 'Sending a decision');
    return { title: info.title, message: info.message, canRetry: true, closed: false };
}

/**
 * Decision sheet (web: decision dialog): which task and decision, an optional or required comment
 * (required for a rejection), then confirm. Sending locks the sheet (no swipe-away, no second tap); success
 * shows a confirmation and returns to the list; a failure keeps the comment and says what happened.
 */
export function DecisionSheetScreen({ instanceId, decisionKey }: { instanceId: string; decisionKey: string }) {
    const colors = useColors();
    const router = useRouter();
    const dismiss = useDismiss();
    const online = useIsOnline();
    const detail = useTaskDetailView(instanceId);
    const view = detail.data ?? null;
    const decision = view?.decisions.find((candidate) => candidate.key === decisionKey);
    const [comment, setComment] = useState('');
    const [checking, setChecking] = useState(false);
    const decide = useDecideTask({ instanceId, documentId: view?.documentId ?? '', context: view?.context ?? { sapOrigin: 'LOCAL', documentId: '', businessObjectType: '' } });

    const sending = decide.isPending;
    const failure = decide.error ? failureCopy(decide.error) : null;
    const positive = decide.data?.decision.nature === 'POSITIVE' || decision?.nature === 'POSITIVE';
    const negative = decision?.nature === 'NEGATIVE';
    const missingComment = Boolean(decision?.commentRequired) && comment.trim() === '';
    const tint = positive ? colors.success : negative ? colors.danger : colors.accent;

    // Android Back must not close the sheet mid-send either (iOS: swipe is disabled below).
    useEffect(() => {
        if (!sending) return;
        const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
        return () => subscription.remove();
    }, [sending]);

    // After success: back to the list the user came from (detail and sheet close together).
    const finish = () => router.dismissAll();

    const confirm = () => {
        if (!decision || missingComment || sending || !online || (failure && !failure.canRetry)) return;
        haptics.light();
        decide.mutate({ decision, comment });
    };

    // "Could not confirm": re-read the task. Closed → it went through; open → allow another try.
    const checkAgain = async () => {
        setChecking(true);
        const result = await detail.refetch();
        setChecking(false);
        const open = isTaskOpen(result.data);
        if (open === false) finish();
        else if (open) decide.reset();
    };

    if (decide.isSuccess) {
        const done = decide.data.decision;
        return (
            <ScreenScrollView maxWidth={layout.maxFormWidth}>
                <Stack.Screen options={{ gestureEnabled: false }} />
                <DecisionSuccess
                    positive={done.nature !== 'NEGATIVE'}
                    title={done.nature === 'NEGATIVE' ? 'Rejected' : done.nature === 'POSITIVE' ? 'Approved' : `${done.text} sent`}
                    detail={view ? `${view.typeLabel} #${view.documentId} · sent to SAP` : 'Sent to SAP'}
                    onDone={finish}
                />
            </ScreenScrollView>
        );
    }

    return (
        <ScreenScrollView maxWidth={layout.maxFormWidth}>
            {/* While sending, the sheet cannot be swiped away (the outcome would be lost on screen). */}
            <Stack.Screen options={{ gestureEnabled: !sending }} />
            <SheetHeader title={decision?.text ?? 'Decision'} onDone={sending ? () => undefined : dismiss} />

            {view && decision ? (
                <>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.smd, paddingHorizontal: spacing.xs }}>
                        <View style={{ width: 44, height: 44, borderRadius: radius.full, backgroundColor: `${tint}22`, alignItems: 'center', justifyContent: 'center' }}>
                            <Icon name={positive ? { ios: 'checkmark', android: 'check' } : negative ? { ios: 'xmark', android: 'close' } : { ios: 'questionmark', android: 'help' }} size={20} color={tint} />
                        </View>
                        <View style={{ flex: 1, gap: 2 }}>
                            <ThemedText variant="headline" numberOfLines={2}>
                                {view.title}
                            </ThemedText>
                            <ThemedText variant="footnote" numberOfLines={1}>
                                {view.typeLabel} · #{view.documentId}
                            </ThemedText>
                        </View>
                    </View>

                    <Section
                        title={decision.commentRequired ? 'Comment (required)' : 'Comment (optional)'}
                        footer={negative ? 'Tell the requester why the request is rejected.' : 'The comment is added to the approval history in SAP.'}
                    >
                        <TextInput
                            value={comment}
                            onChangeText={setComment}
                            editable={!sending}
                            placeholder={negative ? 'Reason for rejection…' : 'Add a comment…'}
                            placeholderTextColor={colors.tertiaryLabel}
                            multiline
                            maxLength={MAX_COMMENT_LENGTH}
                            autoFocus={decision.commentRequired}
                            accessibilityLabel="Decision comment"
                            style={[type.body, { minHeight: 120, padding: spacing.md, color: colors.label, textAlignVertical: 'top', opacity: sending ? 0.6 : 1 }]}
                        />
                    </Section>

                    {!online && !failure ? <Notice tone="warning" icon={{ ios: 'wifi.slash', android: 'wifi_off' }} title="You are offline" message="Decisions are sent to SAP right away, so they need a connection. Your comment stays here." /> : null}
                    {failure ? <Notice tone={failure.closed ? 'info' : 'danger'} icon={failure.closed ? { ios: 'info.circle', android: 'info' } : { ios: 'exclamationmark.triangle.fill', android: 'error' }} title={failure.title} message={failure.message} /> : null}

                    {failure?.closed ? (
                        <Button title="Close" variant="secondary" onPress={finish} />
                    ) : failure && !failure.canRetry ? (
                        <Button title="Check again" variant="secondary" loading={checking} disabled={!online} onPress={() => void checkAgain()} />
                    ) : (
                        <Button
                            title={sending ? 'Sending…' : failure ? `Try ${decision.text} again` : decision.text}
                            variant={negative ? 'destructive' : 'primary'}
                            loading={sending}
                            disabled={missingComment || !online}
                            onPress={confirm}
                            style={{ alignSelf: 'stretch' }}
                        />
                    )}
                </>
            ) : (
                <ThemedText variant="footnote" style={{ textAlign: 'center', paddingVertical: spacing.lg }}>
                    {detail.isPending && instanceId ? 'Loading…' : 'This decision is no longer available for the task.'}
                </ThemedText>
            )}
        </ScreenScrollView>
    );
}

function Notice({ tone, icon, title, message }: { tone: 'warning' | 'danger' | 'info'; icon: Parameters<typeof Icon>[0]['name']; title: string; message: string }) {
    const colors = useColors();
    const foreground = tone === 'danger' ? colors.danger : tone === 'warning' ? colors.warning : colors.info;
    const background = tone === 'danger' ? colors.dangerSoft : tone === 'warning' ? colors.warningSoft : colors.infoSoft;
    return (
        <Animated.View entering={fadeInContent} accessibilityLiveRegion="polite" style={{ flexDirection: 'row', gap: spacing.sm, padding: spacing.smd, borderRadius: radius.md, borderCurve: 'continuous', backgroundColor: background }}>
            <Icon name={icon} size={16} color={foreground} />
            <View style={{ flex: 1, gap: 2 }}>
                <ThemedText variant="footnote" style={{ color: foreground, fontWeight: '600' }}>
                    {title}
                </ThemedText>
                <ThemedText variant="footnote" style={{ color: colors.label }}>
                    {message}
                </ThemedText>
            </View>
        </Animated.View>
    );
}
