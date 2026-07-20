# Changelog

All notable changes to the **CNMA Approval** project will be documented in this file.

---

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
