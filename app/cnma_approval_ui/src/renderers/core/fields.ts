import type { FieldDefinition, TableColumnDefinition, TaskCardChipDefinition } from './renderer.types';
import { formatRawDate, formatRawAmount, formatRawQuantity, formatCodeText, formatRawValue } from './formatters';
import { getRecordVal } from './objectView';

export function chip(fieldDef: FieldDefinition, isPrimary?: boolean): TaskCardChipDefinition {
    return { ...fieldDef, isPrimary };
}


export function text(config: {
    source: string;
    label: string;
    key?: string;
    isLongText?: boolean;
    align?: 'left' | 'center' | 'right';
    formatter?: (val: unknown, record: any) => string;
}): FieldDefinition {
    return {
        key: config.key || config.source,
        label: config.label,
        source: config.source,
        isLongText: config.isLongText,
        align: config.align,
        formatter: config.formatter || ((val) => formatRawValue(val))
    };
}

export function codeText(config: {
    code: string;
    text: string;
    label: string;
    key?: string;
    align?: 'left' | 'center' | 'right';
}): FieldDefinition {
    return {
        key: config.key || `${config.code}_${config.text}`,
        label: config.label,
        code: config.code,
        text: config.text,
        align: config.align,
        formatter: (_, record) => formatCodeText(getRecordVal(record, config.code), getRecordVal(record, config.text))
    };
}

export function amount(config: {
    value: string;
    currency?: string;
    label: string;
    key?: string;
    align?: 'left' | 'center' | 'right';
}): FieldDefinition {
    const currencySource = config.currency || 'LocalCurrency';

    return {
        key: config.key || config.value,
        label: config.label,
        value: config.value,
        currency: currencySource,
        align: config.align || 'right',
        formatter: (val, record) => {
            const curr = String(getRecordVal(record, currencySource) || '');
            return formatRawAmount(val, curr || undefined);
        }
    };
}



export function quantity(config: {
    value: string;
    unit?: string;
    label: string;
    key?: string;
    align?: 'left' | 'center' | 'right';
}): FieldDefinition {
    return {
        key: config.key || config.value,
        label: config.label,
        value: config.value,
        unit: config.unit,
        align: config.align || 'right',
        formatter: (val, record) => {
            const uom = config.unit ? String(getRecordVal(record, config.unit) || '') : undefined;
            return formatRawQuantity(val, uom);
        }
    };
}

export function date(config: {
    source: string;
    label: string;
    key?: string;
    timeSource?: string;
    align?: 'left' | 'center' | 'right';
    formatter?: (val: unknown, record?: any) => string;
}): FieldDefinition {
    return {
        key: config.key || config.source,
        label: config.label,
        source: config.source,
        align: config.align,
        formatter: config.formatter || ((val, record) => {
            const timeVal = config.timeSource ? record?.[config.timeSource] : (record?.CreationTime || record?.creationTime || record?.CreatedOnTime);
            return formatRawDate(val, timeVal);
        })
    };
}

export function tableCol(config: {
    key: string;
    header: string;
    source?: string;
    code?: string;
    text?: string;
    value?: string;
    currency?: string;
    unit?: string;
    align?: 'left' | 'center' | 'right';
    formatter?: (val: unknown, record: any) => string;
}): TableColumnDefinition {
    return {
        key: config.key,
        header: config.header,
        source: config.source,
        code: config.code,
        text: config.text,
        value: config.value,
        currency: config.currency,
        unit: config.unit,
        align: config.align,
        formatter: config.formatter
    };
}
