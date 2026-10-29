# My Tasks and Approved Tasks API flow

Source reviewed on 2026-10-21. Request counts below are cold-load estimates without search, errors or retries, not measured runtime latency.

Base BFF URL: `/api/cnma/APPROVAL_SRV/tasks`.

## Page entry

- Both pages concurrently request `GET <base>/category-counts?scope=my` and `GET <base>/category-counts?scope=approved`. Each returns `{ PR, PO, RESERVATION, CLAIM, ALL, complete }` independently of task ordering.
- Each count request reads SAP `CNMA_TASKBYDOCTYPE`, filtered by `Status eq 'IN PROCESSING'` or `Status eq 'COMPLETED'`. BFF sums RequestCount by DocCategory: BUS2105=PR, BUS2012=PO, BUS2093/ZBUS2093=RESERVATION, CLAIM=CLAIM. Existing propagated credentials/user context are retained; no shared user cache was introduced.
- Unsupported, failed, malformed or server-paginated aggregate responses fall back to four parallel `CNMA_WFTASK` count reads for that scope. Failed fallback counts remain null, not confirmed zero.
- With all categories initially closed: **2 BFF requests / 2 SAP aggregate requests / 0 task records**. Empty summaries require no task-list reads. Count cache freshness is 60 seconds. If both aggregates fail, fallback adds eight SAP reads after the two aggregate attempts. Identity, mobile status badges, task detail and optional tabs are additional calls.

## Category lists

| Scope | First-page request | SAP status |
| --- | --- | --- |
| My Tasks | `GET <base>?category=PR&top=25&skip=0` | IN PROCESSING |
| Approved Tasks | `GET <base>/approved?category=PR&top=25&skip=0` | COMPLETED |

- Substitute PO, RESERVATION or CLAIM as needed. Each request reads one CNMA_WFTASK page with category/status filters, count=true and descending task creation time. Cards do not fetch full business detail.
- Only expanded categories load; mobile category toggling keeps one accordion open. Opening one adds one BFF/SAP read and at most 25 records. Intentionally opening all four adds four reads. Lists remain fresh for 30 seconds.
- Scope/category/search use separate query keys. Pagination offsets advance by actual returned rows. A global top-25 page is never split to infer category availability, so 1001 PR tasks cannot hide another category's tasks.
- Newer unfiltered list totals override older summary totals in the current view. A cached count of 25 cannot block a list reporting total=26; a newer summary takes precedence over an older list snapshot.
- Normal pagination requires deliberate downward movement near the bottom or Load more tasks. Idle/layout changes do not load pages. Wheel/touch input from the previous category cannot trigger pagination in the next category.
- Closing a category disables its query and cancels ordinary in-flight reads, retaining cache. Category controls stop Select All and cancel pagination. Scope/search/unmount cleanup cancels previous pagination. Browser cancellation does not guarantee an SAP operation already accepted by BFF stops executing.

## Select All

- Explicit Select All selects all actionable tasks matching the current filters, including unopened categories and all remaining pages. It is not limited to loaded records. normalTask=false tasks remain excluded.
- It explicitly fetches unopened first pages with pagination metadata, making those cancellable together with later pages. Normal scroll pagination pauses during selection; rounds wait for outstanding requests. Errors stop automatic paging and retain loaded selections; retry is explicit.
- Toggling Select All off, exiting selection, individual selection changes, category controls, filter context changes and navigation stop the run. Toggling Select All off clears selection immediately; loaded pages remain cached.
- Large explicit selection intentionally still transfers all matching records and can retain substantial network/render cost.

## Search, refresh, mobile and detail

- Search is debounced 350 ms and enables all four category queries so unopened groups contribute results. It resets offsets. Badges retain global totals; local filters apply to loaded records and subsequently loaded pages.
- Refresh and decisions invalidate list/count/status caches. Enabled lists refetch immediately; closed lists wait until reopened. An enabled infinite query with several cached pages can refetch those sequentially.
- Both layouts share demand loading and cancellation. Mobile detail disables ordinary category queries while preserving cache; reopening a fresh cached category reuses it. Mobile pull-to-refresh uses shared invalidation. Bottom-bar status counts are an additional cached API call.
- Opening detail adds `GET <base>/<instanceId>`. BFF resolves CNMA_WFTASK with legacy fallback, then loads business detail and optional runtime concurrently. Completed tasks skip runtime; CLAIM preserves its existing decision flow. Workflow/reference/attachment APIs are additional and vary by object type.

## Validation boundary

Tests cover aggregate grouping/fallback, malformed/truncated/empty aggregate responses, 1001 PR versus 4 PO totals, disabled unopened queries, initial loading, count/list freshness, QueryClient cancellation including unopened Select All first pages, full selection over 1001 tasks, and wheel/touch category switching. Server-rendered hook tests do not exercise mounted effects. No browser surfaces were available: desktop/mobile mounted interaction, physical-device gestures, deployed SAP aggregate semantics and response timings remain unverified. Local backend startup with mocked authentication succeeded after server changes; this is not live SAP validation.

### Follow-up: selected category can be collapsed

The selected-task reveal effect previously reopened its category whenever the task array changed, overriding manual collapse and collapse-all. It now reveals once per selected task, using a separate ref from delayed card scrolling; selecting another task reveals its category again. Four hook lifecycle regression cases cover desktop/mobile manual collapse, collapse-all and selecting a different task. These use a DOM-free hook lifecycle harness, not a mounted browser.
