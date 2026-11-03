# CNMA Approval — Developer & AI Agent Context Guide

> **Project Stack:** SAP CAP Node.js (BFF) · Express · Vite React (TypeScript) · Raw OData Backend Strategy (`BaseRawDetail`) · Declarative Raw OData FE Renderer (`ObjectView.registry.ts`) · @cnma/react-ui

This document is automatically read by AI coding agents at session start. It contains mandatory rules, architectural workflows, and step-by-step instructions for adding new fields, modifying field formatters, updating layout column orders, adding subtype cards/tables, or onboarding new business object types across the application (`PR`, `PO`, `CLAIM`, `RESERVATION`, `CONTRACT`, `INVOICE`, etc.).

---

## 🏗️ Data Field Architecture & Display Mechanism

Data fields flow end-to-end through a **Raw OData & Declarative Renderer Pipeline**:

```
[S/4HANA OData / SAP API] 
       │ (1. Raw OData Fetch via BaseRawDetail — no key renaming or string conversion)
       ▼
[srv/lib/integrations/[type].ts]  <-- Strategy Adapter queries raw S/4HANA entities & navigations
       │ (2. Concurrent fetch & unwrap OData containers)
       ▼
[BFF REST API: GET /tasks/tasks/:id]
       │ (3. Returns minimal envelope: { businessObject, taskprocessing: { task, decisionOptions } })
       ▼
[app/cnma_approval_ui/src/renderers/]
       │ ── Primary Declarative Renderer: ObjectView.registry.ts + [type].views.ts + [type].fields.ts
       │ ── Core Infrastructure: renderers/core/ (fields.ts, formatters.ts, predicates.ts, objectView.ts)
       ▼
[React UI Components: TaskDetailView, OverviewPanel, DetailsPanel, TaskCard]
```

---

## 📋 1. Task Card Worklist (Left Sidebar) — Field Source & Modification Guide

### Where Task Card Fields (Chips) Come From:
Each card in the left sidebar worklist (`TaskCard.tsx`) displays key summary info chips (Total Amount, Document Type...).
`TaskCard.tsx` calls `resolveTaskCardConfigForTask(task)` from `@/renderers`, which returns `{ tone, chips, viewDef, module }`:
- If the BFF sends `task.businessChips`, those are formatted and shown as-is (`core/taskCardView.ts`).
- Otherwise the `cardChips` of the matching view in `objects/[type]/[type].views.ts` are evaluated against the task record (empty values are dropped).

### How to Add or Modify Task Card Fields:
1. Open `objects/[type]/[type].views.ts` and edit its `cardChips` (e.g. `standardCardChips` / `zubCardChips` in `po.views.ts`):
   ```typescript
   const standardCardChips: TaskCardChipDefinition[] = [
       chip(amount({ value: 'TotalOrderValue|TotalNetAmountLocalCrcy', currency: 'LocalCurrency|DocumentCurrency', label: 'Total' }), true), // primary chip
       chip(text({ source: 'DocumentTypeText|DocumentType', label: 'Type' })),
       chip(text({ source: 'SupplierName', label: 'Vendor' })),
   ];
   ```
2. Card accent colour comes from the module `tone` (`primary` | `info` | `warning` | `success`) in `[type].views.ts`. `TaskCard.tsx` maps tone → Tailwind classes in `TONE_CLASSES`; never put CSS classes in `src/renderers/`.

---

## 🎯 2. Task Detail View (Overview & Details Tabs) — Field & Layout Guide

Task Detail panels use the **Declarative Raw OData Object Renderer**:
- **Field Primitive Catalogs**: [`app/cnma_approval_ui/src/renderers/objects/[type]/[type].fields.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/renderers/objects/po/po.fields.ts)
- **View & Table Layouts**: [`app/cnma_approval_ui/src/renderers/objects/[type]/[type].views.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/renderers/objects/po/po.views.ts)
- **Master View Registry**: [`app/cnma_approval_ui/src/renderers/ObjectView.registry.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/renderers/ObjectView.registry.ts)
- **Core Field Primitives & Helpers**: [`app/cnma_approval_ui/src/renderers/core/fields.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/renderers/core/fields.ts) (provides `text()`, `codeText()`, `amount()`, `date()`, `quantity()`, `tableCol()`, `excludeColumns()`, `chip()`)
- **Visibility Predicates**: [`app/cnma_approval_ui/src/renderers/core/predicates.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/renderers/core/predicates.ts) (provides `when.exists`, `when.eq`, `when.in`, `when.notEmpty`, `when.all`, `when.not`)
- **Other core files**: `core/types.ts` (definitions, `Tone`, `ObjectTypeModule`), `core/model.ts` (output model, `EMPTY_VALUE`), `core/record.ts` (`getRecordVal`: `A|B` fallbacks + cached case-insensitive lookup), `core/formatters.ts` (pure formatters, cached `Intl`), `core/objectView.ts` (evaluation), `objects/generic/` (fallback view for unknown types).

> ⚠️ **RENDERER RULES**
> - `src/renderers/` is UI-agnostic (shared later with the mobile app): no React, DOM, CSS classes or imports from `@/pages`, `@/components`, `@/hooks`, `@/lib` (enforced by ESLint). Consumers import from `@/renderers` only.
> - Display output is locked by golden snapshots in `app/cnma_approval_ui/tests/renderers/golden/`. A failing snapshot means the UI changed: only update it (`npx vitest run tests/renderers -u`) when the change is intended, and review the snapshot diff.

### How to Modify Fields or Formatting in Overview/Details:
1. Open `[type].fields.ts` (e.g. [`po.fields.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/renderers/objects/po/po.fields.ts) or [`pr.fields.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/renderers/objects/pr/pr.fields.ts)).
2. Add or update field primitive definitions:
   ```typescript
   // Example 1: Standardized vendor code + name formatting (using shared helper)
   vendor: text({
       source: 'Supplier',
       label: 'Vendor',
       formatter: (_val, record) => formatVendorCodeAndName(record)
   }),

   // Example 2: Short date or datetime formatting
   creationDate: date({ source: 'CreationDate', label: 'Created On', timeSource: 'CreationTime' }),

   // Example 3: Code + Description combination (e.g. "1710 - US TRADING PLANT")
   plant: codeText({ code: 'Plant', text: 'PlantName', label: 'Plant' }),

   // Example 4: Currency Amount
   total: amount({ value: 'TotalOrderValue', currency: 'LocalCurrency', label: 'Total Amount' }),

   // Example 5: Line item table column definition
   materialCol: tableCol({
       key: 'material',
       header: 'Material Number',
       source: 'Material',
       align: 'left'
   })
   ```

   > ⚠️ **CRITICAL RULE FOR `text()` FACTORY**: The `text()` factory in `fields.ts` MUST preserve `config.formatter` via `formatter: config.formatter || ((val) => formatRawValue(val))`. Never override `config.formatter` with standard default functions without calling user-supplied formatters.

### How to Change Field Layout or Column Order:
1. Open `[type].views.ts` (e.g. [`po.views.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/renderers/objects/po/po.views.ts) or [`pr.views.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/renderers/objects/pr/pr.views.ts)).
2. **Overview Grid Fields Order**: Rearrange items in the card's `fields` array (e.g. `standardOverviewCard.fields` or `zubOverviewCard.fields` in `po.views.ts`):
   ```typescript
   const standardOverviewCard: CardDefinition = {
       id: 'po-overview-card',
       title: 'Overview',
       fields: [
           PO_OVERVIEW_FIELDS.poNumber,
           PO_OVERVIEW_FIELDS.documentType,
           PO_OVERVIEW_FIELDS.requester,
           PO_OVERVIEW_FIELDS.vendor, // 👈 Position dictates order in 3-column desktop grid
           PO_OVERVIEW_FIELDS.releaseStrategy,
           PO_OVERVIEW_FIELDS.companyCode,
           PO_OVERVIEW_FIELDS.creationDate,
           PO_OVERVIEW_FIELDS.paymentTerms,
           PO_OVERVIEW_FIELDS.total
       ]
   };
   ```
3. **Table Columns Order**: Rearrange columns array in table definitions (e.g. `standardColumns` or subtype variants such as `columnsMarketing` in `po.views.ts`). The order in the `columns` array dictates left-to-right table column order.
   > 💡 **DRY Column Derivation**: Use `excludeColumns(standardColumns, 'key1', 'key2')` helper to derive subtype-specific column variations dynamically without repeating full column definitions.
4. **Multiline vs Full-Width Card vs Top Grid**:
   - Fields in grid display **3 columns per row** on desktop.
   - Setting `isLongText: true` on a `FieldDefinition` moves it out of the 3-column top grid into a separate full-width section card below the grid (e.g., `HeaderNote`, `Purpose`, `PaidBy`, `BankDetails`).
   - For multiline values inside the 3-column top grid (like 5-line Vendor text), do **NOT** set `isLongText: true`. `OverviewPanel.tsx` handles newlines natively with `whitespace-pre-wrap block w-full`.
5. **Conditional Cards or Subtype Layouts**:
   - Use visibility predicates (`when.eq('DocumentType', 'ZUB')`, `when.in('DocumentType', ['ZCOR', 'ZNBR'])`) or subtype specification maps in `[type].views.ts` to switch layouts dynamically per subtype.

---

## 🎯 3. Onboarding a Completely New Object Type (e.g., `CONTRACT`, `INVOICE`)

Follow this step-by-step checklist to onboard a new business object type end-to-end:

### Step 1: Backend Strategy (`srv/lib/integrations/[newType].ts`)
1. Create `srv/lib/integrations/[newType].ts` extending `BaseRawDetail`.
2. Define strategy metadata:
   ```typescript
   export class ContractDetail extends BaseRawDetail {
       readonly objectType = 'CONTRACT';
       readonly docCategory = 'BUS2014';
       readonly entityName = 'CNMA_CONTRACTHEADER';
       readonly defaultNavigations = ['_Item', '_ApprovalStep', '_HeaderText', '_Attachment', '_Comment'];
   }
   ```
3. Register strategy in [`sap-odata-adapter.ts`](file:///d:/learning/test/cnma_approval/srv/lib/integrations/sap-odata-adapter.ts).
4. Update category routing in [`inbox-processor.ts`](file:///d:/learning/test/cnma_approval/srv/lib/processors/inbox-processor.ts).

### Step 2: Frontend OData Renderer Definitions (`app/cnma_approval_ui/src/renderers/`)
1. Create `app/cnma_approval_ui/src/renderers/objects/[newType]/[newType].fields.ts`:
   Define overview fields, detail fields, and table columns using `text()`, `codeText()`, `amount()`, `date()`, `tableCol()`.
2. Create `app/cnma_approval_ui/src/renderers/objects/[newType]/[newType].views.ts`:
   Define the overview card(s), item table and `cardChips` (task card chips), then export an `ObjectTypeModule`:
   ```typescript
   export const contractModule: ObjectTypeModule = {
       category: 'CONTRACT',
       label: 'Contract',               // short name on task cards
       aliases: ['BUS2014', 'CONTRACT'],// upper-case category codes from SAP/BFF
       tone: 'info',
       resolveView: (documentType) => CONTRACT_VIEWS[documentType] || CONTRACT_VIEWS.DEFAULT,
   };
   ```
3. Register the module in `OBJECT_TYPE_MODULES` in [`ObjectView.registry.ts`](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/renderers/ObjectView.registry.ts). No other renderer code changes are needed.
4. Add a fixture for each document type to `tests/renderers/golden/fixtures.ts` and a golden case to `renderers.golden.test.ts`.

### Step 3: Frontend Translations
1. Add i18n keys in `app/cnma_approval_ui/src/locales/en.json` and `vi.json`.

---

## 🛠️ Verification & Quality Commands

Before claiming any task complete, run:
```powershell
# 1. Run backend unit test suite
npm test

# 2. Run frontend TypeScript typecheck
cd app/cnma_approval_ui; npx tsc --noEmit
```

---

## 📚 Key Reference Links
* Architecture & Raw Renderer Overview: [04-config-driven-mapping.md](file:///d:/learning/test/cnma_approval/docs/technical/01-architecture/04-config-driven-mapping.md)
* Project Structure: [02-project-structure.md](file:///d:/learning/test/cnma_approval/docs/technical/02-implementation/02-project-structure.md)
* Backend BFF REST Endpoints: [03-backend-bff-endpoints.md](file:///d:/learning/test/cnma_approval/docs/technical/02-implementation/03-backend-bff-endpoints.md)
* Frontend Component Architecture: [04-frontend-components.md](file:///d:/learning/test/cnma_approval/docs/technical/02-implementation/04-frontend-components.md)
* Field Mapping & Pipeline Guide: [05-field-mapping-guide.md](file:///d:/learning/test/cnma_approval/docs/technical/02-implementation/05-field-mapping-guide.md)
* Data Retrieval & Display Report: [06-data-retrieval-and-display-report.md](file:///d:/learning/test/cnma_approval/docs/technical/02-implementation/06-data-retrieval-and-display-report.md)
