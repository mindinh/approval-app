# Project Codebase Structure

> **Owner:** Lead SAP CAP Architect | **Last Updated:** 2026-07-31 | **Status:** Active

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
│   │   │   ├── renderers/             # Dynamic UI section registry & object builders (TaskDetailSections.registry.ts)
│   │   │   ├── pages/                 # Full page view structures
│   │   │   │   ├── Dashboard/         # Dashboard metrics page & custom hooks
│   │   │   │   │   ├── DashboardPage.tsx
│   │   │   │   │   └── use-dashboard-data.ts
│   │   │   │   └── Inbox/             # Unified inbox workspace page
│   │   │   │       ├── components/    # Sub-panels, modals, and panel views
│   │   │   │       │   ├── AttachmentPreviewModal.tsx
│   │   │   │       │   ├── TaskCard.tsx
│   │   │   │       │   ├── TaskDetailView.tsx
│   │   │   │       │   └── panels/    # OverviewPanel, AttachmentsPanel, CommentsPanel, WorkflowApprovalPanel
│   │   │   │       ├── hooks/         # Inbox query hooks (useInbox, inboxQueries)
│   │   │   │       └── index.tsx      # Inbox page composition root
│   │   │   ├── services/              # API Client fetch queries (Axios REST clients)
│   │   │   └── styles/                # CSS styling, tokens, and Tailwind theme rules
│   │   ├── tests/                     # Vitest unit tests for components & registries
│   │   └── package.json               # Frontend dependencies & scripts
│   └── router/                        # Standalone Approuter proxy (BTP Cloud Foundry deployment)
├── docs/                              # Project documentation suite
│   ├── business/                      # Business process flows, permissions, data dictionary
│   ├── product/                       # User guide & introduction
│   ├── technical/                     # Technical architecture, implementation, and reference docs
│   └── code-review/                   # Code review reports & audit logs
├── srv/                               # CAP Node.js Backend BFF
│   ├── api/                           # CDS OData entity and route service definitions
│   ├── configuration/                 # Declarative object mapping & metadata configs
│   │   └── object-types/              # Object type configuration directories
│   │       ├── claim/config.json      # Expense Claim configuration
│   │       ├── po/config.json         # Purchase Order configuration
│   │       ├── pr/config.json         # Purchase Requisition configuration
│   │       └── reservation/config.json # Material Reservation configuration
│   ├── controllers/                   # Controller endpoint handlers (Express REST API)
│   │   └── inbox-controller.ts        # REST routing, auth extraction, attachment stream fallbacks
│   ├── external/                      # Imported SAP CDS metadata models
│   ├── lib/                           # Core business processors, mapping engine, and integrations
│   │   ├── integrations/              # Outbound connectors to SAP backend (Strategy pattern)
│   │   │   ├── base.ts                # BaseDetail strategy class handling mock mode & normalization
│   │   │   ├── claim.ts               # Expense Claim detail strategy implementation
│   │   │   ├── detail.ts              # Detail strategy interface definition
│   │   │   ├── mock-data-provider.ts  # In-memory mock data provider for local testing
│   │   │   ├── po.ts                  # Purchase Order detail strategy implementation
│   │   │   ├── pr.ts                  # Purchase Requisition detail strategy implementation
│   │   │   ├── re.ts                  # Material Reservation detail strategy implementation
│   │   │   ├── sap-client.ts          # SAP client connector with proactive CSRF token handling
│   │   │   ├── sap-odata-adapter.ts   # Facade adapter managing strategy dispatch & caching
│   │   │   └── taskprocessing-adapter.ts # SAP Task Gateway operations adapter
│   │   ├── mapping/                   # Config-Driven API Mapping Engine
│   │   │   ├── canonical-business-object.ts # Canonical TypeScript DTO type definitions
│   │   │   ├── canonical-projector.ts # Prunes unmapped fields according to resolved plans
│   │   │   ├── config-registry.ts     # Config reader, validator, in-memory cache, & file watcher
│   │   │   ├── mapping-engine.ts      # Maps raw OData entities to canonical business model
│   │   │   ├── resolver.ts            # FieldRequirementResolver deriving profile/UI schema paths
│   │   │   └── transforms.ts          # Value formatters (sapDateToIso, number, uppercase)
│   │   ├── processors/                # Business processors and orchestrators
│   │   │   ├── inbox-processor.ts     # Main orchestrator linking adapters to mapping engine
│   │   │   ├── object-config.ts       # Object configuration facade delegating to ConfigRegistry
│   │   │   └── odata-config.ts        # OData service constants and path mappings
│   │   └── utils/                     # Cache engine (ttl-lru-cache), MIME type resolver (mime.ts), logging, and auth helpers
│   ├── server.ts                      # Express bootstrap logic (passport, XSUAA JWT, REST routing)
│   └── service.cds                    # CDS BFF Service path definitions
├── tests/                             # Backend Unit, Integration & Performance tests
│   ├── performance/                   # Stress & Performance benchmark suite (api-performance.test.ts, load-generator.ts)
│   └── unit/                          # Unit test suite
│       ├── integrations/              # Tests for SAP adapters & strategy implementations
│       └── processors/                # Tests for processors & mapping engine (config-mapping.test.ts)
├── mta.yaml                           # Multi-Target Application deployment descriptor
└── package.json                       # Root package config & execution scripts
```

---

## 🔑 Crucial Backend Component Files

*   [`srv/server.ts`](file:///d:/learning/test/cnma_approval/srv/server.ts): Bootstraps the Express application. Configures passport authentication using XSUAA/IAS JWT validation strategy and mounts the REST routing middleware at `/api/cnma/APPROVAL_SRV`.
*   [`srv/controllers/inbox-controller.ts`](file:///d:/learning/test/cnma_approval/srv/controllers/inbox-controller.ts): Express controller layer. Maps routes (such as `/tasks/tasks`, `/tasks/tasks/:id`, `/tasks/tasks/:id/decision`), extracts user identity tokens, and handles file attachment content streaming.
*   [`srv/lib/processors/inbox-processor.ts`](file:///d:/learning/test/cnma_approval/srv/lib/processors/inbox-processor.ts): Main business orchestrator. Resolves object types, retrieves raw data via strategy adapters, invokes the mapping engine, projects canonical models, and returns consolidated task responses.
*   [`srv/lib/mapping/`](file:///d:/learning/test/cnma_approval/srv/lib/mapping/): Generic **Config-Driven Mapping Engine**:
    *   [`config-registry.ts`](file:///d:/learning/test/cnma_approval/srv/lib/mapping/config-registry.ts): Reads JSON configs under `srv/configuration/object-types/*/config.json`, validates schemas, and maintains active in-memory models with hot-reload watching.
    *   [`mapping-engine.ts`](file:///d:/learning/test/cnma_approval/srv/lib/mapping/mapping-engine.ts): Maps raw source OData JSON properties into structured nested canonical properties.
    *   [`resolver.ts`](file:///d:/learning/test/cnma_approval/srv/lib/mapping/resolver.ts) & [`canonical-projector.ts`](file:///d:/learning/test/cnma_approval/srv/lib/mapping/canonical-projector.ts): Compiles required property paths based on execution profiles (`list` vs `detail`) and prunes unneeded payload fields.
    *   [`transforms.ts`](file:///d:/learning/test/cnma_approval/srv/lib/mapping/transforms.ts): Provides data formatting utility functions.
*   [`srv/lib/integrations/sap-odata-adapter.ts`](file:///d:/learning/test/cnma_approval/srv/lib/integrations/sap-odata-adapter.ts): Unified SAP OData facade managing object strategies (`PrDetail`, `PoDetail`, `ClaimDetail`, `ReDetail`) and in-memory TTL caching.

---

## 🔑 Crucial Frontend Component Files

*   [`app/cnma_approval_ui/src/pages/Inbox/index.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/index.tsx): Composition root for the inbox workspace UI layout, coordinating tab switches, task selection, and pagination.
*   [`app/cnma_approval_ui/src/pages/Inbox/components/TaskDetailView.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/TaskDetailView.tsx): Renders task details, header badges, dynamic section renderers, decisions, and sub-panels.
*   [`app/cnma_approval_ui/src/pages/Inbox/components/renderers/TaskDetailSections.registry.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/renderers/TaskDetailSections.registry.ts): Dynamic section registry mapping backend `uiSchema` section cards to specific frontend component renderers.
*   [`app/cnma_approval_ui/src/pages/Inbox/components/panels/`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/panels/): Sub-panels managing item details, attachments, comments, and approval workflows:
    *   `OverviewPanel.tsx`: Displays high-level header information and dynamic UI schema sections.
    *   `AttachmentsPanel.tsx`: File attachment grid with download links and preview modal trigger.
    *   `AttachmentPreviewModal.tsx`: Image/PDF inline preview modal.
    *   `CommentsPanel.tsx`: Timeline notes and comment submission.
    *   `WorkflowApprovalPanel.tsx`: Step-by-step release process flow.
