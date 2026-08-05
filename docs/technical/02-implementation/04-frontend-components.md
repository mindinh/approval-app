# Frontend Component Architecture & Dynamic Registry

> **Owner:** Lead Frontend Engineer | **Last Updated:** 2026-08-05 | **Status:** Active

This document details the React component hierarchy, state synchronization patterns, canonical data consumption, modular subtype rendering builders, and dynamic UI section rendering registry of the **CNMA Approval** frontend.

---

## 🎨 Page Layouts and Composition

The frontend application uses a clean, mobile-first master-detail layout for the inbox workspace:

```
[Dashboard Page] -> High-level metrics, KPI summary cards, and quick status links
[Inbox Page] -> Master-Detail Layout:
  ├── Left Pane: TaskList.tsx (with touch swipe pull-to-refresh hook: usePullToRefresh.ts)
  │     ├── TaskCard.tsx (Task title, badges, document numbers, total amounts)
  │     └── TaskPagination.tsx
  └── Right Pane: TaskDetailView.tsx
        ├── Dynamic Header & Status Badges
        ├── Dynamic Rendered Cards & Tables (Driven by uiSchema & src/renderers/TaskDetailSections.registry.ts)
        ├── Tabbed View Panels:
        │     ├── OverviewPanel.tsx (Header fields and schema-driven sections)
        │     ├── DetailsPanel.tsx (Line items table with interactive Reference PR badges)
        │     ├── CommentsPanel.tsx (Timeline notes & ERP comment sync)
        │     ├── AttachmentsPanel.tsx (File grid & AttachmentPreviewModal.tsx with TextViewer)
        │     └── WorkflowApprovalPanel.tsx (Approval tree timeline with releaseText steps)
        ├── Modal Drawers & Dialogs:
        │     ├── ReferencePrDetailView.tsx (Slide-over drawer for PR lookup driven by useReferencePr.ts)
        │     └── ErrorModal.tsx (Structured OData V4 / CAP error popup parsed by parseError.ts)
        └── Action Panel: DecisionPanel.tsx (Floating Approve/Reject decisions with comment modal)
```

---

## ⚡ Data Sync & State Management (React Query)

The frontend relies on **React Query (TanStack Query v5)** for managing asynchronous server states and caching:
*   **Query Keys**:
    *   `['tasks', 'active', pagination]`: Key for cache control on active approval items.
    *   `['tasks', 'history', pagination]`: Key for processed approval history.
    *   `['tasks', 'detail', instanceId]`: Key for single task detail payload (consolidated Canonical Business Object).
    *   `['referencePR', prNumber]`: Key for Reference Purchase Requisition lookup fetched by `useReferencePr.ts`.
*   **Mutations**:
    *   Posting a decision runs `useMutation` which invalidates `['tasks', 'active']` and `['tasks', 'history']` to trigger automatic re-fetches and list updates.
    *   Posting a comment invalidates `['tasks', 'detail', instanceId]`.

---

## 🏛️ Dynamic Detail View Registry & Subtype Builders (`src/renderers/`)

To handle different procurement and financial object types and specialized subtypes without hardcoding UI controls, the application uses a modular renderer architecture located at [`src/renderers/`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/renderers/):

### 1. Subtype Layout Builders (`src/renderers/modules/`)
*   **Purchase Requisition Subtype Builders** (`pr/subtypes/`):
    *   `pr.zass.ts`: Asset Requisition layout builder with investment profile and asset account assignment details.
    *   `pr.zmak.ts`: Asset Subcontracting layout builder.
    *   `pr.znb1.ts`: Standard Purchase Requisition layout builder.
    *   `pr.znb2.ts`: Service Purchase Requisition layout builder with service item specifications.
    *   `pr.ztol.ts`: Toll Manufacturing Requisition layout builder.
*   **Purchase Order Subtype Builders** (`po/subtypes/`):
    *   `po.zass.ts`: Asset PO layout builder with asset number & subnumber display.
    *   `po.zcon.ts`: Consignment PO layout builder with vendor consignment tracking.
    *   `po.zcor.ts`: Correction / Subcontracting PO layout builder.
    *   `po.zexp.ts`: Operational Expense PO layout builder.
    *   `po.zmak.ts`: Asset Subcontracting PO layout builder.
    *   `po.znb1.ts`: Standard Material PO layout builder.
    *   `po.znb2.ts`: Service PO layout builder.
    *   `po.znbr.ts`: Return Goods PO layout builder.
    *   `po.ztol.ts`: Toll Processing PO layout builder.
    *   `po.zub.ts`: Stock Transfer PO layout builder with receiving plant and storage location details.

### 2. Contextual Data Formatters (`src/renderers/shared/formatters.ts`)
*   **DATE**: Formats ISO timestamps or SAP date strings into readable localized dates.
*   **AMOUNT**: Formats values dynamically using original document currencies or VND (e.g. `12,500,000 VND`).
*   **QUANTITY**: Parses counts and appends unit descriptors (e.g., `100 EA` via `formatQuantityWithUnit`).
*   **BADGE**: Renders formatted status and priority indicators (`formatBadge`).
*   **BOOLEAN**: Renders as localized `Yes` or `No` badges.
*   **FALLBACK**: Standardized null/undefined string fallbacks (`-`).

### 3. Modals & Interactivity Components
*   **[`ReferencePrDetailView.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/ReferencePrDetailView.tsx)**: Slide-over modal drawer triggered when clicking on a Purchase Requisition reference badge on PO line items. Loads PR header metadata, item breakdowns, quantities, and account assignments using [`useReferencePr.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/hooks/useReferencePr.ts).
*   **[`ErrorModal.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/components/common/ErrorModal.tsx)**: Global error dialog displaying parsed technical error details, status codes, and friendly resolution guidance using [`parseError.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/utils/parseError.ts).
*   **[`usePullToRefresh.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/hooks/usePullToRefresh.ts)**: Mobile touch swipe gesture hook attached to `TaskList.tsx` providing native-feeling pull-to-refresh functionality on touch devices.

---

## 🌐 Localization & i18n

The application supports bilingual localization (English & Vietnamese) using standard JSON dictionaries located in [`app/cnma_approval_ui/src/locales/`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/locales/):
*   `en.json`: English translation strings for status codes, document types (PR, PO, Claim, Reservation), tab headers, decision actions, reference PR drawer labels, and error messages.
*   `vi.json`: Vietnamese translation strings for all UI components, reference PR drawer titles, and document labels.

