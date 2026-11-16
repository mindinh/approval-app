import { Fragment, useEffect, useMemo } from 'react';
import { Alert, Pressable, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { Avatar } from '@/components/avatar';
import { EmptyState } from '@/components/empty-state';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { isInThread, pendingComments, usePendingComments, type PendingComment } from '@/hooks/mutations/pending-comments';
import { useAddComment } from '@/hooks/mutations/use-add-comment';
import { useMySapUsername } from '@/hooks/queries/use-user-queries';
import type { WriteContext } from '@/lib/api/bff-api';
import { cssEasing, duration, messageIn, radius, spacing, useColors } from '@/theme';
import { isOwnAuthor } from '@/utils/comment-author';
import { formatDate, parseDate } from '@/utils/format';
import type { TaskComment } from '@/utils/task-detail';

const AVATAR = 30;
/** Consecutive messages of one author closer than this read as one burst (one name, one avatar). */
const BURST_MS = 5 * 60_000;

/** Same pattern as the web comments panel: `<tag>…</tag>` markup or an @mention. */
const MENTION = /(<tag>.*?<\/tag>|@[\p{L}\p{N}._-]+(?:\s+[\p{Lu}\p{N}_][\p{L}\p{N}._-]*)*)/gu;
const unescapeTags = (value: string) => value.replace(/&lt;tag&gt;/g, '<tag>').replace(/&lt;\/tag&gt;/g, '</tag>');

function timeOf(value: string): number {
    const time = parseDate(value).getTime();
    return Number.isNaN(time) ? NaN : time;
}

function clock(value: string): string {
    const date = parseDate(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function dayKey(value: string): string {
    const date = parseDate(value);
    return Number.isNaN(date.getTime()) ? '' : date.toDateString();
}

/** Comment text with tagged users and @mentions as highlighted spans (web: primary badges). */
function MessageText({ text, own }: { text: string; own: boolean }) {
    const colors = useColors();
    const foreground = own ? colors.onAccent : colors.label;
    const parts = unescapeTags(text).split(MENTION);
    return (
        <ThemedText variant="callout" selectable style={{ color: foreground, lineHeight: 21 }}>
            {parts.map((part, index) => {
                const tag = part.startsWith('<tag>') && part.endsWith('</tag>');
                if (tag || (part.startsWith('@') && part.length > 1)) {
                    return (
                        <ThemedText key={index} variant="callout" style={{ color: own ? colors.onAccent : colors.accent, fontWeight: '700', textDecorationLine: own ? 'underline' : 'none' }}>
                            {tag ? `@${part.slice(5, -6).replace(/^@/, "")}` : part}
                        </ThemedText>
                    );
                }
                return part;
            })}
        </ThemedText>
    );
}

function DayChip({ label }: { label: string }) {
    const colors = useColors();
    return (
        <View style={{ alignSelf: 'center', paddingHorizontal: spacing.smd, paddingVertical: 4, marginVertical: spacing.sm, borderRadius: radius.full, backgroundColor: colors.fillBackground }}>
            <ThemedText variant="caption" style={{ fontWeight: '600' }}>
                {label}
            </ThemedText>
        </View>
    );
}

/** One bubble of the thread: a comment from SAP, or one of this device that SAP has not shown yet. */
interface ThreadMessage {
    key: string;
    text: string;
    author: string;
    createdAt: string;
    own: boolean;
    forwarded?: boolean;
    forwardedTo?: string;
    /** Set for a local comment (sending, sent or failed). */
    local?: PendingComment;
}

const OWN = '\u0000me';
const sameBurst = (a: ThreadMessage | undefined, b: ThreadMessage | undefined) =>
    Boolean(a && b) &&
    (a!.own ? OWN : a!.author) === (b!.own ? OWN : b!.author) &&
    dayKey(a!.createdAt) === dayKey(b!.createdAt) &&
    Math.abs(timeOf(b!.createdAt) - timeOf(a!.createdAt)) < BURST_MS;

/**
 * Comments as a chat thread, like messaging apps: day chips, your own messages on the right in the brand
 * color, others on the left with avatar and name once per burst, rounded bubbles with a tail on the last
 * message of a burst, and the time under each burst. A comment you send joins the thread at once and is
 * replaced in place by SAP's copy when the task reloads. Forwarded comments carry a "Forwarded to …" line.
 */
export function CommentsTab({ comments, instanceId, context }: { comments: readonly TaskComment[]; instanceId: string; context: WriteContext }) {
    const colors = useColors();
    const me = useMySapUsername();
    const pending = usePendingComments(instanceId);
    const { retry, discard } = useAddComment(instanceId, context);

    // SAP's thread now has some local comments: drop those copies (they are already hidden below).
    useEffect(() => pendingComments.settle(instanceId, comments), [instanceId, comments]);

    const messages = useMemo<ThreadMessage[]>(
        () => [
            ...comments.map((comment) => ({ key: comment.id, text: comment.text, author: comment.author, createdAt: comment.createdAt, own: isOwnAuthor(comment.author, me), forwarded: comment.forwarded, forwardedTo: comment.forwardedTo })),
            ...pending.filter((local) => !isInThread(local, comments)).map((local) => ({ key: local.id, text: local.text, author: me ?? 'You', createdAt: local.createdAt, own: true, local })),
        ],
        [comments, pending, me]
    );

    if (messages.length === 0) {
        return (
            <EmptyState
                icon={{ ios: 'bubble.left.and.bubble.right', android: 'forum' }}
                tint={{ foreground: colors.secondaryLabel, background: colors.fillBackground }}
                title="No comments yet"
                message="Messages about this request will appear here."
            />
        );
    }
    const today = new Date().toDateString();

    return (
        <View style={{ gap: 2 }}>
            {messages.map((message, index) => {
                const previous = messages[index - 1];
                const next = messages[index + 1];
                const day = dayKey(message.createdAt);
                const newDay = day !== '' && day !== (previous ? dayKey(previous.createdAt) : null);
                return (
                    <Fragment key={message.key}>
                        {newDay ? <DayChip label={day === today ? 'Today' : formatDate(message.createdAt)} /> : null}
                        <MessageRow
                            message={message}
                            firstOfBurst={newDay || !sameBurst(previous, message)}
                            lastOfBurst={!sameBurst(message, next)}
                            spaced={!newDay && !sameBurst(previous, message)}
                            onRetry={() => retry(message.key)}
                            onDiscard={() => discard(message.key)}
                        />
                    </Fragment>
                );
            })}
        </View>
    );
}

const BUBBLE_RADIUS = 18;
const TAIL_RADIUS = 6;

/**
 * A bubble with its avatar, name and time. Own messages sit on the right in the brand colour; a local one
 * rises in when sent, is dimmed while sending, and when sending failed turns red with "Not sent · Tap to
 * retry" (tap: Retry or Delete, the text is never lost silently).
 */
function MessageRow({
    message,
    firstOfBurst,
    lastOfBurst,
    spaced,
    onRetry,
    onDiscard,
}: {
    message: ThreadMessage;
    firstOfBurst: boolean;
    lastOfBurst: boolean;
    spaced: boolean;
    onRetry: () => void;
    onDiscard: () => void;
}) {
    const colors = useColors();
    const reduceMotion = useReducedMotion();
    const { own, local } = message;
    const failed = local?.status === 'failed';
    const sending = local?.status === 'sending';
    const showMeta = lastOfBurst || Boolean(local);

    const ask = () =>
        Alert.alert('Comment not sent', 'It did not reach SAP. Send it again?', [
            { text: 'Delete', style: 'destructive', onPress: onDiscard },
            { text: 'Cancel', style: 'cancel' },
            { text: 'Retry', onPress: onRetry },
        ]);

    const meta = failed ? 'Not sent · Tap to retry' : sending ? 'Sending…' : dayKey(message.createdAt) ? clock(message.createdAt) : message.createdAt;
    const bubbleColor = failed ? colors.dangerSoft : own ? colors.accent : colors.cardBackground;
    const textOnAccent = own && !failed;

    return (
        <Animated.View
            entering={local ? messageIn(reduceMotion) : undefined}
            style={{ flexDirection: 'row', justifyContent: own ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: spacing.sm, marginTop: spaced ? spacing.sm : 0 }}
        >
            {!own ? <View style={{ width: AVATAR }}>{lastOfBurst ? <Avatar name={message.author} size={AVATAR} tone="neutral" /> : null}</View> : null}
            <View style={{ maxWidth: '78%', alignItems: own ? 'flex-end' : 'flex-start', gap: 3 }}>
                {firstOfBurst && !own ? (
                    <ThemedText variant="caption" numberOfLines={1} style={{ marginLeft: spacing.smd, fontWeight: '600', color: colors.secondaryLabel }}>
                        {message.author}
                    </ThemedText>
                ) : null}
                <Pressable
                    disabled={!failed}
                    onPress={ask}
                    accessibilityRole={failed ? 'button' : undefined}
                    accessibilityLabel={failed ? `Comment not sent: ${message.text}` : sending ? `Sending comment: ${message.text}` : undefined}
                    accessibilityHint={failed ? 'Retry or delete' : undefined}
                >
                    <Animated.View
                        style={{
                            paddingHorizontal: spacing.smd + 2,
                            paddingVertical: spacing.sm + 1,
                            gap: 4,
                            borderRadius: BUBBLE_RADIUS,
                            borderCurve: 'continuous',
                            borderBottomLeftRadius: !own && lastOfBurst ? TAIL_RADIUS : BUBBLE_RADIUS,
                            borderBottomRightRadius: own && lastOfBurst ? TAIL_RADIUS : BUBBLE_RADIUS,
                            backgroundColor: bubbleColor,
                            borderWidth: own && !failed ? 0 : 1,
                            borderColor: failed ? colors.danger : colors.cardBorder,
                            // Sending → sent: the bubble settles to full strength (state change, kept under Reduce Motion).
                            opacity: sending ? 0.65 : 1,
                            transitionProperty: 'opacity',
                            transitionDuration: duration.fast,
                            transitionTimingFunction: cssEasing.out,
                        }}
                    >
                        {message.forwarded ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Icon name={{ ios: 'arrowshape.turn.up.right.fill', android: 'forward' }} size={11} color={textOnAccent ? colors.onAccent : colors.info} />
                                <ThemedText variant="caption" style={{ color: textOnAccent ? colors.onAccent : colors.info, fontWeight: '600' }}>
                                    Forwarded to {message.forwardedTo || 'no recipient'}
                                </ThemedText>
                            </View>
                        ) : null}
                        <MessageText text={message.text} own={textOnAccent} />
                    </Animated.View>
                </Pressable>
                {showMeta ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginHorizontal: spacing.sm }}>
                        {failed ? <Icon name={{ ios: 'exclamationmark.circle', android: 'error' }} size={12} color={colors.danger} /> : null}
                        <ThemedText variant="caption" style={{ color: failed ? colors.danger : colors.tertiaryLabel, fontWeight: failed ? '600' : '400', fontVariant: ['tabular-nums'] }}>
                            {meta}
                        </ThemedText>
                    </View>
                ) : null}
            </View>
        </Animated.View>
    );
}
