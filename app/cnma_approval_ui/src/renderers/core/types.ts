import type { RawODataEntity } from '@/services/inbox/inbox.contracts';

/** Semantic accent of a document type. Each platform maps it to its own styles. */
export type Tone = 'primary' | 'info' | 'warning' | 'success';

export type Align = 'left' | 'center' | 'right';

/** What a field represents, so platforms can present it natively (alignment, tabular digits, a11y). */
export type FieldKind = 'text' | 'codeText' | 'amount' | 'quantity' | 'date';

export type FieldValueFormatter = (value: unknown, record: RawODataEntity, headerRecord?: RawODataEntity) => string;
export type VisibilityPredicate = (record: RawODataEntity) => boolean;

/**
 * A header field. `formatter` always produces the display string; it receives the raw value
 * read from `source` (supports `A|B` fallbacks and case-insensitive keys) and the whole record.
 */
export interface FieldDefinition {
    key: string;
    label: string;
    kind: FieldKind;
    source?: string;
    formatter: FieldValueFormatter;
    predicate?: VisibilityPredicate;
    /** Moves the field out of the overview grid into its own full-width section. */
    isLongText?: boolean;
    align?: Align;
}

export interface CardDefinition {
    id: string;
    title: string;
    fields: FieldDefinition[];
    predicate?: VisibilityPredicate;
}

/** A line-item column. The formatter also receives the header record (e.g. header currency fallback). */
export interface TableColumnDefinition {
    key: string;
    header: string;
    kind: FieldKind;
    source?: string;
    formatter: FieldValueFormatter;
    align?: Align;
}

export interface TableDefinition {
    id: string;
    title: string;
    sourcePath: string;
    columns: TableColumnDefinition[];
    /** Exact keys holding the item number, tried in order. Defaults to the common SAP item keys. */
    rowIdKeys?: readonly string[];
    /** Path of the deletion indicator (`A|B` fallbacks). Defaults to the common SAP flags (e.g. `LOEKZ`). */
    deletionFlagPath?: string;
}

export interface TaskCardChipDefinition extends FieldDefinition {
    isPrimary?: boolean;
}

export interface ObjectViewDefinition {
    overviewCard: CardDefinition;
    /** Additional cards shown after the overview card (e.g. Claim verification). */
    overviewCards?: CardDefinition[];
    lineItemTable?: TableDefinition;
    cardChips?: TaskCardChipDefinition[];
}

/** Module category (e.g. `PR`, `PO`, `RESERVATION`, `CLAIM`). A string, so new types need no core change. */
export type ObjectCategory = string;

/**
 * Everything needed to render one business object type. Adding a type = adding a module
 * under `objects/<type>/` and registering it in `ObjectView.registry.ts`.
 */
export interface ObjectTypeModule {
    category: ObjectCategory;
    /** Short display name used on task cards (e.g. "PR", "Reservation"). */
    label: string;
    /** Upper-case category codes sent by SAP/BFF (BOR object types and short codes). */
    aliases: readonly string[];
    tone: Tone;
    /** Locale for amounts in backend-provided task chips, when the type requires one. */
    chipAmountLocale?: string;
    resolveView: (documentType: string) => ObjectViewDefinition;
}
