import { MAX_COMMENT_LENGTH } from '@/constants/limits';

/*
 * @mentions in comments (web: RichMentionInput). On the device a mention is plain text "@Full Name" in the
 * draft plus the tagged user in a list; when sending, each still-present mention becomes the web's markup
 * `<tag>@Full Name</tag>` and the users go to SAP as TAGGEDUSER (CC). Pure functions, no React.
 */

/** A person that can be tagged (CNMA_BUSUSER via GET /tasks/bus-users). */
export interface MentionUser {
    sapUser: string;
    fullName: string;
    email: string;
}

/** SAP NOTETEXT holds 255 characters, markup included. */
export const COMMENT_LIMIT = MAX_COMMENT_LENGTH;
const TAG_OPEN = '<tag>';
const TAG_CLOSE = '</tag>';
/** A mention query stops at a line break or when it gets this long (it is not a mention then). */
const MAX_QUERY = 40;

/** Lower case without accents, so "nguyen" finds "Nguyễn" and "đ" matches "d". */
export function fold(value: string): string {
    return value.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/gi, 'd').toLowerCase();
}

export const mentionLabel = (user: MentionUser) => `@${user.fullName}`;

/**
 * The "@query" being typed at the caret, if any: an "@" at the start or after a space, then up to
 * MAX_QUERY characters without a line break. Spaces are allowed so "@nguyen van" keeps searching.
 */
export function activeMention(text: string, caret: number): { start: number; query: string } | null {
    const before = text.slice(0, caret);
    const at = before.lastIndexOf('@');
    if (at < 0 || (at > 0 && !/\s/.test(before[at - 1]))) return null;
    const query = before.slice(at + 1);
    if (query.length > MAX_QUERY || /[\n\r]/.test(query) || query.startsWith(' ')) return null;
    return { start: at, query };
}

/** Replaces "@query" (from `start` to the caret) with "@Full Name " and puts the caret after it. */
export function insertMention(text: string, start: number, caret: number, user: MentionUser): { text: string; caret: number } {
    const label = `${mentionLabel(user)} `;
    const after = text.slice(caret).replace(/^ /, '');
    return { text: text.slice(0, start) + label + after, caret: start + label.length };
}

/** Adds "@Full Name " at the end of the draft (Tag people sheet). */
export function appendMention(text: string, user: MentionUser): string {
    const spacer = text === '' || /\s$/.test(text) ? '' : ' ';
    return `${text}${spacer}${mentionLabel(user)} `;
}

/** Removes a user's mention from the draft (unticked in the sheet, or the chip's ×). */
export function removeMention(text: string, user: MentionUser): string {
    return text.split(`${mentionLabel(user)} `).join('').split(mentionLabel(user)).join('');
}

/** Tagged users whose "@Full Name" is still in the text: editing or deleting the name un-tags them. */
export function activeTags(text: string, tagged: readonly MentionUser[]): MentionUser[] {
    return tagged.filter((user) => text.includes(mentionLabel(user)));
}

export interface SearchIndexEntry {
    user: MentionUser;
    name: string;
    words: string[];
    other: string;
}

/** Folded search keys, built once per directory load (typing then only compares strings). */
export function buildSearchIndex(users: readonly MentionUser[]): SearchIndexEntry[] {
    return users.map((user) => {
        const name = fold(user.fullName);
        return { user, name, words: name.split(/\s+/).filter(Boolean), other: fold(`${user.sapUser} ${user.email}`) };
    });
}

/**
 * People matching a query, best first: full name starts with it, then every query word starts a name word
 * (any order, "van nguyen" finds "Nguyễn Văn A"), then it appears in the SAP user or e-mail.
 */
export function searchMentionUsers(index: readonly SearchIndexEntry[], query: string, limit: number): MentionUser[] {
    const wanted = fold(query.trim());
    if (!wanted) return index.slice(0, limit).map((entry) => entry.user);
    const tokens = wanted.split(/\s+/);
    const scored: { user: MentionUser; score: number }[] = [];
    for (const entry of index) {
        let score = 0;
        if (entry.name.startsWith(wanted)) score = 3;
        else if (tokens.every((token) => entry.words.some((word) => word.startsWith(token)))) score = 2;
        else if (entry.other.includes(wanted) || entry.name.includes(wanted)) score = 1;
        if (score > 0) scored.push({ user: entry.user, score });
    }
    return scored
        .sort((a, b) => b.score - a.score || a.user.fullName.localeCompare(b.user.fullName))
        .slice(0, limit)
        .map((item) => item.user);
}

/**
 * The text SAP stores: a typed "<tag>" is escaped (it must not fake a mention), then each tagged user's
 * "@Full Name" becomes `<tag>@Full Name</tag>`, longest names first so "@An" never splits "@An Nguyen".
 */
export function serializeComment(text: string, tagged: readonly MentionUser[]): string {
    let result = text.replace(/<tag>/g, '&lt;tag&gt;').replace(/<\/tag>/g, '&lt;/tag&gt;');
    const byLength = [...activeTags(text, tagged)].sort((a, b) => b.fullName.length - a.fullName.length);
    const placeholders: string[] = [];
    for (const user of byLength) {
        const label = mentionLabel(user);
        result = result.split(label).join(`\u0000${placeholders.length}\u0000`);
        placeholders.push(`${TAG_OPEN}${label}${TAG_CLOSE}`);
    }
    return result.replace(/\u0000(\d+)\u0000/g, (_match, index: string) => placeholders[Number(index)]);
}

/** Characters left for SAP once the draft is serialized (negative: too long to send). */
export function remainingCharacters(text: string, tagged: readonly MentionUser[]): number {
    return COMMENT_LIMIT - serializeComment(text.trim(), tagged).length;
}

/** Draft split into plain and mention parts, for highlighting mentions in the input. */
export function mentionParts(text: string, tagged: readonly MentionUser[]): { text: string; mention: boolean }[] {
    const labels = activeTags(text, tagged)
        .map(mentionLabel)
        .sort((a, b) => b.length - a.length);
    if (labels.length === 0) return [{ text, mention: false }];
    const escaped = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return text
        .split(new RegExp(`(${escaped.join('|')})`, 'g'))
        .filter((part) => part !== '')
        .map((part) => ({ text: part, mention: labels.includes(part) }));
}
