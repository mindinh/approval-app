import type { TaskDetail, DynamicFieldDefinition } from '@/services/inbox/inbox.types';
import type { BusinessSectionModel, DetailCardModel, DetailTableModel } from './TaskDetailSections.types';
import { formatAmountWithCurrency as formatAmount, formatDateShortLocale as formatDate } from '@/pages/Inbox/utils/formatters';
import { buildDefaultBusinessModel } from './TaskDetailSections.shared';

export function resolveJsonPath(obj: unknown, path: string): unknown {
    if (!path || obj === null || obj === undefined) return undefined;
    if (path === '$') return obj;
    const cleanPath = path.startsWith('$.') ? path.substring(2) : path.startsWith('$') ? path.substring(1) : path;
    if (!cleanPath) return obj;
    
    const parts = cleanPath.split('.');
    let current: unknown = obj;
    for (const part of parts) {
        if (current === null || current === undefined) return undefined;
        if (typeof current === 'object') {
            current = (current as Record<string, unknown>)[part];
        } else {
            return undefined;
        }
    }
    return current;
}

export function buildDynamicBusinessModel(detail: TaskDetail): BusinessSectionModel {
    const fieldSchema = detail.fieldSchema || {};
    const uiSchema = detail.uiSchema || { sections: [] };
    const type = detail.object?.objectType || detail.businessContext?.type || 'UNKNOWN';
    const businessObject = detail.object || (type !== 'UNKNOWN' && detail.businessContext
        ? (detail.businessContext as unknown as Record<string, unknown>)[type.toLowerCase()]
        : null);

    // Helper to format values
    const formatFieldValue = (value: unknown, fieldDef: DynamicFieldDefinition, contextObj?: unknown): string => {
        if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
            return fieldDef.fallbackValue || '-';
        }
        
        const dataType = fieldDef.dataType;

        if (dataType === 'DATE') {
            return formatDate(String(value));
        }

        if (dataType === 'AMOUNT') {
            let currency = '';
            if (fieldDef.currencyPath) {
                currency = String(resolveJsonPath(businessObject, fieldDef.currencyPath) || resolveJsonPath(contextObj, fieldDef.currencyPath) || '');
            }
            if (!currency && contextObj) {
                const rec = contextObj as Record<string, unknown>;
                const localKey = Object.keys(rec).find(k => k.toLowerCase().includes('currency') || k.toLowerCase() === 'waers');
                if (localKey) {
                    currency = String(rec[localKey] || '');
                }
            }
            if (!currency) {
                const currencyFieldKey = Object.keys(fieldSchema).find(k => k.toLowerCase().includes('currency'));
                if (currencyFieldKey) {
                    currency = String(resolveJsonPath(businessObject, fieldSchema[currencyFieldKey].dataPath) || '');
                }
            }
            if (!currency && businessObject) {
                const header = resolveJsonPath(businessObject, 'header') as Record<string, unknown> | undefined;
                currency = String(header?.currency || header?.displayCurrency || header?.documentCurrency || '');
            }
            return formatAmount(String(value), currency);
        }

        if (dataType === 'QUANTITY') {
            const num = Number(value);
            if (Number.isNaN(num)) return String(value);
            const formatted = num.toLocaleString('en-US');
            const contextRecord = contextObj as Record<string, unknown> | undefined;
            const unit = String(contextRecord?.baseUnit || contextRecord?.purchaseOrderQuantityUnit || contextRecord?.unit || contextRecord?.uom || '');
            return unit ? `${formatted} ${unit}` : formatted;
        }

        if (dataType === 'BOOLEAN') {
            return value ? 'Yes' : 'No';
        }

        return String(value);
    };

    const getFormattedFieldVal = (fieldKey: string, contextObj: unknown): string => {
        const fieldDef = fieldSchema[fieldKey];
        if (!fieldDef) return '-';
        const rawVal = resolveJsonPath(contextObj, fieldDef.dataPath);
        return formatFieldValue(rawVal, fieldDef, contextObj);
    };

    const fieldValues: Record<string, string> = {};
    Object.keys(fieldSchema).forEach((key) => {
        fieldValues[key] = getFormattedFieldVal(key, businessObject);
    });

    const interpolateTemplate = (template: string, values: Record<string, string>): string => {
        if (!template) return '';
        return template.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
            const fieldKey = key.trim();
            const lastSegment = fieldKey.includes('.') ? fieldKey.split('.').pop()! : fieldKey;
            return values[fieldKey] !== undefined ? values[fieldKey] : (values[lastSegment] !== undefined ? values[lastSegment] : '');
        });
    };

    const title = interpolateTemplate(uiSchema.title || `${type} Details`, fieldValues);
    const subtitle = interpolateTemplate(uiSchema.subtitle || `Document ${detail.businessContext?.documentId || ''}`, fieldValues);

    const cards: DetailCardModel[] = [];
    const tables: DetailTableModel[] = [];

    const sections = uiSchema.sections || [];
    sections.forEach((section) => {
        if (section.visibleWhen) {
            const { field: checkField, operator, value: checkVal } = section.visibleWhen;
            const checkFieldDef = fieldSchema[checkField];
            const actualVal = checkFieldDef ? resolveJsonPath(businessObject, checkFieldDef.dataPath) : undefined;
            
            let isVisible = true;
            if (operator === 'exists') {
                isVisible = actualVal !== null && actualVal !== undefined && actualVal !== '';
            } else if (operator === 'eq') {
                isVisible = actualVal === checkVal;
            } else if (operator === 'neq') {
                isVisible = actualVal !== checkVal;
            } else if (operator === 'gt') {
                isVisible = Number(actualVal) > Number(checkVal);
            } else if (operator === 'lt') {
                isVisible = Number(actualVal) < Number(checkVal);
            }

            if (!isVisible) return;
        }

        if (section.type === 'CARD') {
            const fields = (section.fields || []).map((fieldKey: string) => {
                const fieldDef = fieldSchema[fieldKey];
                const label = fieldDef?.label || fieldKey;
                const val = getFormattedFieldVal(fieldKey, businessObject);
                const dataType = fieldDef?.dataType || 'TEXT';
                const isLongText = dataType === 'LONG_TEXT' || dataType === 'TEXTAREA';
                return {
                    key: fieldKey,
                    label,
                    value: val,
                    dataType,
                    isLongText
                };
            });

            cards.push({
                id: section.id,
                title: section.title,
                fields
            });
        } else if (section.type === 'TABLE') {
            const rawRows = resolveJsonPath(businessObject, section.dataPath) || [];
            const columns = (section.columns || []).map((colKey: string) => {
                const fieldDef = fieldSchema[colKey];
                return {
                    key: colKey,
                    label: fieldDef?.label || colKey,
                    align: (fieldDef?.dataType === 'AMOUNT' || fieldDef?.dataType === 'QUANTITY' ? 'right' : 'left') as 'left' | 'right' | 'center'
                };
            });

            const rows = (Array.isArray(rawRows) ? rawRows : []).map((rowObj: unknown, index: number) => {
                const values: Record<string, string> = {};
                const rowRecord = rowObj as Record<string, unknown> | undefined;
                (section.columns || []).forEach((colKey: string) => {
                    const fieldDef = fieldSchema[colKey];
                    if (fieldDef) {
                        const rawVal = resolveJsonPath(rowObj, fieldDef.dataPath);
                        values[colKey] = formatFieldValue(rawVal, fieldDef, rowObj);
                    } else {
                        values[colKey] = '-';
                    }
                });

                return {
                    id: String(rowRecord?.id || rowRecord?.objectId || `${section.id}-row-${index}`),
                    values
                };
            });

            tables.push({
                id: section.id,
                title: section.title,
                columns,
                rows,
                emptyMessage: `No ${section.title.toLowerCase()} available`
            });
        }
    });

    return {
        title,
        subtitle,
        cards,
        tables
    };
}

/**
 * Resolver for task object presentation.
 * Returns the dynamic business model if fieldSchema and uiSchema are defined,
 * otherwise falls back to a clean default business model representation.
 */
export function resolveBusinessSectionModel(detail: TaskDetail): BusinessSectionModel {
    if (detail.fieldSchema && detail.uiSchema && Object.keys(detail.fieldSchema).length > 0 && detail.uiSchema.sections && detail.uiSchema.sections.length > 0) {
        return buildDynamicBusinessModel(detail);
    }
    return buildDefaultBusinessModel(detail);
}
