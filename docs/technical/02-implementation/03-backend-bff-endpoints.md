# Backend BFF REST API Reference

> **Owner:** Lead CAP Architect & BFF Developer | **Last Updated:** 2026-07-22 | **Status:** Active

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
*   **Purpose**: Returns high-level metrics for dashboard cards (aggregates total active items, amounts, currencies, and document numbers across PR, PO, Claim, and Reservation document types).
*   **Response Payload Schema**:
    ```json
    {
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
*   **Response**: Standardized array containing unified metadata and basic document headers. Evaluates only the paginated subset of tasks against the SAP Gateway rather than pulling the full queue, preventing high latencies.

### 8. GET `/tasks/tasks/approved`
*   **Purpose**: Retrieve historical queue containing tasks processed by the user (`COMPLETED` state).
*   **Query Parameters**: Same as active worklist.

### 9. GET `/tasks/tasks/:id`
*   **Purpose**: Fetch the consolidated canonical detail payload for a single task. Returns header data, line items, workflow steps, comments, attachments, and dynamic UI layout definitions (`uiSchema`).
*   **URL Parameter**: `id` represents the unique Task Instance ID.
*   **Query Parameters**:
    *   `typeid` (Optional): Fallback task definition code.
    *   `instid` (Optional): Target document ID (e.g. PR/PO/Claim/Reservation number).
    *   `businessObjectType` (Optional): Explicit document classification (`PR`, `PO`, `CLAIM`, or `RE`).
*   **Response Payload Schema (Canonical Business Object format)**:
    ```json
    {
      "object": {
        "header": {
          "documentNumber": "10002341",
          "documentType": "ZASS",
          "createdByName": "John Doe",
          "createdAt": "2026-07-01T08:00:00.000Z",
          "totalNetAmount": 12500000,
          "currency": "VND"
        },
        "items": [
          {
            "itemNumber": "00010",
            "shortText": "MacBook Pro M3 Max",
            "quantity": 2,
            "unitOfMeasure": "EA",
            "netAmount": 12500000
          }
        ],
        "workflow": {
          "steps": [
            { "approver": "Manager A", "status": "APPROVED", "timestamp": "2026-07-02T10:00:00.000Z" }
          ],
          "comments": [
            { "author": "John Doe", "text": "Urgent request for Q3 project", "createdAt": "2026-07-01T08:05:00.000Z" }
          ]
        },
        "attachments": [
          { "id": "ATT_001", "fileName": "Quote_Sheet.pdf", "fileSize": 1048576, "mimeType": "application/pdf" }
        ],
        "uiSchema": {
          "title": "{{header.documentNumber}}",
          "sections": [
            { "id": "basic", "type": "CARD", "title": "Basic Data", "fields": ["documentNumber", "createdByName"] }
          ]
        }
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

### 12. POST `/tasks/tasks/:id/comments`
*   **Purpose**: Upload a text note into the timeline.
*   **Availability**: **Mock-only.** In direct SAP mode (`USE_MOCK_SAP=false`), this endpoint returns `405 Method Not Allowed` because the underlying OData V4 service is read-only.
*   **Payload Schema**:
    ```json
    {
      "text": "Please provide the official quote sheet.",
      "_context": {
        "documentId": "10002341"
      }
    }
    ```

### 13. POST `/tasks/tasks/:id/attachments`
*   **Purpose**: Upload a raw file attachment to the Generic Object Service (GOS).
*   **Availability**: **Mock-only.** In direct SAP mode (`USE_MOCK_SAP=false`), this endpoint returns `405 Method Not Allowed` because the underlying OData V4 service is read-only.
*   **Headers**:
    *   `slug`: URI-encoded file name.
    *   `content-type`: MIME specification (e.g., `application/pdf`).
    *   `x-document-id`: Associated document number.
*   **Payload**: Raw binary stream in body.

### 14. GET `/tasks/tasks/:id/attachments/:attId/content`
*   **Purpose**: Stream and download the binary contents of an attachment.
*   **Availability**: **Supported in both Mock and Real S/4HANA modes.** In real mode, it fetches the binary stream directly from S/4HANA's `ZI_DOC_ATTACH_CONTENT` OData service.
*   **Query Parameters**:
    *   `documentId` (Optional): Associated document number. If omitted in request query, the backend resolves `documentId` dynamically from the task context.
    *   `disposition` (Optional): `'inline'` (default, for browser preview) or `'attachment'` (to force download).
