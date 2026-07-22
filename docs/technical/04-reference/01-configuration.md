# System Configuration & Object Mapping Reference

> **Owner:** Lead CAP Architect | **Last Updated:** 2026-07-22 | **Status:** Active

This document provides a reference guide for runtime environment variables, BTP destination settings, and declarative object type mapping configurations (`config.json`).

---

## ⚙️ Environment Variables (`.env`)

The BFF reads environment variables at launch to control connection mode, destinations, ports, and authentication parameters.

| Variable Name | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `PORT` | No | `4005` | The local port on which the Express server mounts. |
| `USE_MOCK_SAP` | No | `true` | **Mock switch**. Set to `false` to fetch details from real S/4HANA systems. Set to `true` (or omit) to use local mock JSON providers. |
| `SAP_USE_DESTINATION` | No | `false` | **Connectivity profile**. Set to `true` to use BTP destination lookup via SAP Cloud SDK. Set to `false` to connect directly using Axios base URLs. |
| `SAP_TASK_DESTINATION` | Conditional | `SAP_ABAP_BACKEND` | The name of the destination configured in BTP to connect to S/4HANA (used when `SAP_USE_DESTINATION=true`). |
| `SAP_TASK_BASE_URL` | Conditional | - | Direct base URL of the S/4HANA host (e.g. `http://s4hanadev.ais-tech.vn:8000`) used when `SAP_USE_DESTINATION=false`. |
| `SAP_TASK_CLIENT` | Conditional | - | SAP Client ID (e.g. `100`) passed in HTTP headers. |
| `SAP_TASK_USER` | Conditional | - | Username for direct SAP basic authentication. |
| `SAP_TASK_PASSWORD` | Conditional | - | Password for direct SAP basic authentication. |
| `SAP_DEV_JWT` | No | - | Long-lived test JWT token payload to simulate principal authentication on local proxy requests. |

---

## 📋 Declarative Object Mapping Schema (`config.json`)

Each business object type configuration is stored under `srv/configuration/object-types/{objectType}/config.json` (e.g., `pr`, `po`, `claim`, `reservation`).

### Configuration File Structure

```json
{
  "object": {
    "objectType": "PR",
    "displayName": "Purchase Requisition",
    "version": 1,
    "adapter": "PR_DETAIL",
    "aliases": ["BUS2105"],
    "enabledSections": {
      "header": true,
      "items": true,
      "workflow": true,
      "comments": true,
      "attachments": true
    }
  },
  "source": {
    "service": "APPROVAL_SRV",
    "rootEntity": "ZC_PRHEADER",
    "key": [
      { "name": "DocCategory", "value": "BUS2105" },
      { "name": "DocumentNumber", "fromContext": "documentId" }
    ],
    "navigations": {
      "items": "_Item",
      "comments": "_Comment"
    }
  },
  "mappings": {
    "root": [
      { "sourcePath": "purchaseRequisition", "targetPath": "header.purchaseRequisition", "type": "string", "required": true },
      { "sourcePath": "purReqCreationDate", "targetPath": "header.purReqCreationDate", "transform": "sapDateToIso" }
    ],
    "collections": {
      "items": {
        "navigationKey": "items",
        "targetPath": "items",
        "fields": [
          { "sourcePath": "requestedQuantity", "targetPath": "quantity", "transform": "number" }
        ]
      }
    }
  },
  "uiSchema": {
    "title": "{{header.purchaseRequisition}}",
    "sections": [
      {
        "id": "basic",
        "type": "CARD",
        "title": "Basic Data",
        "fields": ["purchaseRequisition"]
      }
    ]
  },
  "profiles": {
    "list": {
      "requiredCanonicalPaths": ["header.purchaseRequisition"]
    },
    "detail": {
      "includeUiFields": true,
      "requiredCanonicalPaths": ["workflow.steps"]
    }
  }
}
```

### Available Data Transformation Functions

The `MappingEngine` supports standard field value transformations defined in [`srv/lib/mapping/transforms.ts`](file:///d:/learning/test/cnma_approval/srv/lib/mapping/transforms.ts):

*   `sapDateToIso`: Converts epoch Unix timestamps (`/Date(1721606400000)/`) or standard SAP date strings into ISO 8601 strings (`YYYY-MM-DDTHH:mm:ss.sssZ`).
*   `number`: Coerces numeric strings or raw numbers into parsed JavaScript floating point numbers.
*   `uppercase`: Converts string values to uppercase.
*   `lowercase`: Converts string values to lowercase.
*   `boolean`: Coerces boolean truthy values.

---

## 🔄 Dynamic Hot-Reloading Mechanism (`ConfigRegistry`)

In development mode (`NODE_ENV !== 'production'`), the [`ConfigRegistry`](file:///d:/learning/test/cnma_approval/srv/lib/mapping/config-registry.ts) monitors changes in the `srv/configuration/object-types` directory using `fs.watch`:

1.  **File Modification Detected**: An edit to any `config.json` triggers the file watcher.
2.  **Schema Validation**: The registry parses and validates the modified JSON.
3.  **Atomic Memory Swap**: If validation passes, the active in-memory configuration is atomically swapped without restarting the Node.js process.
4.  **Error Recovery**: If the modified file has invalid JSON or fails schema validation, the swap is aborted, preserving the current valid in-memory configuration and logging an error.

---

## 🛰️ BTP Destination Configuration

When deploying the MTA to production or hybrid mode, the system fetches connectivity details from the BTP **Destination Service**. The target destination (default: `SAP_ABAP_BACKEND`) must be configured with:

*   **Name**: `SAP_ABAP_BACKEND` (or configured value in `SAP_TASK_DESTINATION`).
*   **Type**: `HTTP`
*   **Proxy Type**: `OnPremise` (for SAP Cloud Connector) or `Internet`.
*   **Authentication**: `PrincipalPropagation` (production mode) or `BasicAuthentication` (test/technical user mode).
