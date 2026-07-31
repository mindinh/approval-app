# Frontend Component Architecture & Dynamic Registry

> **Owner:** Lead Frontend Engineer | **Last Updated:** 2026-07-31 | **Status:** Active

This document details the React component hierarchy, state synchronization patterns, canonical data consumption, and dynamic UI section rendering registry of the **CNMA Approval** frontend.

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
        │     └── WorkflowApprovalPanel.tsx (Approval tree timeline)
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

## 🏛️ Dynamic Detail View Registry (`TaskDetailSections.registry.ts`)

To handle different procurement and financial object types (Purchase Requisitions, Purchase Orders, Expense Claims, Material Reservations) without hardcoding UI controls, the application uses a dynamic section registry engine located at [`src/renderers/TaskDetailSections.registry.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/renderers/TaskDetailSections.registry.ts):

### 1. Dynamic Layout Schema Engine
When the backend task detail response includes a `uiSchema`:
*   `uiSchema`: Defines the section cards, titles, types (`CARD`, `TABLE`), and field lists.
*   `header` / `items` canonical properties: Provide typed data fields for rendering.
*   The registry dynamically parses the `uiSchema`, maps canonical field paths, formats raw values, and renders UI section components cleanly.

### 2. Contextual Data Formatters
*   **DATE**: Formats ISO timestamps or SAP date strings into readable localized dates.
*   **AMOUNT**: Formats values dynamically using original document currencies or VND (e.g. `12,500,000 VND`).
*   **QUANTITY**: Parses counts and appends unit descriptors (e.g., `100 EA`).
*   **BOOLEAN**: Renders as localized `Yes` or `No` badges.

### 3. Sub-Panels & Modals
*   **[`OverviewPanel.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/panels/OverviewPanel.tsx)**: Displays high-level header information, document status badges, and dynamic UI schema card sections.
*   **[`AttachmentsPanel.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/panels/AttachmentsPanel.tsx)**: Displays attached documents with file icons, sizes, and direct download/preview links.
*   **[`AttachmentPreviewModal.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/AttachmentPreviewModal.tsx)**: Renders inline image and PDF previews.

---

## 🌐 Localization & i18n

The application supports bilingual localization (English & Vietnamese) using standard JSON dictionaries located in [`app/cnma_approval_ui/src/locales/`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/locales/):
*   `en.json`: English translation strings for status codes, document types (PR, PO, Claim, Reservation), tab headers, decision actions, and error messages.
*   `vi.json`: Vietnamese translation strings for all UI components and document labels.
