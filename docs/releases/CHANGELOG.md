# Changelog

All notable changes to the **CNMA Approval** project will be documented in this file.

## [1.0.6] - 2026-07-31

### Added
*   **Workzone App Renaming ("My Approval")**:
    *   Renamed HTML5 application title and tile descriptors from `"CNMA Prorequest S4H"` / `"App Title"` to `"My Approval"` across `manifest.json`, `web-manifest.json`, `index.html`, `Component.js`, `i18n.properties`, `METADATA.xml`, `xs-app.json`, and `mta.yaml` for SAP Build Workzone Content Explorer integration.
*   **Developer & AI Agent Context Guide (`CLAUDE.md`)**:
    *   Created comprehensive guide documenting end-to-end data flows, declarative field mapping workflows (`config.json`), dynamic visibility rules (`visibleWhen`), card chips, document-type overrides (`documentTypes` e.g., `ZASS`, `ZFO7`, `ZMAK`, `ZNB1`), and step-by-step onboarding for new object types (`CONTRACT`, `INVOICE`, etc.).
*   **Text File Attachment Viewer (`TextViewer.tsx`)**:
    *   Added plain text viewer component for attachment preview modal supporting `.txt`, `.md`, `.json`, `.csv`, `.log`, and `.xml` files.
*   **Subtype Card Chips & Document Type Overrides**:
    *   Extended `srv/configuration/object-types/*/config.json` with dynamic `cardChips` and `documentTypes` subtype overrides for Asset PR (`ZASS`), Expense PR (`ZFO7`), Marketing PR (`ZMAK`), and Stock PR (`ZNB1`).

### Changed
*   **CAP Task Detail API Payload Flattening**:
    *   Flattened task detail response shape in `inbox-processor.ts` by removing the legacy `object` wrapper and promoting `header`, `items`, `workflow`, `attachments`, `decisions`, `comments`, `fieldSchema`, and `uiSchema` directly to the top-level REST JSON response payload.
    *   Added top-level `_meta: { objectType, objectId, documentType }` metadata block for explicit object type identification.
*   **Modular BFF Processor Architecture**:
    *   Decomposed `srv/lib/processors/inbox-processor.ts` into a slim orchestrator, extracting comment filtering logic into `inbox-utils.ts` and object-type determination into `object-type-resolver.ts`.
*   **BFF Router Prefix Normalization**:
    *   Cleaned Express router mount point in `srv/handlers/inbox-handler.ts` and `srv/server.ts` to mount directly at `/api/cnma/APPROVAL_SRV`, eliminating doubled URL prefixes (`/tasks/tasks/` -> `/tasks/`).
*   **Frontend Renderers Directory Promotion**:
    *   Relocated dynamic section renderers from `app/cnma_approval_ui/src/pages/Inbox/components/renderers/` to top-level src module [`app/cnma_approval_ui/src/renderers/`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/renderers/).
    *   Updated import paths across `OverviewPanel.tsx`, `DetailsPanel.tsx`, `AttachmentsPanel.tsx`, `TaskDetailView.tsx`, and vitest test specs to import directly from `@/renderers`.

---

## [1.0.5] - 2026-07-24

### Changed
*   **Inbox Task-Detail API Refactor**:
    *   Flattened task detail response shape by removing the `object` wrapper and promoting `header`, `items`, `workflow`, `attachments`, `decisions`, `comments`, `fieldSchema`, and `uiSchema` to the top level.
    *   Added top-level `_meta: { objectType, objectId, documentType }` block.
    *   Refactored `srv/lib/processors/inbox-processor.ts` into a slim orchestrator, pure utility module (`inbox-utils.ts`), and resolution component (`object-type-resolver.ts`).

### Fixed
*   **Duplicated Routing Prefix**: Moved Express router mount point in `srv/server.ts` from `/api/cnma/APPROVAL_SRV/tasks` to `/api/cnma/APPROVAL_SRV`, removing the doubled `/tasks/tasks/` URL path.
*   **Comment Cleaning**: Implemented `filterComments()` in `inbox-utils.ts` to automatically filter out empty text, null values, and System noise entries.

---

## [1.0.4] - 2026-07-23

### Added
*   **Comprehensive File Type & MIME Resolver (`mime.ts` & `shared.tsx`)**:
    *   Created `srv/lib/utils/mime.ts` supporting 40+ file extensions across Documents (`.pdf`, `.docx`, `.xlsx`, `.csv`, `.pptx`, `.txt`, `.md`), Images (`.png`, `.jpg`, `.webp`, `.svg`, `.heic`), Archives (`.zip`, `.rar`, `.7z`, `.gz`), Code/Web (`.json`, `.xml`, `.html`, `.yaml`), and Media (`.mp3`, `.mp4`).
    *   Enhanced frontend `friendlyFileType(mimeType?, fileName?)` with file extension fallback so generic `application/octet-stream` MIME types display as human-readable labels (`CSV`, `Excel Spreadsheet`, `Word Document`, etc.) instead of `'Binary File'`.
*   **API Stress & Performance Benchmark Suite (`tests/performance/`)**:
    *   Added `tests/performance/load-generator.ts` and `tests/performance/api-performance.test.ts` executing 11 performance benchmark scenarios under 50-virtual-user burst load.
    *   Added `npm run test:perf` script to root `package.json` measuring throughput (3,500+ RPS), latency percentiles (p50: ~5ms, p95: <15ms), and memory delta.

### Changed
*   **TASKPROCESSING Query Optimization**:
    *   Deprecated redundant `TASKPROCESSING/TaskCollection` calls in `getTasks` and `getApprovedTasks`.
    *   Task list fetching now relies 100% on CDS V4 view `ZC_WORKFLOWTASK` (`SapOdataAdapter.getInstances()`), cutting query overhead in half.
*   **App Router MTA Archive Size Optimization**:
    *   Updated `package.json` `clean` script to include `app/router/resources/`, eliminating 49.26 MB of accumulated legacy Vite builds and shrinking `.mtar` archive size from 17.05 MiB down to ~2.5 MiB.

### Fixed
*   **Approve Decision Comment Area**: Fixed `commentSupported` decision mapping in `inbox-processor.ts` (`sapDec.CommentSupported !== false`) to preserve optional decision comment text areas in non-mock/production SAP environments.
*   **Empty Sonner Toast Box**: Added fallback message extraction in `inboxMutations.ts` (`data?.message || data?.result?.message || 'Decision processed successfully.'`) to prevent empty toast notifications.
*   **Task Detail Page Reload Sync**: Synchronized `isDetailLoading` in `InboxPage.tsx` and validated `activeDetail` instance IDs, ensuring symmetrical skeleton loaders render across both split panels during initial page reload and task switching.
*   **Attachment Upload Security**: Disabled attachment upload UI buttons in `AttachmentsPanel.tsx` and configured backend endpoints `POST /tasks/:id/attachments` and `POST /pr/:docNum/attachments` to return `403 Forbidden`.

---

## [1.0.3] - 2026-07-22

### Added
*   **BFF Debug Config Endpoint**: Exposed a public, unauthenticated GET endpoint `/api/cnma/APPROVAL_SRV/debug-config` to inspect loaded JSON configurations, alias mappings, and directory resolution status.
*   **Dynamic production configuration directory path resolution**: Implemented `process.cwd()` path resolution with a `__dirname` fallback in the BFF `ConfigRegistry` to fix path mismatch crashes inside the SAP BTP Cloud Foundry runtime.

### Changed
*   **Unified Items Table & Standardized Columns**:
    *   Consolidated all auxiliary tables under a single unified `items` table section for all PR types.
    *   Configured a 12-column table displaying code-and-text combined labels for Plant, Storage Location, GL Account, Material Group, and Commitment Item.
    *   Stripped the `"item"` prefix from all collection target paths (e.g. `itemStorageLocation` -> `storageLocation`).
*   **OData List Fetch Optimizations**:
    *   Implemented paginated `InstanceID` filtering on active worklist fetches (`getTasks`), reducing query overhead from fetching all user tasks down to exactly the 10 paginated tasks.
    *   Parallelized the S/4HANA OData fetching pipeline inside BFF when list-level performance hints are provided.
*   **Query Focus & Redirect Optimizations**:
    *   Added `enabled: isMobileViewport` check to queries inside `HomePage.tsx` to stop redundant API requests on desktop pages prior to redirecting to `/inbox`.
    *   Disabled `refetchOnWindowFocus` on infinite list queries to prevent duplicate parallel requests to S/4HANA on tab refocus.
*   **Scroll Area & Horizontal Scrollbars**:
    *   Replaced the Radix `<ScrollArea>` component with a standard CSS scrollable container inside `TaskDetailView` to prevent vertical/horizontal scrollbar clipping.
    *   Added `min-w-max` to table elements and constrained card widths to force horizontal scrollbars to render correctly.

### Fixed
*   **CAP TS Build Compilation Errors**: Updated `ObjectConfig` interface declarations to declare metadata properties and resolved nullable `objectType` references in `inbox-processor.ts`.
*   **API Purge**: Purged deprecated APIs (`getTaskOverview`, `getTaskInformation`) and their query keys from both frontend and backend layers.

## [1.0.2] - 2026-07-17

### Added
*   **OData V4 Consumption Views Integration**: Mapped detail adapters to use the new `ZC_POHEADER` and `ZC_PRHEADER` consumption views in SAP S/4HANA OData V4 services instead of the previous view prefixes.
*   **Expand Comments Support**: Configured `$expand=_Comment` navigation property on PO and PR detail requests to retrieve and display task discussion comments.
*   **Task Type Filter and Badges (CC Tasks)**:
    *   Implemented `TaskTypeBadge` to render a shortened `"CC"` indicator for tagged comment-only tasks (`normalTask === false`) in the task list cards (desktop/mobile) and detail header page.
    *   Added a `"Task Type"` filter option in the filter bar, allowing users to isolate `"Standard Approval"` vs. `"CC"` tasks.
    *   Shortened all related translation keys and configuration strings from `"Tagged Task (Comment-only)"` to `"CC"` in both English and Vietnamese locales.
*   **Workflow Task Creation Metadata**: Exposed new fields `TaskCreationDateTime`, `CreatedByUser`, `CreationDate`, and `CreationTime` in the backend instances mapping, with fallbacks implemented to populate task creation timestamps and requester details in list/detail pages.

### Changed
*   **Fallback Task Action Title**: Adjusted default fallback title construction for `normalTask === false` tasks from `"Approve PR..."` to `"Review PR..."` / `"Reviewed PR..."` in active and historical views to align with comment-only task scopes.

## [1.0.1] - 2026-07-16

### Added
*   **NormalTask Flag Support**: Introduced `NormalTask` flag mapping from INSTANCE LIST response. This flag defines whether a task is a normal approval task (can take action) or a tagged comment-only task (user tagged from comment section, only see/comment, no actions).
*   **Conditional Decision Options Fetching**: Configured the task runtime retriever to conditionally omit the SAP `/DecisionOptions` API call when `NormalTask` is `false`, saving network overhead and hiding actions in the UI.

## [1.0.0] - 2026-07-15

### Added
*   **OData V4 Migration & Consolidation**: Replaced multiple separate V2/V4 integration endpoints with a single unified OData V4 service endpoint `/sap/opu/odata4/sap/zsb_prorequest/srvd_a2x/sap/zsd_prorequest/0001`.
*   **Single Query with `$expand`**: Refactored details retrieval strategies (`PrDetail`, `PoDetail`) to fetch document headers, items, approval strategy steps, and comments in a single query using `$expand=_Item,_ApprovalStep,_HeaderText` instead of 3-5 parallel queries.
*   **Backward Compatibility Mapping**: Added compound key URL building and backwards-compatible field mapping (`purchaseRequisition`, `purchaseOrder`, and dynamically derived PO `accountAssignments`) to preserve existing React frontend structures.

### Changed
*   **Comments & Attachments Write Operations Disabled (Option B)**: Configured the BFF processor and strategies to set `comments` support to `false` in direct mode (whilst keeping mock support intact). Direct comment posting or attachment uploads throw `405 Method Not Allowed` errors, reflecting the read-only properties of the new service.

---

## [1.0.0] - 2026-07-13

### Changed
*   **OData Integration Strategy Refactoring**: Refactored the integration strategies (`PrStrategy`, `PoStrategy`, `DetailStrategy`) into a modular structure:
    *   Defined `Detail` interface in `detail.ts` for clean abstraction.
    *   Introduced `BaseDetail` in `base.ts` to encapsulate shared behaviors like mock-mode checking, parallel batch request fallback, camel-casing keys, and config-driven property mapping.
    *   Decomposed specific details retrieval into `PrDetail` in `pr.ts` and `PoDetail` in `po.ts`.
*   **Decoupled CSRF & Authentication**: Cleanly delegated CSRF token fetching and Cookie replication logic directly to `SapClient.post` and `SapClient.fetchCsrf`, improving BTP multi-instance cluster compatibility.

### Fixed
*   **Double Loading Spinner in Attachments**: Resolved a layout bug in `AttachmentsPanel.tsx` that displayed duplicate spinners during initial load by constraining the secondary loader to `isSecLoading && displayedAttachments.length > 0`.

## [1.0.0] - 2026-07-07 

### Added
*   **Decoupled Express BFF**: Mounted custom REST routes on CAP bootstrap to handle list and detail views.
*   **PR & PO Dynamic Rendering**: Created `TaskDetailSections.registry` to parse dynamic field and UI schemas for Purchase Requisitions and Purchase Orders.
*   **In-Memory caching**: Created the LRU/TTL caching layer to optimize S/4HANA details query speeds and prevent N+1 request loops.
*   **Attachments & Comments Integration**: Implemented binary streams for viewing/uploading files and comment synchronizations.
*   **Mass Actions Support**: Created frontend checkboxes and backend routes to batch process decisions.
*   **XSUAA Security**: Mounted JWT verification middleware with passport strategy to enable secure BTP Principal Propagation.
*   **Mock Fallbacks**: Developed mocked endpoints and local data providers to enable offline development.
*   **Unit Tests**: Added Vitest suites covering caching, adapters, processors, and handlers.

### Changed (Added 2026-07-09)
*   **OData Integration Redesign (SOLID)**: Consolidated split outbound adapters (`instance-list-adapter.ts`, `object-detail-adapter.ts`) into a single facade adapter (`sap-odata-adapter.ts`) and applied the Strategy Pattern using `PrStrategy` and `PoStrategy` classes implementing `DetailStrategy`.
*   **Proactive CSRF Management**: Configured `SapClient` to proactively fetch and manage CSRF tokens/cookies for POST calls, delegating security headers from individual strategies to the HTTP client layer.

### Fixed
*   **Safe ID Padding**: Implemented numeric regex check (`/^\d+$/`) before padding document IDs with leading zeros, preventing alphanumeric ID corruption.
*   **Decoupled Binary Decoding**: Extracted GOS attachment hex/base64 decoding from integration strategies to a dedicated `file-helper.ts` utility.
