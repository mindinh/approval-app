import { useQuery } from '@tanstack/react-query';
import { inboxApi } from '@/services/inbox/inbox.api';
import { STALE } from '@/pages/Inbox/utils/constants';
import { inboxKeys } from './inboxKeys';
import { useDebouncedPattern } from './useDebouncedPattern';
import type { BusUser } from '@/services/inbox/inbox.types';

export function useBusUsers(initialPattern = '', debounceMs = 250) {
    const { searchPattern, setSearchPattern, debouncedPattern } = useDebouncedPattern(initialPattern, debounceMs);

    const query = useQuery<BusUser[]>({
        queryKey: inboxKeys.busUsers(debouncedPattern),
        queryFn: () => inboxApi.getBusUsers(debouncedPattern),
        staleTime: STALE.USER_LOOKUP,
    });

    return {
        searchPattern,
        setSearchPattern,
        debouncedPattern,
        users: query.data || [],
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        error: query.error,
    };
}
