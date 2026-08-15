import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inboxApi } from '@/services/inbox/inbox.api';
import { inboxKeys } from './inboxKeys';
import type { UserSearchResult } from '@/services/inbox/inbox.types';

export function useSearchUsers(initialPattern = '', debounceMs = 300) {
    const [searchPattern, setSearchPattern] = useState(initialPattern);
    const [debouncedPattern, setDebouncedPattern] = useState(initialPattern);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedPattern(searchPattern.trim());
        }, debounceMs);

        return () => clearTimeout(handler);
    }, [searchPattern, debounceMs]);

    const isQueryEnabled = debouncedPattern.length >= 1;

    const query = useQuery<UserSearchResult[]>({
        queryKey: inboxKeys.searchUsers(debouncedPattern),
        queryFn: () => inboxApi.searchUsers(debouncedPattern),
        enabled: isQueryEnabled,
        staleTime: 60 * 1000,
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
