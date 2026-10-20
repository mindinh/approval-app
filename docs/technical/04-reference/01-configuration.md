# Runtime Configuration & Renderer Reference

> **Owner:** Project Team | **Last Updated:** 2026-10-20 | **Status:** Active

## Environment variables

Sources: [SapClient](../../../srv/lib/integrations/sap-client.ts), [identity helper](../../../srv/lib/utils/auth-helper.ts), [server](../../../srv/server.ts), [Vite](../../../app/cnma_approval_ui/vite.config.ts), and [deployment configuration](../../../mta.yaml).
Local secrets belong in ignored environment files. There is no `.env.example` in this checkout.

| Variable | Actual default / behavior |
| --- | --- |
| `SAP_USE_DESTINATION` | Only literal `true` selects BTP Destination mode; otherwise direct Axios. |
| `SAP_TASK_DESTINATION` | Required in destination mode; no default name. MTA/PRD use `VJ_PS4`; QAS uses `VJ_DS4`. |
| `SAP_TASK_BASE_URL` | Required absolute HTTP(S) host for direct mode; no embedded development-host fallback. |
| `SAP_TASK_USER`, `SAP_TASK_PASSWORD` | Required Basic credentials for direct calls; no embedded user/password defaults. |
| `SAP_TASK_CLIENT` | `100`, sent as `sap-client`. MTA/PRD override `900`, QAS `300`. |
| `SAP_LANGUAGE` | `en`, sent as `sap-language`. |
| `SAP_REJECT_UNAUTHORIZED` | Only literal `true` enables certificate validation for direct HTTPS. |
| `SAP_SEND_USER_HEADER` | Only literal `true` adds the resolved `sap-user` to outbound requests. |
| `SAP_DEV_JWT` | Complete JWT fallback when the request token is missing/expired; validated with a 60-second expiry margin. |
| `SAP_DEV_OVERRIDE_DESTINATION` | Literal `false` prevents automatic local direct fallback. Otherwise missing JWT or destination header-building failures can select direct calls outside production only when all three direct settings are configured. |
| `SAP_TASK_HARDCODED_USER` | Identity fallback without `x-sap-user` or JWT; otherwise `MOCK_USER`. |
| `DEFAULT_EMAIL_DOMAIN` | `conarum.com`, used when synthesizing a profile email from an identity without `@`. |
| `ENABLE_JWT_AUTH` | Literal `true` enables custom XSUAA Passport middleware outside production when credentials are bound. Production enables it when configured. |
| `NODE_ENV` | Controls production middleware and disables automatic destination-to-direct fallback in production. |
| `PORT`, `HOST` | CAP listener settings. Main dev scripts set `4005`; LAN scripts set `4004`. |
| `VCAP_SERVICES`, `VCAP_APPLICATION` | CAP/SDK service-binding context; application presence also affects local profile fallback. |
| `VITE_PP_JWT` | Optional Bearer token injected by the Vite development proxy. |

Production only selects destination mode when configured. There is no guard forcing `SAP_USE_DESTINATION=true` if absent.
The direct Axios client is initialized lazily only when direct calls are selected. Missing direct settings fail before a direct network request; missing destination name fails before routing, including local fallback.
Unused `USE_MOCK_SAP`, `ENABLE_IAS_DEV_CLAIMS_FALLBACK`, frontend package `proxy`, unreachable localhost URL branch and unused token-expiry env writer have been removed.
See [unused configuration audit](03-unused-configuration-audit.md).

## SAP service paths and destinations

| Configuration | Default | Use |
| --- | --- | --- |
| `ODATA_PATH_INSTANCE_LIST` | `/sap/opu/odata4/sap/za_cnma_prorequest/srvd_a2x/sap/za_cnma_prorequest/0001` | `CNMA_WFTASK`, aggregates, PR/PO/RE/CLAIM headers and collaboration. |
| `ODATA_PATH_TASKPROCESSING` | `/sap/opu/odata/IWPGW/TASKPROCESSING;v=2` | Task Gateway runtime and decisions. |

All raw document strategies use `ODATA_SERVICES.INSTANCE_LIST`; there is no separate `APPROVAL_SRV` configuration key.
Source: [odata-config.ts](../../../srv/lib/processors/odata-config.ts).
`SAP_Notifications` is an actively used fixed destination in [NotificationClient](../../../srv/lib/integrations/notification-client.ts), without an env override.

## Frontend addressing and renderer contracts

The shared Axios client uses the current origin. Vite listens on `3000` and proxies API requests to `http://127.0.0.1:4005`.
Deployed Approuter forwards API requests to its bound `srv-api` destination. LAN commands on `4004` require a matching proxy setup.

The source of truth is [renderer.types.ts](../../../app/cnma_approval_ui/src/renderers/core/renderer.types.ts):

| Contract | Key properties |
| --- | --- |
| `FieldDefinition` | `key`, `label`, `source`, `code`, `text`, `value`, `currency`, `unit`, `formatter`, `predicate`, `isLongText`, `align`. |
| `CardDefinition` | `id`, `title`, `fields`, optional `predicate`. |
| `TableColumnDefinition` | `key`, `header`, source/value/code/text/currency/unit, formatter and alignment. |
| `TableDefinition` | `id`, `title`, `sourcePath`, `columns`. |

Factory input options differ from the resulting definitions; consult [fields.ts](../../../app/cnma_approval_ui/src/renderers/core/fields.ts).
