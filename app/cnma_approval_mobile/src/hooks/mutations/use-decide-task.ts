import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useBffApi } from '@/hooks/use-bff-api';
import { pendingDecisions } from '@/lib/api/pending-decisions';
import { decisionOutcome, type DecisionOutcome } from '@/lib/api/write-outcome';
import type { TaskDecision, TaskDetailView } from '@/utils/task-detail';
import { readFreshTask } from './read-fresh-task';

/** A decision that did not (or not verifiably) go through; `outcome` says what the user can do next. */
export class DecisionFailure extends Error {
    constructor(
        readonly outcome: Exclude<DecisionOutcome, 'sent'>,
        readonly cause: unknown
    ) {
        super(cause instanceof Error ? cause.message : String(cause));
        this.name = 'DecisionFailure';
    }
}

export interface DecideInput {
    decision: TaskDecision;
    comment: string;
}


/**
 * Sends Approve / Reject (or another SAP decision) for a task.
 * - Never retried automatically; the button is locked while pending (isPending) and the sheet is singular.
 * - A 401 is refreshed and resent once by the API client (safe: the BFF did not run it).
 * - On any other error the task is re-read: closed → it went through (or was decided elsewhere); still
 *   open → safe to try again; unreadable → unknown, kept as a pending record and checked later.
 * - Afterwards every task query (lists, counts, dashboard, this detail) is refreshed.
 */
export function useDecideTask(view: Pick<TaskDetailView, 'instanceId' | 'documentId' | 'context'>) {
    const api = useBffApi();
    const queryClient = useQueryClient();
    const { instanceId } = view;

    return useMutation({
        mutationKey: ['tasks', 'decide', instanceId],
        mutationFn: async ({ decision, comment }: DecideInput) => {
            await pendingDecisions.remember({ instanceId, decisionKey: decision.key, decisionText: decision.text, documentId: view.documentId, sentAt: Date.now() });
            try {
                await api.decideTask(instanceId, { decisionKey: decision.key, comment: comment.trim(), context: view.context });
            } catch (error) {
                const outcome = decisionOutcome(error, await readFreshTask(queryClient, api, instanceId));
                if (outcome !== 'unknown') await pendingDecisions.forget(instanceId);
                if (outcome === 'sent') return { decision, confirmedByReload: true };
                throw new DecisionFailure(outcome, error);
            }
            await pendingDecisions.forget(instanceId);
            return { decision, confirmedByReload: false };
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
    });
}
