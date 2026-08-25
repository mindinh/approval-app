# Caching Strategy & Performance Optimization

> **Owner:** Lead SAP CAP Architect | **Last Updated:** 2026-07-09 | **Status:** Active

This document describes the caching architecture, eviction algorithms, and cache validation policies implemented within the **CNMA Approval** BFF backend.

---

## 🏎️ Caching Motivation (N+1 Query Mitigation)

The **CNMA Approval** application aggregates task information from the SAP Task Gateway (which yields task metadata like ID, priority, and date) and detail metrics from the core S/4HANA ERP (which yields total amounts, G/L accounts, line items, and attachments).

Retrieving ERP details for each task sequentially in a list of 50 tasks would result in 50 separate network calls to S/4HANA, causing a severe **N+1 Query** performance penalty. To mitigate this:
1.  **Batch Requests**: The BFF resolves header details in batch calls (`getDetailBatch`) using SAP Batch OData requests where possible.
2.  **In-Memory Caching**: Detail structures are cached locally on BTP inside a high-speed, zero-dependency caching layer.

---

## 📦 Cache Implementation Detail

The caching engine is located in [cache.ts](file:///d:/learning/test/cnma_approval/srv/lib/utils/cache.ts) under the `TtlLruCache` class:

### 1. LRU (Least Recently Used) Eviction
*   The cache stores values using a JavaScript `Map` which maintains keys in insertion order.
*   Upon retrieving an item with `get(key)`, the entry is deleted and immediately reinserted, moving it to the end of the insertion order list (representing the most recently used state).
*   If the cache size reaches the maximum capacity (`maxCapacity`, default `500`), the cache evicts the oldest key (the first key returned by `cache.keys().next().value`) to prevent memory leaks.

### 2. TTL (Time-To-Live) Expiration
*   Entries are written with a timestamp representing current time + Time-To-Live (`ttlMs`, default `5 minutes`).
*   During `get(key)` or `has(key)` checks, if the current timestamp is greater than the item's expiration timestamp, the item is deleted and `undefined` / `false` is returned.
*   A periodic cleanup routine `evictExpired` runs during size queries to sweep and evict all stale elements from memory.

---

## 🔑 Cache Keys & Operations

The cache is defined as a module-level singleton in [sap-odata-adapter.ts](file:///d:/learning/test/cnma_approval/srv/lib/integrations/sap-odata-adapter.ts):
```javascript
const detailCache = new TtlLruCache<string, any>(500, 5 * 60 * 1000);
```

### Cache Key Structure
Keys are composite strings format:
```
{ObjectType}:{DocumentID}:{HeaderOnlyFlag}
```
Examples:
*   `PR:10002134:true` - Header-only metadata for Purchase Requisition 10002134.
*   `PO:45000109:false` - Complete detail context (including line items and accounts) for Purchase Order 45000109.

---

## ⚡ Cache Invalidation & Mutations

To prevent displaying stale data after a user modifies a document:
*   **Trigger Methods**: Whenever a comment is posted (`addComment`), the cache must be invalidated.
*   **Invalidation Mechanism**: The helper function `clearDetailCache(objectType, objectId)` is executed:
    ```javascript
    export function clearDetailCache(objectType: string, objectId: string) {
        const keyPrefix = `${objectType}:${objectId}:`;
        detailCache.delete(keyPrefix + 'true');
        detailCache.delete(keyPrefix + 'false');
    }
    ```
*   This deletes both the header-only and full detail cache entries, forcing the next fetch operation to query S/4HANA directly and repopulate the cache with fresh data.
