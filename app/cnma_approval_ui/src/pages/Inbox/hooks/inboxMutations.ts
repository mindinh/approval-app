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
import type { DecisionRequest, ForwardRequest, DecisionRequestContext, TaggedUser, MassDecisionPayload } from '@/services/inbox/inbox.types';
import { toast } from '@cnma/react-ui';
import { extractErrorMessage } from '@/pages/Inbox/utils/predicates';
import {
    invalidateAfterDecision,
    invalidateAfterMassDecision,
    invalidateAfterForward,
    invalidateAfterComment,
} from './inboxInvalidation';

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
            if (mutationContext?.toastId) {
                toast.dismiss(mutationContext.toastId);
            }
            const successMsg = data?.message || (data as any)?.result?.message || 'Decision processed successfully.';
            toast.success(successMsg);
            invalidateAfterDecision(queryClient, variables.instanceId);
        },
        onError: (error: any, _variables, mutationContext) => {
            if (mutationContext?.toastId) {
                toast.dismiss(mutationContext.toastId);
            }
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
            const isReject = variables.decisionKey === '0002' || String(variables.decisionKey).toLowerCase().includes('reject');
            const actionText = isReject ? 'Rejecting' : 'Approving';
            const toastId = toast.loading(`${actionText} ${count} task${count !== 1 ? 's' : ''} in background...`);
            return { toastId, count, isReject };
        },

        onSuccess: (data, variables, mutationContext) => {
            if (mutationContext?.toastId) {
                toast.dismiss(mutationContext.toastId);
            }

            const isReject = mutationContext?.isReject ?? (variables.decisionKey === '0002');
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
                        duration: 7000,
                    });
                });
            }

            const instanceIds = variables.items.map((i) => i.instanceId);
            invalidateAfterMassDecision(queryClient, instanceIds);
        },

        onError: (error: any, variables, mutationContext) => {
            if (mutationContext?.toastId) {
                toast.dismiss(mutationContext.toastId);
            }
            const isReject = mutationContext?.isReject ?? (variables.decisionKey === '0002');
            const action = isReject ? 'Mass rejection' : 'Mass approval';
            toast.error(extractErrorMessage(error, `${action} failed.`));
            const instanceIds = variables.items.map((i) => i.instanceId);
            invalidateAfterMassDecision(queryClient, instanceIds);
        },
    });
}

// ─── useForward ────────────────────────────────────────────
export function useForward() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            instanceId,
            request,
        }: {
            instanceId: string;
            request: ForwardRequest;
        }) => inboxApi.forwardTask(instanceId, request),
        onMutate: () => {
            const toastId = toast.loading('Forwarding task...');
            return { toastId };
        },
        onSuccess: (data, variables, mutationContext) => {
            if (mutationContext?.toastId) {
                toast.dismiss(mutationContext.toastId);
            }
            const successMsg = data?.message || (data as any)?.result?.message || 'Task forwarded successfully.';
            toast.success(successMsg);
            invalidateAfterForward(queryClient, variables.instanceId);
        },
        onError: (error: any, _variables, mutationContext) => {
            if (mutationContext?.toastId) {
                toast.dismiss(mutationContext.toastId);
            }
            toast.error(extractErrorMessage(error, 'Forward failed'));
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
        onSuccess: (data, variables, mutationContext) => {
            if (mutationContext?.toastId) {
                toast.dismiss(mutationContext.toastId);
            }
            toast.success(data.message || 'Comment added.');
            invalidateAfterComment(queryClient, variables.instanceId);
        },
        onError: (error: any, _variables, mutationContext) => {
            if (mutationContext?.toastId) {
                toast.dismiss(mutationContext.toastId);
            }
            toast.error(extractErrorMessage(error, 'Failed to add comment'));
        },
    });
}

