# Project Codebase Structure

> **Owner:** Lead SAP CAP Architect | **Last Updated:** 2026-08-24 | **Status:** Active

This document provides a comprehensive folder structure walkthrough mapping key components of both the CAP backend BFF and the Vite React frontend.

---

## 📂 Overall Directory Tree

```
cnma-approval/
├── app/                               # UI Frontend applications
│   ├── cnma_approval_ui/              # Vite React UI5/Tailwind application
│   │   ├── src/
│   │   │   ├── components/            # Reusable core UI components (buttons, modals, badges)
│   │   │   ├── config/                # App-level configs & environment settings
│   │   │   ├── contexts/              # Global React context providers (Theme, Auth, Toast)
│   │   │   ├── locales/               # i18n translation files (en.json, vi.json)
│   │   │   ├── renderers/             # Declarative Raw OData Renderer Architecture
│   │   │   │   ├── core/              # Renderer engine primitives & evaluators
│   │   │   │   │   ├── fields.ts      # Field definition primitives (text, codeText, amount, date, tableCol)
│   │   │   │   │   ├── formatters.ts  # Value formatters for dates, amounts, quantities, codes
│   │   │   │   │   ├── objectView.ts  # Layout evaluator converting raw entities to section model
│   │   │   │   │   ├── predicates.ts  # Rule-based visibility helpers (when.eq, when.exists, etc.)
│   │   │   │   │   ├── renderer.types.ts # Renderer type definitions & contracts
│   │   │   │   │   └── taskCardView.ts   # Declarative TaskCard card titles, chips, and total amount builder
│   │   │   │   ├── objects/           # Object field catalogs & layout view definitions
│   │   │   │   │   ├── claim/         # Claim Form view definitions (claim.view.ts)
│   │   │   │   │   ├── po/            # Purchase Order catalogs (po.fields.ts, po.views.ts)
│   │   │   │   │   ├── pr/            # Purchase Requisition catalogs (pr.fields.ts, pr.views.ts)
│   │   │   │   │   └── reservation/   # Material Reservation catalogs (reservation.fields.ts, reservation.view.ts)
│   │   │   │   └── ObjectView.registry.ts # Master registry resolver for DocCategory & DocumentType
│   │   │   ├── pages/                 # Full page view structures
│   │   │   │   ├── Dashboard/         # Dashboard metrics page & custom hooks
│   │   │   │   └── Inbox/             # Unified inbox workspace page
│   │   │   │       ├── components/    # Sub-panels, modals, and panel views
│   │   │   │       │   ├── ForwardTaskDialog.tsx  # Task forwarding user search modal
│   │   │   │       │   ├── RichMentionInput.tsx   # Text input supporting @mention user tagging
│   │   │   │       │   ├── TagUserDialog.tsx      # CC user tagging dialog modal
│   │   │   │       │   ├── TaskActionPanel.tsx    # Floating action bar (Approve, Reject, Forward, Tag)
│   │   │   │       │   ├── TaskCard.tsx           # Task card item (driven by taskCardView.ts)
│   │   │   │       │   ├── TaskDetailSkeletons.tsx # Skeleton loading states
│   │   │   │       │   ├── TaskDetailView.tsx
│   │   │   │       │   ├── TeamsMentionDropdown.tsx # Autocomplete list for user mentions
│   │   │   │       │   └── panels/    # OverviewPanel, AttachmentsPanel, CommentsPanel, WorkflowApprovalPanel
│   │   │   │       ├── hooks/         # Query hooks (useInbox, useSearchUsers, useBusUsers, useTaskFilters)
│   │   │   │       └── index.tsx      # Inbox page composition root
│   │   │   ├── services/              # API Client fetch queries (Axios REST clients)
│   │   │   ├── styles/                # CSS styling, tokens, and Tailwind theme rules
│   │   │   └── utils/                 # Utilities & launchpad helpers (launchpad.ts, parseError.ts)
│   │   ├── tests/                     # Vitest unit tests for components & renderers
│   │   └── package.json               # Frontend dependencies & scripts
│   └── router/                        # Standalone Approuter proxy (BTP Cloud Foundry deployment)
├── docs/                              # Project documentation suite
│   ├── business/                      # Business process flows, permissions, data dictionary
│   ├── product/                       # User guide & introduction
│   ├── technical/                     # Technical architecture, implementation, and reference docs
│   └── code-review/                   # Code review reports & audit logs
├── srv/                               # CAP Node.js Backend BFF
│   ├── api/                           # CDS OData entity and route service definitions
│   ├── controllers/                   # Controller endpoint handlers (Express REST API)
│   │   └── inbox-controller.ts        # REST routing, auth extraction, attachment stream fallbacks
│   ├── external/                      # Imported SAP CDS metadata models
│   ├── lib/                           # Core business processors and integrations
│   │   ├── integrations/              # Outbound connectors to SAP backend (Strategy pattern)
│   │   │   ├── base.ts                # BaseRawDetail strategy class handling raw OData querying & unwrap
│   │   │   ├── claim.ts               # Expense Claim raw detail strategy
│   │   │   ├── comment.types.ts       # Unified comment payload contract and interface
│   │   │   ├── po.ts                  # Purchase Order raw detail strategy
│   │   │   ├── pr.ts                  # Purchase Requisition raw detail strategy
│   │   │   ├── re.ts                  # Material Reservation raw detail strategy
│   │   │   ├── sap-client.ts          # SAP client connector with CSRF token handling
│   │   │   ├── sap-odata-adapter.ts   # Facade adapter managing strategy dispatch & caching
│   │   │   └── taskprocessing-adapter.ts # SAP Task Gateway operations adapter
│   │   ├── processors/                # Business processors and orchestrators
│   │   │   ├── inbox-processor.ts     # Main orchestrator returning minimal raw task detail payload
│   │   │   └── odata-config.ts        # OData service constants and path mappings
│   │   └── utils/                     # Cache engine (ttl-lru-cache), file-helper.ts (MIME magic byte detection), logging, auth
│   ├── server.ts                      # Express bootstrap logic (passport, XSUAA JWT, REST routing)
│   └── service.cds                    # CDS BFF Service path definitions
├── tests/                             # Backend Unit, Integration & Performance tests
│   ├── performance/                   # Stress & Performance benchmark suite
│   └── unit/                          # Unit test suite for adapters, strategies, and processors
├── mta.yaml                           # Multi-Target Application deployment descriptor
└── package.json                       # Root package config & execution scripts
```

---

## 🔑 Crucial Backend Component Files

*   [`srv/server.ts`](file:///d:/learning/test/cnma_approval/srv/server.ts): Bootstraps Express application. Mounts REST routes at `/api/cnma/APPROVAL_SRV`.
*   [`srv/controllers/inbox-controller.ts`](file:///d:/learning/test/cnma_approval/srv/controllers/inbox-controller.ts): Express REST API controller layer mapping task list, details, decisions, comments, and attachments.
*   [`srv/lib/processors/inbox-processor.ts`](file:///d:/learning/test/cnma_approval/srv/lib/processors/inbox-processor.ts): Business orchestrator fetching raw business objects and taskprocessing states concurrently.
*   [`srv/lib/integrations/base.ts`](file:///d:/learning/test/cnma_approval/srv/lib/integrations/base.ts): Defines `BaseRawDetail` strategy class handling OData `$expand` fetches and stripping transport containers (`__metadata`, `__deferred`) without altering property keys.
*   [`srv/lib/integrations/sap-odata-adapter.ts`](file:///d:/learning/test/cnma_approval/srv/lib/integrations/sap-odata-adapter.ts): Unified SAP OData facade managing raw document strategies (`PrDetail`, `PoDetail`, `ClaimDetail`, `ReDetail`) and in-memory TTL caching.

---

## 🔑 Crucial Frontend Component Files

*   [`app/cnma_approval_ui/src/pages/Inbox/index.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/index.tsx): Composition root for the inbox workspace layout.
*   [`app/cnma_approval_ui/src/pages/Inbox/components/TaskDetailView.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/TaskDetailView.tsx): Task detail container reading raw task response and resolving section models via `resolveBusinessSectionModel`.
*   [`app/cnma_approval_ui/src/renderers/ObjectView.registry.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/renderers/ObjectView.registry.ts): Master registry mapping `DocCategory` and `DocumentType` to declarative layout view specifications.
*   [`app/cnma_approval_ui/src/pages/Inbox/components/panels/`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/panels/): Sub-panels managing overview cards, item tables, attachments, comments, and workflow timelines:
    *   `OverviewPanel.tsx`: Renders overview section cards dynamically from declarative `BusinessSectionModel`.
    *   `DetailsPanel.tsx`: Renders line item tables with interactive Reference PR drawers.
    *   `AttachmentsPanel.tsx`: Renders file attachment grid with preview modal.
    *   `CommentsPanel.tsx`: Renders timeline notes and comment box.
    *   `WorkflowApprovalPanel.tsx`: Renders release strategy workflow timeline.
