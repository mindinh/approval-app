# Comments timeline and identity - 4-Eyes review

## Meta Information

- Date: 261019
- Reviewer: Leo - AI + 4-Eyes
- Branch: `fix/pwa` (working tree; no commit or deployment)
- Workflow: `.agent/workflows/cnma-review-code-4eye.md`
- Revision: follow-up fixes and re-review requested by the user; updates this report in place.
- Scope: Comments timeline/rendering, shared identity/profile, comment draft/refresh, tag selection, mobile tab refs, frontend type contracts and the application typecheck failures identified in the initial review. Other pending PWA, packaging and sidebar work is outside this review.
- Method: source/data-flow re-review, red/green identity regression tests, full unit suites, full frontend application typecheck, focused lint and browser regression fixtures. AI second-pass review; no independent human sign-off.

## Code Score

**95/100**. **0 CRITICAL; 1 open WARNING requiring deployed SAP verification.** All other findings listed below are resolved in code and covered by appropriate checks.

## Business Impact Assessment

Approval conversations are grouped by local calendar day without changing persisted comments or message order. Missing dates remain unknown. Relative labels refresh at midnight and on mobile resume. A login identifier cannot be mistaken for the propagated SAP principal, so ownership is assigned only after verification. Obsolete directory downloads/name-mapping code is removed from this flow. The tag picker retains selections, mobile tab changes reset the actual scroll container, and the frontend typecheck now checks the application rather than an empty root project. Live SAP identity availability still depends on endpoint access and the user's propagated session.

## Actionable Findings by Severity

### CRITICAL

None found in the reviewed scope.

### WARNING - Resolved: missing dates were fabricated

- Function: `normalizeDetailForView`.
- Before Flow -> Need Optimize Flow: absent timestamp -> current timestamp -> false Today group; now absent timestamp -> empty value -> localized Unknown date group.
- Resolution: preserve absent timestamps; join SAP wall date/time with ISO `T`, using midnight for a date-only record.
- Evidence: normalization and timeline tests cover missing values, invalid dates, wall times, offsets and day transitions.

### WARNING - Resolved: browser-dependent calendar grouping

- Functions: `parseCommentDay`, `buildCommentTimeline`, `isSameCommentDay`.
- Resolution: use the existing date-fns ISO parser; compare viewer-local calendar components, without truncating UTC strings or reordering comments. Invalid dates are explicit unknown groups.
- Evidence: same-day, midnight, offset, unknown-date and empty-list regressions; desktop/mobile rendering and Vietnamese localization.

### WARNING - Resolved: IAS login identifiers could establish SAP ownership

- Functions: `resolveSapUsername`, `isCurrentCommentAuthor`, `useUserIdentity`.
- Before Flow -> Need Optimize Flow: non-email IAS login -> assumed SAP ID -> skip lookup; now explicit verified SAP identity -> reuse, otherwise propagated SAP lookup -> compare persisted author.
- Resolution: only `sapUsername` or the server's explicitly configured local `commentAuthorId` establishes identity. General `sapUser`, login `id`, email and names are excluded. Normalize the resolved writer consistently before exposing it to Comments/Profile; reject malformed, email and mock identities.
- Evidence: new tests reproduced incorrect ownership before the fix and pass afterward. Browser regression uses a non-email IAS username equal to another comment author's SAP ID and verifies that only the propagated principal owns messages.

### WARNING - Resolved: full frontend application typecheck failed

- Functions/types: `TaskDetail`, `InboxTask`, `Decision`, `BusinessContext`, `normalizeDetailForView`, `normalizeDateRange`, `resolveObjectView`, `extractTaskEntityRecord`, `buildDefaultBusinessModel`, `TaskCard`, `TaskDetailTabContent`, `TaskDetailView`, `ReferencePrDetailView`, `DetailsPanel`, `ForwardTaskDialog`.
- Before Flow -> Need Optimize Flow: root `tsc --noEmit` checks an empty files list -> false assurance; now `npm run typecheck` checks `tsconfig.app.json` directly -> full application diagnostics.
- Resolution: reconcile the raw-detail/legacy summary contract with current consumers, remove the duplicate property, preserve legacy SAP task-definition casing, import actual exported types, correct type-only imports/date-range shape, guard nullable detail rendering, retain requester metadata in the normalized task, guard optional legacy object spreads, normalize workflow errors and remove ignored upload props. No TypeScript rules were relaxed and no suppressions were added.
- Evidence: all **74 original application diagnostics are cleared**. Both explicit application typecheck and the originally required default command pass.

### WARNING - Resolved: mobile tab gestures received a callback instead of a DOM ref

- Functions: `usePullToRefresh`, `TaskDetailView`, `useMobileTabGestures`.
- Before Flow -> Need Optimize Flow: attachment callback -> gesture hook reads nonexistent `.current` -> scroll reset skipped; now attachment callback and stable DOM ref are exposed separately -> gesture hook reads the actual scroll container.
- Evidence: browser fixture mounts the actual mobile TaskDetailView, scrolls Overview, switches to another tab with scrollable content and verifies that the same DOM container resets to zero without runtime errors.

### WARNING - Resolved: tag dialog used undeclared submission state and reset selection

- Function: `TagUserDialog`.
- Resolution: remove the nonexistent `isSubmitting` references from this synchronous picker; keep its apply guard based on selection. Avoid constructing a new default `initialSelected` array on every render and include the stable search setter in effect dependencies.
- Before Flow -> Need Optimize Flow: selection update -> new default array -> initialization effect clears selection; now absent initial selection stays undefined -> selection persists until apply/close.
- Evidence: browser test reproduced the disabled apply action after selection, then passes selection, enabled apply, successful close and zero page errors after the fix.

### LOW - Resolved: Today label stayed stale across midnight/backgrounding

- Functions: `useCommentToday`, `CommentsPanel.formatDayLabel`.
- Resolution: schedule the next local midnight using calendar hours, refresh on focus/visible events, and clean up the timer/listeners on unmount. Historical groups are not rebuilt just to refresh the label.
- Evidence: fake-clock browser scenarios cross midnight and resume after advancing wall time without running timers; Today changes to the correct historical date in both cases.

### LOW - Resolved: obsolete directory display helpers

- Functions: removed `resolveCommentAuthor`, `needsCommentDirectory`, `resolveCommentAuthorId`; simplified `resolveSapUsername`.
- Resolution: remove unused name/email-directory mapping and replace its obsolete tests with verified-principal regressions. Mentions/user pickers retain their directory search functionality.
- Evidence: source search confirms no obsolete helper references; unit suites and browser scenarios pass with no directory reads for Comments/Profile.

### WARNING - Open: deployed SAP identity endpoint requires verification

- Functions: `SapOdataAdapter.getCurrentSapUser`, `InboxProcessor.getCurrentSapUser`, `InboxController.getCurrentSapUser`, `useUserIdentity`.
- Impact: if `/sap/bc/ui2/start_up` is inaccessible through Cloud Connector or returns an unexpected contract, Profile can show Not identified and ownership stays unresolved. The frontend does not guess a replacement identity.
- Guards reviewed: the caller's JWT is propagated, malformed IDs are rejected, response is private/no-store, the frontend shares the account-scoped result and exposes retry.
- Before Flow -> Need Optimize Flow: propagated session -> endpoint availability unverified -> optional identity; acceptance requires propagated session -> reachable endpoint -> returned SAP ID matches the persisted comment author.
- Required validation: open the deployed endpoint through the affected user's session, confirm the returned SAP username and compare it to an already persisted comment by that user. Verify unavailable-endpoint/retry behavior on the deployment.
- Status: **external validation pending, not a confirmed code fix**. No authenticated deployed user session is available in this workspace. Local mocks cannot close this finding; no credentials, identity-provider settings or Cloud Connector rules were changed.

## Principles Summary

| Principle | Result | Evidence |
| --- | --- | --- |
| SOLID | Pass | Pure timeline helper, dedicated relative-day hook, verified identity boundary, separate callback/ref responsibilities. |
| DRY | Pass | Shared FieldSeparator, formatter, identity resolver, locales and chat styles. |
| YAGNI | Pass | Removed obsolete directory/name mapping; no new timeline API, cache or dependency. |
| KISS | Pass | Linear grouping preserves order; one midnight timer with cleanup; synchronous tag picker. |
| 4-Eyes | Pass with deployment follow-up | Findings fixed and regression checked; one live SAP acceptance condition remains explicit. |

## Verification Evidence

- Pre-commit lint audit: root `npm.cmd run lint` fails because ESLint 9 has no root flat config. Frontend `npm.cmd run lint` reports 227 errors / 51 warnings, including ignored browser-test artifacts scanned by its broad command. A separate lintText comparison over changed frontend TypeScript files finds 85 errors in their original HEAD versions and 84 in the final worktree; this is not lint-clean evidence, and individual diagnostics still require follow-up. The commits preserve this limitation rather than disabling rules or claiming repository lint passes.

- Backend: `npm.cmd test` - 14 files / **220 tests passed**.
- Frontend: `npm.cmd test` - 27 files / **288 tests passed**. The count changed because obsolete directory/name-resolution tests were replaced with current identity regressions.
- Full frontend application: `npm.cmd run typecheck` (`tsc --noEmit -p tsconfig.app.json`) - **passed, 0 errors**.
- Originally required `npx.cmd tsc --noEmit` - passed.
- Focused ESLint: changed identity/date helpers/hooks, CommentsPanel and related unit/browser fixtures - passed without errors or warnings. This is not a claim that repository-wide lint debt has been cleared.
- `tests/e2e/userIdentity.browser.mjs`: **7 scenarios passed** - known SAP ID, propagated ID, non-email IAS login collision, failed lookup/retry, mobile, midnight and resumed tab. Checks retain right alignment, shared profile identity, SAP 72, no directory requests, localized day dividers and no horizontal overflow.
- `tests/e2e/reviewFixes.browser.mjs`: tag selection/apply and actual mobile task-detail tab scroll reset passed without runtime errors.
- Browser fixtures use Chromium device emulation; physical iOS Safari and deployed SAP identity are not verified.
- `git diff --check` - passed, with line-ending conversion notices only.
- No production build, MTAR rebuild, deployment, commit or live SAP write performed.

## Follow-up: rounded desktop tabs and transparent desktop branding

- Selected-tab border correction: restore a subtle rounded top/side border, retain the primary underline and move keyboard focus inside the trigger to prevent overflow clipping. Browser checks pass on both detail screens for visible top borders, suppressed native outline and inset focus with zero outer offset. Mobile styles are unchanged.

- Header placement correction: desktop tab lists now belong inside the header, rather than sitting beside it with matching backgrounds. TaskDetailHeader accepts a children slot; the reference header contains its navigation within the Tabs context. Browser regression verifies actual header containment, keyboard navigation and preserved mobile pills. Typecheck and 220 backend tests pass.

- Header integration follow-up: desktop task/reference-PR navigation shares the header background, with no intervening border/gap or separate frame. Mobile pill styles remain intact. Browser assertions pass for matching surfaces, absent header/top borders, contiguous layout, compact triggers and mobile pill corners; backend 220 tests and full frontend typecheck pass.

- Scope: TaskDetailView and ReferencePrDetailView desktop tab triggers, shared `task-detail-tabs.css`, favicon/general-purpose PWA icons and their generation/validation scripts.
- Review: no new CRITICAL/WARNING findings in this follow-up. Existing pending live SAP verification is unchanged.
- Both detail screens reuse theme-token styles: top corners rounded only, an active underline, zero tab-list/vertical trigger padding, a primary translucent selected surface, neutral hover, visible rounded keyboard focus and library Badge counters. The original library tab semantics/keyboard navigation remain intact; narrow layouts scroll the row within its own width. Mobile navigation is preserved.
- Transparent v4 favicon/`purpose: any` assets remove the white canvas for desktop branding while preserving white SAP lettering. Boundary-connected white removal avoids deleting lettering; source art remains unchanged. Apple/maskable icons keep their opaque canvas. Obsolete general-purpose v3 outputs were removed; public router allowlists already match the new names.
- Browser `tests/e2e/tabsBranding.browser.mjs`: task-detail and reference PR pass top-only rounded-corner, selected-background, active-underline, zero-padding, compact-height, keyboard activation, 640px overflow, manifest-purpose and favicon-alpha/lettering checks. Screenshots inspected; native installed desktop title bars and physical mobile installation remain outside emulation coverage.
- Asset validation: `scripts/test-pwa-icons.ps1` passes all six images and all five entry-point reference checks. No additional build/deploy performed.

- Public cleanup follow-up: removed six unreferenced legacy assets (Apple/PWA icons, favicon SVG and SLA SVGs), removed obsolete explicit route alternatives, and relocated generation source to `scripts/sap-logo.png`. Current install artwork, Work Zone Component/metadata/i18n and recovery assets are preserved. Icon/reference validation and compact-tab browser checks pass after cleanup.
