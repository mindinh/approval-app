/**
 * Task card (worklist row) helpers: the record a card reads from and its summary chips.
 */
import type { RawODataEntity } from '@/services/inbox/inbox.contracts';
import type { BusinessChipConfig, InboxTask } from '@/services/inbox/inbox.types';
import type { ObjectViewDefinition } from './types';
import { evalField } from './objectView';
import { formatAmountWithCurrency, formatDateShortLocale } from './formatters';
import { EMPTY_VALUE } from './model';

export interface BusinessChip {
    label?: string;
    value: string;
    isPrimary?: boolean;
}

/** Locale of backend QUANTITY chips (kept as-is; differs from detail quantities, which use en-US). */
const CHIP_QUANTITY_LOCALE = 'vi-VN';
const DEFAULT_CHIP_CURRENCY = 'VND';

interface DetailHeaderSource {
    businessObject?: RawODataEntity;
    header?: RawODataEntity;
}

/** A previously loaded task detail whose header can enrich the worklist record. */
export interface CachedTaskDetail extends DetailHeaderSource {
    rawDetail?: DetailHeaderSource;
}

/** Merges the task, its legacy business context and an optional cached detail into one record. */
export function extractTaskEntityRecord(task: InboxTask, cachedDetail?: CachedTaskDetail): RawODataEntity {
    const boFromCache =
        cachedDetail?.businessObject ||
        cachedDetail?.header ||
        cachedDetail?.rawDetail?.businessObject ||
        cachedDetail?.rawDetail?.header;

    const legacyHeader =
        task?.businessContext?.po?.header ||
        task?.businessContext?.pr?.header ||
        task?.businessContext?.claim?.header;

    const rawObjectType = task?.objectType || task?.businessContext?.type || boFromCache?.DocCategory || boFromCache?._meta?.objectType || '';
    const rawDocType = task?.documentType || task?.doctyp || task?.documentTypeDisplay || boFromCache?.DocumentType || '';

    return {
        ...task,
        ...task?.businessContext,
        ...(legacyHeader && typeof legacyHeader === 'object' ? legacyHeader : {}),
        ...boFromCache,
        DocCategory: rawObjectType,
        DocumentType: rawDocType,
    };
}

function formatBackendChip(chip: BusinessChipConfig, task: InboxTask, amountLocale?: string): BusinessChip {
    let value: string;
    switch (chip.dataType) {
        case 'AMOUNT': {
            const currency = chip.currency || task.curr_vnd || task.doc_curr || DEFAULT_CHIP_CURRENCY;
            value = formatAmountWithCurrency(chip.value as string | number, currency, amountLocale);
            break;
        }
        case 'DATE':
            value = formatDateShortLocale(String(chip.value));
            break;
        case 'QUANTITY': {
            const num = Number(chip.value);
            const formattedNum = Number.isNaN(num) ? String(chip.value) : num.toLocaleString(CHIP_QUANTITY_LOCALE);
            value = chip.unit ? `${formattedNum} ${chip.unit}` : formattedNum;
            break;
        }
        case 'BOOLEAN':
            value = chip.value ? 'Yes' : 'No';
            break;
        default:
            value = String(chip.value ?? '').trim();
    }
    return { label: chip.label || undefined, value, isPrimary: Boolean(chip.isPrimary) };
}

/**
 * Chips shown on a task card: backend-provided chips win; otherwise the view's `cardChips`
 * are evaluated against the task record (empty values are dropped).
 */
export function evalTaskCardChips(
    viewDef: ObjectViewDefinition,
    record: RawODataEntity,
    task: InboxTask,
    backendAmountLocale?: string
): BusinessChip[] {
    if (task.businessChips && task.businessChips.length > 0) {
        return task.businessChips.map((chip) => formatBackendChip(chip, task, backendAmountLocale));
    }

    const chips: BusinessChip[] = [];
    for (const chipDef of viewDef.cardChips ?? []) {
        const field = evalField(chipDef, record);
        if (field && field.value && field.value !== EMPTY_VALUE) {
            chips.push({ label: field.label, value: field.value, isPrimary: chipDef.isPrimary });
        }
    }
    return chips;
}
