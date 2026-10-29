# Data Retrieval & Display Architecture Report (All Object Types)

> **Owner:** Project Team | **Last Updated:** 2026-10-20 | **Status:** Active

> **Target Audience:** Backend Developers, Frontend Engineers, and AI Coding Agents  
> **Scope:** Comprehensive architecture reference for data retrieval, raw backend strategy execution, and declarative UI rendering across all object types (`PO`, `PR`, `CLAIM`, `RE`).

---

## 🧭 Executive Summary

The CNMA Approval Application delivers end-to-end raw SAP S/4HANA OData payloads to the frontend and renders UI displays using a **Declarative Raw OData Renderer Engine**.

Rather than hardcoding field access and UI layouts per document type, the application employs:
1. **Raw Integration Strategies (`srv/lib/integrations/`)**: Handle low-level SAP Gateway communication, batch sub-entity fetching (`$expand` with concurrent fallback via `BaseRawDetail`), and transport envelope unwrap.
2. **REST Controller & Minimal Envelope (`srv/controllers/inbox-controller.ts`)**: Returns single-fetch task detail envelope `{ businessObject, taskprocessing: { task, decisionOptions } }`.
3. **Declarative Raw Renderer Engine (`app/cnma_approval_ui/src/renderers/`)**: Renders header overview cards and line item tables dynamically using rule-based view specifications (`[type].views.ts`) and primitive field formatters (`[type].fields.ts`).

---

## 📊 1. Object Types Capability Matrix

| Property / Feature | PO (Purchase Order) | PR (Purchase Requisition) | CLAIM (Claim Form) | RE (Reservation) |
| :--- | :--- | :--- | :--- | :--- |
| **ObjectTypeCode** | `PO` | `PR` | `CLAIM` | `RE` |
| **SAP Object Key / Alias** | `BUS2012` | `BUS2105` | `CLAIM` | `ZBUS2093` |
| **Display Name** | Purchase Order | Purchase Requisition | Claim Form | Material Reservation |
| **Integration Strategy** | [`PoDetail`](../../../srv/lib/integrations/po.ts) | [`PrDetail`](../../../srv/lib/integrations/pr.ts) | [`ClaimDetail`](../../../srv/lib/integrations/claim.ts) | [`ReDetail`](../../../srv/lib/integrations/re.ts) |
| **Renderer Entry File** | [`po.fields.ts`](../../../app/cnma_approval_ui/src/renderers/objects/po/po.fields.ts) | [`pr.fields.ts`](../../../app/cnma_approval_ui/src/renderers/objects/pr/pr.fields.ts) | [`claim.view.ts`](../../../app/cnma_approval_ui/src/renderers/objects/claim/claim.view.ts) | [`reservation.view.ts`](../../../app/cnma_approval_ui/src/renderers/objects/reservation/reservation.view.ts) |
| **View Specification File** | [`po.views.ts`](../../../app/cnma_approval_ui/src/renderers/objects/po/po.views.ts) | [`pr.views.ts`](../../../app/cnma_approval_ui/src/renderers/objects/pr/pr.views.ts) | [`claim.view.ts`](../../../app/cnma_approval_ui/src/renderers/objects/claim/claim.view.ts) | [`reservation.view.ts`](../../../app/cnma_approval_ui/src/renderers/objects/reservation/reservation.view.ts) |
| **Source Root Entity** | `CNMA_POHEADER` | `CNMA_PRHEADER` | `CNMA_PRHEADER` | `CNMA_PRHEADER` |
| **Key Construction** | `DocCategory='BUS2012'`, `DocumentNumber='<id>'` | `DocCategory='BUS2105'`, `DocumentNumber='<id>'` | `DocCategory='ZCLAIM'`, `DocumentNumber='<id>'` | `DocCategory='BUS2093'`, `DocumentNumber='<id>'` |
| **Navigations Fetched** | `_Item`, `_ApprovalStep`, `_HeaderText`, `_Attachment`, `_Comment` | `_Item`, `_ApprovalStep`, `_HeaderText`, `_Attachment`, `_Comment`, `_PurposeText`, `_PaidByText`, `_BankDetails` | `_Item`, `_Comment` | `_Item`, `_Comment` |
| **Card Chips (List View)** | Total Amount, Document Type, Supplier, Company Code | Total Amount, Document Type, Requester, Funds Center | Total Amount, Claimant, Company Code | Total Amount, Plant, Movement Type, Cost Center |

---

## 🔄 2. End-to-End Data Pipeline Architecture

Data flows through a standardized **4-Layer Pipeline**:

```
 ┌─────────────────────────────────────────────────────────┐
 │ 1. SAP S/4HANA OData Gateway                            │
 └────────────────────────────┬────────────────────────────┘
                              │ HTTP / OData JSON
                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │ 2. Backend Raw Strategy (srv/lib/integrations/[type].ts)│
 │    - BaseRawDetail.fetchRawDetail() with $expand        │
 │    - Concurrent fetchSubEntities() fallback             │
 │    - Strips __metadata/__deferred envelope              │
 └────────────────────────────┬────────────────────────────┘
                              │ Raw Business Object JSON
                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │ 3. REST Controller (srv/controllers/inbox-controller.ts)│
 │    - Combines raw businessObject + taskprocessing state │
 └────────────────────────────┬────────────────────────────┘
                              │ Raw Envelope DTO
                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │ 4. Declarative React UI Renderer (app/cnma_approval_ui/)│
 │    - ObjectView.registry.ts resolves layout view def    │
 │    - Evaluate cards & item tables via objectView.ts     │
 └─────────────────────────────────────────────────────────┘
```

---

## 🔍 3. Data Retrieval Engine (`BaseRawDetail`)

The `BaseRawDetail` class in [`srv/lib/integrations/base.ts`](../../../srv/lib/integrations/base.ts) orchestrates OData query execution:
1. **Live raw retrieval**: Calls the configured SapClient. CAP mocked authentication does not mock SAP business objects; `USE_MOCK_SAP` has no runtime reader.
2. **Padded Key Resolution**: Automatically formats numeric IDs to 10-digit SAP padded format (e.g. `0010001861`).
3. **Primary Query with `$expand`**: Executes a single HTTP GET for the root entity expanding all sub-entity navigations.
4. **Resilient Fallback Fetching**: If `$expand` fails, `BaseRawDetail` catches the exception and executes sub-entity queries concurrently via `Promise.all()`.
