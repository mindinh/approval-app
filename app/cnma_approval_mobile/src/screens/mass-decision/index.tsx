import type { MassDecisionItemResult } from '@approval-core/inbox-types';
import { Stack, useRouter } from 'expo-router';
import { Fragment, memo, useEffect, useState } from 'react';
import { BackHandler, Pressable, TextInput, View } from 'react-native';
import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { Notice } from '@/components/notice';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { RowSeparator, Section } from '@/components/section';
import { SheetHeader } from '@/components/sheet-header';
import { ThemedText } from '@/components/themed-text';
import { MAX_COMMENT_LENGTH } from '@/constants/limits';
import { massSelection, useMassSelection } from '@/hooks/mutations/mass-selection';
import type { TaskSummary } from '@/utils/task-summary';
import { MassDecisionFailure, useDecideTasks, type MassDecisionKind } from '@/hooks/mutations/use-decide-tasks';
import { useDismiss } from '@/hooks/use-dismiss';
import { useIsOnline } from '@/hooks/use-is-online';
import { haptics } from '@/lib/haptics';
import { layout, spacing, type, useColors } from '@/theme';
import { describeError } from '@/utils/app-error';
import { DecisionSuccess } from '../decision/decision-success';

/**
 * Rows shown before "Show all" in the selection preview. The selection is capped (MASS_LIMIT = 50), so the
 * full list renders inline in the sheet's scroll view: cheaper than a virtualized list nested in it.
 */
const PREVIEW_ROWS = 5;

const plural = (count: number) => `${count} ${count === 1 ? 'request' : 'requests'}`;

/**
 * Mass Approve / Reject (web: MassDecisionDialog), as a native sheet: what is decided (the selected
 * requests), one comment for all (required to reject), then confirm. While sending the sheet is locked.
 * Afterwards it shows the outcome per request like the web toasts: all done (confirmation animation),
 * or how many went through plus each failed request with SAP's reason. The Inbox is refreshed either way.
 */
export function MassDecisionSheet({ kind }: { kind: MassDecisionKind }) {
    const colors = useColors();
    const router = useRouter();
    const dismiss = useDismiss();
    const online = useIsOnline();
    const selection = useMassSelection();
    // Freeze the list once sending starts: the selection is cleared afterwards but the result still names them.
    const [tasks] = useState(() => [...selection.tasks.values()]);
    const [comment, setComment] = useState('');
    const [showAll, setShowAll] = useState(false);
    const decide = useDecideTasks();
    const reject = kind === 'reject';
    const sending = decide.isPending;
    const missingComment = reject && comment.trim() === '';
    const verb = reject ? 'Reject' : 'Approve';

    // Android Back must not close the sheet mid-send (iOS: swipe is disabled below).
    useEffect(() => {
        if (!sending) return;
        const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
        return () => subscription.remove();
    }, [sending]);

    const finish = () => {
        massSelection.end();
        router.back();
    };

    const confirm = () => {
        if (missingComment || sending || !online || tasks.length === 0) return;
        haptics.light();
        decide.mutate({ kind, comment, tasks });
    };

    // Outcome: every request decided → confirmation; some failed → summary with reasons.
    if (decide.isSuccess) {
        const { results, succeededCount, total } = decide.data;
        const failed = (results ?? []).filter((result) => result.status === 'FAILED');
        if (failed.length === 0) {
            return (
                <ScreenScrollView maxWidth={layout.maxFormWidth}>
                    <Stack.Screen options={{ gestureEnabled: false }} />
                    <DecisionSuccess positive={!reject} title={`${plural(succeededCount || total)} ${reject ? 'rejected' : 'approved'}`} detail="Sent to SAP" onDone={finish} />
                </ScreenScrollView>
            );
        }
        return (
            <ScreenScrollView maxWidth={layout.maxFormWidth}>
                <Stack.Screen options={{ gestureEnabled: false }} />
                <SheetHeader title={`${succeededCount} of ${total} ${reject ? 'rejected' : 'approved'}`} onDone={finish} />
                <Notice
                    tone="warning"
                    icon={{ ios: 'exclamationmark.triangle.fill', android: 'warning' }}
                    title={`${plural(failed.length)} not ${reject ? 'rejected' : 'approved'}`}
                    message="SAP did not accept these. They stay in your Inbox; open one to see why or to try again."
                />
                <Section title="Not decided">
                    {failed.map((result, index) => (
                        <Fragment key={result.instanceId}>
                            {index > 0 ? <RowSeparator /> : null}
                            <FailedRow result={result} documentOf={(id) => tasks.find((task) => task.instanceId === id)?.documentId} />
                        </Fragment>
                    ))}
                </Section>
                <Button title="Done" variant="secondary" onPress={finish} />
            </ScreenScrollView>
        );
    }

    const failure = decide.error instanceof MassDecisionFailure ? decide.error : null;
    const failureInfo = failure ? describeError(failure.cause, `Sending ${verb.toLowerCase()} decisions`) : null;

    return (
        <ScreenScrollView maxWidth={layout.maxFormWidth}>
            <Stack.Screen options={{ gestureEnabled: !sending }} />
            <SheetHeader title={`${verb} ${plural(tasks.length)}`} onDone={sending ? () => undefined : dismiss} />

            <Section title={`Selected (${tasks.length})`}>
                {(showAll ? tasks : tasks.slice(0, PREVIEW_ROWS)).map((task, index) => (
                    <Fragment key={task.instanceId}>
                        {index > 0 ? <RowSeparator /> : null}
                        <SelectedRow task={task} />
                    </Fragment>
                ))}
                {tasks.length > PREVIEW_ROWS ? (
                    <>
                        <RowSeparator />
                        <Pressable
                            accessibilityRole="button"
                            accessibilityState={{ expanded: showAll }}
                            onPress={() => {
                                haptics.selection();
                                setShowAll((value) => !value);
                            }}
                            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.smd, opacity: pressed ? 0.6 : 1 })}
                        >
                            <ThemedText variant="footnote" style={{ flex: 1, color: colors.accent, fontWeight: '600' }}>
                                {showAll ? 'Show less' : `Show all ${tasks.length} (${tasks.length - PREVIEW_ROWS} more)`}
                            </ThemedText>
                            <Icon name={showAll ? { ios: 'chevron.up', android: 'expand_less' } : { ios: 'chevron.down', android: 'expand_more' }} size={14} color={colors.accent} />
                        </Pressable>
                    </>
                ) : null}
            </Section>

            <Section
                title={reject ? 'Reason (required)' : 'Comment (optional)'}
                footer={reject ? 'The same reason is added to every selected request.' : 'The same comment is added to every selected request.'}
            >
                <TextInput
                    value={comment}
                    onChangeText={setComment}
                    editable={!sending && failure?.outcome !== 'unknown'}
                    placeholder={reject ? 'Reason for rejection…' : 'Add a comment…'}
                    placeholderTextColor={colors.tertiaryLabel}
                    multiline
                    maxLength={MAX_COMMENT_LENGTH}
                    autoFocus={reject}
                    accessibilityLabel={reject ? 'Rejection reason' : 'Comment'}
                    style={[type.body, { minHeight: 100, padding: spacing.md, color: colors.label, textAlignVertical: 'top', opacity: sending ? 0.6 : 1 }]}
                />
            </Section>

            {!online && !failure ? (
                <Notice tone="warning" icon={{ ios: 'wifi.slash', android: 'wifi_off' }} title="You are offline" message="Decisions are sent to SAP right away, so they need a connection." />
            ) : null}
            {failure?.outcome === 'unknown' ? (
                <Notice
                    tone="danger"
                    icon={{ ios: 'exclamationmark.triangle.fill', android: 'error' }}
                    title="Could not confirm the decisions"
                    message="The connection dropped while SAP was working. Some requests may already be decided: your Inbox is refreshed, and decided ones disappear from it. Check it before deciding again."
                />
            ) : failure && failureInfo ? (
                <Notice tone="danger" icon={{ ios: 'exclamationmark.triangle.fill', android: 'error' }} title={`Not sent: ${failureInfo.title}`} message={`${failureInfo.message} Nothing was decided.`} />
            ) : null}

            {failure?.outcome === 'unknown' ? (
                <Button title="Back to Inbox" variant="secondary" onPress={finish} />
            ) : (
                <Button
                    title={sending ? `${reject ? 'Rejecting' : 'Approving'} ${plural(tasks.length)}…` : failure ? `Try again` : `${verb} ${tasks.length}`}
                    variant={reject ? 'destructive' : 'primary'}
                    loading={sending}
                    disabled={missingComment || !online || tasks.length === 0}
                    onPress={() => {
                        if (failure) decide.reset();
                        confirm();
                    }}
                    style={{ alignSelf: 'stretch' }}
                />
            )}
            {sending ? (
                <ThemedText variant="footnote" style={{ textAlign: 'center' }}>
                    SAP decides a few requests at a time. Keep the app open until it finishes.
                </ThemedText>
            ) : null}
        </ScreenScrollView>
    );
}

/** One selected request: title, then type · document number · amount. */
const SelectedRow = memo(function SelectedRow({ task }: { task: TaskSummary }) {
    const colors = useColors();
    return (
        <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.smd, gap: 2 }}>
            <ThemedText variant="subhead" numberOfLines={1} style={{ color: colors.label, fontWeight: '600' }}>
                {task.title}
            </ThemedText>
            <ThemedText variant="caption" numberOfLines={1} style={{ fontVariant: ['tabular-nums'] }}>
                {task.typeLabel} · #{task.documentId}
                {task.amount ? ` · ${task.amount.value}` : ''}
            </ThemedText>
        </View>
    );
});

/** A request SAP did not decide, with its reason. */
function FailedRow({ result, documentOf }: { result: MassDecisionItemResult; documentOf: (instanceId: string) => string | undefined }) {
    const colors = useColors();
    const document = result.documentNumber || result.documentId || documentOf(result.instanceId) || result.instanceId;
    return (
        <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.smd }}>
            <Icon name={{ ios: 'xmark.circle', android: 'cancel' }} size={16} color={colors.danger} />
            <View style={{ flex: 1, gap: 2 }}>
                <ThemedText variant="subhead" style={{ color: colors.label, fontWeight: '600', fontVariant: ['tabular-nums'] }}>
                    #{document}
                </ThemedText>
                <ThemedText variant="footnote">{result.error || result.message || 'Decision failed'}</ThemedText>
            </View>
        </View>
    );
}
