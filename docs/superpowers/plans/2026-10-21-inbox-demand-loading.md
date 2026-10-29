# Inbox demand loading

User authorized implementation of the best reviewed approach, including category switching and mobile, on 2026-10-21.

## Design

Load category totals independently of task records. Use the existing SAP CNMA_TASKBYDOCTYPE aggregate (Status, DocCategory, RequestCount) for each scope, falling back to existing category count reads when unavailable or invalid. Never derive absent categories from a global top-25 task page. Load a category's first 25 tasks only when expanded; retain separate scope/category/search cache keys and pagination. Search loads all categories to preserve cross-category results. Explicit Select All can fetch unopened categories and every page; cancelling or changing context stops it. Mobile category navigation uses the same demand loading and counts.

## Tasks

1. Add strict aggregate count adapter/processor path with tests for both scopes, empty results, grouping and fallback. Keep existing endpoint contract.
2. Gate first-page queries by requested categories, preserve global totals, pagination and Select All. Test query disabling, unopened categories, cache isolation and cancellation.
3. Connect expanded categories and mobile selection to demand loading. Stop selection on category/filter/scope changes; restrict scroll pagination to visible categories. Check mobile back/detail lifecycle.
4. Run backend/frontend suites, application typecheck/build and diff check; update API flow documentation and request independent review.

## Review focus

- One category having 1000+ records cannot hide another category's count.
- Empty or unsupported aggregates must not fabricate zero totals.
- Switching category while requests run cannot mix task data or continue Select All.
- Mobile landing/back/detail must not eagerly fetch four category lists.
- Select All must still cover all matching records, including unopened categories, and stop after errors/cancellation.

## Execution decisions

- Continue in authorized dirty checkout; preserve unrelated work; no commit/deployment.
- Execute inline using writing-plans, executing-plans, TDD and repository React/backend guidance. User's explicit instruction to implement is authorization to proceed without another approval round.

## Verification record

- Backend tests: 16 files / 253 passed. Backend TypeScript check passed.
- Frontend tests: 37 files / 327 passed. Explicit application typecheck and frontend tsc --noEmit passed.
- Backend started successfully with npm.cmd start on localhost:4005 using local mocked auth after server edits.
- Independent review identified stale summary totals blocking the next page, plus idle header spinners. Both were reproduced with failing tests and fixed; the newer unfiltered list total is reconciled into current counts. Initial missing-summary empty-state flash was likewise reproduced and fixed.
- Wheel/touch gestures carrying into a changed category were reproduced by failing tests, then fixed with gesture context checks. Explicit Select All first pages in unopened categories are verified cancellable for both scopes.
- No browser surfaces were available, so mobile/desktop mounted interaction and physical-device gestures remain unverified. SAP aggregate response semantics and real latency need deployed validation. No commit/push/deployment performed; unrelated working-tree edits preserved.
- Production build passed (both main UI and startup recovery bundles); existing unresolved 72Mono font and large-chunk warnings remain. git diff --check passed.
- Final focused lint passed with zero diagnostics after using stable selection callbacks in dependency arrays. Full frontend suite and application typecheck rerun after callback cleanup.
