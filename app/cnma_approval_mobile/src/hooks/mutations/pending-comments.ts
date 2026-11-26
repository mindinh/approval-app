import { useSyncExternalStore } from 'react';
import { countComments } from '@/lib/api/write-outcome';
import type { MentionUser } from '@/utils/mentions';

/** A comment written on this device that is not in the thread loaded from SAP yet. */
export interface PendingComment {
    id: string;
    /** As sent to SAP (mentions as `<tag>@Name</tag>`). */
    text: string;
    /** People tagged (CC), sent again on retry. */
    tagged: readonly MentionUser[];
    /** sending → sent (SAP accepted it, the thread is catching up) or failed (text kept, tap to retry). */
    status: 'sending' | 'sent' | 'failed';
    /** ISO time it was written. */
    createdAt: string;
    /** Comments with the same text already in the thread when this one was written (see isInThread). */
    before: number;
}

const EMPTY: readonly PendingComment[] = [];
let byTask = new Map<string, readonly PendingComment[]>();
const listeners = new Set<() => void>();

function set(instanceId: string, update: (items: readonly PendingComment[]) => readonly PendingComment[]) {
    const current = byTask.get(instanceId) ?? EMPTY;
    const items = update(current);
    if (items === current) return;
    const next = new Map(byTask);
    if (items.length === 0) next.delete(instanceId);
    else next.set(instanceId, items);
    byTask = next;
    listeners.forEach((listener) => listener());
}

/** Whether SAP's thread now has this comment, so the local copy can go (an older identical one does not count). */
export function isInThread(comment: PendingComment, thread: readonly { text: string }[]): boolean {
    return comment.status === 'sent' && countComments(thread, comment.text) > comment.before;
}

/**
 * Comments shown in the thread right away (optimistic) while they are sent, and kept as "Not sent" when
 * sending fails, so the text is never lost. In memory only: cleared on sign-out with the rest of the cache.
 */
export const pendingComments = {
    get: (instanceId: string) => byTask.get(instanceId) ?? EMPTY,
    add: (instanceId: string, comment: PendingComment) => set(instanceId, (items) => [...items, comment]),
    mark: (instanceId: string, id: string, status: PendingComment['status']) =>
        set(instanceId, (items) => (items.some((item) => item.id === id && item.status !== status) ? items.map((item) => (item.id === id ? { ...item, status } : item)) : items)),
    remove: (instanceId: string, id: string) => set(instanceId, (items) => (items.some((item) => item.id === id) ? items.filter((item) => item.id !== id) : items)),
    /** Drops the local copies SAP's thread now contains. */
    settle: (instanceId: string, thread: readonly { text: string }[]) =>
        set(instanceId, (items) => (items.some((item) => isInThread(item, thread)) ? items.filter((item) => !isInThread(item, thread)) : items)),
    clear: () => {
        byTask = new Map();
        listeners.forEach((listener) => listener());
    },
};

export function usePendingComments(instanceId: string): readonly PendingComment[] {
    return useSyncExternalStore(
        (onChange) => {
            listeners.add(onChange);
            return () => listeners.delete(onChange);
        },
        () => byTask.get(instanceId) ?? EMPTY,
        () => EMPTY
    );
}
