# CNMA Approval — Developer & AI Agent Context Guide

> **Project Stack:** SAP CAP Node.js (BFF) · Express · Vite React (TypeScript) · Config-Driven Mapping Engine

This document is automatically read by AI coding agents at session start. It contains mandatory rules, architectural workflows, and step-by-step instructions for adding new fields, modifying APIs, or onboarding new business object types.

---

## 🎯 MANDATORY WORKFLOW: Adding Fields, Fixing APIs & Scaffolding Objects

When modifying APIs, adding new fields to UI/payloads, or adding new business object types, follow this exact workflow matrix:

### 1. Showing a New Field (From Existing SAP OData Payload)
If the raw OData response already returns the SAP property:
1. **`srv/configuration/object-types/[type]/config.json`**:
   * Add mapping item to `mappings.root` (for header fields) or `mappings.collections.[key].fields` (for item fields).
     ```json
     { "sourcePath": "purReqCreationDate", "targetPath": "header.purReqCreationDate", "transform": "sapDateToIso" }
     ```
   * Add the target field name (e.g. `"purReqCreationDate"`) to `uiSchema.sections.[sectionId].fields` if you want it to appear in UI card sections.
   * If `profiles.detail.includeUiFields` is `true`, the field will automatically be projected.
2. **`srv/lib/mapping/canonical-business-object.ts`**:
   * Add the typed field to `CanonicalHeader` or `CanonicalItem` interfaces to ensure full TypeScript type safety.
3. **Frontend UI (`app/cnma_approval_ui/`)**:
   * **Zero UI code required!** The dynamic section renderer registry ([`TaskDetailSections.registry.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/renderers/TaskDetailSections.registry.ts)) automatically reads `uiSchema` and renders/formats the field on screen.
   * Add field label translations in [`app/cnma_approval_ui/src/locales/en.json`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/locales/en.json) and `vi.json` if necessary.

---

### 2. Showing a New Field Requiring New SAP OData Sub-Entities / Queries
If fetching the new field requires querying an additional SAP navigation path or OData entity:
1. **`srv/lib/integrations/[type].ts`** (e.g. `pr.ts`, `po.ts`, `claim.ts`, `re.ts`):
   * Extend `fetchSubEntities()` in the strategy class to query the new navigation/entity path from S/4HANA OData service.
2. **`srv/configuration/object-types/[type]/config.json`**:
   * Add navigation alias under `source.navigations`.
   * Add mapping rule under `mappings.collections` or `mappings.root`.
   * Include field key in `uiSchema.sections`.
3. **`srv/lib/mapping/canonical-business-object.ts`**:
   * Update TypeScript interface contracts.

---

### 3. Adding a Completely New Business Object Type (e.g., `CONTRACT`, `INVOICE`)
Follow these step-by-step instructions to scaffold a new object type:
1. **Create Configuration**:
   Create directory `srv/configuration/object-types/[newType]/` and add `config.json` defining `object`, `source`, `mappings`, `uiSchema`, and `profiles`.
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
4. **Update Code Constants**:
   Update `ObjectTypeCode` union in `canonical-business-object.ts` and `srv/lib/processors/object-config.ts`.
5. **Add Localized Labels**:
   Add document type labels in `app/cnma_approval_ui/src/locales/en.json` and `vi.json`.

---

### 4. Fixing Field Mapping or Transforming Data Format
* **Raw OData Field Name Changed**: Update `sourcePath` in `srv/configuration/object-types/[type]/config.json`.
* **Value Formatting Needed**: Check [`srv/lib/mapping/transforms.ts`](file:///d:/learning/test/cnma_approval/srv/lib/mapping/transforms.ts) (`sapDateToIso`, `number`, `uppercase`, `lowercase`, `boolean`). Specify `"transform": "transformName"` in `config.json`.
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
* Architecture & Mapping Engine: [04-config-driven-mapping.md](file:///d:/learning/test/cnma_approval/docs/technical/01-architecture/04-config-driven-mapping.md)
* Backend BFF Endpoints: [03-backend-bff-endpoints.md](file:///d:/learning/test/cnma_approval/docs/technical/02-implementation/03-backend-bff-endpoints.md)
* Declarative Schema Reference: [01-configuration.md](file:///d:/learning/test/cnma_approval/docs/technical/04-reference/01-configuration.md)
