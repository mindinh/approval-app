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
import type { DecisionRequest, ForwardRequest, DecisionRequestContext, TaggedUser } from '@/services/inbox/inbox.types';
import { toast } from '@cnma/react-ui';
import { extractErrorMessage } from '@/pages/Inbox/utils/predicates';
import {
    invalidateAfterDecision,
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

