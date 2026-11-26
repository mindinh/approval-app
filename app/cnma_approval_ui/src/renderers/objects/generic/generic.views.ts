import type { FieldDefinition, ObjectViewDefinition } from '../../core/types';
import { amount, codeText, date, text } from '../../core/fields';
import { getRecordVal } from '../../core/record';

/** Shows a field only when at least one of its source paths has data. */
function whenPresent(field: FieldDefinition, ...paths: string[]): FieldDefinition {
    return { ...field, predicate: (record) => paths.some((path) => getRecordVal(record, path) !== undefined) };
}

const NUMBER = 'DocumentNumber|DocumentId|instid';
const TYPE_CODE = 'DocumentType';
const TYPE_TEXT = 'DocumentTypeText';
const REQUESTER = 'UserName|CreatedByUser|CreatedByName';
const TOTAL = 'TotalNetAmountLocalCrcy|TotalAmount|Total|total';

/**
 * Fallback for document types without a dedicated module: a small, readable summary of the
 * common header fields. Raw technical keys are never listed.
 */
export const GENERIC_VIEW: ObjectViewDefinition = {
    overviewCard: {
        id: 'unknown-summary',
        title: 'Overview',
        fields: [
            whenPresent(text({ source: NUMBER, label: 'Document Number' }), NUMBER),
            whenPresent(codeText({ code: TYPE_CODE, text: TYPE_TEXT, label: 'Document Type' }), TYPE_CODE, TYPE_TEXT),
            whenPresent(text({ source: REQUESTER, label: 'Requester' }), REQUESTER),
            whenPresent(date({ source: 'CreationDate', label: 'Created On', timeSource: 'CreationTime' }), 'CreationDate'),
            whenPresent(amount({ value: TOTAL, currency: 'LocalCurrency|DocumentCurrency|Currency', label: 'Total Amount' }), TOTAL),
        ],
    },
};
