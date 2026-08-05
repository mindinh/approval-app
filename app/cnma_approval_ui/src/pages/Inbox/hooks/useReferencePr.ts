import { useQuery } from '@tanstack/react-query';
import { inboxApi } from '@/services/inbox/inbox.api';
import type { ReferencePrDetailResponse } from '@/services/inbox/inbox.types';

export function useReferencePr(prNumber: string | undefined | null) {
    return useQuery<ReferencePrDetailResponse, Error>({
        queryKey: ['reference-pr', prNumber],
        queryFn: () => {
            if (!prNumber) {
                throw new Error('PR number is required');
            }
            return inboxApi.getReferencePrDetail(prNumber);
        },
        enabled: Boolean(prNumber && prNumber.trim() !== '' && prNumber !== '-'),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 2,
    });
}
