# Data Retrieval & Display Architecture Report (All Object Types)

> **Target Audience:** Backend Developers, Frontend Engineers, and AI Coding Agents  
> **Scope:** Comprehensive architecture reference for data retrieval, backend normalization, config-driven DTO mapping, and UI display rendering across all object types (`PO`, `PR`, `CLAIM`, `RE`).

---

## 🧭 Executive Summary

The CNMA Approval Application decouples backend SAP S/4HANA OData integration from frontend dynamic UI rendering using a **Config-Driven Architecture**.

Rather than hardcoding field access and UI layouts per document type, the application employs:
1. **Integration Strategies (`srv/lib/integrations/`)**: Handle low-level SAP Gateway communication, batch sub-entity fetching (`$expand` with concurrent fallback), and data normalization.
2. **Configuration Registry (`srv/configuration/object-types/`)**: JSON-based manifest per object type defining source entities, navigation properties, canonical DTO field mappings, fallback priority (`altSourcePaths`), field transforms, card chips, document profiles, and UI section layouts.
3. **Canonical Mapping Engine (`srv/lib/mapping/`)**: Transforms raw/normalized backend entities into structured `CanonicalBusinessObject` DTOs.
4. **Dynamic Frontend Renderer (`app/cnma_approval_ui/`)**: Renders headers, item tables, workflow timelines, attachments, comments, and action buttons dynamically based on the returned `uiSchema`.

---

## 📊 1. Object Types Capability & Architecture Matrix

| Property / Feature | PO (Purchase Order) | PR (Purchase Requisition) | CLAIM (Claim Form) | RE (Reservation) |
| :--- | :--- | :--- | :--- | :--- |
| **ObjectTypeCode** | `PO` | `PR` | `CLAIM` | `RE` |
| **SAP Object Key / Alias** | `BUS2012` | `BUS2105` | `ZCLAIM` | `BUS2093` |
| **Display Name** | Purchase Order | Purchase Requisition | Claim Form | Material Reservation |
| **Integration Adapter** | [`PoDetail`](file:///d:/learning/test/cnma_approval/srv/lib/integrations/po.ts) | [`PrDetail`](file:///d:/learning/test/cnma_approval/srv/lib/integrations/pr.ts) | [`ClaimDetail`](file:///d:/learning/test/cnma_approval/srv/lib/integrations/claim.ts) | [`ReDetail`](file:///d:/learning/test/cnma_approval/srv/lib/integrations/re.ts) |
| **Configuration File** | [`po/config.json`](file:///d:/learning/test/cnma_approval/srv/configuration/object-types/po/config.json) | [`pr/config.json`](file:///d:/learning/test/cnma_approval/srv/configuration/object-types/pr/config.json) | [`claim/config.json`](file:///d:/learning/test/cnma_approval/srv/configuration/object-types/claim/config.json) | [`reservation/config.json`](file:///d:/learning/test/cnma_approval/srv/configuration/object-types/reservation/config.json) |
| **Source Root Entity** | `CNMA_POHEADER` | `CNMA_PRHEADER` | `CNMA_PRHEADER` | `CNMA_PRHEADER` |
| **Key Construction** | `DocCategory='BUS2012'`, `DocumentNumber='<id>'` | `DocCategory='BUS2105'`, `DocumentNumber='<id>'` | `DocCategory='ZCLAIM'`, `DocumentNumber='<id>'` | `DocCategory='BUS2093'`, `DocumentNumber='<id>'` |
| **Navigations Fetched** | `_Item`, `_ApprovalStep`, `_HeaderText`, `_Attachment`, `_Comment` | `_Item`, `_ApprovalStep`, `_HeaderText`, `_Attachment`, `_Comment`, `_PurposeText`, `_PaidByText`, `_BankDetails` | `_Item`, `_Comment` | `_Item`, `_Comment` |
| **Special Mappings** | Reference PR, Account Assignments derived from items | Purpose Text, Bank Details, Paid-By Text | Expense Claimant & User ID | Goods Recipient & User ID |
| **Card Chips (List View)** | Total Amount, Vendor, Created Date | Total Amount, Requisitioner, Created Date | Total Amount, Claimant, Created Date | Reservation Number, Goods Recipient, Date |
| **Document Profiles** | `NB` (Standard), `FO` (Framework), `UB` (Stock Transport) | `NB` (Standard PR), `ZCLM` (Claim PR) | Standard Profile | Standard Profile |

---

## 🔄 2. End-to-End Data Pipeline Architecture

Data flows through a standardized **6-Layer Pipeline**:

```
 ┌─────────────────────────────────────────────────────────┐
 │ 1. SAP S/4HANA OData Gateway                            │
 └────────────────────────────┬────────────────────────────┘
                              │ HTTP / OData JSON
                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │ 2. Integration Strategy (srv/lib/integrations/[type].ts)│
 │    - BaseDetail.getDetail() with $expand query         │
 │    - Concurrent fetchSubEntities() fallback            │
 │    - MetadataService.normalizeDetail()                  │
 └────────────────────────────┬────────────────────────────┘
                              │ Normalized Raw Entity
                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │ 3. Config Registry (srv/configuration/object-types/)    │
 │    - Loads config.json per objectType                   │
 │    - Defines altSourcePaths priority & transforms       │
 └────────────────────────────┬────────────────────────────┘
                              │ ObjectConfig Rules
                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │ 4. Mapping Engine (srv/lib/mapping/mapping-engine.ts)   │
 │    - Projects raw data into CanonicalBusinessObject     │
 │    - Resolves header fields & item collection fields    │
 └────────────────────────────┬────────────────────────────┘
                              │ TaskDetailResponse DTO
                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │ 5. BFF Controller (srv/controllers/inbox-controller.ts) │
 │    - Combines Task Metadata + Canonical Object + UI Schema│
 └────────────────────────────┬────────────────────────────┘
                              │ JSON Payload
                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │ 6. Dynamic React UI Renderer (app/cnma_approval_ui/)    │
 │    - Summary Cards, Line Item Tables, Workflow Timeline │
 │    - Attachment Viewer, Comments Thread, Actions        │
 └────────────────────────────┬────────────────────────────┘
```

---

## 🔍 3. Data Retrieval Deep-Dive (Backend Layer)

### 3.1 Base Detail Engine ([`srv/lib/integrations/base.ts`](file:///d:/learning/test/cnma_approval/srv/lib/integrations/base.ts))

The `BaseDetail` class orchestrates OData query execution:
1. **Mock Mode Execution**: If `USE_MOCK_SAP !== 'false'`, reads mock data directly from [`mock-data-provider.ts`](file:///d:/learning/test/cnma_approval/srv/lib/integrations/mock-data-provider.ts) for rapid local testing without Gateway connectivity.
2. **Padded Key Resolution**: Automatically formats numeric IDs to 10-digit SAP padded format (e.g., `4500000001`).
3. **Primary Query with `$expand`**: Executes a single HTTP GET for the root entity expanding all sub-entity navigations:
   ```http
   GET /CNMA_POHEADER(DocCategory='BUS2012',DocumentNumber='4500000001')?$expand=_Item,_ApprovalStep,_HeaderText,_Attachment,_Comment&$format=json
   ```
4. **Resilient Fallback Fetching**: If `$expand` fails (due to backend memory limits or Gateway navigation restrictions), `BaseDetail` catches the exception and invokes `fetchSubEntities()` in child classes.

### 3.2 Sub-Entity Concurrent Fetching (`fetchSubEntities`)

Sub-entity queries run concurrently using `Promise.all()` to minimize response latency:

* **PO Detail ([`po.ts`](file:///d:/learning/test/cnma_approval/srv/lib/integrations/po.ts))**:
  ```typescript
  const [rawItems, rawSteps, rawTexts, rawAttachments, rawComments] = await Promise.all([
      fetchSubEntity('_Item', '_Item'),
      fetchSubEntity('_ApprovalStep', '_ApprovalStep'),
      fetchSubEntity('_HeaderText', '_HeaderText'),
      fetchSubEntity('_Attachment', '_Attachment'),
      fetchSubEntity('_Comment', '_Comment')
  ]);
  ```
* **PR Detail ([`pr.ts`](file:///d:/learning/test/cnma_approval/srv/lib/integrations/pr.ts))**:
  ```typescript
  const [rawItems, rawSteps, rawTexts, rawAttachments, rawComments, rawPurpose, rawPaidBy, rawBankDetails] = await Promise.all([
      fetchSubEntity('_Item', '_Item'),
      fetchSubEntity('_ApprovalStep', '_ApprovalStep'),
      fetchSubEntity('_HeaderText', '_HeaderText'),
      fetchSubEntity('_Attachment', '_Attachment'),
      fetchSubEntity('_Comment', '_Comment'),
      fetchSubEntity('_PurposeText', '_PurposeText'),
      fetchSubEntity('_PaidByText', '_PaidByText'),
      fetchSubEntity('_BankDetails', '_BankDetails')
  ]);
  ```

---

## 🎨 4. Data Mapping & UI Display System

### 4.1 Config Mapping Rules (`config.json`)

Each object type configuration defines mapping rules between SAP OData property names and canonical target DTO paths:

```json
{
  "mappings": {
    "root": [
      {
        "sourcePath": "purchaseOrder",
        "altSourcePaths": ["DocumentNumber", "poNumber"],
        "targetPath": "header.purchaseOrder",
        "label": "PO Number",
        "type": "string",
        "required": true
      },
      {
        "sourcePath": "totalAmount",
        "altSourcePaths": ["TotalAmount", "grossAmount"],
        "targetPath": "header.totalAmount",
        "label": "Total Amount",
        "type": "number",
        "transform": "currencyFormat"
      }
    ]
  }
}
```

### 4.2 Multi-Path Fallback (`altSourcePaths`)

To support heterogeneous SAP backend system versions, the mapping engine evaluates field source paths in priority order:
1. `sourcePath`: Primary OData property name (e.g. `purchaseOrder`).
2. `altSourcePaths[0]`: Primary SAP Gateway property fallback (e.g. `DocumentNumber`).
3. `altSourcePaths[1+]`: Secondary legacy/custom fields (e.g. `poNumber`, `Banfn`, `Ebeln`).

### 4.3 UI Schema & Section Layouts (`uiSchema`)

The frontend uses `uiSchema.sections` to dynamically construct detail tabs and cards without custom code:

```json
"uiSchema": {
  "title": "Purchase Order Details",
  "sections": [
    {
      "id": "header",
      "type": "form",
      "title": "General Information",
      "fields": ["purchaseOrder", "documentTypeDisplay", "vendorDisplay", "totalAmountDisplay", "createdAt"]
    },
    {
      "id": "items",
      "type": "table",
      "title": "Line Items",
      "columns": ["purchaseOrderItem", "materialText", "quantity", "netAmount", "plantText"]
    },
    {
      "id": "workflow",
      "type": "timeline",
      "title": "Approval History"
    },
    {
      "id": "attachments",
      "type": "attachmentList",
      "title": "Attachments"
    }
  ]
}
```

---

## 🛠️ 5. Maintenance & Extension Playbook

### Scenario A: Adding a New Field to an Existing Object Type (e.g., PO `DeliveryDate`)

1. **Verify SAP Property**: Check [`METADATA.xml`](file:///d:/learning/test/cnma_approval/METADATA.xml) for property name and data type (`DeliveryDate`).
2. **Update Integration Strategy**: In [`po.ts`](file:///d:/learning/test/cnma_approval/srv/lib/integrations/po.ts), verify that line items extract `DeliveryDate`.
3. **Update Canonical DTOs**:
   - Backend: Add property in [`canonical-business-object.ts`](file:///d:/learning/test/cnma_approval/srv/lib/mapping/canonical-business-object.ts).
   - Frontend: Add property in [`inbox.types.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/services/inbox/inbox.types.ts).
4. **Update Configuration File**: In [`po/config.json`](file:///d:/learning/test/cnma_approval/srv/configuration/object-types/po/config.json), add mapping rule under `mappings.collections.items` and add field ID to `uiSchema.sections[items].columns`.
5. **Run Quality Gates**: Execute `npm test` and typecheck.

---

### Scenario B: Adding a Brand New Object Type (e.g., Service Entry Sheet `SES`)

1. **Create Configuration Directory**: Create `srv/configuration/object-types/ses/config.json`.
2. **Implement Integration Adapter**: Create `srv/lib/integrations/ses.ts` extending `BaseDetail`.
3. **Register Adapter**: Add `SES` adapter to integration factory / router.
4. **Define UI Schema & Actions**: Set up sections (`header`, `items`, `workflow`), decision keys, and list card chips in `ses/config.json`.
5. **Verify End-to-End**: Test with mock data (`USE_MOCK_SAP=true`).

---

## 📌 Summary Checklist for Maintainers

* [x] **Single Source of Truth**: All UI display labels and layout ordering live in `config.json`, NOT in React code.
* [x] **Fallback Protection**: Always provide `altSourcePaths` for OData fields to handle varying SAP backend table names.
* [x] **Type Safety**: Maintain strict 1:1 synchronization between backend `CanonicalBusinessObject` DTOs and frontend `TaskDetailResponse` interfaces.
* [x] **Performance**: Ensure all sub-entities in integration strategies are fetched in parallel via `Promise.all()`.
