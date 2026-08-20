# Frontend Component Architecture & Declarative Renderer Engine

> **Owner:** Lead Frontend Engineer | **Last Updated:** 2026-08-20 | **Status:** Active

This document details the React component hierarchy, state synchronization patterns, raw OData consumption, and the **Declarative Raw OData Renderer Engine** of the **CNMA Approval** frontend.

---

## 🎨 Page Layouts and Composition

The frontend application uses a master-detail layout for the inbox workspace:

```
[Dashboard Page] -> High-level metrics, KPI summary cards, and quick status links
[Inbox Page] -> Master-Detail Layout:
  ├── Header FilterBar: FilterBar.tsx & FilterBarField.tsx
  │     ├── MobileMultiSelectFilter.tsx (Touch bottom-sheet overlay with option search & batch select)
  │     ├── MobileDateRangeFilter (Inline touch calendar range picker)
  │     └── FilterSettingsDialog.tsx (Adapt filter order & visibility)
  ├── Left Pane: TaskList.tsx (with touch pull-to-refresh hook: usePullToRefresh.ts)
  │     ├── TaskCard.tsx (Task title, badges, document numbers, total amounts via taskCard.mapper.ts)
  │     └── TaskPagination.tsx
  └── Right Pane: TaskDetailView.tsx (with TaskDetailSkeletons.tsx loading indicators & PTR container ref)
        ├── Header & Status Badges (StatusHeaderBadges.tsx)
        ├── Dynamic Overview Cards & Tables (Driven by ObjectView.registry.ts & resolveBusinessSectionModel)
        ├── Tabbed View Panels:
        │     ├── OverviewPanel.tsx (Renders cards from BusinessSectionModel)
        │     ├── DetailsPanel.tsx (Renders item tables with Table/Grid View Mode Switcher, Item Deletion Flags & Reference PR badges)
        │     ├── CommentsPanel.tsx (Timeline notes & RichMentionInput with TeamsMentionDropdown)
        │     ├── AttachmentsPanel.tsx (File grid & AttachmentPreviewModal.tsx)
        │     └── WorkflowApprovalPanel.tsx (Approval release tree timeline)
        ├── Dialog Modals:
        │     ├── ReferencePrDetailView.tsx (Slide-over drawer for PR lookup driven by useReferencePr.ts)
        │     ├── ForwardTaskDialog.tsx (Task forwarding/delegation user search driven by useSearchUsers.ts)
        │     └── TagUserDialog.tsx (CC user tagging modal driven by useBusUsers.ts)
        └── Action Panel: TaskActionPanel.tsx (Approve, Reject, Forward, Tag User actions & confirmation dialogs)
```

---

## ⚡ Data Sync & State Management (React Query)

The frontend relies on **React Query (TanStack Query v5)** for managing asynchronous server states and caching:
*   **Query Keys**:
    *   `['tasks', 'active', pagination]`: Cache key for active inbox approval items.
    *   `['tasks', 'history', pagination]`: Cache key for completed approval items.
    *   `['tasks', 'detail', instanceId]`: Cache key for single task detail raw payload (`RawTaskDetailResponse`).
    *   `['referencePR', prNumber]`: Cache key for Reference Purchase Requisition lookup.
    *   `['searchUsers', query]`: Cache key for user search results (`useSearchUsers.ts`).
    *   `['busUsers', query]`: Cache key for CNMA business user search results (`useBusUsers.ts`).
*   **Mutations**:
    *   Posting a decision runs `useMutation` which invalidates `['tasks', 'active']` and `['tasks', 'history']` to trigger automatic re-fetches.
    *   Forwarding a task invalidates `['tasks', 'active']` and removes the item from the pending list.
    *   Posting a comment invalidates `['tasks', 'detail', instanceId]`.

---

## 🏛️ Declarative Raw OData Renderer Architecture (`src/renderers/`)

The application renders header overview cards and line item tables for all document types (`PR`, `PO`, `RE`, `CLAIM`) and document subtypes (`ZASS`, `ZCON`, `ZCOR`, `ZEXP`, `ZMAK`, `ZNB1`, `ZNB2`, `ZNBR`, `ZTOL`, `ZUB`) using a declarative, rule-based renderer architecture located at [`src/renderers/`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/renderers/):

```
app/cnma_approval_ui/src/renderers/
├── ObjectView.registry.ts      <-- Resolves DocCategory + DocumentType to ObjectViewDefinition
├── core/
│   ├── fields.ts              <-- Primitive field constructors (text, codeText, amount, date, tableCol)
│   ├── formatters.ts          <-- Presentation formatters for dates, currency amounts, units, codes
│   ├── objectView.ts          <-- Evaluates view definitions against raw entity to build BusinessSectionModel
│   ├── predicates.ts          <-- Rule-based visibility helpers (when.eq, when.exists, when.in, when.all)
│   └── renderer.types.ts      <-- Renderer contract types & interfaces
└── objects/
    ├── claim/                 <-- Claim view definitions (claim.view.ts)
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

The application supports bilingual localization (English & Vietnamese) using standard JSON dictionaries located in [`app/cnma_approval_ui/src/locales/`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/locales/):
*   `en.json`: English translation strings for status codes, document types, card titles, decision actions, and table headers.
*   `vi.json`: Vietnamese translation strings for all UI components and document labels.
