# Authentication and Security Architecture

> **Owner:** Project Team | **Last Updated:** 2026-10-20 | **Status:** Active

## Request boundaries

[Approuter routes](../../../app/router/xs-app.json) authenticate API traffic with XSUAA and forward requests to `srv-api`.
[package.json](../../../package.json) configures CAP mocked auth by default, IAS in hybrid, and XSUAA in production.

In [server.ts](../../../srv/server.ts), custom Passport JWT middleware is mounted on `/api/cnma/APPROVAL_SRV/tasks` only when XSUAA credentials are available and either production or `ENABLE_JWT_AUTH=true` applies.
Initialization failures are logged. Do not infer that every bootstrap endpoint has this middleware: health, debug-config and Swagger are mounted before it.
The task router does not have a universal `.user`/`.admin` scope guard.

## Identity and SAP connectivity

[auth-helper.ts](../../../srv/lib/utils/auth-helper.ts) extracts tokens from supported headers, derives identity from claims, and supports `x-sap-user` override or `SAP_TASK_HARDCODED_USER`/`MOCK_USER` fallback.
Identity extraction decodes claims; signature validation belongs to the authenticated boundary.
The `x-sap-user` override is checked by the helper without a production-mode guard.

[SapClient](../../../srv/lib/integrations/sap-client.ts) chooses Destination mode only with `SAP_USE_DESTINATION=true`.
Destination authentication depends on its BTP configuration; principal propagation is not guaranteed by selecting any destination name.
Production disables automatic fallback to direct calls, but explicitly configured direct mode still uses Basic credentials. Host/user/password and destination-name defaults have been removed.
Outside production, missing valid JWT or a destination header-building failure can select direct mode only with a complete explicit direct configuration, unless `SAP_DEV_OVERRIDE_DESTINATION=false`.

## Notification administration and diagnostics

[NotificationController](../../../srv/controllers/notification-controller.ts) has an `isAdmin()` check for its REST actions. It permits headerless non-production requests, `MOCK_USER`, or JWT scopes ending in `.admin`.
CAP notification actions in [service.ts](../../../srv/service.ts) have separate handlers; they do not call the REST controller's `isAdmin()`.

The diagnostic REST endpoints can expose identity, token and binding information. `/debug/jwt` returns HTTP 400 when no usable JWT exists.
The Swagger Bearer scheme describes how to supply a token; it does not itself enforce authorization.

See [configuration](../04-reference/01-configuration.md), [REST reference](../02-implementation/03-backend-bff-endpoints.md), and [Swagger reference](../04-reference/02-swagger-api-placeholder.md).
