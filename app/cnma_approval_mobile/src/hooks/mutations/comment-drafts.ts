import { useSyncExternalStore } from 'react';
import type { MentionUser } from '@/utils/mentions';

/** A comment being written on a task: the text and the people tagged in it. */
export interface CommentDraft {
    text: string;
    tagged: readonly MentionUser[];
}

const EMPTY: CommentDraft = { text: '', tagged: [] };
let drafts = new Map<string, CommentDraft>();
const listeners = new Set<() => void>();

function emit() {
    listeners.forEach((listener) => listener());
}

/**
 * Drafts per task, shared by the composer and the Tag people sheet, and kept when the user leaves the
 * task and comes back (like a chat draft). In memory only; cleared on sign-out.
 */
export const commentDrafts = {
    get: (instanceId: string) => drafts.get(instanceId) ?? EMPTY,
    set: (instanceId: string, update: (draft: CommentDraft) => CommentDraft) => {
        const next = update(drafts.get(instanceId) ?? EMPTY);
        const map = new Map(drafts);
        if (next.text === '' && next.tagged.length === 0) map.delete(instanceId);
        else map.set(instanceId, next);
        drafts = map;
        emit();
    },
    clear: () => {
        drafts = new Map();
        emit();
    },
};

export function useCommentDraft(instanceId: string): CommentDraft {
    return useSyncExternalStore(
        (onChange) => {
            listeners.add(onChange);
            return () => listeners.delete(onChange);
        },
        () => drafts.get(instanceId) ?? EMPTY,
        () => EMPTY
    );
}
