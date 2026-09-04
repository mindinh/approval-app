# User Manual & Operations Guide

> **Owner:** Product Manager | **Last Updated:** 2026-09-03 | **Status:** Active

This guide describes how to operate the **CNMA Approval** portal to manage, review, and decide on procurement workflows.

---

## 📊 Dashboard Overview
When you first log in, you are presented with the **Dashboard**. The dashboard acts as your landing page and command center:
*   **Approval Queue Status**: Quick counter panels displaying the total number of pending items.
*   **Object Type Breakdown**: Distribution of tasks between Purchase Requisitions (PR), Purchase Orders (PO), Expense Claims (CLAIM), and Material Reservations (RE).
*   **Quick Search**: Start typing to filter tasks instantly.

---

## 📥 Inbox Worklist
The **Inbox** holds your structured task list:
*   **Tabs**: 
    *   `Active`: Current pending items requiring decision.
    *   `History`: Previously approved or processed tasks.
*   **Task Cards**: Each card displays key metadata summarizing the task at first glance:
    *   **Document Header Title**: Displays pure document numbers directly (e.g., `4500000001` or `1000000234`) for high scannability, paired with visual document category badges (`PR`, `PO`, `Claim`, `Reservation`).
    *   **Task Type Badge**: Displays a clear `"CC"` badge on Carbon Copy tasks to distinguish tagged comment-only tasks from standard approval tasks.
    *   Creator / Requester name.
    *   Creation date and age of the task.
    *   Total net amount (with display currency e.g., VND) and VND equivalency.
    *   Priority badges (Low, Medium, High, Very High) to help prioritize.
*   **Mobile Multi-Select Filter Sheets & Date Pickers**: On smartphone and tablet viewports, tapping multi-select filter fields opens an interactive bottom-sheet drawer with option search, "Select All" / Clear action buttons, and touch-friendly date range selection.
*   **Mass Action Mode & Bulk Decisions**:
    *   Activate selection mode to check multiple tasks.
    *   **CC Task Exclusion**: Carbon Copy (CC) review-only tasks cannot be approved or rejected. Their checkboxes appear disabled with an explanatory tooltip, and the **Select All** button automatically selects only actionable tasks.
    *   **Mass Task Summary View**: On desktop, selecting multiple tasks opens the summary screen showing your selected queue alongside an **Excluded Tasks — Review Only (CC)** section explaining skipped items.
    *   **Non-Blocking Mass Decision Dialog**: Approving or rejecting prompts a confirmation dialog (rejection reason mandatory, approval note optional). Once confirmed, the dialog closes immediately and decisions process in the background.
    *   **Smart Toast Progress**: A single aggregated toast summarizes successful completions (e.g. `10/10 tasks approved successfully`), while individual toasts alert you to any specific document failures.
*   **Mobile Pull to Refresh**: On touch mobile devices, swipe down from top of the task list or detail view to instantly refresh your pending approval queue and latest document details.

---

## 🔍 Task Detail Panels
Clicking a Task Card loads its comprehensive details in a split-screen view:

### 1. General Information & Items
Displays header data (Company Code, Purchasing Organization, Supplier, total net value) followed by customized subtype layouts (Asset PR/PO, Subcontracting, Toll Manufacturing, Service PR/PO, Stock Transfer, Expense Claim). For each line item:
*   **View Mode Switcher (`Table` vs `Card Grid`)**: Toggle between standard desktop table layout and responsive card grid view for line items.
*   **Item Deletion Indicators**: Line items marked as deleted in S/4HANA are clearly flagged with red background styling, strike-through text, and a **Trash** icon (`Item Deleted`).
*   Item Number and description.
*   Quantity, Unit of Measure, Net Price, and Net Value.
*   Material Group.
*   **Reference Purchase Requisition Link**: If a Purchase Order line item references an original Purchase Requisition, clicking the reference link opens the original requisition directly in SAP S/4HANA Fiori Launchpad in a new browser tab.
*   **Account Assignments** (available on expansion): Cost Center, Profit Center, Asset Number, and G/L Account.

### 2. Workflow Approval Tree
Located in the **Workflow** tab, this panel displays the hierarchy of the approval strategy:
*   Chronological steps in the release strategy.
*   Release Stage titles (e.g. *Department Manager Approval*, *Finance Sign-off*) rendered alongside release codes.
*   Who has already approved, who is the current agent, and who is up next.
*   Timestamps and decision status (Approved, Rejected, In Approving, Pending) for each agent.
*   **Visual Rejection Highlights**: Rejected steps are prominently styled with red badges (`Rejected`), red timeline markers (X-circle icon with pulse effect), red status text, "Rejected Date:" labels, and highlighted red comment containers.

### 3. Attachments Panel
Located in the **Attachments** tab, this manages related files:
*   **View & Download**: Lists existing attachments fetched from S/4HANA. Clicking on a document streams and previews it directly in the embedded modal (supporting PDF, images, and plain text files such as `.txt`, `.json`, `.csv`, `.xml`). Clicking download saves the file while preserving its original filename and extension.
*   **Upload**: Disabled in standard view to maintain S/4HANA audit trail immutability.

### 4. Comments Panel
Located in the **Comments** tab, this acts as the collaboration log:
*   **Timeline View**: Displays notes written by previous approvers and comments pulled from the ERP (`_Comment` navigation).
*   **Forward Audit Log Indicators**: Delegated task notes display an inline indicator strip with directional arrows (`Forwarded by User A -> User B`) to clearly highlight task re-assignments in the comment log.
*   **Rich User Mentions (`@mention`)**: Type `@` into the comment box to activate the user dropdown autocompletion. Select a colleague from the list to mention them directly in your comment thread.
*   **Post Comment**: Type a new comment and click **Send** to post it to the ERP document note history.

---

## ✍️ Executing Decisions & Delegating Tasks
When you are ready to make a decision or delegate a task, use the floating **Task Action Panel**:

1.  **Approve or Reject**:
    *   Click **Approve** or **Reject**.
    *   If rejecting, enter a justification comment in the input area.
    *   Confirm the action. The portal pushes the decision code (`A` for Approve, `R` for Reject) and comment to SAP Task Gateway, updating your worklist.

2.  **Forward Task**:
    *   Click **Forward** in the action bar to delegate the task to another user.
    *   In the **Forward Task** dialog, search for the target user by name or user ID.
    *   Enter an optional delegation note explaining why the task is being forwarded.
    *   Click **Forward Task**. The task is re-assigned to the target user in SAP Task Gateway, an audit comment `[Forwarded to ${forwardTo}] ${comment}` is recorded on the ERP document history, and the task is removed from your active queue.
    *   **CC Task Restriction**: For Carbon Copy (CC) tasks (`TaskType == 'CC'`), the Forward button is automatically disabled and hidden, as CC tasks are comment-only notifications.

3.  **Tag User (CC Notification)**:
    *   Click **Tag User** in the action bar to select business colleagues for notification.
    *   Search and select users from the `CNMA_BUSUSER` directory dialog to attach CC mentions to your comment.

4.  **Notifications & Toast Feedback**:
    *   Action confirmations and errors render in mobile-responsive Sonner toast notifications at the screen edge, complete with swipe-to-dismiss support and explicit dismiss buttons.
    *   If a network failure or SAP Gateway exception occurs, an **Error Modal** appears explaining the root cause and HTTP status code.


