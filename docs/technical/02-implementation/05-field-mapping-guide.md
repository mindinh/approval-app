# Field Modification & Property Pipeline Guide

> **Target Audience:** Developers & AI Coding Agents  
> **Last Updated:** 2026-08-27 | **Status:** Active  
> **Scope:** Adding, modifying, or formatting data fields across S/4HANA OData services, backend raw strategies, and React UI declarative renderers.

---

## 🧭 Architectural Overview

Data fields flow end-to-end through a **4-Step Raw Pipeline**:

```
1. S/4HANA OData (METADATA.xml)
       │
       ▼
2. Backend Integration Strategy (srv/lib/integrations/[type].ts — extends BaseRawDetail)
       │
       ▼
3. Declarative Renderer Field Catalogs & View Layouts (app/cnma_approval_ui/src/renderers/objects/[type]/)
       │
       ▼
4. Master Registry & UI Section Rendering (ObjectView.registry.ts + OverviewPanel / DetailsPanel)
```

---

## 📋 Step-by-Step Field Modification Checklist

When adding a new field (e.g. `ReleaseText`, `InternalOrderID`, `SupplyingPlant`, `DeliveryDate`), follow this complete 4-step checklist:

### Step 1 — Verify SAP OData Property (`METADATA.xml`)

1. Open [`METADATA.xml`](file:///d:/learning/test/cnma_approval/METADATA.xml).
2. Locate the target `EntityType` (e.g. `CNMA_PRHEADERType`, `ZI_CNMA_PRITEMType`, `CNMA_POHEADERType`, `ZI_CNMA_POITEMType`).
3. Verify the exact OData property name, case sensitivity (`PascalCase`), data type (`Edm.String`, `Edm.Date`, `Edm.Decimal`), and length.
   * *Example:* `<Property Name="OrderInternalID" Type="Edm.String" MaxLength="12"/>`

---

## Step 2 — Backend Strategy Configuration (`srv/lib/integrations/`)

1. Open the backend object integration strategy:
   * PR: [`srv/lib/integrations/pr.ts`](file:///d:/learning/test/cnma_approval/srv/lib/integrations/pr.ts)
   * PO: [`srv/lib/integrations/po.ts`](file:///d:/learning/test/cnma_approval/srv/lib/integrations/po.ts)
   * RE: [`srv/lib/integrations/re.ts`](file:///d:/learning/test/cnma_approval/srv/lib/integrations/re.ts)
   * CLAIM: [`srv/lib/integrations/claim.ts`](file:///d:/learning/test/cnma_approval/srv/lib/integrations/claim.ts)
2. Ensure `defaultNavigations` includes the sub-entity navigation path containing the field (e.g., `_Item`, `_ApprovalStep`, `_HeaderText`, `_Attachment`, `_Comment`).
3. `BaseRawDetail` automatically fetches raw OData entities without camelCasing or stripping properties. No code changes are required in backend mapping engines!

---

## Step 3 — Declarative Renderer Field Catalog (`[type].fields.ts`)

Open `app/cnma_approval_ui/src/renderers/objects/[type]/[type].fields.ts`:

1. **Overview Field Definition**:
   Create or update field definitions using primitive factories (`text`, `codeText`, `amount`, `date`, `quantity`):
   ```typescript
   // Code + Name combination:
   internalOrder: codeText({
       code: 'OrderInternalID',
       text: 'OrderInternalName',
       label: 'Internal Order'
   }),

   // Custom Formatter Field:
   customVendor: text({
       source: 'Supplier',
       label: 'Vendor',
       formatter: (_val, record) => {
           if (!record) return '-';
           return `${record.Supplier || ''} - ${record.SupplierName || ''}`.trim();
       }
   })
   ```
2. **Table Column Definition**:
   Create or update table column definitions:
   ```typescript
   internalOrderCol: tableCol({
       id: 'internalOrder',
       header: 'Internal Order',
       source: 'OrderInternalID',
       formatter: (val, record) => {
           if (!record) return '-';
           const code = (record.OrderInternalID || '').trim();
           const name = (record.OrderInternalName || '').trim();
           if (code && name) return `${code} - ${name}`;
           return code || name || '-';
       }
   })
   ```

---

## Step 4 — Declarative Renderer View Layout (`[type].views.ts`)

Open `app/cnma_approval_ui/src/renderers/objects/[type]/[type].views.ts`:

1. **Add Field to Card**: Add the field definition reference to the appropriate `CardDefinition.fields` array:
   ```typescript
   export const marketingPrOverviewCard: CardDefinition = {
       id: 'pr-mak-overview-card',
       title: 'Overview',
       fields: [
           PR_OVERVIEW_FIELDS.prNumber,
           PR_OVERVIEW_FIELDS.documentType,
           PR_OVERVIEW_FIELDS.requester,
           PR_OVERVIEW_FIELDS.internalOrder, // 👈 Position dictates order in 3-column top grid
           // ...
       ]
   };
   ```
2. **Add Column to Table**: Add the column definition reference to the appropriate `TableDefinition.columns` array:
   ```typescript
   export const marketingPrTable: TableDefinition = {
       id: 'pr-mak-table',
       title: 'Line Items (Marketing PR)',
       itemSource: '_Item',
       columns: [
           PR_TABLE_COLUMNS.item,
           PR_TABLE_COLUMNS.plant,
           PR_TABLE_COLUMNS.materialNumber,
           PR_TABLE_COLUMNS.internalOrderCol, // 👈 Position dictates left-to-right table column order
           // ...
       ]
   };
   ```

---

## 🛠️ Step 5 — Mandatory Quality & Verification Pipeline

Always run the verification commands before completing your task:

```powershell
# 1. Run backend unit test suite
npm test

# 2. Run frontend TypeScript typecheck
cd app/cnma_approval_ui; npx tsc --noEmit
```

---

## 📌 Common Pitfalls & Solutions

| Symptom | Root Cause | Fix |
|---|---|---|
| Field appears `undefined` in UI | Navigation set in backend strategy missing target entity navigation key | Add navigation name to `defaultNavigations` in `srv/lib/integrations/[type].ts` |
| Field not rendered in overview grid | Field omitted from `CardDefinition.fields` array in `[type].views.ts` | Add field reference to target `CardDefinition.fields` array |
| Multiline field breaking 3-column top grid | `isLongText: true` omitted or wrongfully applied | Set `isLongText: true` ONLY for separate full-width section cards (like Header Notes or Purpose) |
| TypeScript compilation error | Field property name mismatch between raw OData entity and formatter `record` | Inspect exact raw OData casing in `METADATA.xml` |
