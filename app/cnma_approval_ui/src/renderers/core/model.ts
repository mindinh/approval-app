import type { Align, FieldKind } from './types';

/** Display value used when a field has no data. Platforms may hide or style it. */
export const EMPTY_VALUE = '-';

export interface DetailField {
    key: string;
    label: string;
    /** Display string (EMPTY_VALUE when there is no data). */
    value: string;
    kind: FieldKind;
    isLongText?: boolean;
}

export interface DetailCardModel {
    id: string;
    title: string;
    fields: DetailField[];
}

export interface DetailTableColumn {
    key: string;
    label: string;
    align?: Align;
}

export interface DetailTableRow {
    id: string;
    values: Record<string, string>;
    isDeleted?: boolean;
}

export interface DetailTableModel {
    id: string;
    title: string;
    columns: DetailTableColumn[];
    rows: DetailTableRow[];
}

export interface BusinessSectionModel {
    title: string;
    cards: DetailCardModel[];
    tables: DetailTableModel[];
}
