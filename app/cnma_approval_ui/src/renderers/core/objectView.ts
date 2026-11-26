/**
 * Evaluates an ObjectViewDefinition against a raw OData record. Pure: same input, same model.
 */
import type { RawODataEntity } from '@/services/inbox/inbox.contracts';
import type { CardDefinition, FieldDefinition, ObjectViewDefinition, TableColumnDefinition, TableDefinition } from './types';
import type { BusinessSectionModel, DetailCardModel, DetailField, DetailTableModel, DetailTableRow } from './model';
import { getRecordVal } from './record';

export const SECTION_TITLE = 'Document Details';

/** Item number fields, tried in order (exact keys); falls back to the 1-based row position. */
const DEFAULT_ROW_ID_KEYS = ['ItemNumber', 'PurchaseRequisitionItem', 'PurchaseOrderItem', 'ItemNo'] as const;
const DEFAULT_DELETION_FLAG_PATH = 'Deleted|deleted|LOEKZ|DeletedFlag|deletionFlag';

export function evalField(fieldDef: FieldDefinition, record: RawODataEntity): DetailField | null {
    if (fieldDef.predicate && !fieldDef.predicate(record)) return null;
    return {
        key: fieldDef.key,
        label: fieldDef.label,
        value: fieldDef.formatter(getRecordVal(record, fieldDef.source), record),
        kind: fieldDef.kind,
        isLongText: fieldDef.isLongText,
    };
}

export function evalColumn(colDef: TableColumnDefinition, rowRecord: RawODataEntity, headerRecord?: RawODataEntity): string {
    return colDef.formatter(getRecordVal(rowRecord, colDef.source), rowRecord, headerRecord);
}

function evalCard(cardDef: CardDefinition, record: RawODataEntity): DetailCardModel | null {
    if (cardDef.predicate && !cardDef.predicate(record)) return null;
    const fields: DetailField[] = [];
    for (const fieldDef of cardDef.fields) {
        const field = evalField(fieldDef, record);
        if (field) fields.push(field);
    }
    return { id: cardDef.id, title: cardDef.title, fields };
}

function rowIdOf(row: RawODataEntity, index: number, idKeys: readonly string[]): string {
    for (const key of idKeys) {
        if (row[key]) return String(row[key]);
    }
    return String(index + 1);
}

function isDeletedRow(row: RawODataEntity, flagPath: string): boolean {
    const flag = getRecordVal(row, flagPath);
    if (flag == null) return false;
    const normalized = String(flag).trim();
    return normalized !== '' && normalized !== '0' && normalized.toLowerCase() !== 'false';
}

function evalTable(tableDef: TableDefinition, record: RawODataEntity): DetailTableModel {
    const rawItems = record[tableDef.sourcePath];
    const items: RawODataEntity[] = Array.isArray(rawItems) ? rawItems : [];
    const { columns, rowIdKeys = DEFAULT_ROW_ID_KEYS, deletionFlagPath = DEFAULT_DELETION_FLAG_PATH } = tableDef;

    const rows: DetailTableRow[] = items.map((row, index) => {
        const values: Record<string, string> = {};
        for (const col of columns) {
            values[col.key] = evalColumn(col, row, record);
        }
        return { id: rowIdOf(row, index, rowIdKeys), values, isDeleted: isDeletedRow(row, deletionFlagPath) };
    });

    return {
        id: tableDef.id,
        title: tableDef.title,
        columns: columns.map((col) => ({ key: col.key, label: col.header, align: col.align || 'left' })),
        rows,
    };
}

export function resolveObjectView(definition: ObjectViewDefinition, businessObject: RawODataEntity): BusinessSectionModel {
    const cards: DetailCardModel[] = [];
    for (const cardDef of [definition.overviewCard, ...(definition.overviewCards ?? [])]) {
        const card = evalCard(cardDef, businessObject);
        if (card) cards.push(card);
    }

    return {
        title: SECTION_TITLE,
        cards,
        tables: definition.lineItemTable ? [evalTable(definition.lineItemTable, businessObject)] : [],
    };
}
