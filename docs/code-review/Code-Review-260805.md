# Code Review Report

**Date:** 260805
**Reviewer:** Leo – AI + 4-Eyes
**Scope:** Recent Git Tree Changes (PO Subtype Renderers, Reference PR Integration, Error Modal & Formatters, Task Detail Panels)

---

## Code Score

**Overall: 78 / 100**

> *Functional implementation is robust with 0 TypeScript errors and passing MTA production builds, but score is impacted by significant DRY violations across 10 PO subtype renderers, mid-file module imports, and PR number zero-stripping edge case bugs.*

---

## Business Impact Assessment

The recent changes deliver high business value by enabling approvers to view Reference Purchase Requisitions (PR) directly from Purchase Order (PO) approval tasks, alongside mobile pull-to-refresh and unified error diagnostics. 

However, edge cases like PR number zero-stripping (`"0000000000"`) could cause API request failures when users inspect certain reference documents. Additionally, duplicated row-mapping logic across 10 PO subtype renderer files increases maintenance overhead and regression risk when extending SAP PO field definitions in future releases.

---

## Actionable Findings

### 🔴 CRITICAL — Must fix before shipping

| # | Location | Issue | Recommendation |
|---|---|---|---|
| C1 | `srv/lib/integrations/reference-pr.ts` (`fetchReferencePrDetail`) | `prNumber.replace(/^0+/, '')` reduces `"0000000000"` or `"0"` to an empty string `""`, causing invalid SAP OData endpoint request `A_PurchaseRequisitionHeader('')` and HTTP 400 errors. | Fall back to original `prNumber` if zero-stripped result is empty. |
| C2 | `app/cnma_approval_ui/src/renderers/shared/formatters.ts` | Import statement `import type { DetailTableModel, DetailTableRow }` is placed at line 244 in the middle of executable code instead of the top of the module. | Move all `import` statements to top of file (lines 1–3). |

### 🟡 WARNING — Tech debt / design issues

| # | Location | Issue | Recommendation |
|---|---|---|---|
| W1 | `app/cnma_approval_ui/src/renderers/modules/po/subtypes/*.ts` | 10 subtype files (`po.zub.ts`, `po.zexp.ts`, `po.znb1.ts`, etc.) duplicate 50+ lines of identical line-item property extraction logic. | Refactor line-item mapping into a shared `mapPoLineItemRow()` helper in `po.builder.ts`. |
| W2 | `srv/lib/integrations/reference-pr.ts` | `items[0]?.purReqnItemCurrency` accessed without verifying non-empty array, causing potential undefined currency fallbacks. | Extract currency safely via a dedicated helper checking header first, then item array. |
| W3 | `app/cnma_approval_ui/src/hooks/usePullToRefresh.ts` | Touch event handlers bound without `{ passive: true }` option, potentially causing scroll performance jank on mobile WebKit browsers. | Add `{ passive: true }` option to `touchstart` and `touchmove` listeners. |
| W4 | `srv/controllers/inbox-controller.ts` (`getMe`) | Hardcoded `@conarum.com` domain fallback in user controller mixes organizational business rules into generic auth resolution. | Move default domain fallback into domain configuration or environment variable. |

### 🔵 LOW — Nice-to-have improvements

| # | Location | Issue | Recommendation |
|---|---|---|---|
| L1 | `app/cnma_approval_ui/src/renderers/shared/formatters.ts` | Magic floating point rank (`rank: 14.5`) used for Reference PR column ordering in `SAP_GUI_COLUMN_MAP`. | Re-index column ranks using integer scales (e.g. 140, 150, 160). |
| L2 | Multiple UI Renderers | Extensive use of `any` and `Record<string, any>` for raw SAP items (`rawItems?: any[]`). | Define interface `RawPoItem` / `RawPrItem` for strong typing across renderers. |
| L3 | `app/cnma_approval_ui/src/pages/Inbox/components/ReferencePrDetailView.tsx` | Duplicate `EMPTY_VALUE` definition instead of importing canonical `EMPTY_VALUE` constant from `formatters.ts`. | Import `EMPTY_VALUE` from `@/renderers/shared/formatters`. |

---

## Finding Details

### [C1] — PR Number Zero-Stripping Bug

**Class / Function:** `fetchReferencePrDetail` in `srv/lib/integrations/reference-pr.ts`

**Detail:** When `prNumber` is `"0000000000"` or `"0"`, `prNumber.replace(/^0+/, '')` returns `""`. Subsequent padding `cleanPrNumber.padStart(10, '0')` results in `"0000000000"`, but initial unpadded OData fallback query `A_PurchaseRequisitionHeader('')` triggers invalid OData query syntax error.

**Before flow → Optimised flow**

```mermaid
flowchart LR
    A[prNumber: '0000000000'] --> B[replace /^0+/ -> ''] --> C[cleanPrNumber is Empty] --> D[SAP Query /A_PurchaseRequisitionHeader('') -> 400 Error]
```

→

```mermaid
flowchart LR
    A[prNumber: '0000000000'] --> B[cleanPrNumber = stripped || prNumber] --> C[cleanPrNumber is '0'] --> D[SAP Query /A_PurchaseRequisitionHeader('0000000000') -> OK]
```

---

### [C2] — Mid-File Import Declaration

**Class / Function:** `app/cnma_approval_ui/src/renderers/shared/formatters.ts` (Line 244)

**Detail:** TypeScript / ES module specification requires imports to be hoisted to the top of the file. Placing `import type { DetailTableModel, DetailTableRow } from '../TaskDetailSections.types';` at line 244 disrupts static code readability and linting rules.

**Remediation:** Move line 244 to line 2 alongside existing imports.

---

### [W1] — DRY Violation Across 10 PO Subtype Renderers

**Class / Function:** `buildPoZubItemsTable`, `buildPoZexpItemsTable`, `buildPoZnb1ItemsTable`, etc.

**Detail:** All 10 PO subtype files in `src/renderers/modules/po/subtypes/` contain copy-pasted blocks of row property extraction:

```typescript
const itemCurrency = item.documentCurrency || item.DocumentCurrency || ... || 'VND';
const itemPrice = item.price ?? item.Price ?? ...;
const itemTotal = item.totalAmount ?? item.TotalAmount ?? ...;
```

**Before flow → Optimised flow**

```mermaid
flowchart TD
    subgraph Copy-Pasted Mapping (10 Files)
        ZUB[po.zub.ts] --> M1[50 lines row mapping]
        ZEXP[po.zexp.ts] --> M2[50 lines row mapping]
        ZNB1[po.znb1.ts] --> M3[50 lines row mapping]
    end
```

→

```mermaid
flowchart TD
    subgraph Single Shared Mapper
        ZUB[po.zub.ts] --> BASE[buildPoItemsTable(items, columns, 'ZUB')]
        ZEXP[po.zexp.ts] --> BASE
        ZNB1[po.znb1.ts] --> BASE
        BASE --> MAPPER[mapPoItemRow(item, parentCurrency)]
    end
```

---

## Principles Summary

| Principle | Status | Notes |
|---|---|---|
| **SOLID** | ⚠️ Improve | `formatters.ts` mixes SAP column GUI layout ranking with string formatters (SRP violation). |
| **DRY** | ❌ Fail | 10 PO subtype renderer files duplicate 50+ lines of line-item field parsing logic. |
| **YAGNI** | ✅ Pass | All added features (Reference PR, Pull to Refresh, Error modal) serve explicit business requirements. |
| **KISS** | ⚠️ Improve | Overly nested fallback property access chains in PO item mapping. |

