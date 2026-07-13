# Project Codebase Structure

> **Owner:** Lead SAP CAP Architect | **Last Updated:** 2026-07-09 | **Status:** Active

This document provides a folder structure walkthrough mapping the key components of both the CAP backend BFF and the Vite React frontend.

---

## 📂 Overall Directory Tree

```
cnma-approval/
├── app/                               # UI Frontend applications
│   ├── cnma_approval_ui/              # Vite React UI5/Tailwind application
│   │   ├── src/
│   │   │   ├── components/            # Reusable core UI components
│   │   │   ├── config/                # App-level configs
│   │   │   ├── contexts/              # Global React context providers
│   │   │   ├── pages/                 # Full page structures
│   │   │   │   ├── Dashboard/         # Dashboard metrics page
│   │   │   │   ├── Home/              # Fallback root redirect page
│   │   │   │   └── Inbox/             # Unified inbox workspace page
│   │   │   │       ├── components/    # Inbox sub-panels and views
│   │   │   │       └── index.tsx      # Inbox page composition root
│   │   │   ├── services/              # API Client fetch queries (Axios / React Query)
│   │   │   └── styles/                # CSS styling and theme definitions
│   │   └── package.json               # Frontend dependencies & scripts
│   └── router/                        # Standalone Approuter proxy (BTP deployment only)
├── srv/                               # CAP Node.js Backend BFF
│   ├── external/                      # Imported SAP CDS metadata models
│   ├── handlers/                      # Custom Express HTTP router definitions
│   │   └── inbox-handler.ts           # Mounts API paths and error handling
│   ├── lib/                           # Core business processors and adapter layers
│   │   ├── integrations/              # Outbound connectors to SAP systems
│   │   │   ├── sap-odata-adapter.ts   # Facade adapter managing list fetching and cache
│   │   │   ├── detail.ts              # Unified detail strategy interface
│   │   │   ├── base.ts                # Base strategy class handling mock mode, camel casing, etc.
│   │   │   ├── pr.ts                  # PR-specific detail strategy implementation
│   │   │   ├── po.ts                  # PO-specific detail strategy implementation
│   │   │   ├── sap-client.ts          # Low-level connection client (proactive CSRF handling)
│   │   │   └── taskprocessing-adapter.ts # SAP Task Gateway operations
│   │   ├── processors/                # Data processors, normalization, and mappings
│   │   │   ├── inbox-processor.ts     # Main orchestrator linking adapters to routers
│   │   │   └── object-config.ts       # Dynamic UI rendering fields schemas
│   │   └── utils/                     # Cache engine, logging, file helper, and auth helpers
│   ├── server.ts                      # Bootstrap logic (Express middleware, passport, JWT)
│   └── service.cds                    # CDS BFF Service path definitions
├── tests/                             # Unit & integration tests
│   └── unit/
│       ├── processors/                # Tests for processors (inbox, configs)
│       └── utils/                     # Tests for cache, auth helpers
├── mta.yaml                           # Multi-Target Application deployment descriptor
└── package.json                       # Project configuration & script shortcuts
```

---

## 🔑 Crucial Backend Component Files

*   [`srv/server.ts`](file:///d:/learning/test/cnma_approval/srv/server.ts): Bootstraps the Express application. Configures passport authentication using XSUAA/IAS JWT validation strategy and mounts the REST routing middleware.
*   [`srv/handlers/inbox-handler.ts`](file:///d:/learning/test/cnma_approval/srv/handlers/inbox-handler.ts): Acts as the controller layer. It maps routes (like `/tasks`, `/tasks/:id`, `/tasks/:id/decision`) to methods inside the processor, extracts user identities, handles errors, and returns JSON envelopes.
*   [`srv/lib/processors/inbox-processor.ts`](file:///d:/learning/test/cnma_approval/srv/lib/processors/inbox-processor.ts): Orchestrates the business logic. It handles the batch fetching of details to solve N+1 query overhead, maps raw structures, merges priorities, and returns standard objects to the frontend.
*   [`srv/lib/integrations/sap-odata-adapter.ts`](file:///d:/learning/test/cnma_approval/srv/lib/integrations/sap-odata-adapter.ts): Unified SAP OData adapter acting as a facade for worklist fetching and document detail routing. Delegates specific detail retrieval tasks to registered detail strategies (`PrDetail`, `PoDetail`) and coordinates in-memory caching.
*   [`srv/lib/integrations/base.ts`](file:///d:/learning/test/cnma_approval/srv/lib/integrations/base.ts): Abstract base strategy class (`BaseDetail`) encapsulating common features like mock data injection, parallel batch GETs, camel-casing serialization, and mapping configurations.
*   [`srv/lib/integrations/pr.ts`](file:///d:/learning/test/cnma_approval/srv/lib/integrations/pr.ts): Strategy class (`PrDetail`) handling PR-specific OData queries, custom info mappings, attachment uploads, comments posting, and schema mappings.
*   [`srv/lib/integrations/po.ts`](file:///d:/learning/test/cnma_approval/srv/lib/integrations/po.ts): Strategy class (`PoDetail`) handling PO-specific OData queries, account assignments, schedule lines, and schema mappings.
*   [`srv/lib/utils/file-helper.ts`](file:///d:/learning/test/cnma_approval/srv/lib/utils/file-helper.ts): Utility library handling binary string decoding and hex/base64 conversions for GOS attachment streams.
*   [`srv/lib/utils/cache.ts`](file:///d:/learning/test/cnma_approval/srv/lib/utils/cache.ts): Implements the custom LRU/TTL cache mechanism.

---

## 🔑 Crucial Frontend Component Files

*   [`app/cnma_approval_ui/src/pages/Inbox/index.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/index.tsx): Composition root for the inbox UI layout. Orchestrates active vs historical tabs, split views, and pagination.
*   [`app/cnma_approval_ui/src/pages/Inbox/components/TaskDetailView.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/TaskDetailView.tsx): Renders the main details, routing elements, and tabs (Info, Workflow, Attachments, Comments).
*   [`app/cnma_approval_ui/src/pages/Inbox/components/TaskDetailSections.registry.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/TaskDetailSections.registry.ts): A renderer registry mapping how dynamic layouts are parsed and drawn on the screen based on whether the task is a PR or PO.
*   [`app/cnma_approval_ui/src/pages/Inbox/components/panels/`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/panels/): Sub-panels managing complex logic:
    *   `AttachmentsPanel.tsx`: File upload drop-zone, sizing, and preview modal links.
    *   `CommentsPanel.tsx`: Scrollable note timelines and input handlers.
    *   `WorkflowApprovalPanel.tsx`: Progress tracking tree.
