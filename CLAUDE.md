# CNMA Approval — Developer & AI Agent Context Guide

> **Project Stack:** SAP CAP Node.js (BFF) · Express · Vite React (TypeScript) · Config-Driven Mapping Engine · @cnma/react-ui

This document is automatically read by AI coding agents at session start. It contains mandatory rules, architectural workflows, and step-by-step instructions for adding new fields, modifying APIs, or onboarding new business object types across the application (`PR`, `PO`, `CLAIM`, `RESERVATION`, `CONTRACT`, `INVOICE`, etc.).

---

## 🏗️ Data Field Architecture & Display Mechanism

Data fields flow end-to-end through a **Config-Driven Architecture**:

```
[S/4HANA OData / SAP API] 
       │ (1. Raw OData Fetch)
       ▼
[srv/lib/integrations/[type].ts]  <-- Adapter queries S/4HANA & nav paths
       │ (2. Declarative Mapping & Transforms)
       ▼
[srv/configuration/object-types/[type]/config.json] <-- Single Source of Truth
       │ (3. Canonical DTO + uiSchema + fieldSchema projection)
       ▼
[BFF REST API: /tasks/tasks/:id]
       │ (4. JSON Payload with fieldSchema + uiSchema)
       ▼
[app/cnma_approval_ui/src/pages/Inbox/components/renderers/TaskDetailSections.registry.ts]
       │ ── Primary: buildDynamicBusinessModel() dynamically builds cards & tables
       │ ── Fallback: modules/[type]/[type].builder.ts (Static builders if schema missing)
       ▼
[React UI Components: BusinessDetailCard, BusinessDetailTable, CardChips]
```

---

## 🎯 MANDATORY WORKFLOW: Adding, Updating & Fixing Data Fields

Follow this exact workflow matrix when modifying fields, adding object types, or updating UI displays:

### 1. Showing a New Field (From Existing SAP OData Payload)
If the raw OData response already returns the SAP property:
1. **`srv/configuration/object-types/[type]/config.json`**:
   * Add mapping entry under `mappings.root` (for header fields) or `mappings.collections.[collectionKey].fields` (for collection items):
     ```json
     {
       "sourcePath": "purReqCreationDate",
       "targetPath": "header.purReqCreationDate",
       "transform": "sapDateToIso",
       "type": "string",
       "dataType": "DATE",
       "label": "Creation Date"
     }
     ```
   * Add field definition to `fieldSchema` (if explicit field schema definition is used):
     ```json
     "purReqCreationDate": {
       "dataPath": "header.purReqCreationDate",
       "label": "Creation Date",
       "dataType": "DATE"
     }
     ```
   * Add the field key (`"purReqCreationDate"`) to `uiSchema.sections.[sectionId].fields` (for cards) or `columns` (for tables) to render on screen.
2. **TypeScript Contracts**:
   * Update `CanonicalHeader` or `CanonicalItem` interfaces in [`srv/lib/mapping/canonical-business-object.ts`](file:///d:/learning/test/cnma_approval/srv/lib/mapping/canonical-business-object.ts).
   * Update frontend `TaskDetail` / header types in [`app/cnma_approval_ui/src/services/inbox/inbox.types.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/services/inbox/inbox.types.ts).
3. **Frontend UI (`app/cnma_approval_ui/`)**:
   * **Zero UI Component Code Required for Dynamic Render!** [`TaskDetailSections.registry.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/renderers/TaskDetailSections.registry.ts) automatically parses `uiSchema` + `fieldSchema` and renders card fields & table columns with auto-formatting (`AMOUNT`, `DATE`, `QUANTITY`, `BOOLEAN`, `LONG_TEXT`).
   * **Static Fallback Builder (Mandatory Sync):** If static fallback is used for offline/mock modes, also add the field to [`app/cnma_approval_ui/src/pages/Inbox/components/renderers/modules/[type]/[type].builder.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/renderers/modules/pr/pr.builder.ts).
   * **i18n Translations:** Add translation keys in `app/cnma_approval_ui/src/locales/en.json` and `vi.json` for new labels.

---

### 2. Showing a New Field Requiring New SAP OData Sub-Entities / Navigations
If fetching the field requires querying an additional SAP navigation path or entity:
1. **`srv/lib/integrations/[type].ts`** (e.g. `pr.ts`, `po.ts`, `claim.ts`, `reservation.ts`):
   * Extend `fetchSubEntities()` in the strategy class to query the new OData navigation property from S/4HANA.
2. **`srv/configuration/object-types/[type]/config.json`**:
   * Add navigation alias under `source.navigations`.
   * Add mapping rule under `mappings.collections` or `mappings.root`.
   * Include field key in `uiSchema.sections`.
3. **TypeScript Contracts**:
   * Update `canonical-business-object.ts` and `inbox.types.ts`.

---

### 3. Adding Card Chips & Document Type Overrides
To display summary chips on task list cards in the Inbox:
1. **Global Card Chips:** Edit `cardChips` array in `srv/configuration/object-types/[type]/config.json`:
   ```json
   {
     "label": "Cost Center",
     "dataPath": "header.costCenter",
     "dataType": "TEXT"
   }
   ```
2. **Document Type Specific Chips (e.g., Asset PR vs Expense PR vs Marketing PR):**
   Add subtype definition under `documentTypes.[docType].cardChips` in `config.json` (e.g. `ZASS`, `ZFO7`, `ZMAK`, `ZNB1`).

---

### 4. Adding Dynamic Section Visibility Rules
To show/hide cards or tables conditionally based on field values:
* Add `visibleWhen` block inside section definition in `uiSchema.sections`:
  ```json
  "visibleWhen": {
    "field": "assetClass",
    "operator": "exists" // operators: 'exists' | 'eq' | 'neq' | 'gt' | 'lt'
  }
  ```

---

### 5. Adding a Completely New Business Object Type (e.g., `CONTRACT`, `INVOICE`, `PAYMENT`)
Follow this step-by-step guide to onboard a new object type across the system:
1. **Create Configuration Folder**:
   Create directory `srv/configuration/object-types/[newType]/` and add `config.json` defining `object`, `source`, `mappings`, `uiSchema`, `fieldSchema`, `cardChips`, and `profiles`.
2. **Implement Detail Strategy Class**:
   Create `srv/lib/integrations/[newType].ts` extending `BaseDetail`:
   ```typescript
   export class ContractDetail extends BaseDetail {
       readonly objectType: ObjectTypeCode = 'CONTRACT';
       // Implement fetchSubEntities...
   }
   ```
3. **Register Strategy**:
   Import and register the strategy in `srv/lib/integrations/sap-odata-adapter.ts`:
   ```typescript
   this.registerStrategy(new ContractDetail(this.sapClient, this.metadataService));
   ```
4. **Update Code Constants & Types**:
   * Add `'CONTRACT'` to `ObjectTypeCode` union in `canonical-business-object.ts` and `object-config.ts`.
5. **Add Frontend Static Fallback Builder (Optional but Recommended)**:
   Create `app/cnma_approval_ui/src/pages/Inbox/components/renderers/modules/[newType]/[newType].builder.ts` and register in `STRATEGY_MAP` in `TaskDetailSections.registry.ts`.
6. **Add Localized Labels**:
   Add document type labels in `app/cnma_approval_ui/src/locales/en.json` and `vi.json`.

---

### 6. Fixing Field Mapping or Transforming Data Format
* **Raw OData Field Name Changed**: Update `sourcePath` / `altSourcePaths` in `config.json`.
* **Prefer Human-Readable Text over Raw Codes**: When adding or displaying fields (e.g., approval steps, document types, status descriptions), always map and render the descriptive text property (e.g., `releaseText` / `ReleaseText`) over raw code numbers (`releaseCode` / `ReleaseCode`). Extract it in `srv/lib/integrations/[type].ts` with fallback to code: `s.ReleaseText || s.ReleaseCode`.
* **Value Formatting Needed**: Use available transforms in [`srv/lib/mapping/transforms.ts`](file:///d:/learning/test/cnma_approval/srv/lib/mapping/transforms.ts):
  - `sapDateToIso`: Formats `/Date(1620000000000)/` or SAP date string to ISO date `YYYY-MM-DD`.
  - `combineCodeAndText`: Combines code and description text (e.g., `1000 - Plant Munich`).
  - `number`: Parses string to numeric float.
  - `uppercase` / `lowercase` / `boolean`.
* **BFF Payload Pre-processing**: Inspect `enrichBusinessObjectForSchema()` in [`srv/lib/processors/inbox-processor.ts`](file:///d:/learning/test/cnma_approval/srv/lib/processors/inbox-processor.ts).

---

## 🛠️ Verification & Quality Commands

Before claiming any task complete, run:
```powershell
# 1. Run backend unit tests
npm test

# 2. Run frontend unit tests
cd app/cnma_approval_ui; npm test

# 3. Run frontend TypeScript typecheck
cd app/cnma_approval_ui; npx tsc --noEmit
```

---

## 📚 Key Reference Links
* Field Mapping & Pipeline Guide: [05-field-mapping-guide.md](file:///d:/learning/test/cnma_approval/docs/technical/02-implementation/05-field-mapping-guide.md)
* Architecture & Mapping Engine: [04-config-driven-mapping.md](file:///d:/learning/test/cnma_approval/docs/technical/01-architecture/04-config-driven-mapping.md)
* Backend BFF Endpoints: [03-backend-bff-endpoints.md](file:///d:/learning/test/cnma_approval/docs/technical/02-implementation/03-backend-bff-endpoints.md)
* Declarative Schema Reference: [01-configuration.md](file:///d:/learning/test/cnma_approval/docs/technical/04-reference/01-configuration.md)

