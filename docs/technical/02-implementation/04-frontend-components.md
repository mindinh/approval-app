# Frontend Component Architecture & Declarative Renderer Engine

> **Owner:** Lead Frontend Engineer | **Last Updated:** 2026-10-20 | **Status:** Active

This document details the React component hierarchy, state synchronization patterns, raw OData consumption, and the **Declarative Raw OData Renderer Engine** of the **CNMA Approval** frontend.

---

## 🏗️ React Component Hierarchy & Workspace Layout

The application employs a unified layout wrapper [`MainLayout.tsx`](../../../app/cnma_approval_ui/src/components/layouts/MainLayout.tsx) providing desktop sidebar navigation alongside responsive mobile navigation:

```
App.tsx (Main App Shell with ErrorBoundary & Toaster)
└── MainLayout.tsx (SidebarProvider & MobileNavProvider)
    ├── Desktop: AppSidebar.tsx (Collapsible Fiori Launchpad Sidebar)
    ├── Mobile: MobileBottomBar.tsx (Persistent 4-tab bar with Framer Motion spring animations & badge counters)
    └── Main Routing Container (<Outlet />)
        ├── HomePage.tsx (Landing portal with MobileTopBar embedded, metrics cards, quick access)
        ├── DashboardPage.tsx (Analytics & charts with MobileTopBar standalone & dynamic bottom clearance)
        └── Inbox/InboxPage.tsx (Master-Detail Layout Engine)
            ├── Mobile: MobileTopBar.tsx (User identity, initials avatar, one-tap logout)
            ├── FilterBar (FilterBarField.tsx, MobileMultiSelectFilter.tsx)
            │     ├── MobileDateRangeFilter (Inline touch calendar range picker)
            │     └── FilterSettingsDialog.tsx (Adapt filter order & visibility)
            ├── Left Pane: TaskList.tsx (Desktop Expand/Collapse All toggle, touch PTR)
            │     ├── CategoryAccordionGroup.tsx (Collapsible PR/PO/Claim/Reservation accordions)
            │     │     └── CategorySubtypeFilter (Multi-select subtype popover with checkboxes)
            │     ├── TaskCard.tsx (Priority stripe, badges, amount chips, chevron affordance)
            │     │     └── SlaIcons.tsx (Friendly SLA aging avatars: green < 5d vs red > 5d)
            │     └── TaskPagination.tsx
            ├── Right Pane: TaskDetailView.tsx (Full responsive task detail view with PTR container)
            │     ├── Header & Status Badges (StatusHeaderBadges.tsx)
            │     ├── Tabs Bar: Overview | Details | Attachments | Comments | Workflow
            │     ├── Sub-Panels:
            │     │     ├── OverviewPanel.tsx (Declarative BusinessSectionModel cards & in-app Reference PR link)
            │     │     ├── DetailsPanel.tsx (Item tables with View Switcher, Deletion Flags & in-app Reference PR link)
            │     │     ├── CommentsPanel.tsx (Timeline notes, rich mention input, inline Forward strips)
            │     │     ├── AttachmentsPanel.tsx (File grid & AttachmentPreviewModal.tsx)
            │     │     └── WorkflowApprovalPanel.tsx (Approval release tree timeline with rejection badges)
            │     ├── In-App Drill-Down: ReferencePrDetailView.tsx (Native tabbed PR inspector with nested history)
            │     ├── Dialog Modals:
            │     │     ├── ForwardTaskDialog.tsx (Task forwarding/delegation user search)
            │     │     └── TagUserDialog.tsx (CC user tagging modal)
            │     └── Action Panel: TaskActionPanel.tsx (Docked desktop / floating mobile bar; CC protected; supportsForward toggle)
            └── Mass Selection Mode:
                  ├── MassSelectionView.tsx (Bulk review queue with Excluded CC Tasks breakdown)
                  └── MassDecisionDialog.tsx (Non-blocking bulk decision confirmation modal)
```

---

## 📱 Mobile Navigation & Viewport Architecture

To provide an optimal native mobile experience on smartphones and tablets, the navigation architecture separates desktop drawer patterns from mobile bottom navigation:

### 1. `MobileNavContext` & State Lifecycle ([`src/contexts/MobileNavContext.tsx`](../../../app/cnma_approval_ui/src/contexts/MobileNavContext.tsx))
*   **Active Tab Tracking**: Categorizes routes into `home`, `my`, `approved`, `dashboard`, or `other` using pure route resolver `resolveNavTab`.
*   **Route Drill-Down Detection**: Pure helper `isTaskDetailPath` uses React Router `matchPath` patterns (`/inbox/:taskId`, `/approved/:taskId`, `/tasks/:taskId`) to detect when a user is inspecting a specific task.
*   **Mutual Exclusivity**:
    *   The `MobileBottomBar` automatically unmounts / slides out (`exit={{ y: '100%', opacity: 0 }}`) when drilling into a task detail view, leaving the viewport dedicated to content and the floating action panel.
    *   When the user activates Mass Selection Mode in `InboxPage.tsx`, `setHideBottomBar(true)` coordinates hiding the bottom bar to make room for mass selection controls.

### 2. Standardized Layout Tokens ([`src/styles/theme.css`](../../../app/cnma_approval_ui/src/styles/theme.css))
Arbitrary padding values have been eliminated in favor of CSS variables defined in `:root`:
*   `--mobile-bottom-nav-height`: `calc(3.75rem + env(safe-area-inset-bottom, 0px))`
*   `--mobile-bottom-nav-clearance`: `calc(var(--mobile-bottom-nav-height) + 1.5rem)`
Both `HomePage.tsx` and `DashboardPage.tsx` use `pb-[var(--mobile-bottom-nav-clearance)] md:pb-8` to ensure touch scrolling never obscures content behind the navigation bar regardless of hardware safe-area insets.

### 3. Identity Top Bar ([`src/components/layouts/MobileTopBar.tsx`](../../../app/cnma_approval_ui/src/components/layouts/MobileTopBar.tsx))
*   Provides user initials avatar, full user email/ID, and one-tap logout (`/do/logout`).
*   Operates in two modes:
    *   **Embedded**: Placed inside the gradient header on `HomePage.tsx` without outer borders or background.
    *   **Standalone**: Renders with full gradient header and safe-area top padding on `DashboardPage.tsx` and list-view on `InboxPage.tsx`.

---

## 🛡️ Carbon Copy (CC / Review-Only) UI Guardrails

Tasks flagged with `normalTask === false` (Carbon Copy / tagged tasks) receive full-stack UI protection:
1. **Decision Stripping**: [`normalizeDetailForView`](../../../app/cnma_approval_ui/src/pages/Inbox/utils/normalizeTaskDetail.ts) strips decision options (`decisions: []`) and disables forwarding (`supports.forward = false`).
2. **Action Panel Suppression**: [`TaskActionPanel.tsx`](../../../app/cnma_approval_ui/src/pages/Inbox/components/TaskActionPanel.tsx) immediately returns `null` when `isNormalTask === false`.
3. **Collaboration Preservation**: In [`TaskDetailView.tsx`](../../../app/cnma_approval_ui/src/pages/Inbox/components/TaskDetailView.tsx), `allowAddComment` checks `!isApprovedScope && viewData?.supports?.comments !== false`, allowing CC reviewers to post comments, mention peers, and preview attachments without approval rights.
4. **Mass Action Exclusion**: Selection checkboxes on CC task cards are rendered as disabled placeholders with explanatory tooltips, and the "Select All" button strictly filters for actionable tasks (`task.normalTask !== false`).

---

## 🔄 State Synchronization & Async Data Fetching

The frontend relies on **React Query (TanStack Query v5)** for managing asynchronous server states and caching:

*   **Query Keys**:
    *   `['tasks', 'active', pagination]`: Cache key for active inbox approval items.
    *   `['tasks', 'history', pagination]`: Cache key for completed approval items.
    *   `['tasks', 'detail', instanceId]`: Cache key for single task detail raw payload (`RawTaskDetailResponse`).
    *   `['prDetail', docNum]`: Cache key for standalone referenced Purchase Requisition details (`useReferencePrDetail.ts`).
    *   `['searchUsers', query]`: Cache key for user search results (`useSearchUsers.ts`).
    *   `['busUsers', query]`: Cache key for CNMA business user search results (`useBusUsers.ts`).
*   **Mutations**:
    *   `decisionMutation`: Executes single-task approval/rejection (`executeDecision`).
    *   `massDecisionMutation`: Executes bulk multi-task approval/rejection (`executeMassDecision`).
    *   `commentMutation`: Posts timeline notes and syncs ERP document notes (`addComment`).

---

## 🗂️ Category Accordion Grouping & Subtype Multi-Select Filtering

The left-pane worklist organizes incoming tasks into hierarchical, collapsible category groups defined in [`src/pages/Inbox/components/CategoryAccordionGroup.tsx`](../../../app/cnma_approval_ui/src/pages/Inbox/components/CategoryAccordionGroup.tsx):

*   **Category Partitioning (`categoryUtils.ts`)**:
    *   Normalizes heterogeneous SAP workflow instances into 4 primary categories: `PR`, `PO`, `CLAIM`, `RESERVATION` via `getTaskObjectCategory`.
    *   Computes category aggregations via `computeCategoryCounts(tasks)` and distinct document subtypes via `extractSubtypeCounts(tasks)` and `getTaskSubtype(task)`.
*   **Expand / Collapse State Management**:
    *   Maintains an expanded category set `expandedCategories: Set<ObjectCategory>`.
    *   List header provides an `onToggleCollapseAll` action (`ChevronsUpDown` / `ChevronsDownUp`) allowing one-click global expansion or collapse.
*   **Integrated Subtype Popover (`CategorySubtypeFilter`)**:
    *   Each category header houses a trigger button showing active subtype selection count.
    *   Opens a Radix `Popover` displaying checkboxes for each subtype found in the current worklist (e.g. `ZNB1 (12)`, `ZMAK (4)`, `ZASS (2)`).
    *   Provides "Select All" and "Clear" batch toggles, filtering category tasks in-memory without resetting other categories.

---

## 📑 In-App Reference Purchase Requisition Navigation Engine

Inspecting linked requisitions is handled natively by [`ReferencePrDetailView.tsx`](../../../app/cnma_approval_ui/src/pages/Inbox/components/ReferencePrDetailView.tsx):

*   **Trigger Mechanism**:
    *   Line item tables in `DetailsPanel.tsx` and header cards in `OverviewPanel.tsx` identify reference PR fields via `isReferencePrField(key, label)`.
    *   Clicking passes the PR number to `onSelectReferencePr(displayVal)`, activating `{ type: 'reference-pr', prNumber }` sub-view in `TaskDetailView.tsx`.
*   **Integrated Panels**:
    *   Queries `useReferencePrDetail(currentPr)` which calls BFF endpoint `GET /tasks/pr/:docNum`.
    *   Normalizes data with `normalizeDetailForView` and resolves layouts via `resolveBusinessSectionModel`.
    *   Renders full tabbed interface (`Overview`, `Details`, `Workflow`, `Attachments`, `Comments`) using shared sub-panels.
*   **Navigation Stack & History Breadcrumbs**:
    *   Maintains internal history array `prHistory: string[]`.
    *   Supports clicking nested reference PRs from within an active reference PR, pushing new IDs onto the stack.
    *   Clicking **Back** pops the latest PR from `prHistory` or returns to the parent Purchase Order view when at the root.

---

## 🛠️ Declarative Column Filtering & Shared Formatters

*   **Declarative Subtype Column Exclusion (`excludeColumns`)**:
    *   Introduced in [`po.views.ts`](../../../app/cnma_approval_ui/src/renderers/objects/po/po.views.ts) and [`pr.views.ts`](../../../app/cnma_approval_ui/src/renderers/objects/pr/pr.views.ts):
        ```typescript
        function excludeColumns(base: typeof standardColumns, ...keysToExclude: string[]) {
            return base.filter((col) => !keysToExclude.includes(col.key));
        }
        ```
    *   Dynamically derives subtype-specific column arrays (e.g., omitting `plant` or `storageLocation` for specific document types) from the standard base definition without duplicating column specifications.
*   **Centralized Vendor Formatter (`formatVendorCodeAndName`)**:
    *   Extracted to [`renderers/core/formatters.ts`](../../../app/cnma_approval_ui/src/renderers/core/formatters.ts) to unify code-and-name resolution across PO and Claim objects, concatenating vendor codes and multiline name fields (`Name1`, `Name2`, `Name3`, `Name4`) into `CODE - FULL NAME`.

---

## 🏛️ Declarative Raw OData Renderer Architecture (`src/renderers/`)

The application renders header overview cards and line item tables for all document types (`PR`, `PO`, `RE`, `CLAIM`) and document subtypes (`ZASS`, `ZCON`, `ZCOR`, `ZEXP`, `ZMAK`, `ZNB1`, `ZNB2`, `ZNBR`, `ZTOL`, `ZUB`) using a declarative, rule-based renderer architecture located at [`src/renderers/`](../../../app/cnma_approval_ui/src/renderers):

```
app/cnma_approval_ui/src/renderers/
├── ObjectView.registry.ts      <-- Resolves DocCategory + DocumentType to ObjectViewDefinition
├── core/
│   ├── fields.ts              <-- Primitive field constructors (text, codeText, amount, date, tableCol)
│   ├── formatters.ts          <-- Presentation formatters for dates, currency amounts, units, codes
│   ├── objectView.ts          <-- Evaluates view definitions against raw entity to build BusinessSectionModel
│   ├── predicates.ts          <-- Rule-based visibility helpers (when.eq, when.exists, when.in, when.all)
│   ├── renderer.types.ts      <-- Renderer contract types & interfaces
│   └── taskCardView.ts        <-- TaskCard view definition builder (title, badges, amounts)
└── objects/
    ├── claim/                 <-- Claim field catalog & view definitions (claim.fields.ts, claim.view.ts)
    ├── po/                    <-- Purchase Order catalogs & subtype views (po.fields.ts, po.views.ts)
    ├── pr/                    <-- Purchase Requisition catalogs & subtype views (pr.fields.ts, pr.views.ts)
    └── reservation/           <-- Reservation catalog & 10-column table view (reservation.view.ts)
```

### 1. Primitive Field Factories (`core/fields.ts`)
*   `text({ source, label, formatter })`: Single line or multiline formatted text field.
*   `codeText({ code, text, label })`: Code and text combination (e.g. `1710 - US TRADING PLANT`).
*   `amount({ value, currency, label })`: Formatted amount with currency.
*   `date({ source, label, timeSource })`: Date formatted as `YYYY-MM-DD` or short date.
*   `quantity({ value, unit, label })`: Numeric quantity with unit of measure.
*   `tableCol({ id, header, source, align, formatter })`: Table column specification.

### 2. Visibility Predicates (`core/predicates.ts`)
Visibility predicates control when fields or cards are rendered:
*   `when.exists('Field')`: Evaluates to true if field is present and non-null.
*   `when.notEmpty('Field')`: Evaluates to true if field contains non-whitespace string content.
*   `when.eq('Field', value)`: Evaluates to true if field strictly equals target value.
*   `when.in('Field', [val1, val2])`: Evaluates to true if field value is present in array.
*   `when.all(pred1, pred2)`: Logical AND across multiple predicates.

### 3. Object View Evaluator (`core/objectView.ts`)
Given a raw SAP OData entity and an `ObjectViewDefinition`, `evaluateObjectView` generates a `BusinessSectionModel` containing:
- `cards`: Resolved grid section cards for `OverviewPanel.tsx`.
- `tables`: Resolved line item table models for `DetailsPanel.tsx`.

---

## 🌐 Localization & i18n

The application supports bilingual localization (English & Vietnamese) using standard JSON dictionaries located in [`app/cnma_approval_ui/src/locales/`](../../../app/cnma_approval_ui/src/locales):
*   `en.json`: English translation strings for status codes, document types, card titles, decision actions, and table headers.
*   `vi.json`: Vietnamese translation strings for all UI components and document labels.
