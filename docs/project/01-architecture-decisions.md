# Architectural Decision Records (ADRs)

> **Owner:** Enterprise Solution Architect | **Last Updated:** 2026-07-09 | **Status:** Active

This document logs critical architectural choices made during the development of the **CNMA Approval** application, detailing context, options considered, and consequences.

---

## 📂 ADR Log

*   [**ADR 01: Decoupled REST Express BFF instead of CAP OData Service**](#adr-01-decoupled-rest-express-bff-instead-of-cap-odata-service)
*   [**ADR 02: In-Memory TTL/LRU Cache for Detail Queries**](#adr-02-in-memory-ttl-lru-cache-for-detail-queries)
*   [**ADR 03: Unified OData Integration Adapter with Strategy Pattern**](#adr-03-unified-odata-integration-adapter-with-strategy-pattern)

---

## ADR 01: Decoupled REST Express BFF instead of CAP OData Service

### Context
Standard SAP CAP applications automatically expose data models as OData v4 services. However, the **CNMA Approval** app does not maintain its own database tables; it is a pass-through orchestration gateway (BFF) fetching data dynamically from two SAP backends:
1.  **SAP Task Gateway** (OData v2, workflow tasks).
2.  **S/4HANA ERP Core** (OData v2, PR/PO details, comments, attachments).

Exposing a standard CDS OData service would require complex virtual entity declarations and custom handler rewrites, adding significant boilerplate.

### Options Considered
1.  **Option A**: Define virtual CDS entities mapping S/4HANA structures and use standard CAP OData v4 hooks.
2.  **Option B**: Build custom, decoupled Express.js REST endpoints mounted on CAP's Express bootstrap event.

### Decision
We chose **Option B (Custom Express REST endpoints)**.

### Rationale
*   **Performance**: Custom REST endpoints allow returning tailored, compact JSON objects (e.g., merging task status, net values, and priority badges), minimizing payload footprint for mobile clients.
*   **Flexibility**: Simpler stream handling for raw attachments and binary content uploads.
*   **Implementation Speed**: Direct Express routing bypasses CDS framework conventions where they do not align with a purely transactional proxy model.

### Consequences
*   **Pros**: Highly optimized payloads; easy attachment streaming; zero database migration overhead.
*   **Cons**: Bypasses automatic CDS client metadata generation. The frontend must consume APIs using custom Axios connectors instead of generic OData binders.

---

## ADR 02: In-Memory TTL/LRU Cache for Detail Queries

### Context
When the frontend loads the dashboard or active list, it must display the currency, values, and priority for each task. Because these fields live across multiple backend tables, we encounter an **N+1 query** issue where loading 20 items requires 20 separate detail fetches to S/4HANA. This results in slow load times and heavy ERP request traffic.

### Options Considered
1.  **Option A**: Fetch details in real-time for every list item.
2.  **Option B**: Persist detail views in a local SQLite database.
3.  **Option C**: Store detail responses in an in-memory cache with a TTL (Time-To-Live) and LRU (Least Recently Used) eviction policy.

### Decision
We chose **Option C (In-Memory TTL/LRU Cache)**.

### Rationale
*   **Latency**: Accessing local RAM reduces response latency to <10ms for cached items.
*   **Maintenance**: Requires zero database configuration, table migrations, or disk read/write permission setups.
*   **Eviction**: LRU guarantees the cache does not exceed capacity boundaries, and TTL ensures that stale records do not persist indefinitely.

### Consequences
*   **Pros**: Negligible latency; immediate mitigation of N+1 request load; simple invalidation upon modification.
*   **Cons**: Data is lost on server restarts or container scaling (though re-fetching is transparent). Cache must be actively invalidated when a comment or attachment is uploaded.

---

## ADR 03: Unified OData Integration Adapter with Strategy Pattern

### Context
Outbound integration calls to SAP S/4HANA OData services were historically split between multiple unstructured adapters (e.g. `instance-list-adapter.ts` and `object-detail-adapter.ts`). Business entity-specific mapping and querying rules (such as custom comment tables for Purchase Requisitions vs default table fields for Purchase Orders) were hardcoded. This layout violated the Open-Closed Principle (OCP) and Single Responsibility Principle (SRP) by requiring edits to shared adapters when adding new integration objects (e.g., `RE` or `CLAIM`), resulting in regression risks.

### Options Considered
1. **Option A**: Keep current unstructured adapter files, branching queries using extensive `if-else` / `switch` structures.
2. **Option B**: Extract strategies into a nested subfolder hierarchy (e.g., `srv/lib/integrations/strategies/`).
3. **Option C**: Merge base query operations into a single integration facade ([sap-odata-adapter.ts](file:///d:/learning/test/cnma_approval/srv/lib/integrations/sap-odata-adapter.ts)) and implement flat, kebab-case entity strategies under the existing integrations directory ([pr-strategy.ts](file:///d:/learning/test/cnma_approval/srv/lib/integrations/pr-strategy.ts) and [po-strategy.ts](file:///d:/learning/test/cnma_approval/srv/lib/integrations/po-strategy.ts)) conforming to a common strategy interface ([detail-strategy.ts](file:///d:/learning/test/cnma_approval/srv/lib/integrations/detail-strategy.ts)).

### Decision
We chose **Option C**.

### Rationale
* **Open-Closed Principle (OCP)**: New document types (e.g., Request for Quotation) can be supported by writing a new strategy implementing `DetailStrategy` and registering it, without editing existing code.
* **Single Responsibility Principle (SRP)**: Facade routes requests, registries store mappings, and strategies perform OData-specific payloads/calls.
* **Simplicity**: Direct flat folder layout matches Conarum standards while avoiding nested directory bloat.
* **Resource Optimization**: A single `SapClient` instance is instantiated once in the adapter constructor and injected into all strategies, resolving multiple warning logs and optimizing connection pools.

### Consequences
* **Pros**: Extensible integration structure, clean dependency tracking, single-point client caching, and 100/100 code-review score.
* **Cons**: Requires explicit registration of new strategy classes in the `SapOdataAdapter` constructor.
