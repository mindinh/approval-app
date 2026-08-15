# Backend BFF REST API Reference

> **Owner:** Lead CAP Architect & BFF Developer | **Last Updated:** 2026-08-15 | **Status:** Active

The **CNMA Approval** BFF backend exposes a custom REST API mounted at `/api/cnma/APPROVAL_SRV` in [server.ts](file:///d:/learning/test/cnma_approval/srv/server.ts) for optimal payload sizing, security control, and integration flexibility.

All API routes below are relative to:
```
/api/cnma/APPROVAL_SRV
```

---

## 🛠️ Debug Endpoints
These endpoints are designed for troubleshooting token bindings, user identities, and auth headers.

### 1. GET `/tasks/debug/current-user`
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

### 2. GET `/tasks/debug/jwt`
*   **Purpose**: Read and decode the raw JWT authorization token payload.
*   **Response Payload Schema**: Returns raw token preview, decoded claims, and raw claims envelope.

### 3. GET `/tasks/debug/auth-summary`
*   **Purpose**: Returns a diagnostic summary mapping BTP configuration variables, Cloud Connector destination links, and parsed authorization header presence.

---

## 👤 Identity & Dashboard Endpoints

### 4. GET `/tasks/me`
*   **Purpose**: Resolves logged-in user profile, displaying name, email, and resolved role scope.
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

### 5. GET `/tasks/dashboard`
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

### 6. GET `/reference-pr/:prNumber`
*   **Purpose**: Fetches detailed header and line item context for a Reference Purchase Requisition from SAP API `API_PURCHASEREQ_PROCESS_SRV` or local mock provider when referenced by a PO line item.
*   **Path Parameters**: `:prNumber` (Required) — 10-digit Purchase Requisition number (e.g., `10000042`).
*   **Response Payload Schema**:
    ```json
    {
      "purchaseRequisition": "10000042",
      "purReqType": "ZNB1",
      "purReqTypeDisplay": "ZNB1 - Standard PR",
      "createdByUser": "MINHDT",
      "userFullName": "Do Tu Minh",
      "headerText": "Quarterly IT Hardware Replenishment",
      "totalNetAmount": 45000000,
      "currency": "VND",
      "items": [
        {
          "purchaseRequisitionItem": "00010",
          "material": "MAT-IT-001",
          "materialDescription": "ThinkPad Laptop Core i7",
          "requestedQuantity": 5,
          "baseUnit": "EA",
          "purchaseRequisitionPrice": 9000000,
          "purReqNetAmount": 45000000,
          "plant": "1000",
          "costCenter": "CC-IT-01"
        }
      ]
    }
    ```

---

## 📋 Task Details & Worklist Endpoints

### 7. GET `/tasks/tasks`
*   **Purpose**: Retrieve the current user's active approval queue (`IN PROCESSING` state).
*   **Query Parameters**: `top` (Optional), `skip` (Optional).

### 8. GET `/tasks/tasks/approved`
*   **Purpose**: Retrieve historical queue containing tasks processed by the user (`COMPLETED` state).

### 9. GET `/tasks/tasks/:id`
*   **Purpose**: Fetch raw business object and taskprocessing details concurrently. Returns minimal envelope with unmapped SAP OData structure and workflow execution state.
*   **URL Parameter**: `:id` represents the unique Task Instance ID.
*   **Query Parameters**:
    *   `typeid` (Optional): Fallback task definition code.
    *   `instid` (Optional): Target document ID.
    *   `businessObjectType` (Optional): Explicit document classification (`PR`, `PO`, `CLAIM`, or `RE`).
*   **Response Payload Schema (Raw Envelope Format)**:
    ```json
    {
      "businessObject": {
        "DocumentNumber": "0010001861",
        "DocCategory": "BUS2105",
        "DocumentType": "ZEXP",
        "DocumentTypeText": "Expense PR",
        "CreatedByUser": "MINHDT",
        "UserName": "Do Tu Minh",
        "CompanyCode": "1710",
        "CompanyCodeName": "US TRADING COMPANY",
        "TotalNetAmountLocalCrcy": 426.4,
        "LocalCurrency": "USD",
        "ReleaseStrategyName": "Release Strategy 1",
        "CreationDate": "2026-07-27",
        "CreationTime": "04:54:59",
        "_Item": [
          {
            "PurchaseRequisitionItem": "00010",
            "Plant": "1710",
            "PlantName": "US TRADING PLANT",
            "ShortText": "Office Supplies Requisition",
            "MaterialGroup": "01",
            "MaterialGroupName": "Material group 01",
            "RequestedQuantity": 100,
            "BaseUnit": "PC",
            "ValuationPrice": 100000,
            "TotalValue": 10000000,
            "GLAccount": "65100000",
            "GLAccountName": "Office Supplies"
          }
        ],
        "_ApprovalStep": [
          {
            "ApprovalLevel": 1,
            "ReleaseCode": "Z1",
            "ReleaseText": "Manager Approval",
            "ApproverName": "Hieu Lam Chi",
            "ApprovalStatus": "PENDING"
          }
        ],
        "_Comment": [],
        "_Attachment": []
      },
      "taskprocessing": {
        "task": {
          "instanceId": "198820",
          "sapOrigin": "LOCAL",
          "title": "Please release purchase requisition 10001861",
          "status": "READY",
          "priority": "MEDIUM",
          "createdOn": "2026-07-27T04:54:59.000Z",
          "requestorName": "MINHDT"
        },
        "decisionOptions": [
          { "decisionKey": "0001", "decisionText": "Approve", "nature": "POSITIVE" },
          { "decisionKey": "0002", "decisionText": "Reject", "nature": "NEGATIVE" }
        ]
      }
    }
    ```

---

## ✍️ Collaboration & Action Endpoints

### 10. POST `/tasks/tasks/:id/decision`
*   **Purpose**: Executes an approval or rejection decision on SAP Task Gateway and updates ERP document notes when comments are provided.
*   **Request Payload Schema**:
    ```json
    {
      "decisionKey": "0001",
      "sapDecisionKey": "0001",
      "comment": "Approved upon review.",
      "_context": {
        "documentId": "10001861",
        "businessObjectType": "PR"
      }
    }
    ```
*   **Response Payload Schema**:
    ```json
    {
      "success": true,
      "result": {
        "instanceId": "198820",
        "decisionKey": "0001",
        "status": "COMPLETED",
        "message": "Decision 0001 executed successfully."
      }
    }
    ```

### 11. POST `/tasks/tasks/:id/comments`
*   **Purpose**: Add a new timeline comment note to the SAP business document.
*   **Request Payload Schema**:
    ```json
    {
      "text": "Please clarify specification on line 10.",
      "_context": {
        "documentId": "10001861"
      }
    }
    ```

### 12. GET `/tasks/tasks/:id/attachments/:attId/content/:filename`
*   **Purpose**: Stream binary attachment content directly from SAP S/4HANA document attachment store while preserving original filename and MIME disposition.

### 13. GET `/tasks/search-users`
*   **Purpose**: Search system users for task forwarding/delegation dialog autocompletion.
*   **Query Parameters**: `SearchPattern` or `q` (Search text string e.g. `minh`).
*   **Response Payload Schema**:
    ```json
    {
      "value": [
        {
          "userId": "MINHDT",
          "uniqueName": "MINHDT",
          "displayName": "Do Tu Minh",
          "email": "minh.do@conarum.com",
          "department": "IT Procurement"
        }
      ]
    }
    ```

### 14. GET `/tasks/bus-users`
*   **Purpose**: Query `CNMA_BUSUSER` business users table for `@mention` user tagging and CC notification dialog autocompletion.
*   **Query Parameters**: `q` or `SearchPattern` (Search query string e.g. `dung`).
*   **Response Payload Schema**:
    ```json
    {
      "value": [
        {
          "SAPUserName": "DUNGNV",
          "FirstName": "Nguyen Van",
          "LastName": "Dung",
          "FullName": "Nguyen Van Dung",
          "EmailAddress": "dung.nguyen@conarum.com"
        }
      ]
    }
    ```

### 15. POST `/tasks/tasks/:id/forward`
*   **Purpose**: Forwards a workflow task instance to another SAP user, and records a formatted audit comment `[Forwarded to ${forwardTo}] ${comment}` on the underlying document note in S/4HANA.
*   **Request Payload Schema**:
    ```json
    {
      "forwardTo": "DUNGNV",
      "comment": "Please review technical line items before approval.",
      "_context": {
        "documentId": "10001861",
        "businessObjectType": "PR"
      }
    }
    ```
*   **Response Payload Schema**:
    ```json
    {
      "success": true,
      "result": {
        "instanceId": "198820",
        "forwardTo": "DUNGNV",
        "status": "FORWARDED"
      }
    }
    ```
