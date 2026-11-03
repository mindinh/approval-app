/**
 * TanStack Query mutation hooks for the Inbox feature.
 *
 * Responsibilities:
 * - Bind API mutation calls
 * - Trigger centralized invalidation policies
 * - Show toast feedback
 *
 * Must NOT:
 * - Contain query definitions
 * - Own page-level UI state
 * - Define ad-hoc invalidation logic
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inboxApi } from '@/services/inbox/inbox.api';
import type { DecisionRequest, DecisionRequestContext, TaggedUser, MassDecisionPayload } from '@/services/inbox/inbox.types';
import { toast } from '@cnma/react-ui';
import { extractErrorMessage } from '@/pages/Inbox/utils/predicates';
import { DECISION_KEYS } from '@/pages/Inbox/utils/constants';
import {
    invalidateAfterDecision,
    invalidateAfterMassDecision,
    invalidateAfterComment,
} from './inboxInvalidation';

const FAILED_TASK_TOAST_DURATION_MS = 7000;

function dismissLoadingToast(mutationContext?: { toastId?: string | number }) {
    if (mutationContext?.toastId) {
        toast.dismiss(mutationContext.toastId);
    }
}

/** Some BFF actions nest the user-facing message under `result`. */
function actionResponseMessage(data: unknown): string | undefined {
    const response = data as { message?: string; result?: { message?: string } } | undefined;
    return response?.message || response?.result?.message;
}

function isRejectDecisionKey(decisionKey: string): boolean {
    return decisionKey === DECISION_KEYS.REJECT;
}

// ─── useDecision ───────────────────────────────────────────
export function useDecision() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            instanceId,
            request,
        }: {
            instanceId: string;
            request: DecisionRequest;
        }) => inboxApi.executeDecision(instanceId, request),

        onMutate: () => {
            const toastId = toast.loading('Processing decision...');
            return { toastId };
        },
        onSuccess: (data, variables, mutationContext) => {
            dismissLoadingToast(mutationContext);
            const successMsg = actionResponseMessage(data) || 'Decision processed successfully.';
            toast.success(successMsg);
            invalidateAfterDecision(queryClient, variables.instanceId);
        },
        onError: (error, _variables, mutationContext) => {
            dismissLoadingToast(mutationContext);
            toast.error(extractErrorMessage(error, 'Decision failed'));
        },
    });
}

// ─── useMassDecision ───────────────────────────────────────
export function useMassDecision() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: MassDecisionPayload) => inboxApi.executeMassDecision(payload),

        onMutate: (variables) => {
            const count = variables.items.length;
            const isReject = isRejectDecisionKey(variables.decisionKey) || String(variables.decisionKey).toLowerCase().includes('reject');
            const actionText = isReject ? 'Rejecting' : 'Approving';
            const toastId = toast.loading(`${actionText} ${count} task${count !== 1 ? 's' : ''} in background...`);
            return { toastId, count, isReject };
        },

        onSuccess: (data, variables, mutationContext) => {
            dismissLoadingToast(mutationContext);

            const isReject = mutationContext?.isReject ?? isRejectDecisionKey(variables.decisionKey);
            const actionWord = isReject ? 'rejected' : 'approved';
            const total = data.total || variables.items.length;
            const succeeded = data.succeededCount ?? 0;
            const failedResults = (data.results || []).filter((r) => r.status === 'FAILED');

            // 1. Single summary toast for all successes (if any succeeded)
            if (succeeded > 0) {
                toast.success(`${succeeded}/${total} tasks ${actionWord} successfully.`);
            }

            // 2. Individual toast for EACH failed task (with document number if possible)
            if (failedResults.length > 0) {
                failedResults.forEach((failed) => {
                    const identifier = failed.documentNumber || failed.documentId || failed.instanceId;
                    const errorMsg = failed.error || failed.message || 'Decision failed';
                    toast.error(`Failed to ${isReject ? 'reject' : 'approve'} ${identifier}: ${errorMsg}`, {
                        duration: FAILED_TASK_TOAST_DURATION_MS,
                    });
                });
            }

            const instanceIds = variables.items.map((i) => i.instanceId);
            invalidateAfterMassDecision(queryClient, instanceIds);
        },

        onError: (error, variables, mutationContext) => {
            dismissLoadingToast(mutationContext);
            const isReject = mutationContext?.isReject ?? isRejectDecisionKey(variables.decisionKey);
            const action = isReject ? 'Mass rejection' : 'Mass approval';
            toast.error(extractErrorMessage(error, `${action} failed.`));
            const instanceIds = variables.items.map((i) => i.instanceId);
            invalidateAfterMassDecision(queryClient, instanceIds);
        },
    });
}

// ─── useAddComment ─────────────────────────────────────────
export function useAddComment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            instanceId,
            text,
            context,
            taggedUsers,
        }: {
            instanceId: string;
            text: string;
            context?: DecisionRequestContext;
            taggedUsers?: TaggedUser[];
        }) => inboxApi.addComment(instanceId, text, context, taggedUsers),
        onMutate: () => {
            const toastId = toast.loading('Adding comment...');
            return { toastId };
        },
        onSuccess: async (data, variables, mutationContext) => {
            await invalidateAfterComment(queryClient, variables.instanceId);
            dismissLoadingToast(mutationContext);
            toast.success(data.message || 'Comment added.');
        },
        onError: (error, _variables, mutationContext) => {
            dismissLoadingToast(mutationContext);
            toast.error(extractErrorMessage(error, 'Failed to add comment'));
        },
    });
}

