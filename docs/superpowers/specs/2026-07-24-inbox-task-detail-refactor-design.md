# Inbox Task-Detail Refactor — Design Spec

**Date:** 2026-07-24
**Owner:** Lead CAP Architect
**Status:** Design — pending user approval
**Scope:** Backend BFF (`srv/`) + thin frontend adjustments (`app/cnma_approval_ui/`)

---

## 1. Problem Statement

Three concrete defects in `/api/cnma/APPROVAL_SRV/tasks/{id}` (and its `/overview`, `/information` aliases):

1. **Doubled routing prefix.** The router is mounted at `/api/cnma/APPROVAL_SRV/tasks` and every handler route inside it also starts with `/tasks/...`, so the resulting URL is `/api/cnma/APPROVAL_SRV/tasks/tasks/10000001`. The frontend (`inbox.api.ts:14`) intentionally constructs the same shape (`BASE_URL = 'api/cnma/APPROVAL_SRV/tasks'` + `'/tasks'`), so the duplication is symmetric on both sides. The same doubled path is also embedded in the attachment download URL inside the response body. Fix: move the BE mount to `/api/cnma/APPROVAL_SRV` (one place, no FE change needed).
2. **Bloated, hard-to-maintain response.** `srv/lib/processors/inbox-processor.ts` is 707 lines, with `getTaskDetail` doing parallel-vs-sequential branch logic, mapping, projection, action decoration, comment/attachment shaping, and fieldSchema construction in one ~300-line body. It nests `header/items/workflow/attachments` under an `object` wrapper that adds an unnecessary indirection, and inlines ad-hoc logic that overlaps with the controller (`buildFieldSchema`) and with the task-card builder (`_buildTaskCard`).
3. **Garbage comments.** The comment list shows `System`-authored entries with empty text, plus duplicate text entries when a decision is made. The BFF forwards SAP's raw `_Comment` array without filtering.

This spec addresses all three.

---

## 2. Goals

- One canonical, flat, slim response shape for `getTaskDetail`.
- No duplicated routing prefix anywhere in the URL surface.
- A comment filter that drops null/empty entries, applied in the BFF.
- `inbox-processor.ts` reduced to a thin orchestrator; reusable pure functions live in `srv/lib/processors/inbox-utils.ts`.
- Existing public method signatures on `InboxProcessor` are preserved (controller and other callers unchanged).
- All existing unit tests updated; new tests added for the pure functions and routing.

## 3. Non-Goals

- No change to the React UI's tab structure, layouts, or component hierarchy.
- No change to the SAP adapter strategies (`pr.ts`, `po.ts`, `re.ts`, `claim.ts`) — they already return the right shape.
- No change to mapping engine, canonical projector, or config-driven schemas.
- No change to the `getTasks` / `getApprovedTasks` list endpoints beyond a small cleanup (no behavior change).
- No new CDS entities.

---

## 4. Architecture

### 4.1 File layout

```
srv/lib/processors/
├── inbox-processor.ts          (orchestrator, ~250 lines, was 707)
├── inbox-utils.ts              (NEW — pure functions, ~150 lines)
├── object-type-resolver.ts     (NEW — encapsulates parallel/sequential probe, ~60 lines)
├── odata-config.ts             (unchanged)
└── object-config.ts            (unchanged)
```

No new sub-folders, no builder classes. Pure functions are exported from `inbox-utils.ts` and reused across the orchestrator and the controller.

### 4.2 Slim flat response shape

**Before** (selected fields shown):
```jsonc
{
  "task": { instanceId, ..., taskDefinitionId, total, curr_vnd, total_doc_curr, doc_curr, businessChips, normalTask,
            businessContext: { type, documentId } },
  "object": { objectType, objectId, documentType, header: { ... }, items: [ ... ], workflow: { ... }, attachments: [ ... ] },
  "decisions": [ ... ],
  "comments": [ ... ],
  "businessContext": { type, documentId, pr: { ... }, po: { ... }, ... },  // also used at top level
  "fieldSchema": { ... },
  "uiSchema": { ... },
  "processingLogs": [],                  // read by ActivityPanel & skeleton checks
  "workflowLogs": [],                    // read by ActivityPanel & skeleton checks
  "customAttributes": [],                // read by TaskDetailSections.shared.ts
  "taskObjects": []                      // read by TaskDetailSections.shared.ts
}
```

**After:**
```jsonc
{
  "task": { instanceId, sapOrigin, title, status, priority, createdOn, createdByName,
            requestorName, taskDefinitionId, supports: { forward, comments },
            businessContext: { type, documentId }, total, curr_vnd, total_doc_curr, doc_curr,
            businessChips, normalTask },
  "_meta":        { objectType, objectId, documentType },
  "header":      { ... canonical header ... },
  "items":       [ ... ],
  "workflow":    { strategyName, steps, comments },
  "attachments": [ ... ],
  "decisions":   [ ... ],
  "comments":    [ ... ],
  "uiSchema":    { ... },
  "fieldSchema": { ... },
  "businessContext": { type, documentId, pr: { ... }, po: { ... }, ... },   // kept for legacy readers
  "processingLogs":   [],                // kept for backward compat
  "workflowLogs":     [],                // kept for backward compat
  "customAttributes": [],                // kept for backward compat
  "taskObjects":      []                 // kept for backward compat
}
```

Promoted to top level (no longer nested under `object`):
`header`, `items`, `workflow`, `attachments`. The previous `object` wrapper is removed; consumers that previously read `detail.object.objectId` should now read `detail._meta.objectId`, and `detail.object.documentType` should read `detail._meta.documentType`. A new top-level `_meta: { objectType, objectId, documentType }` block is added so the existing frontend code can migrate with one line of change instead of digging into the header.

Removed fields:
- none — every existing field is still present at top level, either promoted (`header`, `items`, `workflow`, `attachments`), preserved as a top-level `businessContext` (used at top level by `StatusHeaderBadges`, `TaskDetailSections.registry`, `TaskDetailSections.shared`), or kept as a backward-compat empty array (`processingLogs`, `workflowLogs`, `customAttributes`, `taskObjects`).

Note on `businessContext` at the top level: this is **not** simply a duplicate of `task.businessContext`. Today, the top-level `businessContext` carries the full canonical object as a nested key (e.g. `businessContext.pr = canonicalObject` for PR documents). The React UI's `TaskDetailSections.registry.ts:28-30` uses this nested structure as a fallback when `detail.object` is missing. We keep that behavior — the top-level `businessContext` continues to expose `{ type, documentId, [type.toLowerCase()]: canonicalObject }`. The orchestrator's `composeTaskMeta` builds it by reusing the same `canonicalObject` it returns as flat `header`/`items` (no double-mapping).

### 4.3 `inbox-utils.ts` — exported pure functions

| Function | Purpose |
|---|---|
| `normalizePriority(priority: string): string` | Maps SAP `1..4` / `VERY_HIGH..LOW` / `NOT_VALID` → canonical `VERY_HIGH\|HIGH\|MEDIUM\|LOW`. |
| `normalizeDate(value: string \| undefined): string \| undefined` | Parses `/Date(ms)/` and ISO, returns ISO. |
| `cleanBusinessObjectForList(obj: any): any` | Strips empty arrays/objects/nulls for list cards. |
| `formatTaskTitle(inst, matchingTask, objectType, overrideStatus?): string` | `"Approve PR 10000001"` / `"Reviewed PO ..."`. |
| `filterComments(raw: any[]): Comment[]` | See §5. |
| `buildFieldSchema(config: ObjectConfig): Record<string, any>` | Walks `config.mappings.root` + `config.mappings.collections.*.fields`, returns `dataPath: $.header.x`, `dataType` inferred from `transform`. **Preserves the existing root→`AMOUNT` vs collection→`QUANTITY` distinction for `number` transforms** (matches today's behavior in the controller's `getObjectConfigs`). Explicit `dataType` in mapping wins over inference. |
| `buildBusinessChips(config, projectedObject): any[]` | Resolves `config.cardChips` against projected object. |
| `decorateActions(decisions, config): any[]` | Maps SAP decisions to UI actions, infers `nature`/`variant` from config. |
| `decorateAttachments(attachments, instanceId, instid): any[]` | Adds `link: /api/cnma/APPROVAL_SRV/tasks/{instanceId}/attachments/{id}/content?documentId={instid}`. |
| `composeTaskMeta(args): TaskMetadata` | Builds the `task` object: title, status, priority, supports, requestor, businessContext, total, businessChips. |
| `resolveUiSchema(config, documentType): any` | Picks `config.documentTypes[documentType]?.uiSchema ?? config.uiSchema`. |

All functions are pure, take inputs explicitly, and return new objects (no mutation of inputs).

### 4.4 `object-type-resolver.ts` — encapsulates the resolution branch

```ts
export class ObjectTypeResolver {
  constructor(
    private readonly sapOdataAdapter: SapOdataAdapter,
    private readonly taskAdapter: TaskprocessingAdapter
  ) {}

  async resolve(instanceId, sapUser, hints, userJwt): Promise<{
    objectType: string;
    instid: string;
    inst: any | undefined;
    taskRuntime: any;
    businessObject: any;
  }> {
    // 1. If hints are sufficient → parallel fetch (instances, runtime, detail).
    // 2. Else → sequential: instances → runtime → resolve objectType → detail.
    // 3. On runtime failure → fallback synthetic runtime from inst.
  }
}
```

This is the only place that knows about the parallel/sequential branch. The orchestrator calls `await resolver.resolve(...)` and proceeds with the resolved values.

### 4.5 Comment filtering (backend-only)

```ts
// in srv/lib/processors/inbox-utils.ts
export function filterComments(raw: any[]): Comment[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c, i) => ({
      id: c.id ?? `comment-${i}`,
      createdBy: c.author || c.userComment || 'Unknown',
      createdByName: c.author || c.userComment || 'Unknown',
      text: (c.text ?? c.noteText ?? '').trim(),
      createdAt:
        c.createdAt ??
        normalizeDate(
          c.postedOn && c.postedTime ? `${c.postedOn}T${c.postedTime}` : undefined
        ) ??
        new Date().toISOString(),
    }))
    .filter((c) => c.text.length > 0);
}
```

`System`-authored empty-text entries are dropped by the `.text.length > 0` filter, no special case needed. (Verified by inspection of the screenshot data: every "System" entry has empty text.)

`executeDecision` is **not** modified — the duplicate "HIEULC: test" entries the user saw in the screenshot come from the `addMockComment` in the mock-data provider being merged with the seed `Nguyen Van A` comment, and from repeated PR opens during dev. Once filtered, only one entry per non-empty text remains. If real-SAP later reveals a genuine duplication, we add a dedupe-by-text-and-time step in the same function.

### 4.6 Routing fix (3 edits, no behavior change on either side)

The doubled `/tasks/tasks/` prefix is currently produced by the BE handler's `'/tasks'` route + the BE mount point also being `'/api/cnma/APPROVAL_SRV/tasks'`. The FE (`inbox.api.ts:14`) already constructs `BASE_URL = 'api/cnma/APPROVAL_SRV/tasks'` and appends `'/tasks'`, so the URL the user sees is `…/tasks/tasks/...`.

**Approach:** change the BE mount point, not the routes. The FE stays untouched.

Three edits:

1. `srv/server.ts:100` — change `app.use('/api/cnma/APPROVAL_SRV/tasks', createInboxRouter())` to `app.use('/api/cnma/APPROVAL_SRV', createInboxRouter())`. The handler's `/tasks/...` routes now match directly. **Auth and body-parser middleware at `server.ts:78` and `server.ts:91` stay scoped to `/api/cnma/APPROVAL_SRV/tasks`** — Express middleware path matching is a prefix match, so they continue to cover the inner `/tasks/...` paths. This preserves the exact same auth boundary as today.
2. `srv/controllers/inbox-controller.ts` — update JSDoc `* /tasks/tasks/...` → `* /tasks/...` (cosmetic; Swagger annotations).
3. `srv/lib/processors/inbox-processor.ts` (or its replacement utility) — fix the hard-coded download URL inside `decorateAttachments` from `/api/cnma/APPROVAL_SRV/tasks/tasks/...` to `/api/cnma/APPROVAL_SRV/tasks/...`.

No FE change. `app/cnma_approval_ui/src/services/inbox/inbox.api.ts` `BASE_URL` already produces the correct single-prefix URL once the BE mount moves.

### 4.7 Frontend adjustments (one-time grep + edit)

The flat response shape change forces a small number of destructure updates in 3-4 React files. The fields that move to top level (`workflow`, `attachments`, `header`) are referenced from these sites (verified by grep):

- `app/cnma_approval_ui/src/pages/Inbox/components/TaskDetailView.tsx`
  - L86: `detail.object.workflow?.strategyName` → `detail.workflow?.strategyName`
  - L87: `detail.object.workflow?.steps` → `detail.workflow?.steps`
  - L88: `detail.object.workflow?.comments` → `detail.workflow?.comments`
  - L86 fallback: `detail.object.header?.releaseStrategyName` → `detail.header?.releaseStrategyName`
- `app/cnma_approval_ui/src/services/inbox/inbox.types.ts`
  - L260: `total_doc_curr` stays on `TaskMetadata`.
  - L370-374: `customAttributes`, `taskObjects`, `processingLogs`, `workflowLogs` stay on the `TaskDetail` interface.
  - Add a new top-level `_meta: { objectType, objectId, documentType }` field; remove the `object` wrapper from the interface.
- `app/cnma_approval_ui/src/pages/Inbox/components/panels/StatusHeaderBadges.tsx` — no change (already reads `detail.businessContext`, which stays at top level).
- `app/cnma_approval_ui/src/pages/Inbox/components/renderers/TaskDetailSections.registry.ts`
  - L28: `detail.object?.objectType || detail.businessContext?.type || 'UNKNOWN'` → `detail._meta?.objectType || detail.businessContext?.type || 'UNKNOWN'`
  - L29-31: build `businessObject` from the new flat fields, falling back to the legacy nested key:
    ```ts
    const businessObject =
      (detail._meta
        ? { header: detail.header, items: detail.items, workflow: detail.workflow, attachments: detail.attachments }
        : null)
      ?? (type !== 'UNKNOWN' && detail.businessContext
          ? (detail.businessContext as unknown as Record<string, unknown>)[type.toLowerCase()]
          : null);
    ```
    The fallback chain is preserved; we just add a primary source derived from the new flat fields.
- `app/cnma_approval_ui/src/pages/Inbox/components/renderers/TaskDetailSections.shared.ts` — no change (consumes `customAttributes`, `taskObjects`, `total_doc_curr`, `doc_curr` from unchanged paths).
- `app/cnma_approval_ui/src/pages/Inbox/hooks/inboxQueries.ts` — no change.
- `app/cnma_approval_ui/src/pages/Inbox/mappers/taskCard.mapper.ts` — no change.
- `app/cnma_approval_ui/src/pages/Inbox/components/panels/ActivityPanel.tsx` — no change.
- `app/cnma_approval_ui/src/pages/Inbox/components/panels/CommentsPanel.tsx` — no change to its own data path (consumes `detail.comments`), but note: the `workflowComments` prop it already receives from `TaskDetailView` now comes from `detail.workflow?.comments` instead of `detail.object.workflow?.comments` — that prop is unchanged because `TaskDetailView` is the one that derives it.

`OverviewPanel.tsx`, `DetailsPanel.tsx`, `WorkflowApprovalPanel.tsx`, `AttachmentsPanel.tsx` — these read other top-level fields (`detail.attachments`, `detail.uiSchema`, `detail.fieldSchema`) that are unchanged in shape, but `AttachmentsPanel.tsx` reaches into `detail.attachments` directly today (no `object` indirection), so it needs no change either. Verified by full-tree grep before the design was finalized.

### 4.8 Controller reuse of `buildFieldSchema`

`srv/controllers/inbox-controller.ts:222-247` (`getObjectConfigs`) inlines the same `mappings.root` + `mappings.collections.*.fields` walk that the processor's `getTaskDetail` does. After this refactor, the controller imports `buildFieldSchema` from `srv/lib/processors/inbox-utils.ts` and replaces the inline loop. The current controller-level `AMOUNT` (root) vs `QUANTITY` (collection) distinction is preserved by `buildFieldSchema` (see §4.3). No response-shape change for `/api/cnma/APPROVAL_SRV/tasks/object-configs` — the existing test fixtures and FE consumer (`ConfigContext`, etc.) continue to receive the same fieldSchema.

---

## 5. Data Flow

`getTaskDetail(instanceId, sapUser, hints?, jwt?)`:

```
┌─ ObjectTypeResolver.resolve ─────────────────────────────────────┐
│  hints OK? → Promise.all([instances, runtime, detail])          │
│  else     → instances → runtime → objectType → detail (sequential)│
└──────────────────────────────────────────────────────────────────┘
                                ↓
                 merged = { ...inst, ...businessObject, header: {...} }
                                ↓
        MappingEngine.map(merged, config, { documentId: instid })
                                ↓
       CanonicalProjector.project(canonical, fieldPlan.paths)
                                ↓
   ┌──── inbox-utils (all pure) ────────────────────────────────┐
   │  composeTaskMeta({...})   →  task                          │
   │  buildFieldSchema(config) →  fieldSchema                   │
   │  resolveUiSchema(config, documentType) → uiSchema         │
   │  decorateActions(runtime.decisions, config) → decisions   │
   │  decorateAttachments(projected.attachments, id, instid)    │
   │  filterComments(extractLegacyComments(projected.workflow)) │
   │  buildBusinessChips(config, projected)                     │
   └────────────────────────────────────────────────────────────┘
                                ↓
                  { task, _meta, header, items, workflow, attachments,
                    decisions, comments, uiSchema, fieldSchema,
                    businessContext }
                  // plus defaulted empty arrays:
                  // processingLogs: [], workflowLogs: [],
                  // customAttributes: [], taskObjects: []
```

---

## 6. Error Handling

- `ConfigRegistry.get(objectType)` missing → `AppError('Configuration not found for objectType: X', 500)`.
- `ObjectTypeResolver` cannot resolve `instid` → `AppError('Could not resolve business document ID for task X', 400)` (preserved from current behavior).
- Adapters throw → caught in `executeDecision` / `getTaskDetail` and re-thrown as `AppError(message, statusCode)` (preserved).
- Comment filter is non-throwing — `Array.isArray` guard at entry, returns `[]` for invalid input.

All `AppError` instances flow through the existing global error handler in `srv/server.ts:105-114` and return `{ error: { message, code } }`.

---

## 7. Testing Strategy

### 7.1 New unit tests (`tests/unit/processors/`)

**`inbox-utils.test.ts`** — pure-function tests, no SAP stubs:
- `normalizePriority`: `''` → `MEDIUM`, `'1'` → `VERY_HIGH`, `'4'` → `LOW`, `'NOT_VALID'` → `MEDIUM`, `'high'` → `HIGH`.
- `normalizeDate`: parses `/Date(1700000000000)/` → ISO; passes through ISO; returns undefined for empty.
- `filterComments`:
  - drops `text: null`, `text: ''`, `text: '   '`.
  - keeps a real user comment.
  - drops `System`-authored with empty text (defensive).
  - preserves order.
  - assigns stable `id` from index when missing.
- `buildFieldSchema`:
  - 2 root mappings + 1 collection of 3 fields → 5 entries.
  - `dataPath` formatted as `$.header.fieldName`.
  - `dataType` inferred from `transform` (`sapDateToIso`→DATE, `number`→AMOUNT, others→TEXT).
  - explicit `dataType` in mapping wins over inference.
- `decorateActions`:
  - maps SAP `decisions` array.
  - config's `variant: PRIMARY` → `nature: POSITIVE`.
  - `variant: DANGER` → `nature: NEGATIVE`.
  - `commentSupported` passthrough.
- `decorateAttachments`:
  - produces the single-`/tasks/` URL pattern (regression for the doubled-prefix bug).
- `composeTaskMeta`:
  - title resolution from `inst + taskRuntime` falls through in correct priority.
  - `businessContext` always populated.
- `cleanBusinessObjectForList`:
  - drops empty arrays/objects/nulls, keeps primitives.
  - non-mutating (input untouched).
- `formatTaskTitle`:
  - `Review` vs `Approve` prefix from `normalTask` and `overrideStatus`.

**`object-type-resolver.test.ts`** — stub the two adapters with minimal mocks, assert the two branches (parallel vs sequential) return the same shape.

**`inbox-handler.test.ts`** — spin up the express app with a stub processor, hit each of the ~20 active routes (3 debug, `me`, `dashboard`, `object-configs`, `tasks`, `tasks/approved`, `tasks/:id`, `tasks/:id/overview`, `tasks/:id/information`, `tasks/:id/workflow-approval-tree`, `tasks/:id/comments`, `tasks/:id/attachments/:attId/content`, `attachments/:attachId/content`, `pr/:docNum/attachments`, `pr/:docNum/attachments/:attachId/content`, `tasks/:id/decision`, `/` catch-all), assert 200. Catches the doubled-prefix bug at unit-test time.

### 7.2 Updated existing test

**`inbox-processor.test.ts`** — update fixtures:
- Keep assertions on `processingLogs`, `workflowLogs`, `taskObjects`, `customAttributes` (they stay; only the names are unchanged).
- Keep assertion on the top-level `businessContext` (still present).
- Add: assert `header`, `items`, `workflow`, `attachments` are at top level (not nested under `object`).
- Add: assert the response no longer has the top-level `object` key.
- Add: assert `_meta` is present and contains `objectType`, `objectId`, `documentType`.
- Remove: assertion on `task.title` second resolution path (we keep only the primary one).

### 7.3 Manual smoke

- `curl http://localhost:4004/api/cnma/APPROVAL_SRV/tasks/10000001` → expect flat shape, no doubled `/tasks/tasks/`, no null/System comments.
- `curl http://localhost:4004/api/cnma/APPROVAL_SRV/tasks` → unchanged list response.
- `curl http://localhost:4004/api/cnma/APPROVAL_SRV/tasks/{id}/attachments/{id}/content?documentId=...` → expect 200, correct MIME, correct filename.

---

## 8. Documentation Updates

- [docs/technical/02-implementation/03-backend-bff-endpoints.md](docs/technical/02-implementation/03-backend-bff-endpoints.md) — replace the `/tasks/{id}` example with the new flat shape; add a "filterComments" note.
- [docs/releases/CHANGELOG.md](docs/releases/CHANGELOG.md) — one-line entry: "Refactor inbox task-detail: flat slim response, comment filtering, routing prefix fix; split `inbox-processor.ts` into orchestrator + utils."

---

## 9. Implementation Order

1. Verify `app/cnma_approval_ui/src/services/inbox/inbox.api.ts` `BASE_URL` is `'api/cnma/APPROVAL_SRV/tasks'` (single `/tasks` segment) — no edit, just confirmation. (Verified during design.)
2. Create `srv/lib/processors/inbox-utils.ts` with all pure functions, no behavior change.
3. Create `srv/lib/processors/object-type-resolver.ts` with the resolution logic, no behavior change.
4. Write `tests/unit/processors/inbox-utils.test.ts` and `tests/unit/processors/object-type-resolver.test.ts`. Run → expect green.
5. Refactor `srv/lib/processors/inbox-processor.ts` to use the new utils and return the slim flat response. Update `tests/unit/processors/inbox-processor.test.ts`.
6. Update `srv/controllers/inbox-controller.ts` (`getObjectConfigs`) to import `buildFieldSchema` from `inbox-utils.ts`; remove the inline loop.
7. Apply the routing fix (3 edits, see §4.6):
   - `srv/server.ts:100` — change the mount from `/api/cnma/APPROVAL_SRV/tasks` to `/api/cnma/APPROVAL_SRV`. Auth + body-parser middleware stay scoped to `/api/cnma/APPROVAL_SRV/tasks` (preserves the existing auth boundary).
   - `srv/controllers/inbox-controller.ts` — update JSDoc `* /tasks/tasks/...` → `* /tasks/...`.
   - `srv/lib/processors/inbox-processor.ts` (in `decorateAttachments`) — fix hard-coded download URL from `/api/cnma/APPROVAL_SRV/tasks/tasks/...` to `/api/cnma/APPROVAL_SRV/tasks/...`.
8. Update React frontend destructure sites + `inbox.types.ts` (4 small edits: `TaskDetailView.tsx` L86-88, `inbox.types.ts` add `_meta`, `TaskDetailSections.registry.ts` L28 + L29-31).
9. Run the full check suite per `CLAUDE.md` §"Verification & Quality Commands":
   - `npm test` (backend)
   - `cd app/cnma_approval_ui; npm test` (frontend)
   - `cd app/cnma_approval_ui; npx tsc --noEmit`
10. Manual smoke against the running dev server — confirm URLs are `api/cnma/APPROVAL_SRV/tasks/...` (single segment) end-to-end.
11. Update `docs/technical/02-implementation/03-backend-bff-endpoints.md` + `docs/releases/CHANGELOG.md`.

---

## 10. Open Questions

None at design time. If real-SAP shows additional duplicated or system-text comments after the filter, the next iteration adds a dedupe step in `filterComments` (group by `text + author + postedOn` and keep the first).

---

## 11. Out of Scope / Future Work

- Moving `getTasks` / `getApprovedTasks` to a parallel-class orchestrator (current behavior is fine; only `getTaskDetail` is the bloat culprit).
- Replacing the mock-data provider with a fixture-driven test framework.
- Removing `task.total_doc_curr` / `task.doc_curr` from the list response (kept for backward compat with any future dashboard widget).
- Switching to CDS `cds-typer` for typed handler inputs.
