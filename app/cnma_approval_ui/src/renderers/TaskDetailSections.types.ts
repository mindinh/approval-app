import type { TaskDetail } from '@/services/inbox/inbox.types';

export interface DetailField {
    key: string;
    label: string;
    value: string;
    dataType?: string;
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
    align?: 'left' | 'right' | 'center';
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
    detailFieldLabels?: Record<string, string>;
    emptyMessage?: string;
    preserveOrder?: boolean;
}

export interface BusinessSectionModel {
    title: string;
    subtitle?: string;
    cards: DetailCardModel[];
    tables: DetailTableModel[];
}

export interface TaskDetailRenderer {
    id: string;
    matches: (detail: TaskDetail) => boolean;
    build: (detail: TaskDetail) => BusinessSectionModel;
}
