/**
 * Utility for detecting SAP Build Workzone / Fiori Launchpad context.
 */

/**
 * Detects whether the app is currently running inside SAP Build Workzone / Fiori Launchpad.
 */
export function isWorkZone(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        if (window.parent !== window) return true;
    } catch {
        // Cross-origin iframe restriction means it is running inside an outer shell (e.g. WorkZone)
        return true;
    }
    const href = window.location.href;
    const search = window.location.search;
    return (
        window.location.pathname.includes('/site') ||
        href.includes('/site?siteId=') ||
        search.includes('siteId=') ||
        search.includes('sap-ushell-config=') ||
        search.includes('workzone=')
    );
}


