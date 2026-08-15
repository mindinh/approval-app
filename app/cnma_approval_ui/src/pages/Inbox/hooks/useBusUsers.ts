import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inboxApi } from '@/services/inbox/inbox.api';
import { inboxKeys } from './inboxKeys';
import type { BusUser } from '@/services/inbox/inbox.types';

export function useBusUsers(initialPattern = '', debounceMs = 250) {
    const [searchPattern, setSearchPattern] = useState(initialPattern);
    const [debouncedPattern, setDebouncedPattern] = useState(initialPattern);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedPattern(searchPattern.trim());
        }, debounceMs);

        return () => clearTimeout(handler);
    }, [searchPattern, debounceMs]);

    const query = useQuery<BusUser[]>({
        queryKey: inboxKeys.busUsers(debouncedPattern),
        queryFn: () => inboxApi.getBusUsers(debouncedPattern),
        staleTime: 60 * 1000,
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
