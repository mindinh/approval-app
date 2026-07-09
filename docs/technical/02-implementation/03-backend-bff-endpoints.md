# Backend BFF REST API Reference

The **CNMA Approval** BFF backend does not expose default CDS OData endpoints. Instead, it exposes a custom REST API mounted at `/api/cnma/APPROVAL_SRV` in [server.ts](file:///d:/learning/test/cnma_approval/srv/server.ts) for optimal payload sizing, security control, and integration flexibility.

All API routes below are relative to:
```
/api/cnma/APPROVAL_SRV
```

---

## 🛠️ Debug Endpoints
These endpoints are designed for troubleshooting token bindings and user identities. Access requires the Solution Administrator role (`.admin` scope).

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

### 5. GET `/tasks/dashboard`
*   **Purpose**: Returns high-level metrics for dashboard cards (aggregates total active items, amounts, currencies, and document numbers).
*   **Response Payload Schema**:
    ```json
    {
      "items": [
        {
          "taskId": "000000021312",
          "documentNumber": "10002341",
          "taskType": "PR",
          "documentType": "ZASS",
          "documentTypeDesc": "ZASS",
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

### 6. GET `/tasks/tasks`
*   **Purpose**: Retrieve the current user's active approval queue (`IN PROCESSING` state).
*   **Query Parameters**:
    *   `top` (Optional): Maximum number of entries to return (for pagination).
    *   `skip` (Optional): Number of entries to skip.
*   **Response**: Standardized array containing unified metadata and basic document headers.

### 7. GET `/tasks/tasks/approved`
*   **Purpose**: Retrieve historical queue containing tasks processed by the user (`COMPLETED` state).
*   **Query Parameters**: Same as active worklist.

### 8. GET `/tasks/tasks/:id`
*   **Purpose**: Fetch the complete detail profile for a single task including general details, dynamic field definitions, decisions, comments list, and attachment list.
*   **URL Parameter**: `id` represents the unique Task Instance ID.
*   **Query Parameters**:
    *   `typeid` (Optional): Fallback task definition code.
    *   `instid` (Optional): Target document ID (e.g. PR/PO number).
    *   `businessObjectType` (Optional): Explicit classification (`PR` or `PO`).

### 9. GET `/tasks/tasks/:id/workflow-approval-tree`
*   **Purpose**: Fetch the timeline and release steps for the target document.
*   **Query Parameters**:
    *   `documentId`: Purchase Requisition/Order number.

---

## ✍️ Collaboration & Action Endpoints

### 10. POST `/tasks/tasks/:id/decision`
*   **Purpose**: Executes an approval or rejection decision.
*   **Payload Schema**:
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

### 11. POST `/tasks/tasks/:id/comments`
*   **Purpose**: Upload a text note into the timeline.
*   **Payload Schema**:
    ```json
    {
      "text": "Please provide the official quote sheet.",
      "_context": {
        "documentId": "10002341"
      }
    }
    ```

### 12. POST `/tasks/tasks/:id/attachments`
*   **Purpose**: Upload a raw file attachment to the Generic Object Service (GOS).
*   **Headers**:
    *   `slug`: URI-encoded file name.
    *   `content-type`: MIME specification (e.g., `application/pdf`).
    *   `x-document-id`: Associated PR/PO number.
*   **Payload**: Raw binary stream in body.

### 13. GET `/tasks/tasks/:id/attachments/:attId/content`
*   **Purpose**: Stream and download the binary contents of an attachment.
*   **Query Parameters**:
    *   `documentId`: Associated PR/PO number.
