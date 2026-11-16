import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/queries/query-keys';
import { useBffApi } from '@/hooks/use-bff-api';
import type { BffApi, TaskDetailResponse, WriteContext } from '@/lib/api/bff-api';
import { countComments, hasComment, isUnknownOutcome } from '@/lib/api/write-outcome';
import { serializeComment, type MentionUser } from '@/utils/mentions';
import { toTaskDetailView } from '@/utils/task-detail';
import { pendingComments } from './pending-comments';
import { readFreshTask } from './read-fresh-task';

/** After SAP accepts a comment, re-read the thread at these delays until it shows up (SAP can lag a little). */
const CONFIRM_DELAYS_MS = [0, 1500, 4000] as const;

let sequence = 0;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Comments with this text in the cached thread right now (the baseline a new one is counted against). */
function cachedCount(queryClient: QueryClient, instanceId: string, text: string): number {
    const raw = queryClient.getQueryData<TaskDetailResponse>(queryKeys.taskDetail(instanceId));
    return raw ? countComments(toTaskDetailView(raw).comments, text) : 0;
}

/** Reloads the task until SAP's thread has the comment; the thread then replaces the local copy in place. */
async function waitUntilInThread(queryClient: QueryClient, api: BffApi, instanceId: string, text: string, before: number) {
    for (const delay of CONFIRM_DELAYS_MS) {
        if (delay > 0) await wait(delay);
        if (hasComment(await readFreshTask(queryClient, api, instanceId), text, before)) return;
    }
}

interface SendVariables {
    id: string;
    text: string;
    tagged: readonly MentionUser[];
    before: number;
}

/**
 * Sends a comment like a messaging app: it appears in the thread at once ("Sending…"), turns into a normal
 * bubble when SAP accepts it, and is swapped for SAP's copy as soon as the reloaded thread contains it (no
 * pull-to-refresh). On failure it stays as "Not sent · Tap to retry" with its text. Never retried
 * automatically; when the outcome is unclear (timeout, dropped connection) the thread is re-read first, so
 * a comment that did land is not posted twice.
 */
export function useAddComment(instanceId: string, context: WriteContext) {
    const api = useBffApi();
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationKey: ['tasks', 'comment', instanceId],
        mutationFn: async ({ text, tagged, before }: SendVariables) => {
            try {
                await api.addComment(instanceId, { text, context, taggedUsers: tagged });
            } catch (error) {
                if (isUnknownOutcome(error) && hasComment(await readFreshTask(queryClient, api, instanceId), text, before)) return;
                throw error;
            }
        },
        onSuccess: (_result, { id, text, before }) => {
            pendingComments.mark(instanceId, id, 'sent');
            void waitUntilInThread(queryClient, api, instanceId, text, before);
        },
        onError: (_error, { id }) => pendingComments.mark(instanceId, id, 'failed'),
    });

    return {
        /** Sends a draft; `tagged` are the people mentioned in it (CC), whose names become SAP mention markup. */
        send: (draft: string, tagged: readonly MentionUser[] = []) => {
            const trimmed = draft.trim();
            if (!trimmed) return;
            const text = serializeComment(trimmed, tagged);
            const cc = tagged.filter((user) => text.includes(`<tag>@${user.fullName}</tag>`));
            const id = `local-${Date.now()}-${(sequence += 1)}`;
            const before = cachedCount(queryClient, instanceId, text);
            pendingComments.add(instanceId, { id, text, tagged: cc, status: 'sending', createdAt: new Date().toISOString(), before });
            mutation.mutate({ id, text, tagged: cc, before });
        },
        retry: (id: string) => {
            const comment = pendingComments.get(instanceId).find((item) => item.id === id);
            if (!comment) return;
            pendingComments.mark(instanceId, id, 'sending');
            mutation.mutate({ id, text: comment.text, tagged: comment.tagged, before: comment.before });
        },
        discard: (id: string) => pendingComments.remove(instanceId, id),
    };
}
