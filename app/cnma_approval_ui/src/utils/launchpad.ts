/**
 * Utility for building dynamic SAP Fiori Launchpad URLs.
 * Automatically derives the current site base URL (domain + pathname + search)
 * when running inside SAP Fiori Launchpad / SAP Build Workzone,
 * with a fallback for local development.
 */

const DEFAULT_FALLBACK_LAUNCHPAD_SITE =
    'https://proconarum-vj-qas.launchpad.cfapps.ap11.hana.ondemand.com/site?siteId=4dc3f27d-2323-459c-8470-058fe64e8ca2';

/**
 * Returns the base Fiori Launchpad site URL (without hash).
 * e.g. "https://proconarum-vj-qas.launchpad.cfapps.ap11.hana.ondemand.com/site?siteId=4dc3f27d-2323-459c-8470-058fe64e8ca2"
 */
export function getLaunchpadBaseUrl(): string {
    if (typeof window !== 'undefined' && window.location) {
        const href = window.location.href;
        // If running inside FLP site, href contains '/site'
        if (window.location.pathname.includes('/site') || href.includes('/site?siteId=')) {
            return href.split('#')[0];
        }
    }

    // Fallback to environment variable or QAS site URL for local dev
    return import.meta.env.VITE_SAP_LAUNCHPAD_BASE_URL || DEFAULT_FALLBACK_LAUNCHPAD_SITE;
}

/**
 * Formats a Purchase Requisition number into a 10-digit zero-padded string.
 * e.g. "1500000200" -> "1500000200", "200" -> "0000000200"
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
 *
 * Target URL structure:
 * `<baseSiteUrl>#F2229-Display?sap-ui-app-id-hint=2079f675-98bf-427c-a523-05b63006c5f1&/C_PurchaseReqnHeader(PurchaseRequisition='{prNumber}',DraftUUID=guid'00000000-0000-0000-0000-000000000000',IsActiveEntity=true)`
 */
export function buildSapPrLaunchpadUrl(prNumber: string): string {
    if (!prNumber || prNumber === '-' || prNumber.trim() === '') {
        return '';
    }

    const baseUrl = getLaunchpadBaseUrl();
    const formattedPr = formatPrNumberForOData(prNumber);

    const intentHash = `#F2229-Display?sap-ui-app-id-hint=2079f675-98bf-427c-a523-05b63006c5f1&/C_PurchaseReqnHeader(PurchaseRequisition='${formattedPr}',DraftUUID=guid'00000000-0000-0000-0000-000000000000',IsActiveEntity=true)`;

    return `${baseUrl}${intentHash}`;
}
