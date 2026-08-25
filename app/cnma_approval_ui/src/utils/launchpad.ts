/**
 * Utility for building SAP Fiori Launchpad URLs.
 * Automatically derives the base site URL when running inside FLP/WorkZone,
 * with fallbacks for local development.
 */

const DEFAULT_FALLBACK_LAUNCHPAD_SITE =
    'https://proconarum-vj-qas.launchpad.cfapps.ap11.hana.ondemand.com/site?siteId=4dc3f27d-2323-459c-8470-058fe64e8ca2';

const SAP_PR_APP_ID_HINT =
    import.meta.env.VITE_SAP_PR_APP_ID_HINT || '2079f675-98bf-427c-a523-05b63006c5f1';

/**
 * Ensures sap-ushell-config=headerless parameter is present in the base query string.
 */
function appendUshellConfig(url: string): string {
    if (url.includes('sap-ushell-config=')) {
        return url;
    }
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}sap-ushell-config=headerless`;
}

/**
 * Returns the base Fiori Launchpad site URL (without hash),
 * guaranteeing sap-ushell-config=headerless is included.
 */
export function getLaunchpadBaseUrl(): string {
    let baseUrl = import.meta.env.VITE_SAP_LAUNCHPAD_BASE_URL || DEFAULT_FALLBACK_LAUNCHPAD_SITE;

    if (typeof window !== 'undefined' && window.location) {
        const href = window.location.href;
        if (window.location.pathname.includes('/site') || href.includes('/site?siteId=')) {
            baseUrl = href.split('#')[0];
        }
    }

    return appendUshellConfig(baseUrl);
}

/**
 * Formats a Purchase Requisition number into a 10-digit zero-padded string.
 */
export function formatPrNumberForOData(prNumber: string): string {
    const clean = prNumber.trim();
    if (/^\d+$/.test(clean)) {
        return clean.padStart(10, '0');
    }
    return clean;
}

/**
 * Builds the full SAP Fiori Launchpad URL to display a specific Purchase Requisition in S/4HANA.
 */
export function buildSapPrLaunchpadUrl(prNumber: string): string {
    if (!prNumber || prNumber === '-' || prNumber.trim() === '') {
        return '';
    }

    const baseUrl = getLaunchpadBaseUrl();
    const formattedPr = formatPrNumberForOData(prNumber);

    return `${baseUrl}#F2229-Display?sap-ushell-config=headerless&sap-ui-app-id-hint=${SAP_PR_APP_ID_HINT}&/C_PurchaseReqnHeader(PurchaseRequisition='${formattedPr}',DraftUUID=guid'00000000-0000-0000-0000-000000000000',IsActiveEntity=true)`;
}
