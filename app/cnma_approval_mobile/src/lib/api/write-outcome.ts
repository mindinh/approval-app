import type { TaskDetailView } from '@/utils/task-detail';
import { ApiError } from './http-client';

/*
 * Decisions and comments are not idempotent and the BFF has no idempotency key, so a write is never retried
 * automatically. When a write fails in a way that leaves its effect unknown (timeout, dropped connection,
 * gateway or server error), the app re-reads the task and decides from SAP's current state instead.
 */

/** The request may have reached SAP: transport failures, timeouts and gateway/server errors. */
export function isUnknownOutcome(error: unknown): boolean {
    if (error instanceof ApiError) return error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT' || error.status >= 500;
    return error instanceof TypeError; // fetch's own network failure
}

/** A 401 means the BFF never ran the request (the token was rejected first), so nothing changed in SAP. */
export function wasNotExecuted(error: unknown): boolean {
    return error instanceof ApiError && error.code === 'UNAUTHORIZED';
}

/** Whether the task still asks this user for a decision. null: the task could not be read. */
export function isTaskOpen(fresh: Pick<TaskDetailView, 'decisions'> | null | undefined): boolean | null {
    if (!fresh) return null;
    return fresh.decisions.length > 0;
}

/**
 * What a failed decision request really did, judged from the task re-read after the error:
 * - `sent`: the task is closed and the error left the outcome open (timeout, 5xx), so our decision landed
 * - `closedElsewhere`: SAP refused it (4xx) and the task is closed, e.g. already approved on the web
 * - `notSent`: the task still waits for a decision; safe to try again
 * - `unknown`: the task could not be read; do not resend until it can be checked
 */
export type DecisionOutcome = 'sent' | 'closedElsewhere' | 'notSent' | 'unknown';

export function decisionOutcome(error: unknown, fresh: Pick<TaskDetailView, 'decisions'> | null | undefined): DecisionOutcome {
    if (wasNotExecuted(error)) return 'notSent';
    const open = isTaskOpen(fresh);
    if (open === null) return 'unknown';
    if (open) return 'notSent';
    return isUnknownOutcome(error) ? 'sent' : 'closedElsewhere';
}

const normalize = (text: string) => text.replace(/\s+/g, ' ').trim().toLowerCase();

/** How many comments in a thread have this text (spacing and case ignored). */
export function countComments(comments: readonly { text: string }[], text: string): number {
    const wanted = normalize(text);
    return comments.reduce((count, comment) => (normalize(comment.text) === wanted ? count + 1 : count), 0);
}

/**
 * Whether the thread has a comment with this text beyond the `before` copies it had when ours was sent, so
 * an older identical comment ("ok") does not count as ours.
 */
export function hasComment(fresh: Pick<TaskDetailView, 'comments'> | null | undefined, text: string, before = 0): boolean {
    return fresh ? countComments(fresh.comments, text) > before : false;
}
