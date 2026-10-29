/** Reset only the cache and worker owned by this app mount; session cookies stay intact. */
export async function resetAppCache(baseUrl: string): Promise<void> {
    try {
        if (navigator.serviceWorker) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.filter(registration => registration.scope === baseUrl)
                .map(registration => registration.unregister()));
        }
    } catch { /* Restricted storage must not prevent an online retry. */ }
    try {
        if (window.caches) {
            const keys = await window.caches.keys();
            await Promise.all(keys.filter(key => key.startsWith('prorequest-v2') ||
                key === `prorequest-v3-static-${encodeURIComponent(baseUrl)}`)
                .map(key => window.caches.delete(key)));
        }
    } catch { /* Private browsing and quota errors are recoverable. */ }
}
