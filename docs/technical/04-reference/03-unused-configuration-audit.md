# URL and Environment Configuration Cleanup

> **Owner:** Project Team | **Last Updated:** 2026-10-20 | **Status:** Active

Cleanup applied to the current checkout after the source audit. No live SAP/BTP requests or deployments were performed. Local environment values and secrets are not reproduced.

## Removed

| Item | Applied cleanup |
| --- | --- |
| `USE_MOCK_SAP` | Removed from local root `.env`, [MTA](../../../mta.yaml), [QAS](../../../deployment/qas.mtaext) and [PRD](../../../deployment/prd.mtaext); no runtime reader or mock business-data provider exists. |
| `ENABLE_IAS_DEV_CLAIMS_FALLBACK` | Removed its ineffective assignment from `start:ias:lan` in [package.json](../../../package.json). Host/port/binding command remains. |
| Frontend package `proxy` | Removed the ignored `localhost:5000` setting from [frontend package.json](../../../app/cnma_approval_ui/package.json). Vite owns the active development proxy. |
| Unreachable localhost branch | Removed `isLocal = false` and its dead URL branch from [axiosInstance.ts](../../../app/cnma_approval_ui/src/services/core/axiosInstance.ts); requests continue to use the current origin. |
| `VITE_PP_JWT_EXPIRES_AT` | Removed unused environment writes from [pp-token.mjs](../../../app/cnma_approval_ui/pp-token.mjs); console expiry information and actual token writes remain. |
| Embedded SAP direct host/user/password | Removed defaults from [SapClient](../../../srv/lib/integrations/sap-client.ts). Explicit configuration is required when a direct request is selected. |
| `SAP_ABAP_BACKEND` | Removed the destination-name fallback from SapClient and the diagnostic default from [InboxController](../../../srv/controllers/inbox-controller.ts). Missing diagnostic configuration is reported as `null`. |

`VITE_CAP_BASE_URL` and `VITE_DEV_JWT` occur only as generic design examples in the [hybrid guide](../../plans/cap-react-local-hybrid-principal-propagation-guide.md). Its banner directs application setup to current docs; these are not application settings. Existing unused keys are removed from local environment files when present.

## Resulting connection contract

- Destination mode requires an explicit `SAP_TASK_DESTINATION`, including when local fallback is possible.
- Direct calls require `SAP_TASK_BASE_URL` (absolute HTTP/S URL), `SAP_TASK_USER` and `SAP_TASK_PASSWORD`. Missing settings fail before a direct network call.
- Axios is constructed lazily; destination-only setups do not require direct credentials.
- Existing local direct fallback remains available only with all three direct settings present. Production and `SAP_DEV_OVERRIDE_DESTINATION=false` continue to disable automatic fallback.
- Explicit direct mode remains supported. SAP client/language defaults and actively consumed identity/header settings remain unchanged.

The Vite loopback target, CF API endpoint, active destination names, OData paths, logout font URL, SVG namespace and `https://odata.invalid` parsing base retain current consumers.
`default-env.json` remains SDK-owned destination/binding configuration and is preserved.

## Documentation and verification

API paths and Swagger match mounted routes, including counts, SAP-user lookup, notification APIs and optional attachment filename variants.
Runtime configuration, setup and security docs describe the cleaned connection behavior. Historical reviews and generic design examples remain labeled as such.

```powershell
npm.cmd test
npx.cmd tsc --noEmit
cd app/cnma_approval_ui
npx.cmd tsc --noEmit
npx.cmd tsc --noEmit -p tsconfig.app.json
cd ../..
node scripts/check-doc-links.cjs
```

[SapClient tests](../../../tests/unit/integrations/sap-client.test.ts) mock transports and cover required settings, destination-only operation, local fallback and production/override restrictions. Live destination existence and deployed CF environment overrides are outside these checks.
