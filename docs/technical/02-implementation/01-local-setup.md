# Local Development Setup

> **Owner:** Project Team | **Last Updated:** 2026-10-20 | **Status:** Active

## Install

Use Node.js 22 and npm:

```powershell
npm.cmd install
npm.cmd --prefix app/cnma_approval_ui install
```

## Direct SAP development

Create an ignored root `.env` using settings for your authorized environment:

```dotenv
PORT=4005
SAP_USE_DESTINATION=false
SAP_TASK_BASE_URL=https://<sap-host>:<port>
SAP_TASK_CLIENT=<client>
SAP_TASK_USER=<technical-user>
SAP_TASK_PASSWORD=<password>
SAP_REJECT_UNAUTHORIZED=true
```

```powershell
npm.cmd run dev:all
```

The backend runs on `4005`; Vite runs on `3000` and proxies API traffic to `127.0.0.1:4005`.
`USE_MOCK_SAP` does not select mock business data: the reader and old provider are gone.
CAP mocked authentication mocks identity, not outbound SAP adapters.

## Hybrid destination development

Log in to the required CF org/space and bind Destination/Connectivity/identity services using CAP hybrid bindings. Configure:

```dotenv
SAP_USE_DESTINATION=true
SAP_TASK_DESTINATION=<destination-name>
SAP_TASK_CLIENT=<client>
SAP_DEV_OVERRIDE_DESTINATION=false
```

```powershell
npm.cmd run dev:hybrid
```

The command serves the hybrid profile; it does not provision bindings. Hybrid auth is IAS; production auth is XSUAA in `package.json`.
Optional frontend `.env.local` `VITE_PP_JWT` supplies the Vite proxy Bearer token. Without `SAP_DEV_OVERRIDE_DESTINATION=false`, local calls can fall back to direct Basic authentication when JWT or destination headers are unavailable, but only when `SAP_TASK_BASE_URL`, `SAP_TASK_USER` and `SAP_TASK_PASSWORD` are all explicitly configured. Destination mode always requires `SAP_TASK_DESTINATION`.

## LAN testing

`start:lan`, `start:hybrid:lan`, and `start:ias:lan` bind the backend to `0.0.0.0:4004`.
The Vite proxy still targets `4005`; align the backend and proxy before testing.
The obsolete `ENABLE_IAS_DEV_CLAIMS_FALLBACK` assignment has been removed from `start:ias:lan`.

## Validation

```powershell
npm.cmd test
npm.cmd --prefix app/cnma_approval_ui test
cd app/cnma_approval_ui
npx.cmd tsc --noEmit
```

Root tests cover backend code; frontend tests run separately. Unit tests mock adapters and do not establish live destination connectivity.
See [configuration](../04-reference/01-configuration.md) and [REST APIs](03-backend-bff-endpoints.md).
