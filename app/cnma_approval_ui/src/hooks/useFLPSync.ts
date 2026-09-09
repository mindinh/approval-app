import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * Iframe-safe FLP sync using postMessage API.
 * 
 * When running in an iframe, we can't directly access parent.location due to
 * cross-origin restrictions. Instead, we use postMessage to communicate with
 * the parent window.
 */

// Global store for initial FLP state received from parent
let initialFLPState: { hash: string; search: string } | null = null;
let stateReceived = false;
let lastDetectedParentHash = '';

/**
 * Check if the external URL hash has changed (e.g. user manually edited the browser address bar).
 * If changed, notify all FLP route listeners so React Router navigates immediately.
 */
export function checkParentHashChange() {
    try {
        const targetWindow = window.parent !== window ? window.parent : window;
        const currentHash = targetWindow.location.hash || '';
        const currentSearch = targetWindow.location.search || '';

        if (currentHash && currentHash !== lastDetectedParentHash) {
            lastDetectedParentHash = currentHash;
            const newRoute = parseFLPRoute(currentHash, currentSearch);
            console.log('[FLP-SYNC] Detected external URL hash change:', currentHash, '->', newRoute);
            if (newRoute && newRoute !== '/') {
                flpRouteListeners.forEach((listener) => listener(newRoute));
            }
        }
    } catch (e) {
        // Cross-origin iframe or access restricted
    }
}

/**
 * Sync React Router navigation with parent FLP URL using postMessage.
 */
export function useFLPSyncDirect() {
    const location = useLocation();
    const isInitialRenderRef = useRef(true);

    useEffect(() => {
        const isInIframe = window.parent !== window;

        if (!isInIframe) {
            console.log("[FLP-SYNC] Standalone mode - skipping");
            return;
        }

        const appRoute = location.pathname.replace(/^\//, "");

        console.log("[FLP-SYNC] Syncing route to parent:", appRoute, "| Initial render:", isInitialRenderRef.current);

        // Update initialFLPState to keep it in sync with current route
        if (initialFLPState) {
            const prefix = initialFLPState.hash.split('&/')[0];
            initialFLPState.hash = appRoute ? `${prefix}&/${appRoute}` : prefix;
        }

        const parentHasDeepLink = initialFLPState?.hash?.includes("&/") || false;
        const parentDeepRoute = initialFLPState?.hash?.split('&/').pop()?.replace(/^\//, '');

        // If parent has a specific deep-link route (e.g. inbox/99999), do NOT overwrite it
        // with generic default routes (empty, "home", or plain "inbox") during startup!
        if (parentHasDeepLink && parentDeepRoute && parentDeepRoute !== appRoute && (appRoute === "" || appRoute === "home" || appRoute === "inbox")) {
            console.log("[FLP-SYNC] Skipping sync to preserve parent deep link:", parentDeepRoute, "vs current:", appRoute);
            return;
        }

        isInitialRenderRef.current = false;

        // If same-origin with parent Launchpad, update parent URL hash so browser address bar reflects new task
        try {
            const parentHash = window.parent.location.hash;
            const prefix = parentHash.split('&/')[0];
            if (prefix) {
                const newHash = appRoute ? `${prefix}&/${appRoute}` : prefix;
                if (window.parent.location.hash !== newHash) {
                    lastDetectedParentHash = newHash;
                    window.parent.history.replaceState(null, '', newHash);
                }
            }
        } catch (e) {
            // Cross-origin iframe, expected
        }

        try {
            window.parent.postMessage({
                type: 'ROUTE_CHANGE',
                route: appRoute
            }, '*');
            console.log("[FLP-SYNC] Sent route change to parent:", appRoute);
        } catch (e) {
            console.error("[FLP-SYNC] Failed to send message to parent:", e);
        }
    }, [location.pathname]);
}

/**
 * Parse an incoming FLP hash and search string into a React Router path.
 * Supports:
 * - SAP FLP / Workzone standard inner route: #Intent-action&/inbox/1234 -> /inbox/1234
 * - Direct route hash: #/inbox/1234 -> /inbox/1234
 * - Query parameters: ?taskId=1234 or &taskId=1234 or InstanceID=1234 -> /inbox/1234
 * - Worklist query parameter: ?worklist=approved -> /approved
 */
export function parseFLPRoute(hash: string = '', search: string = ''): string {
    const cleanHash = hash.replace(/^#/, '');

    // 1. Check &/<route> pattern standard in SAP Fiori Launchpad / Workzone
    const parts = cleanHash.split('&/');
    if (parts.length > 1) {
        const routePart = parts[parts.length - 1];
        if (routePart) {
            return '/' + routePart.replace(/^\//, '');
        }
    }

    // 2. Check if cleanHash starts directly with a path, e.g. /inbox/1234
    if (cleanHash.startsWith('/')) {
        return cleanHash;
    }

    // 3. Check query parameters from both search and hash
    const searchParams = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);

    let hashParams = new URLSearchParams();
    const qIndex = cleanHash.indexOf('?');
    if (qIndex !== -1) {
        hashParams = new URLSearchParams(cleanHash.substring(qIndex + 1));
    }

    const taskId =
        searchParams.get('taskId') ||
        searchParams.get('InstanceID') ||
        searchParams.get('instanceId') ||
        hashParams.get('taskId') ||
        hashParams.get('InstanceID') ||
        hashParams.get('instanceId');

    if (taskId) {
        return `/inbox/${encodeURIComponent(taskId)}`;
    }

    const worklist = searchParams.get('worklist') || hashParams.get('worklist');
    if (worklist === 'approved') {
        return '/approved';
    }
    if (worklist === 'inbox' || worklist === 'my') {
        return '/inbox';
    }
    if (worklist) {
        return `/?worklist=${encodeURIComponent(worklist)}`;
    }

    return '/';
}

type FLPRouteListener = (route: string) => void;
const flpRouteListeners = new Set<FLPRouteListener>();

/**
 * Subscribe to async route updates from FLP/Workzone parent postMessage.
 */
export function subscribeFLPRoute(listener: FLPRouteListener): () => void {
    flpRouteListeners.add(listener);
    return () => {
        flpRouteListeners.delete(listener);
    };
}

/**
 * Get the initial route from parent FLP hash or iframe URL params.
 */
export function getInitialFLPRoute(): string {
    if (initialFLPState && initialFLPState.hash) {
        const route = parseFLPRoute(initialFLPState.hash, initialFLPState.search);
        if (route !== '/') return route;
    }

    if (window.parent !== window) {
        // Check iframe search params first
        const iframeRoute = parseFLPRoute('', window.location.search);
        if (iframeRoute !== '/') return iframeRoute;

        try {
            const parentHash = window.parent.location.hash;
            const parentSearch = window.parent.location.search;
            const route = parseFLPRoute(parentHash, parentSearch);
            if (route !== '/') return route;
        } catch (e) {
            console.log('[FLP-INIT] Cannot access parent directly (cross-origin iframe)');
        }
    } else {
        // Standalone mode: check search params (hash is handled by HashRouter)
        const standaloneRoute = parseFLPRoute(window.location.hash, window.location.search);
        if (standaloneRoute !== '/') return standaloneRoute;
    }

    return '/';
}

/**
 * Get URL parameters from initial FLP state.
 */
export function getInitialFLPParams(): { locale: string | null; theme: string | null } {
    const result = { locale: null as string | null, theme: null as string | null };

    if (window.parent === window) {
        console.log('[FLP-PARAMS] Standalone mode');
        return result;
    }

    if (initialFLPState && initialFLPState.search) {
        const params = new URLSearchParams(initialFLPState.search);
        result.locale = params.get('sap-locale');
        result.theme = params.get('sap-theme');
        console.log('[FLP-PARAMS] From postMessage - locale:', result.locale, 'theme:', result.theme);
        return result;
    }

    try {
        const params = new URLSearchParams(window.parent.location.search);
        result.locale = params.get('sap-locale');
        result.theme = params.get('sap-theme');
        console.log('[FLP-PARAMS] From direct access - locale:', result.locale, 'theme:', result.theme);
    } catch (e) {
        console.log('[FLP-PARAMS] Cannot access parent directly (expected in iframe)');
    }

    return result;
}

/**
 * Initialize postMessage listener to receive initial state from parent.
 */
export function initFLPMessageListener() {
    if (stateReceived) {
        return;
    }

    console.log('[FLP-MSG] Initializing message and URL hash listeners');

    // Snapshot current parent/window hash
    try {
        const targetWindow = window.parent !== window ? window.parent : window;
        lastDetectedParentHash = targetWindow.location.hash || '';
    } catch (e) {}

    const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'INITIAL_STATE') {
            console.log('[FLP-MSG] Received initial state from parent:', event.data);
            initialFLPState = {
                hash: event.data.hash || '',
                search: event.data.search || '',
            };
            stateReceived = true;

            const resolvedRoute = parseFLPRoute(initialFLPState.hash, initialFLPState.search);
            if (resolvedRoute && resolvedRoute !== '/') {
                flpRouteListeners.forEach((listener) => listener(resolvedRoute));
            }
        } else if (event.data && event.data.type === 'ROUTE_CHANGED' && event.data.route) {
            const resolvedRoute = parseFLPRoute(event.data.route, '');
            if (resolvedRoute && resolvedRoute !== '/') {
                flpRouteListeners.forEach((listener) => listener(resolvedRoute));
            }
        }
    };

    window.addEventListener('message', handleMessage);

    // Listen to hashchange & focus on window
    window.addEventListener('hashchange', checkParentHashChange);
    window.addEventListener('focus', checkParentHashChange);

    if (window.parent !== window) {
        // If embedded in Launchpad iframe, listen to parent hashchange
        try {
            window.parent.addEventListener('hashchange', checkParentHashChange);
        } catch (e) {
            // Cross-origin iframe
        }

        // Polling fallback to catch address bar edits in case browser suppresses cross-frame events
        setInterval(checkParentHashChange, 600);

        console.log('[FLP-MSG] Requesting initial state from parent');
        try {
            window.parent.postMessage({ type: 'REQUEST_INITIAL_STATE' }, '*');
        } catch (e) {
            console.error('[FLP-MSG] Failed to request initial state:', e);
        }
    } else {
        setInterval(checkParentHashChange, 800);
    }
}

/**
 * Testing helper to reset internal module state between tests.
 */
export function _resetFLPStateForTesting() {
    initialFLPState = null;
    stateReceived = false;
    lastDetectedParentHash = '';
    flpRouteListeners.clear();
}

