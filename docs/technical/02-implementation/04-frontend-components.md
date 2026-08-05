# Frontend Component Architecture & Dynamic Registry

> **Owner:** Lead Frontend Engineer | **Last Updated:** 2026-08-05 | **Status:** Active

This document details the React component hierarchy, state synchronization patterns, canonical data consumption, modular subtype rendering builders, and dynamic UI section rendering registry of the **CNMA Approval** frontend.

---

## 🎨 Page Layouts and Composition

The frontend application uses a clean, mobile-first master-detail layout for the inbox workspace:

```
[Dashboard Page] -> High-level metrics, KPI summary cards, and quick status links
[Inbox Page] -> Master-Detail Layout:
  ├── Left Pane: TaskList.tsx
  │     ├── TaskCard.tsx (Task title, badges, document numbers, total amounts)
  │     └── TaskPagination.tsx
  └── Right Pane: TaskDetailView.tsx
        ├── Dynamic Header & Status Badges
        ├── Dynamic Rendered Cards & Tables (Driven by uiSchema & src/renderers/TaskDetailSections.registry.ts)
        ├── Tabbed View Panels:
        │     ├── OverviewPanel.tsx (Header fields and schema-driven sections)
        │     ├── CommentsPanel.tsx (Timeline notes & submission)
        │     ├── AttachmentsPanel.tsx (File grid & AttachmentPreviewModal.tsx with TextViewer)
        │     └── WorkflowApprovalPanel.tsx (Approval tree timeline with releaseText steps)
        └── Action Panel: DecisionPanel.tsx (Floating Approve/Reject decisions with comment modal)
```

---

## ⚡ Data Sync & State Management (React Query)

The frontend relies on **React Query (TanStack Query v5)** for managing asynchronous server states and caching:
*   **Query Keys**:
    *   `['tasks', 'active', pagination]`: Key for cache control on active approval items.
    *   `['tasks', 'history', pagination]`: Key for processed approval history.
    *   `['tasks', 'detail', instanceId]`: Key for single task detail payload (consolidated Canonical Business Object).
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
    *   `po.zass.ts`, `po.zcon.ts`, `po.zcor.ts`, `po.zmak.ts`, `po.znb1.ts`, `po.znb2.ts`, `po.znbr.ts`, `po.ztol.ts`, `po.zub.ts`: Specialized layout builders for asset, consignment, subcontracting, standard, service, return, toll, and stock transfer orders.

### 2. Contextual Data Formatters (`src/renderers/shared/formatters.ts`)
*   **DATE**: Formats ISO timestamps or SAP date strings into readable localized dates.
*   **AMOUNT**: Formats values dynamically using original document currencies or VND (e.g. `12,500,000 VND`).
*   **QUANTITY**: Parses counts and appends unit descriptors (e.g., `100 EA`).
*   **BOOLEAN**: Renders as localized `Yes` or `No` badges.

### 3. Sub-Panels & Modals
*   **[`OverviewPanel.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/panels/OverviewPanel.tsx)**: Displays high-level header information, document status badges, and dynamic UI schema card sections.
*   **[`WorkflowApprovalPanel.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/panels/WorkflowApprovalPanel.tsx)**: Displays chronological workflow release steps, rendering `releaseText` stage titles alongside release codes.
*   **[`AttachmentsPanel.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/panels/AttachmentsPanel.tsx)**: Displays attached documents with file icons, sizes, and direct filename-preserved download links `/content/:filename`.
*   **[`AttachmentPreviewModal.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/AttachmentPreviewModal.tsx)**: Renders inline image, PDF, and plain text (`TextViewer.tsx`) previews.

---

## 🌐 Localization & i18n

The application supports bilingual localization (English & Vietnamese) using standard JSON dictionaries located in [`app/cnma_approval_ui/src/locales/`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/locales/):
*   `en.json`: English translation strings for status codes, document types (PR, PO, Claim, Reservation), tab headers, decision actions, and error messages.
*   `vi.json`: Vietnamese translation strings for all UI components and document labels.
