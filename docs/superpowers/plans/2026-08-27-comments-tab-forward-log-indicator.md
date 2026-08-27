# Comments Tab — Forward Log Indicator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render SAP `_Comment` rows with `Forward === true` as visually distinct "Forwarded to `<ToUser>`" entries in the Inbox Comments tab. Non-forward comments render unchanged. Mobile responsiveness preserved.

**Architecture:** Extend the existing `_Comment` mapper in `panels/index.ts` to surface `forward` and `toUser`. Plumb those two optional fields through the `merged` list in `CommentsPanel.tsx`. In the comment card render, when `forward === true`, add a 3px warning left stripe, an `ArrowRight` icon, and a `Forwarded to <ToUser>` header line above the existing author/date row. The `NoteText` body stays.

**Tech Stack:** React + TypeScript, lucide-react icons, Tailwind utility classes, TanStack Query (no changes).

---

## File Map

**Modify** (no new files):
- `app/cnma_approval_ui/src/pages/Inbox/components/panels/index.ts` — extend the `_Comment` mapper (tab-badge count consumer).
- `app/cnma_approval_ui/src/pages/Inbox/utils/normalizeTaskDetail.ts` — extend the `_Comment` mapper (this is the one CommentsPanel.tsx actually consumes).
- `app/cnma_approval_ui/src/pages/Inbox/components/panels/CommentsPanel.tsx` — extend merged-shape and render the inline strip when `forward === true`.

**Why two mappers**: There are two distinct `bo._Comment.map(...)` blocks producing comment rows. `panels/index.ts` feeds the tab-badge count only; `normalizeTaskDetail.ts` feeds the `detail.comments` array that CommentsPanel consumes. Both must carry `forward` + `toUser` so the new fields actually reach the render path.

**No backend changes. No new test files.** Change is rendering-only on top of an already-tested comment pipeline.

---

## Task 1: Extend both `_Comment` mappers

**Files:**
- Modify: `app/cnma_approval_ui/src/pages/Inbox/components/panels/index.ts:30-36`
- Modify: `app/cnma_approval_ui/src/pages/Inbox/utils/normalizeTaskDetail.ts:75-81`

- [ ] **Step 1: Locate the existing mapper**

Open `app/cnma_approval_ui/src/pages/Inbox/components/panels/index.ts`. Lines 30–36 currently read:

```ts
} : bo?._Comment)
? bo._Comment.map((c: any, idx: number) => ({
    id: c.id || c.DocId || `comment-${idx}`,
    text: c.NoteText || c.noteText || c.text || '',
    createdBy: c.UserComment || c.author || c.createdBy || 'User',
    createdAt: c.PostedOn ? `${c.PostedOn} ${c.PostedTime || ''}` : c.createdAt || ''
}))
```

(Note: line 30 in the file actually starts with `?` because line 29 ends the ternary; the full block is the `bo._Comment.map((c: any, idx: number) => ({...}))` call.)

- [ ] **Step 2: Add `forward` and `toUser` to the mapped object in `panels/index.ts`**

Replace the closing `}))` of the `bo._Comment.map(...)` arrow so the returned object becomes:

```ts
{
    id: c.id || c.DocId || `comment-${idx}`,
    text: c.NoteText || c.noteText || c.text || '',
    createdBy: c.UserComment || c.author || c.createdBy || 'User',
    createdAt: c.PostedOn ? `${c.PostedOn} ${c.PostedTime || ''}` : c.createdAt || '',
    forward: c.Forward === true || c.forward === true,
    toUser: c.ToUser || c.toUser || ''
}
```

- [ ] **Step 3: Mirror the same fields into `normalizeTaskDetail.ts:75-81`**

Open `app/cnma_approval_ui/src/pages/Inbox/utils/normalizeTaskDetail.ts`. The block at lines 75-81 currently reads:

```ts
const rawComments = bo?._Comment || detail.comments || [];
const comments = Array.isArray(rawComments) ? rawComments.map((c: any, idx: number) => ({
    id: c.id || c.DocId || `comment-${idx}`,
    text: c.NoteText || c.noteText || c.text || '',
    createdBy: c.UserComment || c.author || c.createdBy || 'User',
    createdAt: c.PostedOn ? `${c.PostedOn} ${c.PostedTime || ''}` : c.createdAt || new Date().toISOString()
})) : [];
```

Replace with:

```ts
const rawComments = bo?._Comment || detail.comments || [];
const comments = Array.isArray(rawComments) ? rawComments.map((c: any, idx: number) => ({
    id: c.id || c.DocId || `comment-${idx}`,
    text: c.NoteText || c.noteText || c.text || '',
    createdBy: c.UserComment || c.author || c.createdBy || 'User',
    createdAt: c.PostedOn ? `${c.PostedOn} ${c.PostedTime || ''}` : c.createdAt || new Date().toISOString(),
    forward: c.Forward === true || c.forward === true,
    toUser: c.ToUser || c.toUser || ''
})) : [];
```

Note: a trailing comma is now required after `new Date().toISOString()` because `forward` / `toUser` are new last items.

- [ ] **Step 4: Verify TypeScript still compiles**

Run: `cd app/cnma_approval_ui; npx tsc --noEmit`
Expected: exits 0, no diagnostics about `forward` / `toUser`.

- [ ] **Step 5: Commit (single commit covering both files)**

```bash
git add app/cnma_approval_ui/src/pages/Inbox/components/panels/index.ts app/cnma_approval_ui/src/pages/Inbox/utils/normalizeTaskDetail.ts
git commit -m "feat(comments): plumb Forward and ToUser fields from _Comment mapper"
```

---

## Task 2: Extend the merged-shape in `CommentsPanel.tsx`

**Files:**
- Modify: `app/cnma_approval_ui/src/pages/Inbox/components/panels/CommentsPanel.tsx:77-110`

- [ ] **Step 1: Add optional fields to the inferred merged-comment type**

In `CommentsPanel.tsx`, the `merged` useMemo block starts at line 76 with:

```ts
const merged = useMemo(() => {
    const list: Array<{ id: string; text: string; createdBy: string; createdAt: string }> = [];
```

Replace it with:

```ts
const merged = useMemo(() => {
    const list: Array<{
        id: string;
        text: string;
        createdBy: string;
        createdAt: string;
        forward?: boolean;
        toUser?: string;
    }> = [];
```

- [ ] **Step 2: Populate `forward` and `toUser` from `detail.comments`**

In the second `for` loop (currently lines 98–107), the `list.push(...)` call looks like:

```ts
list.push({
    id: tc.id || `tc-${list.length}`,
    text: tc.text,
    createdBy: tc.createdByName || tc.createdBy || 'Unknown',
    createdAt: tc.createdAt || '',
});
```

Replace it with:

```ts
list.push({
    id: tc.id || `tc-${list.length}`,
    text: tc.text,
    createdBy: tc.createdByName || tc.createdBy || 'Unknown',
    createdAt: tc.createdAt || '',
    forward: tc.forward === true,
    toUser: tc.toUser || '',
});
```

Leave the `workflowComments` loop (lines 79–96) untouched — workflow-approval comments do not carry forward info, so they should render as plain comments.

- [ ] **Step 3: Verify TypeScript still compiles**

Run: `cd app/cnma_approval_ui; npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add app/cnma_approval_ui/src/pages/Inbox/components/panels/CommentsPanel.tsx
git commit -m "feat(comments): pipe forward/toUser through CommentsPanel merged list"
```

---

## Task 3: Render the inline strip with arrow icon

**Files:**
- Modify: `app/cnma_approval_ui/src/pages/Inbox/components/panels/CommentsPanel.tsx:2` (imports)
- Modify: `app/cnma_approval_ui/src/pages/Inbox/components/panels/CommentsPanel.tsx:195-210` (render)

- [ ] **Step 1: Add `ArrowRight` to the lucide-react import**

The import on line 2 currently reads:

```ts
import { Send, Loader2, MessageSquare, User, AtSign, X } from 'lucide-react';
```

Replace with:

```ts
import { Send, Loader2, MessageSquare, User, AtSign, X, ArrowRight } from 'lucide-react';
```

- [ ] **Step 2: Add the `cn` import if not already present**

Confirm `cn` is imported. If not, add at the top of the file alongside the other imports:

```ts
import { cn } from '@/lib/utils';
```

(It is already imported on line 10 per the current file — skip this step if so.)

- [ ] **Step 3: Update the comment card markup**

The existing `merged.map(...)` body starts at line 195 with:

```tsx
<div
    key={comment.id}
    className="rounded-lg border border-border/60 p-3 space-y-1.5 bg-muted/10 min-w-0 max-w-full overflow-hidden"
>
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <User className="size-3 shrink-0" />
        <span className="font-medium text-foreground/80 truncate">{comment.createdBy}</span>
        <span>·</span>
        <span className="shrink-0">{formatDateTime(comment.createdAt)}</span>
    </div>
    <div className="text-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-foreground min-w-0">
        {renderFormattedCommentText(comment.text)}
    </div>
</div>
```

Replace the outer `<div>` and its two children with the version below (keep `key={comment.id}` exactly as React expects):

```tsx
<div
    key={comment.id}
    className={cn(
        'relative rounded-lg border p-3 space-y-1.5 bg-muted/10 min-w-0 max-w-full overflow-hidden',
        comment.forward && 'border-warning/40 bg-warning/5 pl-4'
    )}
>
    {comment.forward && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-warning-foreground/90">
            <ArrowRight className="size-3.5 shrink-0 text-warning" />
            <span>
                Forwarded to{' '}
                <span className="font-semibold">{comment.toUser?.trim() || '(no recipient)'}</span>
            </span>
        </div>
    )}
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <User className="size-3 shrink-0" />
        <span className="font-medium text-foreground/80 truncate">{comment.createdBy}</span>
        <span>·</span>
        <span className="shrink-0">{formatDateTime(comment.createdAt)}</span>
    </div>
    <div className="text-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-foreground min-w-0">
        {renderFormattedCommentText(comment.text)}
    </div>
    {comment.forward && (
        <span
            aria-hidden
            className="absolute left-0 top-0 bottom-0 w-[3px] bg-warning/60 rounded-l-lg"
        />
    )}
</div>
```

Note: `cn` and the existing `formatDateTime` / `renderFormattedCommentText` helpers are already in scope in this file (lines 10 and 8–9).

- [ ] **Step 4: Verify TypeScript still compiles**

Run: `cd app/cnma_approval_ui; npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add app/cnma_approval_ui/src/pages/Inbox/components/panels/CommentsPanel.tsx
git commit -m "feat(comments): render inline strip + arrow for Forward entries"
```

---

## Task 4: Verify mobile responsiveness (no UI regression)

**Files:** none (verification only)

- [ ] **Step 1: Run the backend unit test suite**

Run: `npm test`
Expected: existing tests still pass (no backend change, this is a sanity check).

- [ ] **Step 2: Run the frontend TypeScript typecheck**

Run: `cd app/cnma_approval_ui; npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 3: Manual desktop smoke (Chrome + responsive view)**

Open any PR/PO task that contains at least one comment row where `Forward === true` (you'll need an SAP doc that has been forwarded at least once). Confirm:
- The forwarded comment card shows a 3px warning-colored left stripe.
- Above the author/date line, a new line appears: `Forwarded to <ToUser>` with an `ArrowRight` icon.
- The `NoteText` body still renders below the new header line.
- For non-forward comments, the card looks identical to before (no stripe, no header line).

- [ ] **Step 4: Manual mobile smoke (DevTools device emulation, e.g. iPhone 12)**

Open the same task in mobile emulation. Confirm:
- The forward strip + arrow + header line still render correctly at narrow widths.
- The arrow icon does not wrap awkwardly.
- Long `ToUser` values truncate rather than overflow.
- The `NoteText` body wraps within the card.

- [ ] **Step 5: Manual edge case — empty `ToUser`**

Find (or fabricate via test data) a comment where `Forward === true` but `ToUser` is blank or whitespace. Confirm:
- Header reads exactly `Forwarded to (no recipient)`.
- No empty `<span className="font-semibold"></span>` is left over.

- [ ] **Step 6: Commit (no code change, skip if nothing changed)**

If nothing was changed during verification: skip. If any className tweak was needed for mobile, commit it:

```bash
git add app/cnma_approval_ui/src/pages/Inbox/components/panels/CommentsPanel.tsx
git commit -m "fix(comments): tighten forward header layout on mobile"
```

---

## Done Criteria

- Comments with `Forward === true` show a 3px warning stripe + `ArrowRight` + `Forwarded to <ToUser>` header.
- `NoteText` still renders below.
- Non-forward comments render unchanged.
- Empty `ToUser` renders `(no recipient)` (not blank).
- `npx tsc --noEmit` passes.
- Mobile (≤ 640px) layout remains clean.
