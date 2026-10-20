# Caching and Request Behavior

> **Owner:** Project Team | **Last Updated:** 2026-10-20 | **Status:** Active

## Current backend behavior

[SapOdataAdapter](../../../srv/lib/integrations/sap-odata-adapter.ts) no longer maintains the historical business-object detail cache.
`clearDetailCache()` is a no-op compatibility export. Repeated detail requests are not served from the old process-wide TTL cache.

[InboxProcessor](../../../srv/lib/processors/inbox-processor.ts) retains a per-processor `instanceCache` of `normalTask` flags with a five-minute freshness check.
`getInstanceNormalTask()` uses a fresh flag or queries the workflow instance. On fetch failure it returns the cached value if available, otherwise `false`.
This is a capability cache, not a document payload cache.

[SapClient](../../../srv/lib/integrations/sap-client.ts) caches CSRF tokens/cookies for two minutes and uses HTTP keep-alive agents.
[MetadataService](../../../srv/lib/metadata-service.ts) caches parsed service metadata by service path in a Map.

## Utility and frontend caches

[TtlLruCache](../../../srv/lib/utils/cache.ts) remains a tested utility with defaults of 500 entries and five minutes. Its existence does not imply use by the raw detail adapter.
React Query caches frontend query results; individual hooks control stale times, query keys and invalidation after actions.

The Home page uses dedicated status counts and a bounded dashboard feed rather than fetching the complete worklist for badges. See [REST APIs](../02-implementation/03-backend-bff-endpoints.md).
