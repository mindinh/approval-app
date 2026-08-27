# Comments Tab — Forward Log Indicator

**Date:** 2026-08-27
**Status:** Approved
**Scope:** Frontend-only. No backend changes.

## Background

The SAP backend entity `ZI_CNMA_COMMENT` ([METADATA.xml:400-415](../../METADATA.xml#L400)) exposes a `Forward` boolean and `ToUser` string alongside `PostedOn`, `PostedTime`, `NoteText`, `UserComment`. The PR/PO header navigation `_Comment` already returns these fields when expanded by `BaseRawDetail`. Currently the FE renders every comment identically — there is no way to tell a forward event apart from a regular comment.

## Goal

In the Comments tab, render each comment that has `Forward === true` with a clear visual indicator that says "Forwarded to `<ToUser>`" and `PostedOn`/`PostedTime` of the forward action. Non-forward comments render unchanged.
Make sure to ensure responsiveness for Mobile

## Out of Scope

- Backend changes — `_Comment` already returns `Forward` and `ToUser`.
- `_ApprovalStep` workflow-tree comments — they don't carry these fields; they continue to render as plain comments.
- New API endpoints.
- Translation keys (`Forwarded to` and `<ToUser>` labels are inline English for this iteration).

## Design

### Data plumbing

There are **two** `_Comment` mappers that turn `bo._Comment` rows into comment objects. Both must be extended so the new fields actually reach `CommentsPanel.tsx`:

1. [app/cnma_approval_ui/src/pages/Inbox/components/panels/index.ts](../../app/cnma_approval_ui/src/pages/Inbox/components/panels/index.ts#L30) — produces a local `commentsList` used only for the tab-badge count.
2. [app/cnma_approval_ui/src/pages/Inbox/utils/normalizeTaskDetail.ts](../../app/cnma_approval_ui/src/pages/Inbox/utils/normalizeTaskDetail.ts#L75) — produces the `detail.comments` array that `CommentsPanel.tsx` actually consumes.

In both mappers, the `bo._Comment.map((c: any, idx: number) => ({...}))` returned object gains:

```ts
forward: c.Forward === true || c.forward === true,
toUser: c.ToUser || c.toUser || ''
```

Then pass `forward` and `toUser` through the merged list in [CommentsPanel.tsx:77-110](../../app/cnma_approval_ui/src/pages/Inbox/components/panels/CommentsPanel.tsx#L77).

The internal merged-shape gains two optional fields:

```ts
type MergedComment = {
  id: string;
  text: string;
  createdBy: string;
  createdAt: string;
  forward?: boolean;
  toUser?: string;
};
```

For `workflowComments` (the approval-tree half of the merge), these fields stay `undefined`. That means workflow-approval comments never show the strip — exactly what we want, since those comments don't carry forward info.

### Rendering

In the existing `merged.map` ([CommentsPanel.tsx:194-211](../../app/cnma_approval_ui/src/pages/Inbox/components/panels/CommentsPanel.tsx#L194)), the comment card changes from:

```
┌─────────────────────────────────────────────┐
│ [👤 User] author · date                     │
│ NoteText body                                │
└─────────────────────────────────────────────┘
```

to (when `forward === true`):

```
╔═ 3px warning stripe ═══════════════════════════╗
║ [↪ ArrowRight] Forwarded to <ToUser>          ║   ← NEW header line
║ [👤 User] author · date                       ║
� NoteText body                                  ║
╚═══════════════════════════════════════════════╝
```

Concrete diff:

1. Add `ArrowRight` to the lucide-react import on line 2.
2. Wrap the existing `<div>` with `cn(...)` adding `comment.forward && 'border-warning/40 bg-warning/5 pl-4'`.
3. Above the existing `<div className="flex items-center gap-2 text-xs text-muted-foreground">` row, insert (when `comment.forward`):

   ```tsx
   <div className="flex items-center gap-1.5 text-xs font-medium text-warning-foreground/90">
     <ArrowRight className="size-3.5 shrink-0 text-warning" />
     <span>
       Forwarded to{" "}
       <span className="font-semibold">
         {comment.toUser?.trim() || "(no recipient)"}
       </span>
     </span>
   </div>
   ```

4. As the last child, when `comment.forward`, render an absolutely-positioned left stripe:

   ```tsx
   <span
     aria-hidden
     className="absolute left-0 top-0 bottom-0 w-[3px] bg-warning/60 rounded-l-lg"
   />
   ```

The card already uses `relative` (or will after step 2) so the absolute stripe anchors correctly.

### Edge cases

| Condition                                           | Behavior                                                             |
| --------------------------------------------------- | -------------------------------------------------------------------- |
| `Forward === true`, `ToUser = 'NGUYENNT'`           | Strip + arrow + "Forwarded to NGUYENNT" header + NoteText body       |
| `Forward === true`, `ToUser = ''`                   | Strip + arrow + "Forwarded to (no recipient)" header + NoteText body |
| `Forward === false` or missing                      | Render exactly as today                                              |
| `forward === undefined` (workflow-approval comment) | Render exactly as today                                              |

## Verification

Per `CLAUDE.md`:

1. `npm test` — no backend changes; run to confirm no regressions.
2. `cd app/cnma_approval_ui; npx tsc --noEmit` — must pass (we touched inferred types).
3. Manual smoke:
   - Open a PR/PO with a Forward=true comment row. Confirm strip + arrow + header + body all render.
   - Open a PR/PO with only regular comments. Confirm no strip.
   - Open a task where ToUser is blank. Confirm `(no recipient)` shows.
4. Visual regression: non-forward cards byte-identical to before; forward cards add only the new header line + 3px warning stripe.

No new test files. The change is a single component rendering tweak on top of an already-tested merge path.
