# Product Introduction & Capabilities

## 🎯 Purpose
The **CNMA Approval** application is a lightweight, mobile-first workflow management portal designed to streamline operational review processes for procurement items. It serves as a unified approval workspace (BFF + UI) that aggregates pending requests directly from backend ERP systems (SAP S/4HANA & SAP Task Gateway) into a single, high-performance interface.

The solution enables executives, procurement leads, and managers to review, comment on, and approve or reject purchase requisitions and purchase orders on-the-go without navigating complex ERP interfaces.

---

## 🚀 Key Capabilities

### 1. Multi-Object Approval Support
The portal dynamically formats and renders details for different types of procurement objects:
*   **Purchase Requisitions (PR)**: Used for internal approval of purchasing requests.
*   **Purchase Orders (PO)**: Used for external-facing contractual commitments to suppliers.

### 2. Comprehensive Worklist & Dashboard
*   **Metric Badges**: Real-time aggregation of pending approvals based on priority, document type, and values.
*   **Active vs History Worklists**: Access to current tasks needing decision (`IN PROCESSING`) and historical logs of already processed tasks (`COMPLETED`).
*   **Filtering, Sorting & Pagination**: Optimized to handle high volumes of workflow items efficiently.

### 3. Dynamic Detail Views
*   **Dynamic Sections Renderer**: Automatically displays fields customized to the object type (e.g., Company Code, Purchasing Org, Supplier, Item tables, Account Assignments, G/L accounts).
*   **Workflow Approval Tree**: Visual representation of the approval steps, including current level, pending approvers, and previous signatures.

### 4. Rich Interactivity & Collaboration
*   **Real-time Comments**: Post notes and view discussion logs directly within the task context. Comments are synchronized with the S/4HANA backend to keep records unified.
*   **Attachment Handling**: Stream and preview attachments (e.g., PDFs, invoices, quotation sheets) straight from the ERP.
*   **Individual & Mass Actions**: Execute decisions (Approve, Reject) for a single document or select multiple tasks to approve in bulk.

---

## 💡 Business Benefits
*   **Accelerated Approval Cycles**: Reduced bottlenecks in purchasing workflows by enabling decisions from any device.
*   **Clean Core Strategy**: Custom UX and aggregation logic live on SAP BTP, keeping the core S/4HANA systems standard and lightweight.
*   **Audit Compliance**: All decisions, comments, and attachments are pushed back to the ERP system of record, maintaining a full audit trail.
