# Raw OData and Declarative Renderer Architecture

> **Owner:** Project Team | **Last Updated:** 2026-10-20 | **Status:** Active

## Backend contract

The BFF returns a raw `businessObject` and `taskprocessing` envelope. It removes OData transport wrappers without renaming business properties.
[BaseRawDetail](../../../srv/lib/integrations/base.ts) reads the strategy's `source` configuration (`entity`, `docCategory`, `navigations`), loads the header with expansions and retries missing navigations separately.
CLAIM overrides header keys to include `ApproverNumber`.

The historical backend JSON mapping registry/canonical projector is removed. Raw strategies are registered in [SapOdataAdapter](../../../srv/lib/integrations/sap-odata-adapter.ts).
There is no backend mock-data provider selected by `USE_MOCK_SAP`.

## Frontend renderer

| Source | Responsibility |
| --- | --- |
| [renderer.types.ts](../../../app/cnma_approval_ui/src/renderers/core/renderer.types.ts) | Field, card, table, chip and object view contracts. |
| [fields.ts](../../../app/cnma_approval_ui/src/renderers/core/fields.ts) | `text`, `codeText`, `amount`, `quantity`, `date`, `tableCol`, `chip` factories. |
| [formatters.ts](../../../app/cnma_approval_ui/src/renderers/core/formatters.ts) | Raw dates, amounts, quantities, code/text and multiline presentation. |
| [predicates.ts](../../../app/cnma_approval_ui/src/renderers/core/predicates.ts) | Conditional field/card visibility. |
| [objectView.ts](../../../app/cnma_approval_ui/src/renderers/core/objectView.ts) | Field/column evaluation and `resolveObjectView`. |
| [ObjectView.registry.ts](../../../app/cnma_approval_ui/src/renderers/ObjectView.registry.ts) | Resolve view from raw entity; build section model from detail input. |
| [taskCardView.ts](../../../app/cnma_approval_ui/src/renderers/core/taskCardView.ts) | Extract card record, evaluate `cardChips`, resolve style. |
| [objects](../../../app/cnma_approval_ui/src/renderers/objects/) | PR/PO/CLAIM/Reservation catalogs and subtype layouts. |

`resolveObjectViewDefinition(businessObject)` selects an object definition.
`resolveBusinessSectionModel(detailInput)` builds the detail sections.
`resolveTaskCardConfigForTask(task, cachedDetail?)` builds card configuration.
These accept complete objects rather than separate category/type arguments.

## Editing fields and layouts

- Define raw property references using the field factories; keep custom `text()` formatters intact.
- Field/column identity uses `key`; tables use `sourcePath`, not the historical `itemSource`.
- Reorder card `fields` or table `columns` to change layout order.
- Configure worklist summaries with object-view `cardChips`; there is no current `taskCard.mapper.ts`.
- Keep subtype behavior in object definitions and shared formatting in core helpers.

For a new object, implement a strategy with a `source` definition, register it in the adapter/resolver, add field/view catalogs and register the frontend view. Add translations and verify the supported payload before documenting it.
See [field guide](../02-implementation/05-field-mapping-guide.md), [configuration](../04-reference/01-configuration.md), and [REST API](../02-implementation/03-backend-bff-endpoints.md).
