/**
 * Entry points used by the UI: build the detail section model and the task card configuration.
 */
import type { RawODataEntity } from '@/services/inbox/inbox.contracts';
import type { InboxTask } from '@/services/inbox/inbox.types';
import type { ObjectTypeModule, ObjectViewDefinition, Tone } from './core/types';
import type { BusinessSectionModel } from './core/model';
import { SECTION_TITLE, resolveObjectView } from './core/objectView';
import { evalTaskCardChips, extractTaskEntityRecord, type BusinessChip, type CachedTaskDetail } from './core/taskCardView';
import { findObjectTypeModule, readDocCategory, resolveObjectViewDefinition } from './ObjectView.registry';

const DEFAULT_TONE: Tone = 'primary';

/** Task detail payload shapes: `{ businessObject }`, `{ header, items }` or the raw business object. */
export type DetailInput = RawODataEntity & { businessObject?: RawODataEntity; header?: RawODataEntity; items?: unknown };

function businessObjectOf(input: DetailInput): RawODataEntity {
    if (input.businessObject) return input.businessObject;
    return input.header ? { ...input.header, _Item: input.items } : input;
}

/** Builds the overview cards and line-item table for a task detail response. */
export function resolveBusinessSectionModel(detailInput: DetailInput | null | undefined): BusinessSectionModel {
    if (!detailInput) return { title: SECTION_TITLE, cards: [], tables: [] };
    const businessObject = businessObjectOf(detailInput);
    return resolveObjectView(resolveObjectViewDefinition(businessObject), businessObject);
}

export interface TaskCardConfig {
    viewDef: ObjectViewDefinition;
    record: RawODataEntity;
    module?: ObjectTypeModule;
    tone: Tone;
    chips: BusinessChip[];
}

/** Everything a worklist card needs: tone, summary chips and the resolved view. */
export function resolveTaskCardConfigForTask(task: InboxTask, cachedDetail?: CachedTaskDetail): TaskCardConfig {
    const record = extractTaskEntityRecord(task, cachedDetail);
    const module = findObjectTypeModule(readDocCategory(record));
    const viewDef = resolveObjectViewDefinition(record, module);
    return {
        viewDef,
        record,
        module,
        tone: module?.tone ?? DEFAULT_TONE,
        chips: evalTaskCardChips(viewDef, record, task, module?.chipAmountLocale),
    };
}
