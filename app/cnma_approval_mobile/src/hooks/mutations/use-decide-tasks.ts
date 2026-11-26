import type { MassDecisionItemPayload, MassDecisionResponse } from '@approval-core/inbox-types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useBffApi } from '@/hooks/use-bff-api';
import { isUnknownOutcome } from '@/lib/api/write-outcome';
import type { TaskSummary } from '@/utils/task-summary';

/** SAP decision keys, same as the web (`DECISION_KEYS`). */
export const MASS_DECISION_KEYS = { approve: '0001', reject: '0002' } as const;
export type MassDecisionKind = keyof typeof MASS_DECISION_KEYS;

/** The BFF decides four tasks at a time; allow ~15 s per round on top of a base, capped at 3 minutes. */
export function massDecisionTimeout(count: number): number {
    return Math.min(180_000, 30_000 + Math.ceil(count / 4) * 15_000);
}

/** Payload item per task, with the same context fields as the web mass decision. */
export function toMassItem(task: TaskSummary): MassDecisionItemPayload {
    return {
        instanceId: task.instanceId,
        documentId: task.documentId,
        documentNumber: task.documentId,
        businessObjectType: task.decisionContext.businessObjectType,
        sapOrigin: task.decisionContext.sapOrigin,
    };
}

/** A mass decision request that failed as a whole; `unknown` means some tasks may have been decided. */
export class MassDecisionFailure extends Error {
    constructor(
        readonly outcome: 'unknown' | 'notSent',
        readonly cause: unknown
    ) {
        super(cause instanceof Error ? cause.message : String(cause));
        this.name = 'MassDecisionFailure';
    }
}

/**
 * Approves or rejects many Inbox tasks in one request (web: useMassDecision). The BFF answers per task
 * (SUCCESS / FAILED with a reason), which the sheet shows. Never retried automatically: if the request
 * itself fails after it may have reached the BFF (timeout, dropped connection, 5xx), the outcome is
 * `unknown` and the refreshed Inbox shows what was decided. Every task list and count is refreshed after.
 */
export function useDecideTasks() {
    const api = useBffApi();
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['tasks', 'decide-many'],
        mutationFn: async ({ kind, comment, tasks }: { kind: MassDecisionKind; comment: string; tasks: readonly TaskSummary[] }): Promise<MassDecisionResponse> => {
            try {
                return await api.decideTasks({ decisionKey: MASS_DECISION_KEYS[kind], comment: comment.trim(), items: tasks.map(toMassItem) }, massDecisionTimeout(tasks.length));
            } catch (error) {
                throw new MassDecisionFailure(isUnknownOutcome(error) ? 'unknown' : 'notSent', error);
            }
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
    });
}
