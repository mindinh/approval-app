/**
 * A task link (push notification, mail, another app) that arrived while the user was not signed in.
 * The auth gate sends the user to sign-in first; once signed in, the app opens the task instead of Home.
 */
const MAX_AGE_MS = 10 * 60_000;

let pending: { path: string; at: number } | null = null;

/** `/tasks/<id>` for a task link (`cnmaapproval://tasks/1`, `/tasks/1?x=y`, `https://host/tasks/1`), else null. */
export function taskPathOf(url: string): string | null {
    // https://host/tasks/1 → /tasks/1, but cnmaapproval://tasks/1 → tasks/1 (with an app scheme the
    // first segment sits where a web host would be).
    const withoutScheme = /^https?:\/\//i.test(url) ? url.replace(/^https?:\/\/[^/]*/i, '') : url.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
    const match = /^\/?tasks\/([^/?#]+)/.exec(withoutScheme);
    if (!match) return null;
    const id = decodeURIComponent(match[1]).trim();
    return id ? `/tasks/${encodeURIComponent(id)}` : null;
}

export function rememberPendingLink(url: string): void {
    const path = taskPathOf(url);
    if (path) pending = { path, at: Date.now() };
}

/** The remembered task path (once), if it is recent. */
export function takePendingLink(now = Date.now()): string | null {
    const link = pending;
    pending = null;
    return link && now - link.at <= MAX_AGE_MS ? link.path : null;
}
