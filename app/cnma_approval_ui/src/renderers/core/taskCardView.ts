import type { RawODataEntity } from '@/services/inbox/inbox.contracts';
import type { InboxTask } from '@/services/inbox/inbox.types';
import type { ObjectViewDefinition, TaskCardStyleConfig } from './renderer.types';
import { evalField } from './objectView';
import { formatAmountWithCurrency, formatDateShortLocale } from '@/pages/Inbox/utils/formatters';

export interface BusinessChip {
    label?: string;
    value: string;
    isPrimary?: boolean;
}

/**
 * Extracts a normalized, unified business entity from Task and optional detail cache.
 */
export function extractTaskEntityRecord(task: InboxTask, cachedDetail?: any): RawODataEntity {
    const boFromCache =
        cachedDetail?.businessObject ||
        cachedDetail?.header ||
        cachedDetail?.rawDetail?.businessObject ||
        cachedDetail?.rawDetail?.header;

    const legacyHeader =
        task?.businessContext?.po?.header ||
        task?.businessContext?.pr?.header ||
        task?.businessContext?.claim?.header;

    const rawObjectType =
        task?.objectType ||
        task?.businessContext?.type ||
        boFromCache?.DocCategory ||
        boFromCache?._meta?.objectType ||
        '';

    const rawDocType =
        task?.documentType ||
        task?.doctyp ||
        task?.documentTypeDisplay ||
        boFromCache?.DocumentType ||
        '';

    return {
        ...task,
        ...task?.businessContext,
        ...legacyHeader,
        ...boFromCache,
        DocCategory: rawObjectType,
        DocumentType: rawDocType,
    };
}

/**
 * Formats dynamic backend chips if present.
 */
function formatDynamicChip(chip: any, task: InboxTask): BusinessChip {
    let formattedValue = '';

    switch (chip.dataType) {
        case 'AMOUNT': {
            const currency = chip.currency || task.curr_vnd || task.doc_curr || 'VND';
            formattedValue = formatAmountWithCurrency(chip.value, currency);
            break;
        }
        case 'DATE': {
            formattedValue = formatDateShortLocale(String(chip.value));
            break;
        }
        case 'QUANTITY': {
            const num = Number(chip.value);
            const formattedNum = Number.isNaN(num)
                ? String(chip.value)
                : num.toLocaleString('vi-VN');
            formattedValue = chip.unit ? `${formattedNum} ${chip.unit}` : formattedNum;
            break;
        }
        case 'BOOLEAN': {
            formattedValue = chip.value ? 'Yes' : 'No';
            break;
        }
        default: {
            formattedValue = String(chip.value ?? '').trim();
            break;
        }
    }

    return {
        label: chip.label || undefined,
        value: formattedValue,
        isPrimary: Boolean(chip.isPrimary),
    };
}


/**
 * Evaluates card chips defined in an ObjectViewDefinition against a task record.
 */
export function evalTaskCardChips(
    viewDef: ObjectViewDefinition,
    record: RawODataEntity,
    task: InboxTask
): BusinessChip[] {
    // 1. If backend dynamic chips exist, format and return them
    if (task.businessChips && task.businessChips.length > 0) {
        return task.businessChips.map((chip) => formatDynamicChip(chip, task));
    }

    // 2. If object view has defined cardChips, evaluate them
    if (viewDef.cardChips && viewDef.cardChips.length > 0) {
        const chips: BusinessChip[] = [];
        for (const chipDef of viewDef.cardChips) {
            const evaluated = evalField(chipDef, record);
            if (evaluated && evaluated.value && evaluated.value !== '-') {
                chips.push({
                    label: evaluated.label,
                    value: evaluated.value,
                    isPrimary: chipDef.isPrimary,
                });
            }
        }
        return chips;
    }

    return [];
}


/**
 * Resolves style configuration for task card (colors, text styling, left stripe).
 */
export function resolveTaskCardStyle(viewDef: ObjectViewDefinition): TaskCardStyleConfig {
    if (viewDef.cardConfig) {
        return viewDef.cardConfig;
    }

    const docCat = String(viewDef.docCategory || '').toUpperCase();
    if (docCat === 'PO' || docCat === 'BUS2012') {
        return { colorKey: 'info', textClass: 'text-info font-semibold', stripeClass: 'before:bg-info' };
    }
    if (docCat === 'RE' || docCat === 'BUS2093' || docCat === 'ZBUS2093' || docCat === 'RESV') {
        return { colorKey: 'warning', textClass: 'text-warning font-semibold', stripeClass: 'before:bg-warning' };
    }
    if (docCat === 'CLAIM' || docCat === 'ZCLAIM') {
        return { colorKey: 'success', textClass: 'text-success font-semibold', stripeClass: 'before:bg-success' };
    }

    return { colorKey: 'primary', textClass: 'text-primary font-semibold', stripeClass: 'before:bg-primary' };
}
