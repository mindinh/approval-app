# Changelog

All notable changes to the **CNMA Approval** project will be documented in this file.

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
