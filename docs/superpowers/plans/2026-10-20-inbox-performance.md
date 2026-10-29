# My Tasks and Approved Tasks Performance Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Track evidence below.

**Goal:** Reduce redundant work and time to useful content without changing task access, decisions, filters, or global count semantics.

**Architecture:** Keep the existing four paginated category queries and raw OData renderer. Reuse unfiltered list totals for current-scope counts; retain opposite-scope counts and global search counts. Refresh active queries once, preserve fresh cached lists, and fetch independent detail branches concurrently after the authorized worklist lookup.

**Tech Stack:** React, TanStack Query v5, Axios, Express/CAP BFF, SAP OData, Vitest.

**Spec:** User-approved audit in the conversation, 2026-10-20. Priorities: redundant refresh, progressive list display, parallel detail, count reuse, bounded initial payload, short cache freshness and cancellation.

## Constraints and decisions

- Work in the current checkout on `fix/pwa`; preserve pre-existing auth/login edits. No dependency install, commit, push, or deployment is needed.
- Initial category page size: 25; list freshness: 30 seconds. Decisions and manual refresh still invalidate immediately.
- Do not substitute unverified SAP aggregates, remove access checks, trust client document context, or change detail/decision contracts.
- Keep full detail expands and legacy worklist fallback in this iteration. Validate those separately with live SAP timings before changing compatibility behavior.
- Current-scope counts come from unfiltered first-page totals, including empty pages. Search uses global count cache/API, never matching-result totals.
- No cross-scope placeholder content. Inactive query caches become stale on refresh but do not fetch until used.

## Task 1: Refresh and query policy

- [x] Add real QueryObserver regression tests: one fetch per active list/count/detail; inactive caches invalidated without network calls; padded detail aliases and unrelated details handled correctly.
- [x] Observe failures, then remove explicit duplicate refetches. Return a promise for refresh completion and await it in the page refresh handler.
- [x] Remove broad refresh on scope change; preserve selection reset.
- [x] Set list freshness to 30 seconds; category page size to 25; forward AbortSignal through list, counts, and detail reads. Keep previous data only within the same scope.
- [x] Verify frontend focused tests, including fresh remount and search cancellation.

## Task 2: Counts and progressive rendering

- [x] Add regression tests for partial category completion, first empty result, query failure, global counts during search, scope isolation, and list totals exceeding loaded rows.
- [x] Reuse current-scope first-page totals without fetching redundant category counts; enable global fallback counts during search or list errors. Seed global counts cache only from complete, genuine unfiltered results.
- [x] Keep the full skeleton only until a category succeeds; display loading/error/retry within each category thereafter.
- [x] Preserve SAP totalCount on empty task pages for both scopes.
- [x] Verify frontend focused tests and backend processor tests.

## Task 3: Parallel task detail

- [x] Add deferred-promise tests proving runtime starts before business object finishes, errors preserve fallback behavior, and completed/Claim tasks skip runtime.
- [x] Observe failure, then run business detail and optional runtime concurrently after worklist resolution. Keep runtime errors nonfatal and business-object errors fatal.
- [x] Verify resolver tests and the full backend suite.

## Task 4: Verification and review

- [x] Run backend `npm.cmd test` and frontend `npm.cmd test`.
- [x] Run frontend `npx.cmd tsc --noEmit` and `npm.cmd run typecheck` (the latter checks the application project explicitly).
- [x] Run frontend production build (`npm.cmd run build:mta`) and scoped whitespace/diff checks.
- [x] Request one independent review of the scoped working-tree changes; fix significant findings with regression tests.
- [x] Record results and remaining live verification below.

## Review focus

- Opposite-scope totals and unfiltered counts must survive searches and rapid scope changes.
- Partial responses must not claim an empty category or erase loaded cards on an unrelated failure.
- Disabled current-scope count queries must refresh through lists and seed cache without effect loops.
- Smaller pages must advance by actual rows fetched and keep infinite-scroll and select-all behavior.
- Cancellation must not hide genuine errors; runtime failures must not break detail fallback or produce unhandled rejections.

## Execution record

- Baseline audit: backend 273 tests passed; frontend `tsc --noEmit` passed. Existing auth/login changes identified before edits.
- Live timing boundary: request counts are source-derived; no production latency claim or deployment validation.
- Task 1: RED manual-refresh test reproduced missing completion promise; GREEN now verifies exactly one active fetch, normalized aliases, and no inactive network calls. QueryObserver tests cover freshness, scope placeholders, pagination offsets, and abandoned-search cancellation; Axios signal forwarding also verified.
- Tasks 2/3: RED tests reproduced global loading gate, missing current-scope totals, lost empty-page totals, and sequential runtime. GREEN tests cover progressive loading, search/global counts, errors/retry UI, both scopes, concurrent detail, fallback, and simultaneous branch failures.
- Cache review follow-up: synchronization preserves the oldest category source timestamp, skips equal/older writes, and reseeds after a newer snapshot even if totals are unchanged. Four real QueryClient tests verify these conditions and scope separation.
- Final verification: backend 19 files / 283 tests passed; frontend 34 files / 318 tests passed; frontend `npx.cmd tsc --noEmit` and explicit application `npm.cmd run typecheck` passed; `npm.cmd run build:mta` passed; scoped `git diff --check` passed.
- Lint: scoped run reports 14 errors and 3 warnings. The 6 InboxPage errors and 8 inboxQueries errors were reproduced against HEAD; warnings are pre-existing unused values and a TaskList dependency warning. No new lint diagnostics remain in the changed code. Build reports an unresolved 72Mono font reference and a chunk-size warning; these remain outside this change.
- Independent review found no confirmed functional bugs. Added component loading/error/retry tests and simultaneous-rejection coverage after review. Remaining coverage limits: no mounted React effect/browser interaction test (browser inventory has no surfaces), and no end-to-end Select All across multiple pages. Pagination termination is covered at QueryObserver level.
- Ruling: execute in the authorized current checkout without creating another worktree, committing, pushing, or deploying; preserve all unrelated pre-existing auth/login edits. This keeps the requested changes immediately reviewable in the user's workspace.
- Ruling: defer new SAP aggregate contracts, lazy detail tabs, and legacy lookup fallback removal until live SAP compatibility/timing evidence is available. This iteration retains existing data and decision contracts.
- Expected source-derived normal cold-load change (no search/errors, excluding detail and mobile status badge): 6 -> 5 BFF requests, 12 -> 8 SAP requests, maximum initial task records 200 -> 100. Cache hits reduce requests further; search/error fallback can require the original counts calls.

## Follow-up: idle pagination and mass selection

- User reported categories with 1000+ tasks fetching while idle and interrupting selection/category navigation. Source inspection found the pagination observer reattaching on render/fetch changes, plus a Select All effect depending on a fresh selection wrapper and repeatedly emitting equivalent Sets.
- Replaced observer-driven pagination with a stable scroll binding: downward wheel/touch/keyboard/scrollbar input followed by movement near the bottom can request one page. Layout/programmatic scrolling alone does not request a page. Added a manual Load more tasks button for short lists and recovery. Pause automatic pagination during mass selection.
- Keep explicit Select All across all remaining pages. Remove its duplicate initial fetch and suppress equivalent selection updates, including a regression with 1000 selected IDs.
- Independent review identified persistent pagination errors restarting Select All indefinitely. Stop automatic selection paging on a category error, retain loaded actionable selections, and use existing category retry/manual load controls for recovery. Focused re-review found no remaining important findings.
- Verification: backend 19 files / 283 tests passed; frontend 37 files / 326 tests passed; explicit application typecheck passed. Scroll tests cover idle/layout changes, one request per input, cleanup, upward scrolling, touch, keyboard, distance from bottom, and control-click disarming. Selection paging tests cover in-flight requests, completion and retained hasNextPage after errors.
- Limits: no live browser interaction/timing evidence, mounted React Select All test, or physical-device gesture validation. Large explicit Select All still loads all pages by design; no claim of eliminating its total network/render cost. Changes remain in the working tree without commit or deployment.

## Follow-up 2026-10-21: cancel explicit Select All

- Preserve Select All across every remaining page. Added a regression covering 1,001 actionable tasks in 25-record pages.
- Cancelling an active Select All now clears its immediate guard, clears selection, and aborts matching next-page queries through QueryClient/Axios. Exiting selection mode or changing an individual selection also stops the run. Cleanup cancels the previous context's pagination on unmount or scope/search changes.
- QueryClient/InfiniteQueryObserver regression tests for both scopes first failed with an unaborted signal, then passed: cancellation retains loaded pages and hasNextPage, while leaving initial loads and other scopes untouched.
- Independent focused review found no important regressions. Browser interaction remains unverified; a browser abort does not prove SAP execution was cancelled downstream.
- Added source-verified API report at `docs/technical/02-implementation/07-inbox-api-flow.md`.
- Current-checkout validation: backend 16 files / 244 tests; frontend 37 files / 318 tests; application typecheck and production build passed. These counts reflect the current checkout, whose unrelated work changed since the previous execution record. Existing build font/chunk warnings remain.
