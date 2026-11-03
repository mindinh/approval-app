/**
 * Public API of the document renderers. Import from `@/renderers` only; internal files may move.
 * This module is UI-agnostic (no React, DOM or CSS) so it can later be shared with the mobile app.
 */
export { OBJECT_TYPE_MODULES, findObjectTypeModule, resolveObjectViewDefinition } from './ObjectView.registry';
export { resolveBusinessSectionModel, resolveTaskCardConfigForTask, type DetailInput, type TaskCardConfig } from './resolvers';
export { resolveObjectView } from './core/objectView';
export { EMPTY_VALUE } from './core/model';
export type {
    BusinessSectionModel,
    DetailCardModel,
    DetailField,
    DetailTableColumn,
    DetailTableModel,
    DetailTableRow,
} from './core/model';
export type { BusinessChip, CachedTaskDetail } from './core/taskCardView';
export type { FieldKind, ObjectCategory, ObjectTypeModule, ObjectViewDefinition, Tone } from './core/types';
