import { useQuery } from '@tanstack/react-query';
import { inboxApi } from '@/services/inbox/inbox.api';
import { STALE } from '@/pages/Inbox/utils/constants';
import { inboxKeys } from './inboxKeys';
import { useDebouncedPattern } from './useDebouncedPattern';
import type { UserSearchResult } from '@/services/inbox/inbox.types';

export function useSearchUsers(initialPattern = '', debounceMs = 300) {
    const { searchPattern, setSearchPattern, debouncedPattern } = useDebouncedPattern(initialPattern, debounceMs);

    const isQueryEnabled = debouncedPattern.length >= 1;

    const query = useQuery<UserSearchResult[]>({
        queryKey: inboxKeys.searchUsers(debouncedPattern),
        queryFn: () => inboxApi.searchUsers(debouncedPattern),
        enabled: isQueryEnabled,
        staleTime: STALE.USER_LOOKUP,
    });

    return {
        searchPattern,
        setSearchPattern,
        debouncedPattern,
        users: query.data || [],
        isLoading: query.isLoading && isQueryEnabled,
        isFetching: query.isFetching,
        error: query.error,
    };
}
