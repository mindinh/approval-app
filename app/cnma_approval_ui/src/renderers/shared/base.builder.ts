import type { CustomAttribute, TaskObject } from '@/services/inbox/inbox.types';
import type { DetailField, DetailTableModel, DetailTableRow } from '../TaskDetailSections.types';
import { EMPTY_VALUE, normalizeDisplayValue } from './formatters';

const ATTRIBUTE_NAME_ALIASES: Record<string, string[]> = {
    documentId: ['ponumber', 'purchasenumber', 'purchaseorder', 'prnumber', 'purchaserequisition', 'banfn', 'ebeln'],
    supplier: ['vendorname', 'supplier', 'suppliername', 'lifnr'],
    companyCode: ['companycode', 'bukrs'],
    purchasingOrg: ['purchorganization', 'purchasingorganization', 'ekorg'],
    paymentTerms: ['paymentterms', 'zterm'],
    incoterms: ['incoterms', 'inco1', 'inco2'],
    netValue: ['netvalue', 'totalvalue', 'amount'],
    currency: ['currency', 'waers'],
    totalnetvaluebeforetax: ['totalnetvaluebeforetax', 'subtotal', 'netvaluebeforetax'],
    totalfreightamount: ['totalfreightamount', 'freightamount', 'shippingfee'],
    totalvatamount: ['totalvatamount', 'vatamount', 'taxamount', 'vat'],
    totalordervalue: ['totalordervalue', 'ordervalue', 'totalamount', 'netvalue'],
};

export function field(label: string, value: unknown, key?: string): DetailField {
    return {
        key: key || label.toLowerCase().replace(/\s+/g, '-'),
        label,
        value: normalizeDisplayValue(value),
    };
}

export function createAttributeIndex(attributes?: CustomAttribute[]): Map<string, CustomAttribute> {
    const index = new Map<string, CustomAttribute>();
    for (const attr of (attributes || [])) {
        if (!attr || !attr.name) continue;
        index.set(attr.name.toLowerCase(), attr);
        if (attr.label) {
            index.set(attr.label.toLowerCase(), attr);
        }
    }
    return index;
}

export function pickAttribute(
    index: Map<string, CustomAttribute>,
    candidates: string[]
): CustomAttribute | undefined {
    if (!index || !candidates || !Array.isArray(candidates)) return undefined;
    for (const key of candidates) {
        if (!key) continue;
        const direct = index.get(key.toLowerCase());
        if (direct) return direct;
    }
    for (const [key, value] of index) {
        if (candidates.some((candidate) => candidate && key.includes(candidate.toLowerCase()))) {
            return value;
        }
    }
    return undefined;
}

export function pickByAlias(
    index: Map<string, CustomAttribute>,
    aliasKey: string
): string | undefined {
    const candidates = ATTRIBUTE_NAME_ALIASES[aliasKey] || [aliasKey];
    return pickAttribute(index, candidates)?.value;
}

export function buildTaskObjectsTable(taskObjects?: TaskObject[]): DetailTableModel {
    const rows: DetailTableRow[] = (taskObjects || []).map((obj, idx) => ({
        id: `${obj.objectId}-${idx}`,
        values: {
            type: normalizeDisplayValue(obj.type),
            objectId: normalizeDisplayValue(obj.objectId),
            name: normalizeDisplayValue(obj.name),
            url: normalizeDisplayValue(obj.url),
        },
    }));

    return {
        id: 'task-objects',
        title: 'Related Objects',
        columns: [
            { key: 'type', label: 'Type' },
            { key: 'objectId', label: 'Object ID' },
            { key: 'name', label: 'Name' },
            { key: 'url', label: 'URL' },
        ],
        rows,
        emptyMessage: 'No related objects',
    };
}

export function buildCustomAttributesTable(attributes?: CustomAttribute[]): DetailTableModel {
    const rows: DetailTableRow[] = (attributes || []).map((attr) => ({
        id: attr.name,
        values: {
            label: normalizeDisplayValue(attr.label),
            value: normalizeDisplayValue(attr.value),
            type: normalizeDisplayValue(attr.type),
            technicalName: normalizeDisplayValue(attr.name),
        },
    }));

    return {
        id: 'custom-attributes',
        title: 'Custom Attributes',
        columns: [
            { key: 'label', label: 'Label' },
            { key: 'value', label: 'Value' },
            { key: 'type', label: 'Type' },
            { key: 'technicalName', label: 'Name' },
        ],
        rows,
        emptyMessage: 'No custom attributes',
    };
}
