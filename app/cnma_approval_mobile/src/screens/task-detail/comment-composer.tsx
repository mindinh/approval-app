import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions, type TextInputInstance } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/icon';
import { PERSON_ROW_HEIGHT, PersonRow } from '@/components/person-row';
import { ThemedText } from '@/components/themed-text';
import { commentDrafts, useCommentDraft } from '@/hooks/mutations/comment-drafts';
import { useAddComment } from '@/hooks/mutations/use-add-comment';
import { useMentionDirectory } from '@/hooks/queries/use-user-queries';
import { useIsOnline } from '@/hooks/use-is-online';
import type { WriteContext } from '@/lib/api/bff-api';
import { features } from '@/lib/config/env';
import { haptics } from '@/lib/haptics';
import { duration, radius, spacing, type, useColors } from '@/theme';
import {
    activeMention,
    activeTags,
    buildSearchIndex,
    COMMENT_LIMIT,
    insertMention,
    mentionParts,
    remainingCharacters,
    removeMention,
    searchMentionUsers,
    type MentionUser,
} from '@/utils/mentions';

/** Show the remaining-characters hint from this many left. */
const COUNTER_FROM = 40;
/** Suggestions shown while typing "@…" (the list scrolls; the Tag people sheet has everyone). */
const SUGGESTION_LIMIT = 20;

/** Height the composer covers at the bottom before it is measured (one-line draft). */
export const COMPOSER_HEIGHT = 64;

/**
 * Message composer pinned to the bottom of the Comments tab of an open task (web: comment input with
 * mentions). It rides on the keyboard and reports its height so the thread pads by what it covers.
 *
 * Tagging (CC), made for phones:
 * - typing "@" opens suggestions right above the field (the keyboard stays up; taps never close it);
 *   the search runs on the device over the cached directory, accent-insensitive, as you type
 * - picking a person writes "@Full Name" highlighted in the field; tag as many people as you like
 * - tagged people show as chips (× removes them); deleting or editing a name un-tags that person
 * - the @ button opens the Tag people sheet to tick several people at once
 * The draft (text and tags) is kept per task, so leaving the task and coming back keeps it.
 * Tagging is left out entirely when the build turns it off (features.mentions).
 */
export function CommentComposer({
    instanceId,
    context,
    onHeightChange,
    onSent,
}: {
    instanceId: string;
    context: WriteContext;
    onHeightChange?: (height: number) => void;
    onSent?: () => void;
}) {
    const colors = useColors();
    const router = useRouter();
    const { bottom } = useSafeAreaInsets();
    const { height: windowHeight } = useWindowDimensions();
    const online = useIsOnline();
    const { send: sendComment } = useAddComment(instanceId, context);
    const draft = useCommentDraft(instanceId);
    const inputRef = useRef<TextInputInstance>(null);
    const [focused, setFocused] = useState(false);
    const [selection, setSelection] = useState({ start: draft.text.length, end: draft.text.length });

    const text = draft.text;
    const tagged = features.mentions ? activeTags(text, draft.tagged) : [];
    const mention = features.mentions && focused && selection.start === selection.end ? activeMention(text, selection.start) : null;

    // The directory loads once the user starts writing, so the first "@" already has people to show.
    const directory = useMentionDirectory(features.mentions && (focused || tagged.length > 0));
    const index = useMemo(() => buildSearchIndex(directory.data ?? []), [directory.data]);
    const suggestions = mention ? searchMentionUsers(index, mention.query, SUGGESTION_LIMIT) : [];

    const remaining = remainingCharacters(text, tagged);
    const canSend = online && text.trim().length > 0 && remaining >= 0;

    const setText = (next: string) => commentDrafts.set(instanceId, (current) => ({ text: next, tagged: activeTags(next, current.tagged) }));

    const changeText = (next: string) => {
        // Move the caret with the edit right away; onSelectionChange corrects it (its order differs per OS).
        if (selection.start === selection.end) {
            const caret = Math.max(0, selection.start + next.length - text.length);
            setSelection({ start: caret, end: caret });
        }
        setText(next);
    };

    const placeCaret = (caret: number) => {
        setSelection({ start: caret, end: caret });
        requestAnimationFrame(() => inputRef.current?.setSelection(caret, caret));
    };

    const pick = (user: MentionUser) => {
        if (!mention) return;
        haptics.selection();
        const already = tagged.some((item) => item.sapUser === user.sapUser);
        if (already) {
            // Already tagged: just drop the "@query" that was typed.
            setText(text.slice(0, mention.start) + text.slice(selection.start));
            placeCaret(mention.start);
            return;
        }
        const result = insertMention(text, mention.start, selection.start, user);
        commentDrafts.set(instanceId, (current) => ({ text: result.text, tagged: [...activeTags(result.text, current.tagged), user] }));
        placeCaret(result.caret);
    };

    const untag = (user: MentionUser) => {
        haptics.selection();
        commentDrafts.set(instanceId, (current) => {
            const next = removeMention(current.text, user);
            return { text: next, tagged: current.tagged.filter((item) => item.sapUser !== user.sapUser) };
        });
    };

    const send = () => {
        if (!canSend) return;
        haptics.light();
        sendComment(text, tagged);
        commentDrafts.set(instanceId, () => ({ text: '', tagged: [] }));
        setSelection({ start: 0, end: 0 });
        onSent?.();
    };

    const openTagSheet = () => {
        haptics.light();
        router.push({ pathname: '/tag-people', params: { id: instanceId } });
    };

    // Up to ~5 rows, never more than a third of the screen (small phones with the keyboard up).
    const panelHeight = Math.min(PERSON_ROW_HEIGHT * 5, Math.round(windowHeight * 0.3));

    return (
        <KeyboardStickyView offset={{ closed: 0, opened: bottom }} style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
            <View
                onLayout={(event) => onHeightChange?.(event.nativeEvent.layout.height)}
                style={{
                    gap: spacing.xs,
                    paddingTop: spacing.sm,
                    paddingBottom: Math.max(bottom, spacing.sm) + spacing.xs,
                    backgroundColor: colors.groupedBackground,
                    borderTopWidth: 0.5,
                    borderTopColor: colors.separator,
                }}
            >
                {mention ? (
                    <Animated.View
                        entering={FadeIn.duration(duration.fast)}
                        exiting={FadeOut.duration(duration.fast)}
                        style={{ maxHeight: panelHeight, marginHorizontal: spacing.md, borderRadius: radius.md, borderCurve: 'continuous', backgroundColor: colors.cardBackground, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden' }}
                    >
                        <SuggestionList
                            query={mention.query}
                            users={suggestions}
                            tagged={tagged}
                            loading={directory.isPending && directory.fetchStatus === 'fetching'}
                            unavailable={directory.data === undefined && (Boolean(directory.error) || !online)}
                            offline={!online}
                            onRetry={() => void directory.refetch()}
                            onPick={pick}
                        />
                    </Animated.View>
                ) : null}

                {tagged.length > 0 ? <TaggedChips users={tagged} onRemove={untag} /> : null}

                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, paddingHorizontal: spacing.md }}>
                    {features.mentions ? (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Tag people"
                            accessibilityHint="Choose people to copy on this comment"
                            hitSlop={4}
                            onPress={openTagSheet}
                            style={({ pressed }) => ({ width: 40, height: 40, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? colors.fillBackground : 'transparent' })}
                        >
                            <Icon name={{ ios: 'at', android: 'alternate_email' }} size={20} color={colors.accent} />
                        </Pressable>
                    ) : null}
                    <TextInput
                        ref={inputRef}
                        onChangeText={changeText}
                        onSelectionChange={(event) => setSelection(event.nativeEvent.selection)}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        placeholder={online ? (features.mentions ? 'Write a comment… (@ to tag)' : 'Write a comment…') : 'Offline: sending needs a connection'}
                        placeholderTextColor={colors.tertiaryLabel}
                        multiline
                        maxLength={COMMENT_LIMIT}
                        accessibilityLabel="Comment"
                        accessibilityHint={features.mentions ? 'Type @ to tag someone' : undefined}
                        style={[
                            type.callout,
                            {
                                flex: 1,
                                minHeight: 40,
                                maxHeight: 120,
                                paddingHorizontal: spacing.md,
                                paddingTop: 10,
                                paddingBottom: 10,
                                borderRadius: 20,
                                backgroundColor: colors.cardBackground,
                                borderWidth: 1,
                                borderColor: focused ? colors.accent : colors.cardBorder,
                                color: colors.label,
                            },
                        ]}
                    >
                        {/* Mentions are highlighted inside the field (styled children of a TextInput). */}
                        {mentionParts(text, tagged).map((part, partIndex) => (
                            <Text key={partIndex} style={part.mention ? { color: colors.accent, fontWeight: '600' } : undefined}>
                                {part.text}
                            </Text>
                        ))}
                    </TextInput>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={tagged.length > 0 ? `Send comment and copy ${tagged.length} ${tagged.length === 1 ? 'person' : 'people'}` : 'Send comment'}
                        accessibilityState={{ disabled: !canSend }}
                        disabled={!canSend}
                        hitSlop={4}
                        onPress={send}
                        style={({ pressed }) => ({
                            width: 40,
                            height: 40,
                            borderRadius: radius.full,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: canSend ? colors.accentFill : colors.fillBackground,
                            opacity: pressed ? 0.75 : 1,
                        })}
                    >
                        <Icon name={{ ios: 'arrow.up', android: 'send' }} size={17} color={canSend ? colors.onAccent : colors.tertiaryLabel} />
                    </Pressable>
                </View>
                {remaining <= COUNTER_FROM ? (
                    <ThemedText variant="caption" style={{ alignSelf: 'flex-end', marginRight: 64, fontVariant: ['tabular-nums'], color: remaining < 0 ? colors.danger : colors.secondaryLabel }}>
                        {remaining < 0 ? `Too long by ${-remaining} (tags count too)` : `${remaining} characters left`}
                    </ThemedText>
                ) : null}
            </View>
        </KeyboardStickyView>
    );
}

/** "CC" strip of the people tagged in the draft; × un-tags (and removes the name from the text). */
function TaggedChips({ users, onRemove }: { users: readonly MentionUser[]; onRemove: (user: MentionUser) => void }) {
    const colors = useColors();
    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always" contentContainerStyle={{ gap: spacing.xs, paddingHorizontal: spacing.md, alignItems: 'center' }}>
            <ThemedText variant="caption" style={{ color: colors.secondaryLabel, fontWeight: '700', marginRight: 2 }}>
                CC
            </ThemedText>
            {users.map((user) => (
                <Pressable
                    key={user.sapUser}
                    onPress={() => onRemove(user)}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${user.fullName} from CC`}
                    style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingLeft: spacing.sm,
                        paddingRight: 6,
                        paddingVertical: 4,
                        borderRadius: radius.full,
                        backgroundColor: colors.accentSoft,
                        opacity: pressed ? 0.7 : 1,
                    })}
                >
                    <ThemedText variant="caption" numberOfLines={1} style={{ color: colors.accent, fontWeight: '600', maxWidth: 160 }}>
                        {user.fullName}
                    </ThemedText>
                    <Icon name={{ ios: 'xmark.circle.fill', android: 'cancel' }} size={14} color={colors.accent} />
                </Pressable>
            ))}
        </ScrollView>
    );
}

/** People matching "@query", with loading, offline, error and no-match states. */
function SuggestionList({
    query,
    users,
    tagged,
    loading,
    unavailable,
    offline,
    onRetry,
    onPick,
}: {
    query: string;
    users: readonly MentionUser[];
    tagged: readonly MentionUser[];
    loading: boolean;
    unavailable: boolean;
    offline: boolean;
    onRetry: () => void;
    onPick: (user: MentionUser) => void;
}) {
    const colors = useColors();
    if (loading) {
        return (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md }}>
                <ActivityIndicator size="small" color={colors.secondaryLabel} />
                <ThemedText variant="footnote">Loading people…</ThemedText>
            </View>
        );
    }
    if (unavailable) {
        return (
            <Pressable onPress={offline ? undefined : onRetry} accessibilityRole={offline ? undefined : 'button'} style={{ padding: spacing.md }}>
                <ThemedText variant="footnote" style={{ color: colors.secondaryLabel }}>
                    {offline ? 'Connect to the internet to search people.' : 'Could not load people. Tap to try again.'}
                </ThemedText>
            </Pressable>
        );
    }
    if (users.length === 0) {
        return (
            <ThemedText variant="footnote" style={{ padding: spacing.md, color: colors.secondaryLabel }}>
                {query.trim() ? `No one matches “${query.trim()}”` : 'Type a name to tag someone.'}
            </ThemedText>
        );
    }
    return (
        <ScrollView keyboardShouldPersistTaps="always" accessibilityRole="list">
            {users.map((user, rowIndex) => (
                <PersonRow key={user.sapUser} user={user} selected={tagged.some((item) => item.sapUser === user.sapUser)} divider={rowIndex > 0} onPress={() => onPick(user)} />
            ))}
        </ScrollView>
    );
}
