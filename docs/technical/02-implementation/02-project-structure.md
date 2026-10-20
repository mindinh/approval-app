# Project Codebase Structure

> **Owner:** Project Team | **Last Updated:** 2026-10-20 | **Status:** Active

## Backend

| Location | Responsibility |
| --- | --- |
| [server.ts](../../../srv/server.ts) | CAP bootstrap, custom REST mount, health, Swagger and middleware. |
| [service.cds](../../../srv/service.cds), [service.ts](../../../srv/service.ts) | CAP notification service contracts and handlers. |
| [handlers/inbox-handler.ts](../../../srv/handlers/inbox-handler.ts) | Express route registrations. |
| [controllers](../../../srv/controllers) | Inbox and notification HTTP handlers. |
| [processors](../../../srv/lib/processors) | Inbox orchestration, object configuration/resolution, decision strategies and OData paths. |
| [integrations](../../../srv/lib/integrations) | SAP transport, metadata-backed raw strategies and notification client. |
| [utils](../../../srv/lib/utils) | Identity, errors, validation, MIME, filenames, logging and cache utility. |
| [tests](../../../tests) | Backend unit and mocked performance tests. |

No active backend mapping/configuration directory or mock-data provider is present. The old `clearDetailCache` export is a compatibility no-op.

## Frontend

| Location | Responsibility |
| --- | --- |
| [App.tsx](../../../app/cnma_approval_ui/src/App.tsx) | Application routes/shell. |
| [InboxPage.tsx](../../../app/cnma_approval_ui/src/pages/Inbox/InboxPage.tsx) | Inbox page composition; `index.ts` exports the page. |
| [Inbox components](../../../app/cnma_approval_ui/src/pages/Inbox/components) | Cards, task detail, reference PR and collaboration panels. |
| [Inbox hooks](../../../app/cnma_approval_ui/src/pages/Inbox/hooks) | Queries, filtering, selection and actions. |
| [renderers](../../../app/cnma_approval_ui/src/renderers) | Object registry, core primitives, object-specific field/view definitions and worklist chip evaluation. |
| [services](../../../app/cnma_approval_ui/src/services) | Shared HTTP client and typed API contracts. |
| [locales](../../../app/cnma_approval_ui/src/locales) | Translation catalogs. |
| [frontend tests](../../../app/cnma_approval_ui/tests) | Unit and browser fixtures. |

Task-card fields are now defined through renderer `cardChips` and `core/taskCardView.ts`; the historical `taskCard.mapper.ts` is absent.

## Build and deployment

[MTA](../../../mta.yaml) builds the CAP backend and React UI, packages the standalone [Approuter](../../../app/router), and deploys UI resources to the HTML5 repository.
[QAS](../../../deployment/qas.mtaext) and [PRD](../../../deployment/prd.mtaext) override destination/client properties.
`gen/`, frontend `dist/` and `mta_archives/` are generated outputs.
See [local setup](01-local-setup.md), [configuration](../04-reference/01-configuration.md) and [API reference](03-backend-bff-endpoints.md).
