# Changelog

All notable changes to the **CNMA Approval** project will be documented in this file.

## [1.0.10] - 2026-08-17

### Added
*   **Unified Comment Payload Interface (`comment.types.ts`)**:
    *   Created [`comment.types.ts`](file:///d:/learning/test/cnma_approval/srv/lib/integrations/comment.types.ts) to define a standardized `CommentPayload` contract across all integration strategies (`po.ts`, `pr.ts`, `re.ts`, `reference-pr.ts`, `claim.ts`, `sap-odata-adapter.ts`).
    *   Supported structured tagged users (`taggedUsers` / `TAGGEDUSER`) and document context in comment requests.
*   **Dynamic Launchpad App ID & Base URL Resolution (`launchpad.ts`)**:
    *   Updated [`launchpad.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/utils/launchpad.ts) to support dynamic Fiori Launchpad App ID and URL resolution, allowing cross-app navigation without UI redeployment.
*   **Code Review Audit Report (`Code-Review-260817.md`)**:
    *   Added [`Code-Review-260817.md`](file:///d:/learning/test/cnma_approval/docs/code-review/Code-Review-260817.md) documenting code quality verification and architectural compliance.

### Refactored & Changed
*   **Streamlined Backend Comment API & Controller**:
    *   Simplified `addComment` handling in [`inbox-controller.ts`](file:///d:/learning/test/cnma_approval/srv/controllers/inbox-controller.ts) and [`inbox-processor.ts`](file:///d:/learning/test/cnma_approval/srv/lib/processors/inbox-processor.ts), eliminating redundant body field extractions.
*   **Declarative Raw OData Frontend Renderers**:
    *   Refactored panel components ([`OverviewPanel.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/panels/OverviewPanel.tsx), [`DetailsPanel.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/panels/DetailsPanel.tsx), [`TaskDetailView.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/TaskDetailView.tsx)) to render raw OData responses directly using field primitives.
*   **Dead Code Cleanup**:
    *   Purged deprecated `mock-data-provider.ts` (1,922 lines of unused mock code removed from `srv/lib/integrations/`).
    *   Removed redundant `comments.mapper.ts` and its corresponding test file [`comments.mapper.test.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/tests/pages/Inbox/mappers/comments.mapper.test.ts) from the frontend codebase.

---

## [1.0.9] - 2026-08-15

### Added
*   **Task Forwarding & Delegation (`POST /tasks/:id/forward`)**:
    *   Added backend controller endpoint `POST /tasks/:id/forward` and user search route `GET /tasks/search-users`.
    *   Integrated forwarding logic in [`InboxProcessor`](file:///d:/learning/test/cnma_approval/srv/lib/processors/inbox-processor.ts), [`TaskProcessingAdapter`](file:///d:/learning/test/cnma_approval/srv/lib/integrations/taskprocessing-adapter.ts), [`SapOdataAdapter`](file:///d:/learning/test/cnma_approval/srv/lib/integrations/sap-odata-adapter.ts), and [`MockDataProvider`](file:///d:/learning/test/cnma_approval/srv/lib/integrations/mock-data-provider.ts).
    *   Created frontend modal [`ForwardTaskDialog.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/ForwardTaskDialog.tsx) and custom search hook [`useSearchUsers.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/hooks/useSearchUsers.ts).
    *   Automatically records a formatted audit comment `[Forwarded to ${forwardTo}] ${comment}` on the underlying document history in S/4HANA when forwarding with a comment note.
*   **Business User Tagging & Rich Mentions (`@mention`)**:
    *   Added backend endpoint `GET /tasks/bus-users` to query `CNMA_BUSUSER` business users table for CC user tagging.
    *   Created frontend components [`RichMentionInput.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/RichMentionInput.tsx), [`TeamsMentionDropdown.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/TeamsMentionDropdown.tsx), [`TagUserDialog.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/TagUserDialog.tsx), and hook [`useBusUsers.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/hooks/useBusUsers.ts).
    *   Integrated `@mention` inline autocomplete into [`CommentsPanel.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/panels/CommentsPanel.tsx).
*   **Unified Task Action Panel (`TaskActionPanel.tsx`)**:
    *   Replaced legacy decision bar with [`TaskActionPanel.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/TaskActionPanel.tsx), consolidating **Approve**, **Reject**, **Forward**, and **Tag User** actions with confirmation dialogs and rich mention text input.
*   **Reservation Declarative Field Primitives**:
    *   Added [`reservation.fields.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/renderers/objects/reservation/reservation.fields.ts) and updated [`reservation.view.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/renderers/objects/reservation/reservation.view.ts) for declarative raw rendering of Material Reservation objects.
*   **Launchpad Deep-Linking & Task Loading Skeletons**:
    *   Added [`launchpad.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/utils/launchpad.ts) utility for cross-app navigation in SAP Fiori Launchpad environments.
    *   Added [`TaskDetailSkeletons.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/TaskDetailSkeletons.tsx) for smooth skeleton loading states in master-detail view.

### Changed
*   **Centralized Total Amount Resolution (`resolveTaskTotalAmount`)**:
    *   Created centralized amount helper [`resolveTaskTotalAmount`](file:///d:/learning/test/cnma_approval/srv/lib/processors/inbox-utils.ts) to standardize total net amount resolution order across ZUB Stock Transfer Purchase Orders, standard Purchase Orders (BUS2012), Purchase Requisitions, and Reservation objects.
    *   Updated [`taskCard.mapper.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/mappers/taskCard.mapper.ts) and [`TaskList.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/TaskList.tsx) to consume standardized amount fields.
*   **Inbox Filter & Quick Status Tabs**:
    *   Updated [`inboxFilterConfig.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/inboxFilterConfig.ts) and [`useTaskFilters.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/hooks/useTaskFilters.ts) to support tab status filtering ("All", "Pending", "Approved", "Rejected") and enhanced search predicates.

---

## [1.0.8] - 2026-08-05

### Added
*   **Reference Purchase Requisition Drawer Lookup (`/reference-pr/:prNumber`)**:
    *   Added backend service module [`reference-pr.ts`](file:///d:/learning/test/cnma_approval/srv/lib/integrations/reference-pr.ts) and controller route `GET /reference-pr/:prNumber` to query SAP `API_PURCHASEREQ_PROCESS_SRV` or local mock provider for referenced PR header and line item details.
    *   Created frontend hook [`useReferencePr.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/hooks/useReferencePr.ts) and slide-over component [`ReferencePrDetailView.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/ReferencePrDetailView.tsx) to inspect referenced PR details directly from PO line item tables.
*   **Purchase Order Comment Navigation Sync (`_Comment`)**:
    *   Updated `srv/lib/integrations/po.ts` and `inbox-processor.ts` to fetch `_Comment` navigation items from S/4HANA OData service and map them into top-level task comments.
*   **Touch Swipe Mobile Pull-to-Refresh (`usePullToRefresh.ts`)**:
    *   Created [`usePullToRefresh.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/hooks/usePullToRefresh.ts) hook and attached touch gesture handling to `TaskList.tsx` for mobile inbox refresh.

### Changed
*   **PO Subtype Layout Builders & Config Standardization**:
    *   Refactored all 10 Purchase Order subtype layout builders in `app/cnma_approval_ui/src/renderers/modules/po/`: `ZASS`, `ZCON`, `ZCOR`, `ZEXP`, `ZMAK`, `ZNB1`, `ZNB2`, `ZNBR`, `ZTOL`, and `ZUB`.
    *   Standardized header fields, card chips, table columns, and data display structures in [`srv/configuration/object-types/po/config.json`](file:///d:/learning/test/cnma_approval/srv/configuration/object-types/po/config.json).
*   **Structured OData V4 Error Parsing (`ErrorModal.tsx`)**:
    *   Enhanced [`parseError.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/utils/parseError.ts) to parse inner error objects, SAP message containers, status codes, and HTTP network error details for display in [`ErrorModal.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/components/common/ErrorModal.tsx).
*   **Contextual Data Formatters (`formatters.ts`)**:
    *   Added rich formatting functions: `formatQuantityWithUnit`, `formatBadge`, `formatCurrency`, `formatDate`, and standardized null/undefined fallback handling (`-`).

---

## [1.0.7] - 2026-08-05

### Added
*   **Modular PR & PO Subtype Layout Builders**:
    *   Created modular layout builders under `app/cnma_approval_ui/src/renderers/modules/`:
        *   PR subtypes (`pr/subtypes/`): `ZASS` (Asset), `ZMAK` (Asset Subcontracting), `ZNB1` (Standard), `ZNB2` (Service), `ZTOL` (Toll Manufacturing).
        *   PO subtypes (`po/subtypes/`): `ZASS`, `ZCON`, `ZCOR`, `ZMAK`, `ZNB1`, `ZNB2`, `ZNBR`, `ZTOL`, `ZUB`.
*   **Workflow Approval Release Step Description (`releaseText`)**:
    *   Exposed `releaseText` in canonical approval step mapping interface `ApprovalStep` and updated `WorkflowApprovalPanel.tsx` to display human-readable stage descriptions alongside release codes.
*   **Field Mapping Guide (`05-field-mapping-guide.md`)**:
    *   Added comprehensive technical field mapping guide documenting S/4HANA to Canonical Business Object properties across all document types and subtypes.

### Changed
*   **OData V4 Service Endpoint Upgrade**:
    *   Upgraded `INSTANCE_LIST` service path to `/sap/opu/odata4/sap/za_cnma_prorequest/srvd_a2x/sap/za_cnma_prorequest/0001` consuming entity set `CNMA_WFTASK`.
    *   Updated `METADATA.xml` OData EDMX definitions to incorporate latest S/4HANA CDS entity annotations.
*   **Filename-Preserving Attachment Streaming**:
    *   Extended backend BFF attachment content endpoint URL routing pattern to `/api/cnma/APPROVAL_SRV/tasks/:id/attachments/:attId/content/:filename`, preserving file extension and titles during downloads.
*   **PR Approval Decision Comment Syncing**:
    *   Updated `InboxProcessor.addComment` decision push to send decision codes (`A` for Approve, `R` for Reject) along with comment text to SAP Gateway.
*   **Requester Name Resolution Hierarchy**:
    *   Updated requester name resolution in `InboxProcessor` and `inbox-utils.ts` to check `header.userName` before falling back to `header.userFullName` or `header.createdByUser`.

### Fixed
*   **DocType & Status Counts Fallback Calculation**:
    *   Replaced failing OData aggregate count fetches in `SapOdataAdapter` with in-memory instance aggregation fallback.
*   **UI Test Suite Alignment**:
    *   Updated `formatters.shared.test.ts` and `pr.subtypes.test.ts` unit tests to cover new subtype builders and shared formatters.

---

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
