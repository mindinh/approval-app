/**
 * Runtime configuration. EXPO_PUBLIC_* values are inlined at bundle time, so each one must be
 * read with a literal `process.env.EXPO_PUBLIC_…` expression. Never put secrets here.
 */
export interface AppConfig {
    entra: {
        tenantId: string;
        clientId: string;
        /** Delegated API scope, e.g. `api://<client-id>/access_as_user`. */
        apiScope: string;
    };
    /** BFF base URL, e.g. `http://192.168.1.20:4005/api/cnma/APPROVAL_SRV`. */
    apiBaseUrl: string;
}

const values = {
    EXPO_PUBLIC_ENTRA_TENANT_ID: process.env.EXPO_PUBLIC_ENTRA_TENANT_ID,
    EXPO_PUBLIC_ENTRA_CLIENT_ID: process.env.EXPO_PUBLIC_ENTRA_CLIENT_ID,
    EXPO_PUBLIC_ENTRA_API_SCOPE: process.env.EXPO_PUBLIC_ENTRA_API_SCOPE,
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
};

/** Names of required variables that are missing; the UI shows them instead of crashing. */
export const missingConfig = Object.entries(values)
    .filter(([, value]) => !value?.trim())
    .map(([name]) => name);

export const config: AppConfig | null =
    missingConfig.length > 0
        ? null
        : {
              entra: { tenantId: values.EXPO_PUBLIC_ENTRA_TENANT_ID!.trim(), clientId: values.EXPO_PUBLIC_ENTRA_CLIENT_ID!.trim(), apiScope: values.EXPO_PUBLIC_ENTRA_API_SCOPE!.trim() },
              apiBaseUrl: values.EXPO_PUBLIC_API_URL!.trim().replace(/\/+$/, ''),
          };
