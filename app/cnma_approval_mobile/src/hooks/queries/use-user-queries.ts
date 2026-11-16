import { useQuery } from '@tanstack/react-query';
import { useBffApi } from '@/hooks/use-bff-api';
import { asSapUsername } from '@/utils/comment-author';
import { queryKeys } from './query-keys';

/** Identity rarely changes during a session. */
const USER_STALE_MS = 5 * 60_000;

/** Identity the BFF derived from the access token (GET /tasks/me). */
export function useCurrentUser() {
    const api = useBffApi();
    return useQuery({ queryKey: queryKeys.currentUser, queryFn: ({ signal }) => api.getCurrentUser(signal), staleTime: USER_STALE_MS });
}

/** SAP user the BFF's destination resolves to (GET /tasks/me/sap-user). */
export function useSapUser(enabled = true) {
    const api = useBffApi();
    return useQuery({ queryKey: queryKeys.sapUser, queryFn: ({ signal }) => api.getSapUser(signal), staleTime: USER_STALE_MS, enabled });
}

/**
 * The signed-in user's SAP user name, as SAP writes it on comments (upper case), or undefined while unknown.
 * /tasks/me only has it for some setups; otherwise it is asked from SAP once (GET /tasks/me/sap-user).
 */
export function useMySapUsername(): string | undefined {
    const me = useCurrentUser().data;
    const known = asSapUsername(me?.sapUsername) ?? asSapUsername(me?.commentAuthorId);
    const sapUser = useSapUser(Boolean(me) && !known);
    return known ?? asSapUsername(sapUser.data?.sapUsername);
}

/** The directory changes rarely; one load serves every @ search for a while (and offline after that). */
const DIRECTORY_STALE_MS = 30 * 60_000;

/**
 * Everyone comments can tag. The BFF loads the whole CNMA_BUSUSER directory for any query anyway, so the app
 * asks once and searches on the device: instant results while typing, no request per keystroke.
 *
 * @param enabled load only once the user starts writing a comment
 */
export function useMentionDirectory(enabled: boolean) {
    const api = useBffApi();
    return useQuery({ queryKey: queryKeys.mentionUsers, queryFn: ({ signal }) => api.getBusUsers(signal), staleTime: DIRECTORY_STALE_MS, gcTime: DIRECTORY_STALE_MS, enabled });
}
