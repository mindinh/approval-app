# System Configuration & Destinations Reference

This document maps all configuration properties, environment variables, and outbound destination parameters required to deploy and run the **CNMA Approval** BFF backend.

---

## ⚙️ Environment Variables (`.env`)

The BFF reads environment variables at launch. These settings control the connection mode, credentials, port, and security features.

| Variable Name | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `PORT` | No | `4005` | The local port on which the Express server mounts. |
| `USE_MOCK_SAP` | No | `true` | **Mock switch**. Set to `false` to fetch details from real SAP systems. Set to `true` (or omit) to use local mock JSON providers. |
| `SAP_USE_DESTINATION` | No | `false` | **Connectivity profile**. Set to `true` to use BTP destination lookup via SAP Cloud SDK. Set to `false` to connect directly using Axios base URLs. |
| `SAP_TASK_DESTINATION` | Conditional | `SAP_ABAP_BACKEND` | The name of the destination configured in BTP to connect to S/4HANA (used when `SAP_USE_DESTINATION=true`). |
| `SAP_TASK_BASE_URL` | Conditional | - | Direct base URL of the S/4HANA host (e.g. `http://s4hanadev.ais-tech.vn:8000`) used when `SAP_USE_DESTINATION=false`. |
| `SAP_TASK_CLIENT` | Conditional | - | SAP Client ID (e.g. `100`) used for direct direct Axios HTTP header parameters. |
| `SAP_TASK_USER` | Conditional | - | Username for direct SAP basic authentication. |
| `SAP_TASK_PASSWORD` | Conditional | - | Password for direct SAP basic authentication. |
| `SAP_DEV_JWT` | No | - | Long-lived test JWT token payload to simulate principal authentication on local proxy requests. |

---

## 🛰️ BTP Destination Configuration

When deploying the Multi-Target Application to production (or in `hybrid` profile mode), the system fetches connectivity details from the BTP **Destination Service**. The target destination (default: `SAP_ABAP_BACKEND`) must be configured with the following properties:

### Required Parameters
*   **Name**: `SAP_ABAP_BACKEND` (or the value set in `SAP_TASK_DESTINATION`).
*   **Type**: `HTTP`
*   **URL**: The internal virtual URL of the S/4HANA host resolved by the Cloud Connector, or the public HTTP endpoint.
*   **Proxy Type**: `OnPremise` (if connecting via SAP Cloud Connector) or `Internet`.
*   **Authentication**: `PrincipalPropagation` (production mode to propagate user context) or `BasicAuthentication` (test/technical user mode).

### Required Additional Properties (Cloud Connector Linkage)
If `Proxy Type` is set to `OnPremise`:
*   `WebIDEEnabled` = `true`
*   `WebIDSystem` = `<systemId>`
*   `WebIDEUsage` = `odata_gen`
