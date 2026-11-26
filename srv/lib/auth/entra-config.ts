/**
 * Configuration for accepting Microsoft Entra ID access tokens (mobile app) on the BFF.
 *
 * Read from the user-provided service `cnma-prorequest-s4h-entra` (bound via mta.yaml) or, for
 * local runs, from ENTRA_* environment variables. When neither is present the Entra branch is
 * disabled and only XSUAA tokens (web) are accepted.
 */
export interface EntraConfig {
    tenantId: string;
    /** Client ID of the "CNMA Approval API" app registration (audience of mobile access tokens). */
    apiClientId: string;
    /** Client secret of the API app registration, used for the On-Behalf-Of request. Never logged. */
    clientSecret: string;
    /** OBO scope for the SAML Enterprise App that targets XSUAA, e.g. `https://<subdomain>.authentication.<region>.hana.ondemand.com/.default`. */
    samlScope: string;
    /** Delegated scope the mobile token must carry. */
    requiredScope: string;
    /**
     * XSUAA endpoint for the saml2-bearer grant. Defaults to `<xsuaa url>/oauth/token/alias/<alias>` when
     * `xsuaaTokenAlias` is set, otherwise `<xsuaa url>/oauth/token`.
     */
    xsuaaTokenAlias?: string;
}

export const ENTRA_SERVICE_NAME = 'cnma-prorequest-s4h-entra';
const DEFAULT_REQUIRED_SCOPE = 'access_as_user';

type RawConfig = Partial<Record<keyof EntraConfig, unknown>>;

const readString = (value: unknown): string | undefined =>
    typeof value === 'string' && value.trim() ? value.trim() : undefined;

const fromVcap = (vcapJson: string | undefined): RawConfig | undefined => {
    if (!vcapJson) return undefined;
    try {
        const vcap = JSON.parse(vcapJson) as Record<string, Array<{ name?: string; instance_name?: string; credentials?: RawConfig }>>;
        for (const instances of Object.values(vcap)) {
            const match = instances?.find((s) => s.name === ENTRA_SERVICE_NAME || s.instance_name === ENTRA_SERVICE_NAME);
            if (match?.credentials) return match.credentials;
        }
    } catch {
        console.error('[EntraAuth] VCAP_SERVICES is not valid JSON; Entra token support disabled');
    }
    return undefined;
};

const fromEnv = (env: NodeJS.ProcessEnv): RawConfig => ({
    tenantId: env.ENTRA_TENANT_ID,
    apiClientId: env.ENTRA_API_CLIENT_ID,
    clientSecret: env.ENTRA_API_CLIENT_SECRET,
    samlScope: env.ENTRA_SAML_SCOPE,
    requiredScope: env.ENTRA_REQUIRED_SCOPE,
    xsuaaTokenAlias: env.ENTRA_XSUAA_TOKEN_ALIAS,
});

/** Returns the Entra configuration, or undefined when it is missing or incomplete. */
export const loadEntraConfig = (env: NodeJS.ProcessEnv = process.env): EntraConfig | undefined => {
    const raw = fromVcap(env.VCAP_SERVICES) ?? fromEnv(env);
    const tenantId = readString(raw.tenantId);
    const apiClientId = readString(raw.apiClientId);
    const clientSecret = readString(raw.clientSecret);
    const samlScope = readString(raw.samlScope);

    const missing = Object.entries({ tenantId, apiClientId, clientSecret, samlScope })
        .filter(([, value]) => !value)
        .map(([key]) => key);
    if (missing.length === 4) return undefined;
    if (missing.length) {
        console.error(`[EntraAuth] Entra configuration incomplete (missing: ${missing.join(', ')}); Entra token support disabled`);
        return undefined;
    }

    return {
        tenantId: tenantId!,
        apiClientId: apiClientId!,
        clientSecret: clientSecret!,
        samlScope: samlScope!,
        requiredScope: readString(raw.requiredScope) ?? DEFAULT_REQUIRED_SCOPE,
        xsuaaTokenAlias: readString(raw.xsuaaTokenAlias),
    };
};
