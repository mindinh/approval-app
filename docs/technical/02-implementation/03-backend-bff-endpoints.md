# Backend BFF REST API Reference

> **Owner:** Lead CAP Architect & BFF Developer | **Last Updated:** 2026-07-31 | **Status:** Active

The **CNMA Approval** BFF backend exposes a custom REST API mounted at `/api/cnma/APPROVAL_SRV` in [server.ts](file:///d:/learning/test/cnma_approval/srv/server.ts) for optimal payload sizing, security control, and integration flexibility.

All API routes below are relative to:
```
/api/cnma/APPROVAL_SRV
```

---

## 🛠️ Debug Endpoints
These endpoints are designed for troubleshooting configurations, token bindings, and user identities.

### 1. GET `/debug-config`
*   **Purpose**: Get a diagnostics dump of all loaded JSON configuration objects, alias maps, and configuration directory resolution status.
*   **Authentication**: Unauthenticated (bypasses JWT checks for easy browser/curl diagnostic access).
*   **Response Payload Schema**:
    ```json
    {
      "resolvedConfigDir": "d:\\learning\\test\\cnma_approval\\srv\\configuration\\object-types",
      "configDirExists": true,
      "configsLoaded": ["CLAIM", "PO", "PR", "RESERVATION"],
      "aliases": {
        "BUS2081": "PO",
        "BUS2105": "PR"
      },
      "configs": { ... }
    }
    ```

### 2. GET `/tasks/debug/current-user`
*   **Purpose**: Get details about the resolved SAP User and BTP Identity.
*   **Response Headers Analyzed**: Reads incoming `x-sap-user` (for development mocks) and standard JWT authorization.
*   **Response Payload Schema**:
    ```json
    {
      "id": "MOCK_USER",
      "sapUser": "MOCK_USER",
      "isImpersonated": true,
      "hasJwt": false,
      "tokenSource": "header",
      "jwt": null,
      "claims": null
    }
    ```

### 3. GET `/tasks/debug/jwt`
*   **Purpose**: Read and decode the raw JWT authorization token payload.
*   **Response Payload Schema**: Returns raw token preview, decoded claims, and raw claims envelope.

### 4. GET `/tasks/debug/auth-summary`
*   **Purpose**: Returns a diagnostic summary mapping BTP configuration variables, Cloud Connector destination links, and parsed authorization header presence.

---

## 👤 Identity & Dashboard Endpoints

### 5. GET `/tasks/me`
*   **Purpose**: Resolves logged-in user profile, displaying name, email, and resolved role scope (Admin vs User).
*   **Response Payload Schema**:
    ```json
    {
      "id": "MOCK_USER",
      "sapUser": "MOCK_USER",
      "displayName": "Mock Developer",
      "firstName": "Mock",
      "lastName": "Developer",
      "role": "Admin",
      "email": "mock_user@conarum.com"
    }
    ```

### 6. GET `/tasks/dashboard`
*   **Purpose**: Returns high-level metrics for dashboard cards (aggregates status counts, document type counts, items, total active amounts, currencies, and document numbers across PR, PO, Claim, and Reservation document types).
*   **Response Payload Schema**:
    ```json
    {
      "statusCounts": [
        { "WorkflowTaskStatus": "IN PROCESSING", "statusLabel": "In Approving", "count": 10 },
        { "WorkflowTaskStatus": "COMPLETED", "statusLabel": "Completed", "count": 25 }
      ],
      "docTypeCounts": [
        { "DocCategory": "BUS2105", "count": 6 },
        { "DocCategory": "BUS2012", "count": 4 }
      ],
      "items": [
        {
          "taskId": "000000021312",
          "documentNumber": "10002341",
          "taskType": "PR",
          "documentType": "ZASS",
          "documentTypeDesc": "Purchase Requisition",
          "status": "IN_PROCESSING",
          "currency": "VND",
          "totalNetAmount": 12500000,
          "displayCurrency": "VND",
          "createdAt": "2026-07-01T08:00:00.000Z"
        }
      ],
      "total": 1
    }
    ```

---

## 📥 Worklist & Detail Endpoints

### 7. GET `/tasks/tasks`
*   **Purpose**: Retrieve the current user's active approval queue (`IN PROCESSING` state).
*   **Query Parameters**:
    *   `top` (Optional): Maximum number of entries to return (for pagination).
    *   `skip` (Optional): Number of entries to skip.
*   **Performance Optimization**: Task list data is fetched directly from CDS view `ZC_WORKFLOWTASK` via `SapOdataAdapter.getInstances()`. Redundant `TASKPROCESSING/TaskCollection` calls have been eliminated, cutting query latency by 50%.

### 8. GET `/tasks/tasks/approved`
*   **Purpose**: Retrieve historical queue containing tasks processed by the user (`COMPLETED` state).
*   **Query Parameters**: Same as active worklist.

### 9. GET `/tasks/:id`
*   **Purpose**: Fetch the consolidated canonical detail payload for a single task. Returns header data, line items, workflow steps, comments (filtered of empty/system noise), attachments, decisions, and dynamic UI layout definitions (`uiSchema`).
*   **URL Parameter**: `id` represents the unique Task Instance ID.
*   **Query Parameters**:
    *   `typeid` (Optional): Fallback task definition code.
    *   `instid` (Optional): Target document ID (e.g. PR/PO/Claim/Reservation number).
    *   `businessObjectType` (Optional): Explicit document classification (`PR`, `PO`, `CLAIM`, or `RE`).
*   **Response Payload Schema (Flat Canonical Format)**:
    ```json
    {
      "taskId": "198820",
      "instanceId": "198820",
      "status": "IN_PROCESSING",
      "priority": "MEDIUM",
      "createdOn": "2026-07-27T04:54:59.000Z",
      "createdByName": "SAP_WFRT",
      "requestorName": "MINHDT",
      "objectType": "PR",
      "documentId": "0010001861",
      "documentType": "ZEXP",
      "documentTypeDisplay": "ZEXP - Expense PR",
      "companyCode": "1710",
      "companyCodeDisplay": "1710 - Company Code 1710",
      "total": 426.4,
      "currency": "USD",
      "releaseStrategyName": "Release Strategy 1",
      "normalTask": true,
      "decisions": [
        { "key": "0001", "text": "Approve", "nature": "POSITIVE", "commentMandatory": false },
        { "key": "0002", "text": "Reject", "nature": "NEGATIVE", "commentMandatory": false }
      ],
      "approvalSteps": [
        { "documentId": "0010001861", "level": 1, "releaseCode": "Z1", "approver": "Hieu Lam Chi", "approverUserId": "HIEULC", "status": "PENDING", "noteText": "", "postedOn": "", "postedTime": "00:00:00" }
      ],
      "items": [
        {
          "item": "10",
          "plant": "1710 - US TRADING PLANT",
          "shortText": "test1",
          "materialGroup": "01 - Material group 01",
          "quantity": 100,
          "unit": "PC",
          "deliveryDate": "2026-07-30T00:00:00.000Z",
          "price": 100000,
          "totalAmount": 10000000,
          "glAccount": "65100000 - Office Supplies",
          "commitmentItemShortId": "1001201000 - Chi phí công tác-test",
          "documentCurrency": "VND",
          "localCurrency": "USD"
        }
      ],
      "attachments": [],
      "comments": [],
      "task": {
        "instanceId": "198820",
        "sapOrigin": "LOCAL",
        "title": "Please release purchase requisition 10001861",
        "status": "READY",
        "priority": "MEDIUM",
        "createdOn": "2026-07-27T04:54:59.000Z",
        "requestorName": "MINHDT",
        "taskDefinitionId": "TS20000159",
        "supports": { "forward": true, "comments": true },
        "businessContext": { "type": "PR", "documentId": "0010001861" },
        "total": 426.4,
        "curr_vnd": "USD",
        "normalTask": true
      },
      "header": {
        "purchaseRequisition": "0010001861",
        "userFullName": "MINHDT",
        "purchaseRequisitionType": "ZEXP",
        "purchaseRequisitionTypeDisplay": "ZEXP - Expense PR",
        "companyCodeDisplay": "1710 - Company Code 1710",
        "companyCode": "1710",
        "totalNetAmount": 426.4,
        "displayCurrency": "USD",
        "releaseStrategyName": "Release Strategy 1",
        "createdOn": "2026-07-27T00:00:00.000Z"
      },
      "workflow": {
        "strategyName": "Release Strategy 1",
        "steps": [
          { "documentId": "0010001861", "level": 1, "releaseCode": "Z1", "approver": "Hieu Lam Chi", "approverUserId": "HIEULC", "status": "PENDING" }
        ],
        "comments": []
      }
    }
    ```

### 10. GET `/tasks/tasks/:id/workflow-approval-tree` [DEPRECATED]
*   **Status**: **Deprecated.**
*   **Deprecation Note**: Workflow approval steps and comment logs are now included directly inside `object.workflow.steps` and `object.workflow.comments` within the primary `GET /tasks/tasks/:id` response, eliminating redundant network roundtrips.

---

## ✍️ Collaboration & Action Endpoints

### 11. POST `/tasks/tasks/:id/decision`
*   **Purpose**: Executes an approval or rejection decision.
*   **Request Payload Schema**:
    ```json
    {
      "decisionKey": "0001",
      "sapDecisionKey": "0001",
      "comment": "Approved upon review of documentation.",
      "_context": {
        "documentId": "10002341",
        "businessObjectType": "PR"
      }
    }
    ```
*   **Response Payload Schema**:
    ```json
    {
      "success": true,
      "result": {
        "instanceId": "task-pr-01",
        "decisionKey": "0001",
        "status": "COMPLETED",
        "message": "Decision 0001 executed successfully."
      }
    }
    ```

### 12. POST `/tasks/tasks/:id/comments`
*   **Purpose**: Post a comment note into the document timeline.
*   **Request Payload Schema**:
    ```json
    {
      "text": "Please provide the official quote sheet.",
      "_context": {
        "documentId": "10002341"
      }
    }
    ```
*   **Response Payload Schema**:
    ```json
    {
      "success": true,
      "message": "Comment added successfully."
    }
    ```

### 13. POST `/tasks/tasks/:id/attachments` & POST `/tasks/pr/:docNum/attachments` [DISABLED]
*   **Status**: **Disabled.**
*   **Response**: Returns `403 Forbidden` (`"Attachment upload is disabled."`). Upload functionality is hidden in the user interface.

### 14. GET `/tasks/tasks/:id/attachments/:attId/content` & GET `/tasks/pr/:docNum/attachments/:attachId/content`
*   **Purpose**: Stream and download the binary contents of an attachment.
*   **Availability**: **Supported in both Mock and Real S/4HANA modes.** In real mode, it fetches the binary stream directly from S/4HANA's `ZI_DOC_ATTACH_CONTENT` OData service.
*   **Query Parameters**:
    *   `documentId` (Optional): Associated document number. If omitted in request query, the backend resolves `documentId` dynamically from the task context.
    *   `disposition` (Optional): `'inline'` (default, for browser preview) or `'attachment'` (to force download).

