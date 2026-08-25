import type { RawODataEntity } from '@/services/inbox/inbox.contracts';

export type FieldValueFormatter = (value: unknown, record: RawODataEntity) => string;
export type VisibilityPredicate = (record: RawODataEntity) => boolean;

export interface FieldDefinition {
    key: string;
    label: string;
    source?: string;
    code?: string;
    text?: string;
    value?: string;
    currency?: string;
    unit?: string;
    formatter?: FieldValueFormatter;
    predicate?: VisibilityPredicate;
    isLongText?: boolean;
    align?: 'left' | 'center' | 'right';
}

export interface CardDefinition {
    id: string;
    title: string;
    fields: FieldDefinition[];
}

export interface TableColumnDefinition {
    key: string;
    header: string;
    source?: string;
    code?: string;
    text?: string;
    value?: string;
    currency?: string;
    unit?: string;
    formatter?: FieldValueFormatter;
    align?: 'left' | 'center' | 'right';
}

export interface TableDefinition {
    id: string;
    title: string;
    sourcePath: string;
    columns: TableColumnDefinition[];
}

export interface TaskCardStyleConfig {
    colorKey: 'primary' | 'info' | 'warning' | 'success';
    textClass?: string;
    stripeClass?: string;
}

export interface TaskCardChipDefinition extends FieldDefinition {
    isPrimary?: boolean;
}

export interface ObjectViewDefinition {
    docCategory: string;
    documentType?: string;
    overviewCard: CardDefinition;
    lineItemTable?: TableDefinition;
    cardConfig?: TaskCardStyleConfig;
    cardChips?: TaskCardChipDefinition[];
}

