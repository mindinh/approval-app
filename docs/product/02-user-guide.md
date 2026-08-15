# User Manual & Operations Guide

This guide describes how to operate the **CNMA Approval** portal to manage, review, and decide on procurement workflows.

---

## 📊 Dashboard Overview
When you first log in, you are presented with the **Dashboard**. The dashboard acts as your landing page and command center:
*   **Approval Queue Status**: Quick counter panels displaying the total number of pending items.
*   **Object Type Breakdown**: Distribution of tasks between Purchase Requisitions (PR) and Purchase Orders (PO).
*   **Quick Search**: Start typing to filter tasks instantly.

---

## 📥 Inbox Worklist
The **Inbox** holds your structured task list:
*   **Tabs**: 
    *   `Active`: Current pending items requiring decision.
    *   `History`: Previously approved or processed tasks.
*   **Task Cards**: Each card displays key metadata summarizing the task at first glance:
    *   Document Type and Number.
    *   Creator / Requester name.
    *   Creation date and age of the task.
    *   Total net amount (with display currency e.g., VND) and VND equivalency.
    *   Priority badges (Low, Medium, High, Very High) to help prioritize.
*   **Mass Action Mode**: Check the checkboxes on multiple task cards to activate the mass action bar at the bottom, allowing you to approve several documents at once.
*   **Mobile Pull to Refresh**: On touch mobile devices, swipe down from top of the task list to instantly refresh your pending approval queue.

---

## 🔍 Task Detail Panels
Clicking a Task Card loads its comprehensive details in a split-screen view:

### 1. General Information & Items
Displays header data (Company Code, Purchasing Organization, Supplier, total net value) followed by customized subtype layouts (Asset PR/PO, Subcontracting, Toll Manufacturing, Service PR/PO, Stock Transfer). For each line item:
*   Item Number and description.
*   Quantity, Unit of Measure, Net Price, and Net Value.
*   Material Group.
*   **Reference Purchase Requisition Drawer**: If a Purchase Order line item references an original Purchase Requisition, click the **Reference PR** badge (e.g. `PR 10000042 / 00010`) to launch a slide-over drawer displaying original PR header notes, items, quantities, and account assignments without navigating away.
*   **Account Assignments** (available on expansion): Cost Center, Profit Center, Asset Number, and G/L Account.

### 2. Workflow Approval Tree
Located in the **Workflow** tab, this panel displays the hierarchy of the approval strategy:
*   Chronological steps in the release strategy.
*   Release Stage titles (e.g. *Department Manager Approval*, *Finance Sign-off*) rendered alongside release codes.
*   Who has already approved, who is the current agent, and who is up next.
*   Timestamps and decision status (Approve, Reject, Pending) for each agent.

### 3. Attachments Panel
Located in the **Attachments** tab, this manages related files:
*   **View & Download**: Lists existing attachments fetched from S/4HANA. Clicking on a document streams and previews it directly in the embedded modal (supporting PDF, images, and plain text files such as `.txt`, `.json`, `.csv`, `.xml`). Clicking download saves the file while preserving its original filename and extension.
*   **Upload**: Disabled in standard view to maintain S/4HANA audit trail immutability.

### 4. Comments Panel
Located in the **Comments** tab, this acts as the collaboration log:
*   **Timeline View**: Displays notes written by previous approvers and comments pulled from the ERP (`_Comment` navigation).
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

3.  **Tag User (CC Notification)**:
    *   Click **Tag User** in the action bar to select business colleagues for notification.
    *   Search and select users from the `CNMA_BUSUSER` directory dialog to attach CC mentions to your comment.

4.  **Error Handling**:
    *   If a network failure or SAP Gateway exception occurs, a clear **Error Modal** appears explaining the exact root cause, HTTP status code, and actionable advice to resolve the issue.


