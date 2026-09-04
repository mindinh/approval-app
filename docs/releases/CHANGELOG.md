# Changelog

All notable changes to the **CNMA Approval** project will be documented in this file.

## [Unreleased]

## [1.0.16] - 2026-09-04

### Added
*   **Mobile Bottom Navigation Architecture (`MobileNavContext`, `MobileBottomBar`, `MobileTopBar`)**:
    *   Replaced the mobile drawer sidebar with a thumb-friendly 4-tab **`MobileBottomBar`** (`Home`, `My Tasks` with live badge counter, `Approved`, `Dashboard`) featuring Framer Motion spring transition indicators.
    *   Introduced [`MobileNavContext`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/contexts/MobileNavContext.tsx) with pure `matchPath` route resolution (`isTaskDetailPath`, `resolveNavTab`) managing mutual exclusivity (bottom bar automatically hides during task detail inspection or mass selection mode).
    *   Created [`MobileTopBar`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/components/layouts/MobileTopBar.tsx) supporting embedded mode (in `HomePage` gradient banner) and standalone mode (in `DashboardPage` and `InboxPage` list view) with user initials avatar, user ID, and one-tap logout.
    *   Defined standardized layout CSS variables in `theme.css`: `--mobile-bottom-nav-height` and `--mobile-bottom-nav-clearance` to dynamically adapt container bottom padding without magic numbers.
*   **SAP S/4HANA Claim Composite Key Support (`claim.ts`, `decision-strategy.ts`, `sap-odata-adapter.ts`)**:
    *   Implemented full 3-part composite key integration for `CNMA_CLAIMHEADER`: `(DocCategory='CLAIM', DocumentNumber='<id>', ApproverNumber='<step>')`.
    *   Updated `ClaimDetail` to support composite keys across GET detail queries, entity-bound actions (`approve`, `reject`), and timeline comment notes.
    *   Extended `ClaimDecisionStrategy` to extract and propagate `approverNumber` for dual-action execution (stage decision + audit comment).
*   **4-Eyes Code Review Report 260904 (`docs/code-review/Code-Review-260904.md`)**:
    *   Generated a comprehensive 4-Eyes audit report scoring 100/100 across SOLID, DRY, YAGNI, and KISS principles with all follow-up action items fully resolved.

### Refactored & Changed
*   **Deterministic Worklist Resolution (`ObjectTypeResolver.ts`)**:
    *   Eliminated speculative URL query parameter guessing (`hints`: `typeid`, `instid`, `businessObjectType`, `documentId`).
    *   Implemented deterministic 2-step lookup: queries active worklist (`CNMA_WFTASK`) with multi-format internal task ID normalization (`cleanId`, `padded10`, `padded12`), then dispatches directly to the target document header.
*   **Tactile Card & Action Affordances (`TaskCard.tsx`, `TaskActionPanel.tsx`)**:
    *   Added subtle spring scaling (`active:scale-[0.98]`) on task cards and (`active:scale-[0.97]`) on action buttons for responsive touch feedback.
    *   Added chevron drill-down indicators on task card footers and rounded left priority stripes (`before:rounded-r-full`).

---

## [1.0.15] - 2026-09-03

### Added
*   **Mass Approve & Reject Engine (`POST /tasks/mass-decision`)**:
    *   Added dedicated backend BFF endpoint [`POST /tasks/mass-decision`](file:///d:/learning/test/cnma_approval/srv/lib/processors/inbox-processor.ts#L271-L325) supporting bulk decisions with bounded concurrency (pool limit = 4) via `Promise.allSettled`.
    *   Introduced `MassDecisionDialog` component with non-blocking UX: modal dismisses immediately upon confirmation while task processing continues in the background.
    *   Implemented Sonner toast orchestration: single aggregated summary toast for successful tasks (e.g. `18/18 tasks approved successfully`) plus individual error toasts for each failed document ID.
*   **Mass Selection Excluded Tasks Breakdown (`MassSelectionView.tsx`)**:
    *   Added a secondary summary table displaying review-only / CC tasks excluded from mass decision actions, including task titles, requestor, document numbers, and `CC / Tagged` indicator badges.
*   **4-Eyes Code Review Report (`docs/code-review/Code-Review-260903.md`)**:
    *   Generated a comprehensive 4-Eyes audit report scoring 98/100 across SOLID, DRY, YAGNI, and KISS principles.

### Refactored & Changed
*   **Carbon Copy (CC) Task Full-Stack Protection (`inbox-processor.ts`, `TaskList.tsx`, `InboxPage.tsx`)**:
    *   **Backend Guard**: `executeDecision` checks `getInstanceNormalTask(instanceId)` and throws `403 Forbidden` if `normalTask === false` (`Decisions (Approve/Reject) are not allowed for tagged/CC tasks`).
    *   **Task List Selection**: Replaced selection checkboxes with disabled dashed placeholders and tooltips for `normalTask === false` tasks.
    *   **Select-All & Infinite-Scroll**: `handleToggleSelectAll` and automatic page loading strictly filter for `task.normalTask !== false`, skipping CC tasks.
    *   **Mass Action Trigger**: Blocks modal trigger and alerts user if all selected items are review-only CC tasks.
*   **Comments Pipeline Single-Source-of-Truth (`CommentsPanel.tsx`, `TaskDetailView.tsx`, `panels/index.ts`)**:
    *   Eliminated deprecated `workflowData.comments` parsing and heuristic `${text}|${author}` deduplication.
    *   Unified comments rendering and tab header count badges to read directly from `detail.comments`.
*   **Sonner Toast Styling & UX Refinement (`App.tsx`, `theme.css`)**:
    *   Set `gap={8}`, `expand={true}`, `richColors`, and inline `border: none` on `<Toaster />`.
    *   Removed left border accent stroke and hid close buttons on non-front stacked toasts.

---

## [1.0.14] - 2026-08-27

### Added
*   **Comments Forward Log Indicator (`CommentsPanel.tsx` & `normalizeTaskDetail.ts`)**:
    *   Plumbed `ForwardedBy`, `ForwardedTo`, and `ToUser` fields through `_Comment` OData mapper into task comment detail payloads.
    *   Rendered inline visual indicator strip with directional arrow (`User A -> User B`) in [`CommentsPanel.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/panels/CommentsPanel.tsx) for Forward audit entries merged into the comment log.
*   **Backend Decision Strategy Pattern (`srv/lib/processors/decision-strategy.ts`)**:
    *   Introduced `DecisionStrategy` pattern encapsulating validation, authorization rules, and execution for task decisions (Approve, Reject, Forward, Mass Actions).
    *   Integrated request validation via [`request-validator.ts`](file:///d:/learning/test/cnma_approval/srv/lib/utils/request-validator.ts) to enforce payload parameter contracts before executing OData actions.

### Refactored & Changed
*   **Carbon Copy (CC) Task Action Restrictions (`TaskActionPanel.tsx`, `MassActionBar.tsx`, `predicates.ts`)**:
    *   Updated `isCcTask` / `canForward` predicate checks in [`predicates.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/utils/predicates.ts).
    *   Disabled and hid the Forward action button for CC tasks (`TaskType == 'CC'`) in [`TaskActionPanel.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/TaskActionPanel.tsx), [`MassActionBar.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/MassActionBar.tsx), and [`MassSelectionView.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/MassSelectionView.tsx).
    *   Enforced CC task forward action prohibition in backend `DecisionStrategy`.
*   **Reference PR Drawer Cleanup**:
    *   Purged legacy embedded iframe drawer [`ReferencePrDetailView.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/ReferencePrDetailView.tsx), [`useReferencePr.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/hooks/useReferencePr.ts), and backend module [`reference-pr.ts`](file:///d:/learning/test/cnma_approval/srv/lib/integrations/reference-pr.ts).
    *   Consolidated detail fetching into generic detail integration strategy ([`detail.ts`](file:///d:/learning/test/cnma_approval/srv/lib/integrations/detail.ts)) and direct Fiori Launchpad deep linking.
*   **Mobile Sonner Toast & Modal UI Enhancements (`theme.css`)**:
    *   Fixed Sonner toast width, margin, close button placement, and swipe actions on small screens in [`theme.css`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/styles/theme.css).

---

## [1.0.13] - 2026-08-25

### Added
*   **Workflow Approval Panel Rejection Visual Highlights (`WorkflowApprovalPanel.tsx`)**:
    *   Enhanced rejection step rendering with red/destructive badges (`Rejected`), red timeline icons (X-circle icon with pulse effect), red status text (`Rejected`), "Rejected Date:" labels, and red comment highlight containers (`bg-destructive/10 border-destructive/25 text-destructive`).
*   **Approval Status Predicate Suite (`predicates.ts` & `predicates.test.ts`)**:
    *   Added `isRejectedApprovalStatus` and `isApprovedApprovalStatus` predicate helper functions in [`predicates.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/utils/predicates.ts) with full Vitest test suite coverage in [`predicates.test.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/tests/pages/Inbox/utils/predicates.test.ts).
*   **Modularized Claim Field Definitions (`claim.fields.ts`)**:
    *   Extracted declarative claim overview fields (`CLAIM_OVERVIEW_FIELDS`) and line item table columns (`CLAIM_TABLE_COLUMNS`) into [`claim.fields.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/renderers/objects/claim/claim.fields.ts) for clean architecture compliance.
*   **4-Eyes Code Review Audit Report (`Code-Review-260825.md`)**:
    *   Added [`Code-Review-260825.md`](file:///d:/learning/test/cnma_approval/docs/code-review/Code-Review-260825.md) evaluating code quality, SOLID, DRY, YAGNI, KISS, and 4-Eyes principle compliance.

### Refactored & Changed
*   **TaskCard Header Title Optimization (`TaskCard.tsx`)**:
    *   Cleaned header title display to render pure document numbers (e.g. `4500000001` or `1000000234`) instead of prefixing with redundant document category labels, reducing visual noise.
*   **Direct Hints-Based Task Resolution (`object-type-resolver.ts`)**:
    *   Optimized `ObjectTypeResolver.resolve` to directly extract `objectType` and `documentId` from incoming `hints` (e.g. `hints.businessObjectType`, `hints.typeid`, `hints.documentId`, `hints.instid`), eliminating redundant OData task list queries (`getInstances`).
    *   Dynamically injects decision options (Approve `0001`, Reject `0002`) for pending `CLAIM` tasks with `ActionButton === 'X'`.
*   **Enhanced OData Adapter & Attachment Streaming (`sap-odata-adapter.ts` & `inbox-controller.ts`)**:
    *   Corrected 10-digit zero-padded DocumentNumber filter queries (`DocumentNumber eq '${padded10}'`) and numeric instance ID sorting in `getInstances`.
    *   Updated `fetchAttachmentContent` to accept `objectType` query parameter (`?documentId=...&objectType=CLAIM`) and stream files using `CLAIM` attachment strategy (`CNMA_CLAIM_ATTA`) with automatic fallback to GOS attachment strategy (`CNMA_ATTACH_CONTENT`).
*   **Standardized Claim Payment & Total Amount Resolution (`inbox-utils.ts`)**:
    *   Updated `resolveTaskTotalAmount` to support Expense Claim payment amounts (`PaymentAmountLocalCrcy`, `PaymentAmount`) alongside PO/ZUB total amounts.

---

## [1.0.12] - 2026-08-24

### Added
*   **Expense Claim (`CLAIM`) Document Type Integration**:
    *   Added full support for Expense Claim headers (`CNMA_CLAIMHEADER`) and line items (`CNMA_CLAIMITEM`) across backend strategies ([`claim.ts`](file:///d:/learning/test/cnma_approval/srv/lib/integrations/claim.ts)), type resolvers ([`object-type-resolver.ts`](file:///d:/learning/test/cnma_approval/srv/lib/processors/object-type-resolver.ts), [`odata-config.ts`](file:///d:/learning/test/cnma_approval/srv/lib/processors/odata-config.ts)), and declarative frontend views ([`claim.view.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/renderers/objects/claim/claim.view.ts)).
    *   Updated `METADATA.xml` with OData EDMX definitions for `CNMA_CLAIMHEADER` and `CNMA_CLAIMITEM` entities.
*   **Buffer Magic Bytes MIME & Extension Detector (`file-helper.ts`)**:
    *   Added `detectMimeFromBuffer` in [`file-helper.ts`](file:///d:/learning/test/cnma_approval/srv/lib/utils/file-helper.ts) for binary magic header inspection (PDF, PNG, JPEG, GIF, WebP, ZIP) and fallback lookup maps (`MIME_TYPE_MAP`, `EXT_FROM_MIME`).
*   **Declarative Task Card Renderer (`taskCardView.ts`)**:
    *   Created [`taskCardView.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/renderers/core/taskCardView.ts) under `src/renderers/core/` to drive TaskCard titles, badges, document numbers, and total amounts via [`ObjectView.registry.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/renderers/ObjectView.registry.ts).
*   **Code Review Audit Report (`Code-Review-260824.md`)**:
    *   Added [`Code-Review-260824.md`](file:///d:/learning/test/cnma_approval/docs/code-review/Code-Review-260824.md) evaluating code quality, SOLID, DRY, YAGNI, KISS, and 4-Eyes principle compliance.

### Refactored & Changed
*   **Purged Legacy Task Card Mapper**:
    *   Removed `app/cnma_approval_ui/src/pages/Inbox/mappers/taskCard.mapper.ts` in favor of declarative renderer architecture.
*   **Enhanced Object Type Resolver & Task Processing**:
    *   Updated `resolveObjectTypeFromInstance` in [`object-type-resolver.ts`](file:///d:/learning/test/cnma_approval/srv/lib/processors/object-type-resolver.ts) to evaluate `DocCategory`, `TechnicalWrkflwObjectType`, or `typeid`/`TaskDefinitionID`.
    *   Bypassed TASKPROCESSING decision runtime fetching for `CLAIM` tasks (`SupportsForward: false`).
*   **Streamlined Inbox Query Hooks**:
    *   Refactored and simplified state invalidation and queries in [`inboxInvalidation.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/hooks/inboxInvalidation.ts), [`inboxQueries.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/hooks/inboxQueries.ts), and [`inboxMutations.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/hooks/inboxMutations.ts).

---

## [1.0.11] - 2026-08-20

### Added
*   **Mobile Multi-Select Filter Bottom-Sheet Overlay (`MobileMultiSelectFilter.tsx`)**:
    *   Created [`MobileMultiSelectFilter.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/components/filterbar/MobileMultiSelectFilter.tsx) rendering a touch-optimized bottom-sheet sub-drawer for mobile multi-select filtering via `createPortal`. Includes live search, "Select All" / Clear action buttons, count badges, custom touch checkboxes, and async `optionsLoader` cleanup.
    *   Added `MobileDateRangeFilter` in [`FilterBarField.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/components/filterbar/FilterBarField.tsx) providing an inline touch-friendly date range calendar for mobile filter bars.
*   **Detail Table View Mode Switcher (`table` vs `grid`)**:
    *   Added view mode toggle to [`DetailsPanel.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/panels/DetailsPanel.tsx) allowing desktop and tablet users to toggle between standard table view and collapsible card grid view for line items.
*   **Code Review Audit Report (`Code-Review-260820.md`)**:
    *   Added [`Code-Review-260820.md`](file:///d:/learning/test/cnma_approval/docs/code-review/Code-Review-260820.md) evaluating code quality, SOLID, DRY, YAGNI, KISS, and 4-Eyes principle compliance (Code Score: 95/100).

### Refactored & Changed
*   **Callback Ref Architecture for Mobile Pull-to-Refresh (`usePullToRefresh.ts`)**:
    *   Re-architected touch gesture event handling in [`usePullToRefresh.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/hooks/usePullToRefresh.ts) using callback refs (`setRef`) for dynamic DOM node binding across tab remounts.
    *   Strictly scoped passive touch listeners to container elements to enable 100% native momentum touch scrolling without gesture interference.
*   **Generic OData Deletion Indicator String Trimming**:
    *   Updated `checkIsDeleted` in [`DetailsPanel.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/panels/DetailsPanel.tsx) to trim string values (`String(delVal).trim() !== ''`) before non-empty evaluation, preventing space-padded strings (`" "`) from triggering false-positive deleted indicators on active line items across all SAP document types.
*   **Non-Normal Task Task Forwarding Guard**:
    *   Updated [`inbox-processor.ts`](file:///d:/learning/test/cnma_approval/srv/lib/processors/inbox-processor.ts) and [`object-type-resolver.ts`](file:///d:/learning/test/cnma_approval/srv/lib/processors/object-type-resolver.ts) to restrict forwarding capabilities (`SupportsForward: false`) on non-normal tasks (e.g., info/notification tasks).
*   **Standardized Business Chip Mapper & Amount Resolution**:
    *   Refactored [`taskCard.mapper.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/mappers/taskCard.mapper.ts) to resolve primary total amounts from live detail cache and map document type fallback chips.

---

### Added
*   **Unified Comment Payload Interface (`comment.types.ts`)**:
    *   Created [`comment.types.ts`](file:///d:/learning/test/cnma_approval/srv/lib/integrations/comment.types.ts) to define a standardized `CommentPayload` contract across all integration strategies (`po.ts`, `pr.ts`, `re.ts`, `reference-pr.ts`, `claim.ts`, `sap-odata-adapter.ts`).
    *   Supported structured tagged users (`taggedUsers` / `TAGGEDUSER`) and document context in comment requests.
*   **Dynamic Launchpad App ID & Base URL Resolution (`launchpad.ts`)**:
    *   Updated [`launchpad.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/utils/launchpad.ts) to support dynamic Fiori Launchpad App ID and URL resolution, allowing cross-app navigation without UI redeployment.
*   **Code Review Audit Report (`Code-Review-260817.md`)**:
    *   Added [`Code-Review-260817.md`](file:///d:/learning/test/cnma_approval/docs/code-review/Code-Review-260817.md) documenting code quality verification and architectural compliance.

### Refactored & Changed
*   **Streamlined Backend Comment API & Controller**:
    *   Simplified `addComment` handling in [`inbox-controller.ts`](file:///d:/learning/test/cnma_approval/srv/controllers/inbox-controller.ts) and [`inbox-processor.ts`](file:///d:/learning/test/cnma_approval/srv/lib/processors/inbox-processor.ts), eliminating redundant body field extractions.
*   **Declarative Raw OData Frontend Renderers**:
    *   Refactored panel components ([`OverviewPanel.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/panels/OverviewPanel.tsx), [`DetailsPanel.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/panels/DetailsPanel.tsx), [`TaskDetailView.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/TaskDetailView.tsx)) to render raw OData responses directly using field primitives.
*   **Dead Code Cleanup**:
    *   Purged deprecated `mock-data-provider.ts` (1,922 lines of unused mock code removed from `srv/lib/integrations/`).
    *   Removed redundant `comments.mapper.ts` and its corresponding test file [`comments.mapper.test.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/tests/pages/Inbox/mappers/comments.mapper.test.ts) from the frontend codebase.

---

## [1.0.9] - 2026-08-15

### Added
*   **Task Forwarding & Delegation (`POST /tasks/:id/forward`)**:
    *   Added backend controller endpoint `POST /tasks/:id/forward` and user search route `GET /tasks/search-users`.
    *   Integrated forwarding logic in [`InboxProcessor`](file:///d:/learning/test/cnma_approval/srv/lib/processors/inbox-processor.ts), [`TaskProcessingAdapter`](file:///d:/learning/test/cnma_approval/srv/lib/integrations/taskprocessing-adapter.ts), [`SapOdataAdapter`](file:///d:/learning/test/cnma_approval/srv/lib/integrations/sap-odata-adapter.ts), and [`MockDataProvider`](file:///d:/learning/test/cnma_approval/srv/lib/integrations/mock-data-provider.ts).
    *   Created frontend modal [`ForwardTaskDialog.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/ForwardTaskDialog.tsx) and custom search hook [`useSearchUsers.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/hooks/useSearchUsers.ts).
    *   Automatically records a formatted audit comment `[Forwarded to ${forwardTo}] ${comment}` on the underlying document history in S/4HANA when forwarding with a comment note.
*   **Business User Tagging & Rich Mentions (`@mention`)**:
    *   Added backend endpoint `GET /tasks/bus-users` to query `CNMA_BUSUSER` business users table for CC user tagging.
    *   Created frontend components [`RichMentionInput.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/RichMentionInput.tsx), [`TeamsMentionDropdown.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/TeamsMentionDropdown.tsx), [`TagUserDialog.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/TagUserDialog.tsx), and hook [`useBusUsers.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/hooks/useBusUsers.ts).
    *   Integrated `@mention` inline autocomplete into [`CommentsPanel.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/panels/CommentsPanel.tsx).
*   **Unified Task Action Panel (`TaskActionPanel.tsx`)**:
    *   Replaced legacy decision bar with [`TaskActionPanel.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/TaskActionPanel.tsx), consolidating **Approve**, **Reject**, **Forward**, and **Tag User** actions with confirmation dialogs and rich mention text input.
*   **Reservation Declarative Field Primitives**:
    *   Added [`reservation.fields.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/renderers/objects/reservation/reservation.fields.ts) and updated [`reservation.view.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/renderers/objects/reservation/reservation.view.ts) for declarative raw rendering of Material Reservation objects.
*   **Launchpad Deep-Linking & Task Loading Skeletons**:
    *   Added [`launchpad.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/utils/launchpad.ts) utility for cross-app navigation in SAP Fiori Launchpad environments.
    *   Added [`TaskDetailSkeletons.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/TaskDetailSkeletons.tsx) for smooth skeleton loading states in master-detail view.

### Changed
*   **Centralized Total Amount Resolution (`resolveTaskTotalAmount`)**:
    *   Created centralized amount helper [`resolveTaskTotalAmount`](file:///d:/learning/test/cnma_approval/srv/lib/processors/inbox-utils.ts) to standardize total net amount resolution order across ZUB Stock Transfer Purchase Orders, standard Purchase Orders (BUS2012), Purchase Requisitions, and Reservation objects.
    *   Updated [`taskCard.mapper.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/mappers/taskCard.mapper.ts) and [`TaskList.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/TaskList.tsx) to consume standardized amount fields.
*   **Inbox Filter & Quick Status Tabs**:
    *   Updated [`inboxFilterConfig.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/inboxFilterConfig.ts) and [`useTaskFilters.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/hooks/useTaskFilters.ts) to support tab status filtering ("All", "Pending", "Approved", "Rejected") and enhanced search predicates.

---

## [1.0.8] - 2026-08-05

### Added
*   **Reference Purchase Requisition Drawer Lookup (`/reference-pr/:prNumber`)**:
    *   Added backend service module [`reference-pr.ts`](file:///d:/learning/test/cnma_approval/srv/lib/integrations/reference-pr.ts) and controller route `GET /reference-pr/:prNumber` to query SAP `API_PURCHASEREQ_PROCESS_SRV` or local mock provider for referenced PR header and line item details.
    *   Created frontend hook [`useReferencePr.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/hooks/useReferencePr.ts) and slide-over component [`ReferencePrDetailView.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/ReferencePrDetailView.tsx) to inspect referenced PR details directly from PO line item tables.
*   **Purchase Order Comment Navigation Sync (`_Comment`)**:
    *   Updated `srv/lib/integrations/po.ts` and `inbox-processor.ts` to fetch `_Comment` navigation items from S/4HANA OData service and map them into top-level task comments.
*   **Touch Swipe Mobile Pull-to-Refresh (`usePullToRefresh.ts`)**:
    *   Created [`usePullToRefresh.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/hooks/usePullToRefresh.ts) hook and attached touch gesture handling to `TaskList.tsx` for mobile inbox refresh.

### Changed
*   **PO Subtype Layout Builders & Config Standardization**:
    *   Refactored all 10 Purchase Order subtype layout builders in `app/cnma_approval_ui/src/renderers/modules/po/`: `ZASS`, `ZCON`, `ZCOR`, `ZEXP`, `ZMAK`, `ZNB1`, `ZNB2`, `ZNBR`, `ZTOL`, and `ZUB`.
    *   Standardized header fields, card chips, table columns, and data display structures in [`srv/configuration/object-types/po/config.json`](file:///d:/learning/test/cnma_approval/srv/configuration/object-types/po/config.json).
*   **Structured OData V4 Error Parsing (`ErrorModal.tsx`)**:
    *   Enhanced [`parseError.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/utils/parseError.ts) to parse inner error objects, SAP message containers, status codes, and HTTP network error details for display in [`ErrorModal.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/components/common/ErrorModal.tsx).
*   **Contextual Data Formatters (`formatters.ts`)**:
    *   Added rich formatting functions: `formatQuantityWithUnit`, `formatBadge`, `formatCurrency`, `formatDate`, and standardized null/undefined fallback handling (`-`).

---

## [1.0.7] - 2026-08-05

### Added
*   **Modular PR & PO Subtype Layout Builders**:
    *   Created modular layout builders under `app/cnma_approval_ui/src/renderers/modules/`:
        *   PR subtypes (`pr/subtypes/`): `ZASS` (Asset), `ZMAK` (Asset Subcontracting), `ZNB1` (Standard), `ZNB2` (Service), `ZTOL` (Toll Manufacturing).
        *   PO subtypes (`po/subtypes/`): `ZASS`, `ZCON`, `ZCOR`, `ZMAK`, `ZNB1`, `ZNB2`, `ZNBR`, `ZTOL`, `ZUB`.
*   **Workflow Approval Release Step Description (`releaseText`)**:
    *   Exposed `releaseText` in canonical approval step mapping interface `ApprovalStep` and updated `WorkflowApprovalPanel.tsx` to display human-readable stage descriptions alongside release codes.
*   **Field Mapping Guide (`05-field-mapping-guide.md`)**:
    *   Added comprehensive technical field mapping guide documenting S/4HANA to Canonical Business Object properties across all document types and subtypes.

### Changed
*   **OData V4 Service Endpoint Upgrade**:
    *   Upgraded `INSTANCE_LIST` service path to `/sap/opu/odata4/sap/za_cnma_prorequest/srvd_a2x/sap/za_cnma_prorequest/0001` consuming entity set `CNMA_WFTASK`.
    *   Updated `METADATA.xml` OData EDMX definitions to incorporate latest S/4HANA CDS entity annotations.
*   **Filename-Preserving Attachment Streaming**:
    *   Extended backend BFF attachment content endpoint URL routing pattern to `/api/cnma/APPROVAL_SRV/tasks/:id/attachments/:attId/content/:filename`, preserving file extension and titles during downloads.
*   **PR Approval Decision Comment Syncing**:
    *   Updated `InboxProcessor.addComment` decision push to send decision codes (`A` for Approve, `R` for Reject) along with comment text to SAP Gateway.
*   **Requester Name Resolution Hierarchy**:
    *   Updated requester name resolution in `InboxProcessor` and `inbox-utils.ts` to check `header.userName` before falling back to `header.userFullName` or `header.createdByUser`.

### Fixed
*   **DocType & Status Counts Fallback Calculation**:
    *   Replaced failing OData aggregate count fetches in `SapOdataAdapter` with in-memory instance aggregation fallback.
*   **UI Test Suite Alignment**:
    *   Updated `formatters.shared.test.ts` and `pr.subtypes.test.ts` unit tests to cover new subtype builders and shared formatters.

---

## [1.0.6] - 2026-07-31

### Added
*   **Workzone App Renaming ("My Approval")**:
    *   Renamed HTML5 application title and tile descriptors from `"CNMA Prorequest S4H"` / `"App Title"` to `"My Approval"` across `manifest.json`, `web-manifest.json`, `index.html`, `Component.js`, `i18n.properties`, `METADATA.xml`, `xs-app.json`, and `mta.yaml` for SAP Build Workzone Content Explorer integration.
*   **Developer & AI Agent Context Guide (`CLAUDE.md`)**:
    *   Created comprehensive guide documenting end-to-end data flows, declarative field mapping workflows (`config.json`), dynamic visibility rules (`visibleWhen`), card chips, document-type overrides (`documentTypes` e.g., `ZASS`, `ZFO7`, `ZMAK`, `ZNB1`), and step-by-step onboarding for new object types (`CONTRACT`, `INVOICE`, etc.).
*   **Text File Attachment Viewer (`TextViewer.tsx`)**:
    *   Added plain text viewer component for attachment preview modal supporting `.txt`, `.md`, `.json`, `.csv`, `.log`, and `.xml` files.
*   **Subtype Card Chips & Document Type Overrides**:
    *   Extended `srv/configuration/object-types/*/config.json` with dynamic `cardChips` and `documentTypes` subtype overrides for Asset PR (`ZASS`), Expense PR (`ZFO7`), Marketing PR (`ZMAK`), and Stock PR (`ZNB1`).

### Changed
*   **CAP Task Detail API Payload Flattening**:
    *   Flattened task detail response shape in `inbox-processor.ts` by removing the legacy `object` wrapper and promoting `header`, `items`, `workflow`, `attachments`, `decisions`, `comments`, `fieldSchema`, and `uiSchema` directly to the top-level REST JSON response payload.
    *   Added top-level `_meta: { objectType, objectId, documentType }` metadata block for explicit object type identification.
*   **Modular BFF Processor Architecture**:
    *   Decomposed `srv/lib/processors/inbox-processor.ts` into a slim orchestrator, extracting comment filtering logic into `inbox-utils.ts` and object-type determination into `object-type-resolver.ts`.
*   **BFF Router Prefix Normalization**:
    *   Cleaned Express router mount point in `srv/handlers/inbox-handler.ts` and `srv/server.ts` to mount directly at `/api/cnma/APPROVAL_SRV`, eliminating doubled URL prefixes (`/tasks/tasks/` -> `/tasks/`).
*   **Frontend Renderers Directory Promotion**:
    *   Relocated dynamic section renderers from `app/cnma_approval_ui/src/pages/Inbox/components/renderers/` to top-level src module [`app/cnma_approval_ui/src/renderers/`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/renderers/).
    *   Updated import paths across `OverviewPanel.tsx`, `DetailsPanel.tsx`, `AttachmentsPanel.tsx`, `TaskDetailView.tsx`, and vitest test specs to import directly from `@/renderers`.

---

## [1.0.5] - 2026-07-24

### Changed
*   **Inbox Task-Detail API Refactor**:
    *   Flattened task detail response shape by removing the `object` wrapper and promoting `header`, `items`, `workflow`, `attachments`, `decisions`, `comments`, `fieldSchema`, and `uiSchema` to the top level.
    *   Added top-level `_meta: { objectType, objectId, documentType }` block.
    *   Refactored `srv/lib/processors/inbox-processor.ts` into a slim orchestrator, pure utility module (`inbox-utils.ts`), and resolution component (`object-type-resolver.ts`).

### Fixed
*   **Duplicated Routing Prefix**: Moved Express router mount point in `srv/server.ts` from `/api/cnma/APPROVAL_SRV/tasks` to `/api/cnma/APPROVAL_SRV`, removing the doubled `/tasks/tasks/` URL path.
*   **Comment Cleaning**: Implemented `filterComments()` in `inbox-utils.ts` to automatically filter out empty text, null values, and System noise entries.

---

## [1.0.4] - 2026-07-23

### Added
*   **Comprehensive File Type & MIME Resolver (`mime.ts` & `shared.tsx`)**:
    *   Created `srv/lib/utils/mime.ts` supporting 40+ file extensions across Documents (`.pdf`, `.docx`, `.xlsx`, `.csv`, `.pptx`, `.txt`, `.md`), Images (`.png`, `.jpg`, `.webp`, `.svg`, `.heic`), Archives (`.zip`, `.rar`, `.7z`, `.gz`), Code/Web (`.json`, `.xml`, `.html`, `.yaml`), and Media (`.mp3`, `.mp4`).
    *   Enhanced frontend `friendlyFileType(mimeType?, fileName?)` with file extension fallback so generic `application/octet-stream` MIME types display as human-readable labels (`CSV`, `Excel Spreadsheet`, `Word Document`, etc.) instead of `'Binary File'`.
*   **API Stress & Performance Benchmark Suite (`tests/performance/`)**:
    *   Added `tests/performance/load-generator.ts` and `tests/performance/api-performance.test.ts` executing 11 performance benchmark scenarios under 50-virtual-user burst load.
    *   Added `npm run test:perf` script to root `package.json` measuring throughput (3,500+ RPS), latency percentiles (p50: ~5ms, p95: <15ms), and memory delta.

### Changed
*   **TASKPROCESSING Query Optimization**:
    *   Deprecated redundant `TASKPROCESSING/TaskCollection` calls in `getTasks` and `getApprovedTasks`.
    *   Task list fetching now relies 100% on CDS V4 view `ZC_WORKFLOWTASK` (`SapOdataAdapter.getInstances()`), cutting query overhead in half.
*   **App Router MTA Archive Size Optimization**:
    *   Updated `package.json` `clean` script to include `app/router/resources/`, eliminating 49.26 MB of accumulated legacy Vite builds and shrinking `.mtar` archive size from 17.05 MiB down to ~2.5 MiB.

### Fixed
*   **Approve Decision Comment Area**: Fixed `commentSupported` decision mapping in `inbox-processor.ts` (`sapDec.CommentSupported !== false`) to preserve optional decision comment text areas in non-mock/production SAP environments.
*   **Empty Sonner Toast Box**: Added fallback message extraction in `inboxMutations.ts` (`data?.message || data?.result?.message || 'Decision processed successfully.'`) to prevent empty toast notifications.
*   **Task Detail Page Reload Sync**: Synchronized `isDetailLoading` in `InboxPage.tsx` and validated `activeDetail` instance IDs, ensuring symmetrical skeleton loaders render across both split panels during initial page reload and task switching.
*   **Attachment Upload Security**: Disabled attachment upload UI buttons in `AttachmentsPanel.tsx` and configured backend endpoints `POST /tasks/:id/attachments` and `POST /pr/:docNum/attachments` to return `403 Forbidden`.

---

## [1.0.3] - 2026-07-22

### Added
*   **BFF Debug Config Endpoint**: Exposed a public, unauthenticated GET endpoint `/api/cnma/APPROVAL_SRV/debug-config` to inspect loaded JSON configurations, alias mappings, and directory resolution status.
*   **Dynamic production configuration directory path resolution**: Implemented `process.cwd()` path resolution with a `__dirname` fallback in the BFF `ConfigRegistry` to fix path mismatch crashes inside the SAP BTP Cloud Foundry runtime.

### Changed
*   **Unified Items Table & Standardized Columns**:
    *   Consolidated all auxiliary tables under a single unified `items` table section for all PR types.
    *   Configured a 12-column table displaying code-and-text combined labels for Plant, Storage Location, GL Account, Material Group, and Commitment Item.
    *   Stripped the `"item"` prefix from all collection target paths (e.g. `itemStorageLocation` -> `storageLocation`).
*   **OData List Fetch Optimizations**:
    *   Implemented paginated `InstanceID` filtering on active worklist fetches (`getTasks`), reducing query overhead from fetching all user tasks down to exactly the 10 paginated tasks.
    *   Parallelized the S/4HANA OData fetching pipeline inside BFF when list-level performance hints are provided.
*   **Query Focus & Redirect Optimizations**:
    *   Added `enabled: isMobileViewport` check to queries inside `HomePage.tsx` to stop redundant API requests on desktop pages prior to redirecting to `/inbox`.
    *   Disabled `refetchOnWindowFocus` on infinite list queries to prevent duplicate parallel requests to S/4HANA on tab refocus.
*   **Scroll Area & Horizontal Scrollbars**:
    *   Replaced the Radix `<ScrollArea>` component with a standard CSS scrollable container inside `TaskDetailView` to prevent vertical/horizontal scrollbar clipping.
    *   Added `min-w-max` to table elements and constrained card widths to force horizontal scrollbars to render correctly.

### Fixed
*   **CAP TS Build Compilation Errors**: Updated `ObjectConfig` interface declarations to declare metadata properties and resolved nullable `objectType` references in `inbox-processor.ts`.
*   **API Purge**: Purged deprecated APIs (`getTaskOverview`, `getTaskInformation`) and their query keys from both frontend and backend layers.

## [1.0.2] - 2026-07-17

### Added
*   **OData V4 Consumption Views Integration**: Mapped detail adapters to use the new `ZC_POHEADER` and `ZC_PRHEADER` consumption views in SAP S/4HANA OData V4 services instead of the previous view prefixes.
*   **Expand Comments Support**: Configured `$expand=_Comment` navigation property on PO and PR detail requests to retrieve and display task discussion comments.
*   **Task Type Filter and Badges (CC Tasks)**:
    *   Implemented `TaskTypeBadge` to render a shortened `"CC"` indicator for tagged comment-only tasks (`normalTask === false`) in the task list cards (desktop/mobile) and detail header page.
    *   Added a `"Task Type"` filter option in the filter bar, allowing users to isolate `"Standard Approval"` vs. `"CC"` tasks.
    *   Shortened all related translation keys and configuration strings from `"Tagged Task (Comment-only)"` to `"CC"` in both English and Vietnamese locales.
*   **Workflow Task Creation Metadata**: Exposed new fields `TaskCreationDateTime`, `CreatedByUser`, `CreationDate`, and `CreationTime` in the backend instances mapping, with fallbacks implemented to populate task creation timestamps and requester details in list/detail pages.

### Changed
*   **Fallback Task Action Title**: Adjusted default fallback title construction for `normalTask === false` tasks from `"Approve PR..."` to `"Review PR..."` / `"Reviewed PR..."` in active and historical views to align with comment-only task scopes.

## [1.0.1] - 2026-07-16

### Added
*   **NormalTask Flag Support**: Introduced `NormalTask` flag mapping from INSTANCE LIST response. This flag defines whether a task is a normal approval task (can take action) or a tagged comment-only task (user tagged from comment section, only see/comment, no actions).
*   **Conditional Decision Options Fetching**: Configured the task runtime retriever to conditionally omit the SAP `/DecisionOptions` API call when `NormalTask` is `false`, saving network overhead and hiding actions in the UI.

## [1.0.0] - 2026-07-15

### Added
*   **OData V4 Migration & Consolidation**: Replaced multiple separate V2/V4 integration endpoints with a single unified OData V4 service endpoint `/sap/opu/odata4/sap/zsb_prorequest/srvd_a2x/sap/zsd_prorequest/0001`.
*   **Single Query with `$expand`**: Refactored details retrieval strategies (`PrDetail`, `PoDetail`) to fetch document headers, items, approval strategy steps, and comments in a single query using `$expand=_Item,_ApprovalStep,_HeaderText` instead of 3-5 parallel queries.
*   **Backward Compatibility Mapping**: Added compound key URL building and backwards-compatible field mapping (`purchaseRequisition`, `purchaseOrder`, and dynamically derived PO `accountAssignments`) to preserve existing React frontend structures.

### Changed
*   **Comments & Attachments Write Operations Disabled (Option B)**: Configured the BFF processor and strategies to set `comments` support to `false` in direct mode (whilst keeping mock support intact). Direct comment posting or attachment uploads throw `405 Method Not Allowed` errors, reflecting the read-only properties of the new service.

---

## [1.0.0] - 2026-07-13

### Changed
*   **OData Integration Strategy Refactoring**: Refactored the integration strategies (`PrStrategy`, `PoStrategy`, `DetailStrategy`) into a modular structure:
    *   Defined `Detail` interface in `detail.ts` for clean abstraction.
    *   Introduced `BaseDetail` in `base.ts` to encapsulate shared behaviors like mock-mode checking, parallel batch request fallback, camel-casing keys, and config-driven property mapping.
    *   Decomposed specific details retrieval into `PrDetail` in `pr.ts` and `PoDetail` in `po.ts`.
*   **Decoupled CSRF & Authentication**: Cleanly delegated CSRF token fetching and Cookie replication logic directly to `SapClient.post` and `SapClient.fetchCsrf`, improving BTP multi-instance cluster compatibility.

### Fixed
*   **Double Loading Spinner in Attachments**: Resolved a layout bug in `AttachmentsPanel.tsx` that displayed duplicate spinners during initial load by constraining the secondary loader to `isSecLoading && displayedAttachments.length > 0`.

## [1.0.0] - 2026-07-07 

### Added
*   **Decoupled Express BFF**: Mounted custom REST routes on CAP bootstrap to handle list and detail views.
*   **PR & PO Dynamic Rendering**: Created `TaskDetailSections.registry` to parse dynamic field and UI schemas for Purchase Requisitions and Purchase Orders.
*   **In-Memory caching**: Created the LRU/TTL caching layer to optimize S/4HANA details query speeds and prevent N+1 request loops.
*   **Attachments & Comments Integration**: Implemented binary streams for viewing/uploading files and comment synchronizations.
*   **Mass Actions Support**: Created frontend checkboxes and backend routes to batch process decisions.
*   **XSUAA Security**: Mounted JWT verification middleware with passport strategy to enable secure BTP Principal Propagation.
*   **Mock Fallbacks**: Developed mocked endpoints and local data providers to enable offline development.
*   **Unit Tests**: Added Vitest suites covering caching, adapters, processors, and handlers.

### Changed (Added 2026-07-09)
*   **OData Integration Redesign (SOLID)**: Consolidated split outbound adapters (`instance-list-adapter.ts`, `object-detail-adapter.ts`) into a single facade adapter (`sap-odata-adapter.ts`) and applied the Strategy Pattern using `PrStrategy` and `PoStrategy` classes implementing `DetailStrategy`.
*   **Proactive CSRF Management**: Configured `SapClient` to proactively fetch and manage CSRF tokens/cookies for POST calls, delegating security headers from individual strategies to the HTTP client layer.

### Fixed
*   **Safe ID Padding**: Implemented numeric regex check (`/^\d+$/`) before padding document IDs with leading zeros, preventing alphanumeric ID corruption.
*   **Decoupled Binary Decoding**: Extracted GOS attachment hex/base64 decoding from integration strategies to a dedicated `file-helper.ts` utility.
