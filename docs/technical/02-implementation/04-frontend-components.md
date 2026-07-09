# Frontend Component Architecture & Dynamic Registry

This document details the React component hierarchy, state synchronization patterns, and the dynamic UI section rendering registry of the **CNMA Approval** frontend.

---

## 🎨 Page Layouts and Composition

The frontend application uses a clean, mobile-first split-pane structure for the inbox workspace:

```
[Dashboard Pages] -> Main summaries and quick status numbers
[Inbox Page] -> Master-Detail Layout:
  ├── Left Pane: TaskList.tsx
  │     ├── TaskCard.tsx (Task title, priorities, prices)
  │     └── TaskPagination.tsx
  └── Right Pane: TaskDetailView.tsx
        ├── Dynamic Header & Subtitle
        ├── Dynamic Rendered Cards & Tables (General Info, Line Items)
        ├── Tabbed View Panels:
        │     ├── CommentsPanel.tsx
        │     ├── AttachmentsPanel.tsx (AttachmentPreviewModal.tsx)
        │     └── WorkflowApprovalPanel.tsx
        └── Action Panel: DecisionPanel.tsx (Floating actions Approve/Reject)
```

---

## ⚡ Data Sync & State Management (React Query)

The frontend relies on **React Query (TanStack Query v5)** for managing asynchronous server states and caching:
*   **Query Keys**:
    *   `['tasks', 'active', pagination]`: Key for cache control on active items.
    *   `['tasks', 'history', pagination]`: Key for processed approval history.
    *   `['tasks', 'detail', instanceId]`: Key for single detail data records.
    *   `['workflow-approval-tree', documentId]`: Key for progress step elements.
*   **Mutations**:
    *   Posting comment runs `useMutation` which invalidates `['tasks', 'detail', instanceId]`.
    *   Posting a decision runs `useMutation` which invalidates both `['tasks', 'active']` and `['tasks', 'history']` to trigger automatic re-fetches and list sweeps.

---

## 🏛️ Dynamic Detail View Registry

To handle different procurement objects (Purchase Requisition vs Purchase Order) without hardcoding UI controls, the application uses a dynamic registry engine in [TaskDetailSections.registry.ts](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/TaskDetailSections.registry.ts):

### 1. Dynamic Layout Schema Engine
If the backend details response contains a `fieldSchema` and a `uiSchema`:
*   `fieldSchema`: Defines field paths (JSONPath style `$.header.vendor`), data types (`DATE`, `AMOUNT`, `QUANTITY`, `BOOLEAN`), and labels.
*   `uiSchema`: Defines the card and table layouts, referencing field keys.
*   The registry dynamically parses the schemas, queries values via JSONPath, formats the values, and draws sections accordingly.

### 2. Contextual Data Formatters
*   **DATE**: Formats raw ISO timestamps into readable localized dates (e.g., `YYYY-MM-DD`).
*   **AMOUNT**: Formats values dynamically using original document currencies or VND (e.g. `12,500,000 VND`).
*   **QUANTITY**: Parses counts and suffixes them with unit descriptors (e.g., `100 PC`).
*   **BOOLEAN**: Renders as `Yes` or `No`.

### 3. Conditional Visibility Engine
Sections can define a `visibleWhen` block:
*   **Operators**: `exists`, `eq`, `neq`, `gt`, `lt`.
*   **Example**: A section showing "Asset Class details" only renders if the general header field `purchaseRequisitionType` matches a specific value, or a "Warning Card" only renders if `budgetStatus` is not `'OK'`.

### 4. Static Fallback Renderers
If no dynamic schema is returned by the BFF:
*   `poTaskDetailRenderer`: Builds columns and cards suitable for Purchase Orders.
*   `prTaskDetailRenderer`: Builds columns and cards suitable for Purchase Requisitions.
*   `defaultTaskDetailRenderer`: Basic catch-all card fallback.
