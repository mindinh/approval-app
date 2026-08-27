# CC Task — Disable Forward & Server-Side Enforcement

**Date:** 2026-08-27
**Status:** Design (awaiting user approval)

## Problem

A "CC" task (also called "tagged" task in this codebase) is created when a user is
mentioned (`@username`) in a comment thread of any approval workflow (PR, PO, RE, CLAIM).
The CC user receives an entry in their inbox (`CNMA_WFTASK`) with the flag
`NormalTask = false`, indicating that they cannot approve/reject the document — they
can only view it and contribute comments.

### Current behaviour

- **Approve / Reject:** Already disabled. The runtime retriever at
  `srv/lib/integrations/taskprocessing-adapter.ts:26` only fetches `/DecisionOptions`
  when `normalTask=true`. So the action panel renders no decision buttons for CC
  tasks.
- **Forward button:** Already hidden in the UI. `TaskActionPanel.tsx:67-68` derives
  `supportsForward = isNormalTask`, so `supportsForward=false` hides the button.
  However, `TaskActionPanel` re-derives `supportsForward` instead of consuming the
  normalized `supports.forward` field already computed in `normalizeTaskDetail.ts:151`.
  This is fragile and inconsistent with the rest of the codebase.
- **Server-side forward:** **NOT enforced.** `InboxProcessor.forwardTask()`
  (`srv/lib/processors/inbox-processor.ts:428-496`) accepts any task and forwards
  it without consulting the `NormalTask` flag. A user can craft a direct `POST
  /tasks/{id}/forward` request and bypass the UI gate.
- **Add Comment:** Works via the dedicated "Comments" tab. `CommentsPanel` is
  rendered with `allowAddComment={showActionPanel}` (`TaskDetailView.tsx:229, 387`).
  For a CC task in `my` scope, `showActionPanel=true`, so the comment input is
  visible in the Comments tab. No code change needed.

### Why this design

1. The `NormalTask` flag is the single source of truth for "this is a comment-only
   task." The badge already keys off it (see `TaskBadges.tsx:103-107`).
2. Hiding a button in the UI is not security — anyone with curl can call the BFF.
   We must enforce on the server.
3. Existing data is already in flight: the inbox detail fetch
   (`ObjectTypeResolver.resolve`) returns the `inst` row that already carries
   `normalTask`. We can cache it instead of issuing a fresh WFTASK query for every
   forward call.

## Goals

- [ ] Forward is impossible (UI + server) when `NormalTask=false`.
- [ ] Approve/Reject remain impossible (already true).
- [ ] Add Comment remains possible in the Comments tab (already true).
- [ ] Single source of truth: `supports.forward` computed in
      `normalizeDetailForView` is consumed by `TaskActionPanel` (no duplicate
      derivation).
- [ ] Cache the WFTASK row by `instanceId` so `forwardTask()` is cheap when the
      user has just opened the detail.
- [ ] Cache miss path falls back to a one-row `CNMA_WFTASK` query.
- [ ] No schema changes. No new OData fields. No migration.

## Non-goals

- Permission model beyond "is this a CC task." We are not building a CC-list API
  or a "who got tagged" UI. The WFTASK presence in the user's own inbox is the
  proof-of-eligibility.
- Comment thread restrictions (who can read, who can delete). Out of scope.
- Bulk forward / mass action for CC tasks. Out of scope.

## Design

### Change 1 — Server-side `normalTask` cache + fallback query

**File:** `srv/lib/processors/inbox-processor.ts`

Add a private cache:

```ts
interface CachedInstance {
  normalTask: boolean;
  cachedAt: number;
}

private instanceCache = new Map<string, CachedInstance>();
private static readonly INSTANCE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
```

Add helper method:

```ts
private async getInstanceNormalTask(
  instanceId: string,
  sapUser: string,
  userJwt?: string
): Promise<boolean> {
  const cached = this.instanceCache.get(instanceId);
  if (cached && Date.now() - cached.cachedAt < InboxProcessor.INSTANCE_CACHE_TTL_MS) {
    return cached.normalTask;
  }

  // Cache miss: query CNMA_WFTASK by WorkflowTaskInternalID
  const path = ODATA_SERVICES.INSTANCE_LIST.servicePath;
  const response: any = await this.sapClient.get(
    path,
    '/CNMA_WFTASK',
    {
      $format: 'json',
      $select: 'NormalTask',
      $filter: `WorkflowTaskInternalID eq '${instanceId}'`,
      $top: '1',
    },
    sapUser,
    userJwt
  );
  const item = (response?.value || response?.d?.results || response?.d || [])[0];
  const normalTask = item ? item.NormalTask !== false : true; // default true if not found
  this.instanceCache.set(instanceId, { normalTask, cachedAt: Date.now() });
  return normalTask;
}
```

Populate cache from existing flows:

- In `getTaskDetail()` (line ~136), after `objectTypeResolver.resolve()` returns,
  if `resolved.inst?.normalTask !== undefined`, populate the cache.
- In `getInstances()` callers that map the instance list, also populate cache for
  each visible instance.

Modify `forwardTask()`:

```ts
async forwardTask(instanceId, forwardTo, comment, sapUser, userJwt, context) {
  this.logger.info(`Forwarding task ${instanceId} to user ${forwardTo}`);
  try {
    if (!forwardTo || !forwardTo.trim()) {
      throw new AppError('Target user (forwardTo) is required', 400);
    }

    // NEW: server-side normalTask gate
    const normalTask = await this.getInstanceNormalTask(instanceId, sapUser, userJwt);
    if (normalTask === false) {
      throw new AppError(
        'Forward is not allowed for tagged/CC tasks',
        403
      );
    }

    // ... existing implementation continues unchanged
  }
}
```

### Change 2 — UI consume `supports.forward`

**File:** `app/cnma_approval_ui/src/pages/Inbox/components/TaskActionPanel.tsx`

Replace lines 67-68:

```ts
// Before
const isNormalTask = (detail as any)?.normalTask ?? (detail as any)?.task?.normalTask ?? true;
const supportsForward = isNormalTask;

// After
const supportsForward = (detail as any)?.supports?.forward !== false;
```

This makes the panel consume the canonical `supports.forward` value already produced
by `normalizeDetailForView` at `app/cnma_approval_ui/src/pages/Inbox/utils/normalizeTaskDetail.ts:151`.

The rest of the file is unchanged. `if (!decisions.length && !supportsForward)
return null;` continues to gate the panel correctly.

### Change 3 — Comment input: no change

`CommentsPanel` continues to render the comment input in the Comments tab when
`allowAddComment=true`. For a CC task in `my` scope this is true; the input is
visible. Users click the "Comments" tab to add a comment, exactly as for any
other task. No code change.

## Data flow

### Forward attempt on a CC task

```
User clicks Forward button
  → not possible: button is hidden (Change 2)
Direct POST /tasks/{instanceId}/forward
  → InboxProcessor.forwardTask()
    → getInstanceNormalTask(instanceId)
      → cache HIT: returns cached.normalTask === false
      → cache MISS: queries CNMA_WFTASK, caches result, returns false
    → throws AppError('Forward is not allowed for tagged/CC tasks', 403)
  → response: 403 + error message
```

### Cache population

```
User opens CC task in inbox
  → InboxPage mounts TaskDetailView
  → useTaskDetail(instanceId) fires
  → GET /tasks/tasks/{instanceId}
    → inbox-processor.getTaskDetail()
      → objectTypeResolver.resolve(instanceId, ..., { businessObjectType: ... })
        → adapter returns inst with normalTask
      → inbox-processor caches inst.normalTask by instanceId

User then (somehow) calls forward
  → cache HIT, no extra SAP call
```

## Test plan

### Backend

| File | Case |
|---|---|
| `tests/unit/processors/inbox-processor.test.ts` | `forwardTask()` when cache has `normalTask=false` → throws `AppError(403)` |
| `tests/unit/processors/inbox-processor.test.ts` | `forwardTask()` when cache is empty and WFTASK returns `NormalTask=false` → throws `AppError(403)` |
| `tests/unit/processors/inbox-processor.test.ts` | `forwardTask()` when cache is empty and WFTASK returns `NormalTask=true` → forward succeeds (no throw) |
| `tests/unit/processors/inbox-processor.test.ts` | `forwardTask()` when cache is empty and WFTASK returns no row → forward succeeds (default true; conservative) |
| `tests/unit/processors/inbox-processor.test.ts` | Cache TTL expiry → re-queries WFTASK |
| `tests/unit/processors/inbox-processor.test.ts` | `getTaskDetail()` populates cache from `inst.normalTask` |
| `tests/unit/utils/cache.test.ts` (new) | `getInstanceNormalTask` get/set/expire semantics |

### Frontend

| File | Case |
|---|---|
| `app/cnma_approval_ui/tests/pages/Inbox/components/TaskActionPanel.test.tsx` (new) | render with `detail.supports.forward=false` → forward button absent |
| `app/cnma_approval_ui/tests/pages/Inbox/components/TaskActionPanel.test.tsx` (new) | render with `detail.supports.forward=true` + non-empty decisions → forward + decision buttons present |

### Manual smoke

1. Open a CC task (badge "CC" visible) — confirm no Forward button, no Approve/Reject, comment input visible in Comments tab.
2. `curl -X POST .../tasks/{ccInstanceId}/forward` directly — confirm 403.
3. Open a normal task — confirm Forward + Approve/Reject unchanged.

## Trade-offs & risks

- **5-minute cache TTL:** A task whose `NormalTask` flag flips within 5 minutes
  could see stale behaviour. Acceptable because `NormalTask` only changes when
  SAP retags a user; that's a rare event and the cache window is short.
- **Cache miss path adds 1 WFTASK call** to the first forward attempt after expiry
  or cold cache. Acceptable — it's a single-row `$filter` query.
- **Default `true` on no row:** If WFTASK returns no row for some reason, we
  default to `normalTask=true` and allow forward. This is the conservative
  behaviour — false negatives (blocking a legitimate forward) are worse than
  false positives.
- **No changes to comment UI.** `CommentsPanel.allowAddComment` already gates the
  input correctly. The Comments tab remains the canonical place to comment.

## Files touched

- `srv/lib/processors/inbox-processor.ts` — add cache, `getInstanceNormalTask`, gate `forwardTask`
- `app/cnma_approval_ui/src/pages/Inbox/components/TaskActionPanel.tsx` — read `supports.forward`
- `tests/unit/processors/inbox-processor.test.ts` — new cases
- `tests/unit/utils/cache.test.ts` — new file (if not present)
- `app/cnma_approval_ui/tests/pages/Inbox/components/TaskActionPanel.test.tsx` — new file

No schema, no METADATA, no SAP service changes.
