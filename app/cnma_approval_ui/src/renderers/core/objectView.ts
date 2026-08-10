import type { RawODataEntity } from '@/services/inbox/inbox.contracts';
import type { ObjectViewDefinition, FieldDefinition, TableColumnDefinition } from './renderer.types';
import type { BusinessSectionModel, DetailCardModel, DetailTableModel, DetailField, DetailTableColumn, DetailTableRow } from '../TaskDetailSections.types';
import { formatCodeText, formatRawAmount, formatRawQuantity, formatRawValue } from './formatters';

export function getRecordVal(record: RawODataEntity, key?: string): any {
    if (!record || !key) return undefined;

    if (key.includes('|')) {
        const keys = key.split('|');
        for (const k of keys) {
            const val = getRecordVal(record, k.trim());
            if (val !== undefined && val !== null && val !== '') return val;
        }
        return undefined;
    }

    if (record[key] !== undefined && record[key] !== null && record[key] !== '') return record[key];

    const lowerKey = key.toLowerCase();
    const hit = Object.keys(record).find(k => k.toLowerCase() === lowerKey);
    if (hit && record[hit] !== undefined && record[hit] !== null && record[hit] !== '') return record[hit];

    return undefined;
}

export function evalField(fieldDef: FieldDefinition, record: RawODataEntity): DetailField | null {
    if (fieldDef.predicate && !fieldDef.predicate(record)) {
        return null;
    }

    let val = '';
    if (fieldDef.formatter) {
        const rawSourceVal = fieldDef.source ? getRecordVal(record, fieldDef.source) : (fieldDef.value ? getRecordVal(record, fieldDef.value) : undefined);
        val = fieldDef.formatter(rawSourceVal, record);
    } else if (fieldDef.code || fieldDef.text) {
        val = formatCodeText(getRecordVal(record, fieldDef.code), getRecordVal(record, fieldDef.text));
    } else if (fieldDef.source) {
        val = formatRawValue(getRecordVal(record, fieldDef.source));
    } else {
        val = '-';
    }

    return {
        key: fieldDef.key,
        label: fieldDef.label,
        value: val,
        isLongText: fieldDef.isLongText
    };
}

export function evalColumn(colDef: TableColumnDefinition, rowRecord: RawODataEntity): string {
    if (colDef.formatter) {
        const rawVal = colDef.source ? getRecordVal(rowRecord, colDef.source) : (colDef.value ? getRecordVal(rowRecord, colDef.value) : undefined);
        return colDef.formatter(rawVal, rowRecord);
    }
    if (colDef.code || colDef.text) {
        return formatCodeText(getRecordVal(rowRecord, colDef.code), getRecordVal(rowRecord, colDef.text));
    }
    if (colDef.value && colDef.currency) {
        return formatRawAmount(getRecordVal(rowRecord, colDef.value), getRecordVal(rowRecord, colDef.currency));
    }
    if (colDef.value && colDef.unit) {
        return formatRawQuantity(getRecordVal(rowRecord, colDef.value), getRecordVal(rowRecord, colDef.unit));
    }
    if (colDef.source) {
        return formatRawValue(getRecordVal(rowRecord, colDef.source));
    }
    return '-';
}

export function resolveObjectView(
    definition: ObjectViewDefinition,
    businessObject: RawODataEntity
): BusinessSectionModel {
    const cards: DetailCardModel[] = [];
    const tables: DetailTableModel[] = [];

    // 1. Evaluate Overview Card
    if (definition.overviewCard) {
        const cardFields: DetailField[] = [];
        for (const fieldDef of definition.overviewCard.fields) {
            const evaluated = evalField(fieldDef, businessObject);
            if (evaluated) {
                cardFields.push(evaluated);
            }
        }
        cards.push({
            id: definition.overviewCard.id,
            title: definition.overviewCard.title,
            fields: cardFields
        });
    }

    // 2. Evaluate Line Item Table
    if (definition.lineItemTable) {
        const rawItems = businessObject[definition.lineItemTable.sourcePath] || [];
        const itemsArray = Array.isArray(rawItems) ? rawItems : [];

        const columns: DetailTableColumn[] = definition.lineItemTable.columns.map(col => ({
            key: col.key,
            label: col.header,
            align: col.align || 'left'
        }));

        const rows: DetailTableRow[] = itemsArray.map((rowRecord: RawODataEntity, idx: number) => {
            const rowValues: Record<string, string> = {};
            for (const colDef of definition.lineItemTable!.columns) {
                rowValues[colDef.key] = evalColumn(colDef, rowRecord);
            }
            const rowId = String(rowRecord.ItemNumber || rowRecord.PurchaseRequisitionItem || rowRecord.PurchaseOrderItem || rowRecord.ItemNo || idx + 1);
            return {
                id: rowId,
                values: rowValues
            };
        });

        tables.push({
            id: definition.lineItemTable.id,
            title: definition.lineItemTable.title,
            columns,
            rows,
            preserveOrder: true
        });
    }

    return {
        title: 'Document Details',
        cards,
        tables
    };
}
