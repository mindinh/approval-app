# Field Mapping & Property Pipeline Guide

> **Target Audience:** Developers & AI Coding Agents  
> **Scope:** Adding, modifying, or fixing data fields across S/4HANA OData services, BFF config-driven engine, canonical DTOs, and React UI components.

---

## 🧭 Architectural Overview

Data fields flow end-to-end through a **6-Layer Pipeline**:

```
1. S/4HANA OData (METADATA.xml)
       │
       ▼
2. Integration Strategy (srv/lib/integrations/[type].ts)
       │
       ▼
3. Canonical DTOs (srv/lib/mapping/canonical-business-object.ts & inbox.types.ts)
       │
       ▼
4. Config Registry (srv/configuration/object-types/[type]/config.json)
       │
       ▼
5. React UI Components & Dynamic Renderers (app/cnma_approval_ui/...)
       │
       ▼
6. Quality & Verification Gates (npm test & tsc)
```

---

## 📋 Step-by-Step Field Modification Checklist

When adding a new field (e.g., `ReleaseText`, `PurposeText`, `VendorBankName`, `DeliveryDate`), follow this complete 6-layer checklist:

### Layer 1 — Verify SAP OData Property (`METADATA.xml`)

1. Open [`METADATA.xml`](file:///d:/learning/test/cnma_approval/METADATA.xml).
2. Locate the target `EntityType` (e.g., `CNMA_PRHEADERType`, `ZI_CNMA_PRITEMType`, `ZI_CNMA_APPROVAL_STEPType`).
3. Verify the exact OData property name, case sensitivity (`PascalCase`), data type (`Edm.String`, `Edm.Date`, `Edm.Decimal`), and `MaxLength`.
   * *Example:* `<Property Name="ReleaseText" Type="Edm.String" Nullable="false" MaxLength="60"/>`

---

### Layer 2 — Integration Strategy Normalization (`srv/lib/integrations/`)

1. Open the object integration strategy:
   * PR: [`srv/lib/integrations/pr.ts`](file:///d:/learning/test/cnma_approval/srv/lib/integrations/pr.ts)
   * PO: [`srv/lib/integrations/po.ts`](file:///d:/learning/test/cnma_approval/srv/lib/integrations/po.ts)
2. If the field lives in a sub-entity (`_Item`, `_ApprovalStep`, `_HeaderText`, `_Attachment`, `_Comment`, `_PurposeText`, `_PaidByText`, `_BankDetails`), ensure `fetchSubEntities()` includes it in the `Promise.all()` concurrent batch.
3. Extract and normalize the raw OData property into the intermediate JS object:
   ```typescript
   // Example in PrDetail / PoDetail
   const normalizedSteps = rawSteps.map((s: any) => ({
       documentId: s.ObjectKey || objectId,
       level: Number(s.ApprovalLevel ?? 0),
       releaseCode: s.ReleaseCode || '',
       releaseText: s.ReleaseText || s.ReleaseCode || '', // <-- Extract OData field with fallback
       approver: s.ApproverName || '',
       // ...
   }));
   ```

---

### Layer 3 — TypeScript DTO Contracts

Keep backend DTOs and frontend TypeScript types strictly synchronized:

1. **Backend DTO Contract:** Edit [`srv/lib/mapping/canonical-business-object.ts`](file:///d:/learning/test/cnma_approval/srv/lib/mapping/canonical-business-object.ts). Add property to `ApprovalStep`, `CanonicalHeader`, or `CanonicalItem`:
   ```typescript
   export interface ApprovalStep {
       documentId: string;
       level: number;
       releaseCode: string;
       releaseText?: string; // <-- New field
       approver: string;
       // ...
   }
   ```
2. **Frontend Contract:** Edit [`app/cnma_approval_ui/src/services/inbox/inbox.types.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/services/inbox/inbox.types.ts). Add matching optional property to `WorkflowApprovalStep`, `TaskHeader`, or `TaskItem`:
   ```typescript
   export interface WorkflowApprovalStep {
       documentId: string;
       level: number;
       releaseCode?: string;
       releaseText?: string; // <-- New field
       approver?: string;
       // ...
   }
   ```

---

### Layer 4 — Object Type Configuration (`config.json`)

Edit `srv/configuration/object-types/[type]/config.json` (e.g. [`pr/config.json`](file:///d:/learning/test/cnma_approval/srv/configuration/object-types/pr/config.json), [`po/config.json`](file:///d:/learning/test/cnma_approval/srv/configuration/object-types/po/config.json)):

1. **Mapping Entry (`mappings`)**:
   Add mapping rule under `root`, `collections.[key].fields`, or `workflowSteps`:
   ```json
   {
     "sourcePath": "releaseText",
     "targetPath": "releaseText"
   }
   ```
2. **Field Schema (`fieldSchema`)**:
   Add schema definition detailing label and format data type (`TEXT`, `AMOUNT`, `DATE`, `QUANTITY`, `BOOLEAN`):
   ```json
   "releaseText": {
     "dataPath": "header.releaseText",
     "label": "Release Step",
     "dataType": "TEXT"
   }
   ```
3. **UI Schema (`uiSchema`)**:
   Add field key to the appropriate section's `fields` array (for cards), `columns` (for tables), or `cardChips` (for list badges):
   ```json
   "sections": {
     "overviewCard": {
       "fields": ["purchaseRequisition", "documentTypeText", "releaseText"]
     }
   }
   ```

---

### Layer 5 — Frontend UI Components & Translation

1. **Dynamic Section Renderer:**
   No component edits required for fields in `uiSchema`! [`TaskDetailSections.registry.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/renderers/TaskDetailSections.registry.ts) dynamically builds cards and tables directly from `uiSchema` + `fieldSchema`.
2. **Specific UI Components:**
   For custom timeline components (e.g., [`WorkflowApprovalPanel.tsx`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/panels/WorkflowApprovalPanel.tsx)), update JSX to prefer human-readable text over raw codes:
   ```tsx
   {step.releaseText ? (
       <span>{step.releaseText}</span>
   ) : step.releaseCode ? (
       <span>Code {step.releaseCode}</span>
   ) : null}
   ```
3. **i18n Translations:**
   Add label keys in `app/cnma_approval_ui/src/locales/en.json` and `vi.json` for new UI strings.

---

### Layer 6 — Mandatory Verification Pipeline

Always run the 3-step verification suite before finishing your task:

```powershell
# 1. Backend unit tests
npm test

# 2. Frontend unit tests
cd app/cnma_approval_ui; npm test

# 3. TypeScript compilation check (0 errors required)
npx tsc --noEmit
cd app/cnma_approval_ui; npx tsc --noEmit
```

---

## 📌 Common Pitfalls & Solutions

| Symptom | Root Cause | Fix |
|---|---|---|
| Field appears `undefined` in UI | OData sub-entity not expanded or missing from `fetchSubEntities()` `Promise.all()` | Add sub-entity fetch in `srv/lib/integrations/[type].ts` |
| Field missing from JSON response | Mapping missing from `config.json` under `mappings` | Add `sourcePath` -> `targetPath` rule in `config.json` |
| TypeScript compilation error | Contract out of sync between `canonical-business-object.ts` and `inbox.types.ts` | Update interface properties in both contract files |
| Field not rendered in UI section | Field key omitted from `uiSchema.sections.[sectionId].fields` | Add key to `fields` array in `config.json` |
| Hardcoded code displayed instead of text | Component rendering raw `code` property instead of `text` property | Update component to render `step.releaseText || step.releaseCode` |
