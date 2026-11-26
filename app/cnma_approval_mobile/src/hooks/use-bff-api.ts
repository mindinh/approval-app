import { useMemo } from 'react';
import { createBffApi, type BffApi } from '@/lib/api/bff-api';
import { useSession } from '@/lib/auth/session';
import { config } from '@/lib/config/env';

/** BFF client bound to the current session's access token. Only used behind the auth gate. */
export function useBffApi(): BffApi {
    const { getAccessToken } = useSession();
    if (!config) throw new Error('useBffApi requires app configuration');
    const { apiBaseUrl } = config;
    return useMemo(() => createBffApi(apiBaseUrl, getAccessToken), [apiBaseUrl, getAccessToken]);
}
