/**
 * Field and column factories. Each factory returns a definition whose `formatter` produces
 * the display string, so evaluation has a single code path.
 */
import type { Align, FieldDefinition, FieldValueFormatter, TableColumnDefinition, TaskCardChipDefinition } from './types';
import { formatCodeText, formatRawAmount, formatRawDate, formatRawQuantity, formatRawValue } from './formatters';
import { getRecordCode, getRecordVal } from './record';
import { EMPTY_VALUE } from './model';

export function chip(fieldDef: FieldDefinition, isPrimary?: boolean): TaskCardChipDefinition {
    return { ...fieldDef, isPrimary };
}

/** Plain value. A custom `formatter` (e.g. vendor code + names, multiline notes) always wins. */
export function text(config: {
    source: string;
    label: string;
    key?: string;
    isLongText?: boolean;
    align?: Align;
    formatter?: FieldValueFormatter;
}): FieldDefinition {
    return {
        key: config.key || config.source,
        label: config.label,
        kind: 'text',
        source: config.source,
        isLongText: config.isLongText,
        align: config.align,
        formatter: config.formatter || ((val) => formatRawValue(val)),
    };
}

/** `"code - text"`, e.g. `"1710 - US Trading Plant"`. */
export function codeText(config: { code: string; text: string; label: string; key?: string; align?: Align }): FieldDefinition {
    return {
        key: config.key || `${config.code}_${config.text}`,
        label: config.label,
        kind: 'codeText',
        align: config.align,
        formatter: (_val, record) => formatCodeText(getRecordVal(record, config.code), getRecordVal(record, config.text)),
    };
}

/** Amount with currency. Currency defaults to the record's `LocalCurrency`. */
export function amount(config: {
    value: string;
    currency?: string;
    locale?: string;
    label: string;
    key?: string;
    align?: Align;
}): FieldDefinition {
    const currencySource = config.currency || 'LocalCurrency';
    return {
        key: config.key || config.value,
        label: config.label,
        kind: 'amount',
        source: config.value,
        align: config.align || 'right',
        formatter: (val, record) => {
            const currency = String(getRecordVal(record, currencySource) || '');
            return formatRawAmount(val, currency || undefined, config.locale);
        },
    };
}

export function quantity(config: { value: string; unit?: string; label: string; key?: string; align?: Align }): FieldDefinition {
    return {
        key: config.key || config.value,
        label: config.label,
        kind: 'quantity',
        source: config.value,
        align: config.align || 'right',
        formatter: (val, record) => {
            const unit = config.unit ? String(getRecordVal(record, config.unit) || '') : undefined;
            return formatRawQuantity(val, unit);
        },
    };
}

/** Date, with time from `timeSource` (defaults to the record's creation time). */
export function date(config: {
    source: string;
    label: string;
    key?: string;
    timeSource?: string;
    align?: Align;
    formatter?: FieldValueFormatter;
}): FieldDefinition {
    return {
        key: config.key || config.source,
        label: config.label,
        kind: 'date',
        source: config.source,
        align: config.align,
        formatter:
            config.formatter ||
            ((val, record) => {
                const timeVal = config.timeSource
                    ? (getRecordVal(record, config.timeSource) ?? record?.[config.timeSource])
                    : (record?.CreationTime || record?.creationTime || record?.CreatedOnTime);
                return formatRawDate(val, timeVal);
            }),
    };
}

/**
 * Line-item column. The kind is inferred from the config, in this order:
 * custom `formatter` → `code`/`text` → `value` + `currency` → `value` + `unit` → `source`.
 */
export function tableCol(config: {
    key: string;
    header: string;
    source?: string;
    code?: string;
    text?: string;
    value?: string;
    currency?: string;
    unit?: string;
    align?: Align;
    formatter?: FieldValueFormatter;
}): TableColumnDefinition {
    const base = { key: config.key, header: config.header, align: config.align };

    if (config.formatter) {
        const kind = config.currency ? 'amount' : config.unit ? 'quantity' : 'text';
        return { ...base, kind, source: config.source || config.value, formatter: config.formatter };
    }
    if (config.code || config.text) {
        const { code, text: textPath } = config;
        return { ...base, kind: 'codeText', formatter: (_v, row) => formatCodeText(getRecordVal(row, code), getRecordVal(row, textPath)) };
    }
    if (config.value && config.currency) {
        const currency = config.currency;
        return { ...base, kind: 'amount', source: config.value, formatter: (v, row) => formatRawAmount(v, getRecordCode(row, currency)) };
    }
    if (config.value && config.unit) {
        const unit = config.unit;
        return { ...base, kind: 'quantity', source: config.value, formatter: (v, row) => formatRawQuantity(v, getRecordCode(row, unit)) };
    }
    if (config.source) {
        return { ...base, kind: 'text', source: config.source, formatter: (v) => formatRawValue(v) };
    }
    return { ...base, kind: 'text', formatter: () => EMPTY_VALUE };
}

/** Derives a subtype column set without repeating definitions: `excludeColumns(standard, 'material')`. */
export function excludeColumns(columns: readonly TableColumnDefinition[], ...keys: string[]): TableColumnDefinition[] {
    return columns.filter((col) => !keys.includes(col.key));
}
