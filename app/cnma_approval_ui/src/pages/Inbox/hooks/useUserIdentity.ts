import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { inboxApi } from '@/services/inbox/inbox.api';
import type { TaskDetail } from '@/services/inbox/inbox.types';
import { useCurrentUser } from './inboxQueries';
import { inboxKeys } from './inboxKeys';
import { resolveSapUsername } from '../utils/userIdentity';

/** Read the actual SAP session principal once per authenticated account, independently of login names. */
export function useUserIdentity({ comments, resolveProfile = false }: {
    comments?: TaskDetail['comments'];
    resolveProfile?: boolean;
} = {}) {
    const { data: user } = useCurrentUser();
    const knownUsername = resolveSapUsername(user);
    const sapQuery = useQuery({
        queryKey: [...inboxKeys.currentUser(), 'sap-user', user?.id],
        queryFn: () => inboxApi.getCurrentSapUser(),
        enabled: Boolean(user && !knownUsername && (resolveProfile || comments?.some(comment => comment.text?.trim() && comment.createdBy?.trim()))),
        staleTime: Infinity,
        gcTime: Infinity,
        retry: 1,
    });
    const sapUsername = knownUsername || sapQuery.data?.sapUsername;
    const currentUser = useMemo(() => user ? {
        ...user,
        commentAuthorId: sapUsername,
        sapUsername,
    } : undefined, [user, sapUsername]);
    return {
        currentUser,
        isResolving: sapQuery.isFetching,
        error: sapQuery.error,
        retry: sapQuery.refetch,
    };
}
