# Code Review (4-Eyes Principle) - BFF Integration

## Meta Information
* **Date:** 260630
* **Reviewer:** Leo - AI + 4-Eyes
* **Scope:** BFF OData Integrations (`sap-client.ts`, `object-detail-adapter.ts`, `inbox-processor.ts`, `inbox-handler.ts`)

---

## Code Score: 78/100

---

## Business Impact Assessment
The current code successfully routes data between the S/4 backend and the React frontend, resolving the blocking connectivity issues. However, the system currently lacks a configuration schema registry. If the ABAP/SAP OData metadata fields or service paths change, it requires manual codebase updates in multiple adapter files. This tight coupling increases maintenance costs and slows down the onboarding of new business object types (e.g., Claim Form, Reservation).

---

## Actionable Findings by Severity

### 🔴 CRITICAL
* **Finding:** Hardcoded OData Service Paths & Property Mappings
  * **Class/Function:** `ObjectDetailAdapter.getDetail`
  * **Description:** The SAP OData endpoints (e.g., `/sap/opu/odata/SAP/C_PURREQUISITION_FS_SRV` and the V4 approval tree path) are hardcoded directly inside the adapter's condition blocks. 
  * **Optimization Flow:**
    ```mermaid
    flowchart TD
        Before["Hardcoded Endpoints & JSON properties inside ObjectDetailAdapter"]
        After["Decoupled Object Registry defining OData Paths, Entity Sets, and Schema Config mappings"]
        Before --> |Refactor to| After
    ```

### 🟡 WARNING
* **Finding:** Missing Object Configuration Registry for UI schemas
  * **Class/Function:** `InboxProcessor.getTaskDetail` / `ObjectDetailAdapter`
  * **Description:** As planned in the rebuild specification, the BFF should return `fieldSchema` and `uiSchema` dynamically from a code-based config registry (e.g., base + document-type override registry). Currently, these fields are returned as empty or hardcoded stubs, leaving the UI layout less adaptable.

### 🔵 LOW
* **Finding:** Dev fallback URL configuration defaults
  * **Class/Function:** `SapClient.constructor`
  * **Description:** While we successfully corrected the fallback port to `8000` via `.env`, the fallback value inside the code `http://s4hanadev.ais-tech.vn:8000` is hardcoded. It is better to load it strictly from environment config to prevent code drift.

---

## Principles Summary
* **SOLID:** 🔴 **Improve** - Single Responsibility is slightly violated since `ObjectDetailAdapter` is directly responsible for endpoint querying, schema structure parsing, and merging. Should extract to subclassed adapters per object type (e.g., `PrDetailAdapter`).
* **DRY:** 🟢 **Pass** - The direct Axios fallback is nicely reused across all client requests.
* **YAGNI:** 🟢 **Pass** - No redundant or speculative code is written.
* **KISS:** 🟢 **Pass** - The connection stream routing and raw body parsers are kept simple.
