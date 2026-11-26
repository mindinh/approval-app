import { rememberPendingLink } from '@/lib/navigation/pending-link';

/**
 * Every link that opens the app passes here first. Task links are remembered so they still open after a
 * sign-in (the auth gate would otherwise drop them); the path itself is routed unchanged.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
    rememberPendingLink(path);
    return path;
}
