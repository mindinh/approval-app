import { FlashList } from '@shopify/flash-list';
import { useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { SearchField } from '@/components/search-field';
import { SheetHeader } from '@/components/sheet-header';
import { Skeleton } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { commentDrafts, useCommentDraft } from '@/hooks/mutations/comment-drafts';
import { useMentionDirectory } from '@/hooks/queries/use-user-queries';
import { useDismiss } from '@/hooks/use-dismiss';
import { haptics } from '@/lib/haptics';
import { PersonRow } from '@/components/person-row';
import { spacing, useColors } from '@/theme';
import { activeTags, appendMention, COMMENT_LIMIT, buildSearchIndex, mentionLabel, remainingCharacters, removeMention, searchMentionUsers, type MentionUser } from '@/utils/mentions';

/** Enough for any real search; the list is virtualized, so this only bounds the sort. */
const RESULT_LIMIT = 300;

/**
 * Tag people (CC) for a task's comment: search the directory on the device and tick as many people as
 * needed. Each tick adds "@Full Name" to the draft (untick removes it), so the composer shows exactly who
 * is copied. Opens from the @ button next to the comment field.
 */
export function TagPeopleSheet({ instanceId }: { instanceId: string }) {
    const colors = useColors();
    const dismiss = useDismiss();
    const draft = useCommentDraft(instanceId);
    const directory = useMentionDirectory(true);
    const [query, setQuery] = useState('');
    const index = useMemo(() => buildSearchIndex(directory.data ?? []), [directory.data]);
    const results = useMemo(() => searchMentionUsers(index, query, RESULT_LIMIT), [index, query]);
    const tagged = activeTags(draft.text, draft.tagged);
    const isTagged = (user: MentionUser) => tagged.some((item) => item.sapUser === user.sapUser);

    const toggle = (user: MentionUser) => {
        if (isTagged(user)) {
            haptics.selection();
            commentDrafts.set(instanceId, (current) => ({ text: removeMention(current.text, user), tagged: current.tagged.filter((item) => item.sapUser !== user.sapUser) }));
            return;
        }
        const nextText = appendMention(draft.text, user);
        if (remainingCharacters(nextText, [...tagged, user]) < 0) {
            Alert.alert('Comment too long', `Tagging ${user.fullName} would pass the ${COMMENT_LIMIT}-character limit of SAP comments (tags count too). Shorten the comment first.`);
            return;
        }
        haptics.selection();
        commentDrafts.set(instanceId, (current) => ({ text: appendMention(current.text, user), tagged: [...current.tagged, user] }));
    };

    const header = (
        <View style={{ gap: spacing.smd, paddingBottom: spacing.sm }}>
            <SheetHeader title="Tag people" onDone={dismiss} />
            <SearchField value={query} onChangeText={setQuery} placeholder="Search name, SAP user or e-mail" />
            <ThemedText variant="footnote" style={{ color: colors.secondaryLabel, paddingHorizontal: spacing.xs }} accessibilityLiveRegion="polite">
                {tagged.length === 0 ? 'Tagged people get a copy of your comment (CC).' : `${tagged.length} tagged: ${tagged.map((user) => mentionLabel(user).slice(1)).join(', ')}`}
            </ThemedText>
        </View>
    );

    if (directory.data === undefined) {
        return (
            <View style={{ flex: 1, padding: spacing.md, gap: spacing.sm, backgroundColor: colors.groupedBackground }}>
                {header}
                {directory.error ? (
                    <ErrorState error={directory.error} context="Loading people" onRetry={() => directory.refetch()} />
                ) : (
                    Array.from({ length: 6 }, (_, row) => <Skeleton key={row} height={44} />)
                )}
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.groupedBackground }}>
            <FlashList
                data={results}
                keyExtractor={(user) => user.sapUser}
                extraData={tagged}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xl }}
                ListHeaderComponent={header}
                ListEmptyComponent={
                    <EmptyState
                        icon={{ ios: 'person.crop.circle.badge.questionmark', android: 'person_search' }}
                        tint={{ foreground: colors.secondaryLabel, background: colors.fillBackground }}
                        title={query.trim() ? 'No one found' : 'No people available'}
                        message={query.trim() ? `Nobody matches “${query.trim()}”. Try a first name, last name or SAP user.` : 'The SAP user directory is empty.'}
                    />
                }
                renderItem={({ item, index: row }) => (
                    <View style={{ backgroundColor: colors.cardBackground, borderTopLeftRadius: row === 0 ? 12 : 0, borderTopRightRadius: row === 0 ? 12 : 0, borderBottomLeftRadius: row === results.length - 1 ? 12 : 0, borderBottomRightRadius: row === results.length - 1 ? 12 : 0, overflow: 'hidden' }}>
                        <PersonRow user={item} selected={isTagged(item)} divider={row > 0} onPress={() => toggle(item)} />
                    </View>
                )}
            />
        </View>
    );
}
