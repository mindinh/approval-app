import type { InboxTask } from '@/services/inbox/inbox.types';
import type { RawODataEntity } from '@/services/inbox/inbox.contracts';
import type { ObjectViewDefinition, TaskCardStyleConfig } from './core/renderer.types';
import { resolveObjectView } from './core/objectView';
import { PR_VIEWS } from './objects/pr/pr.views';
import { PO_VIEWS } from './objects/po/po.views';
import { RESERVATION_VIEW } from './objects/reservation/reservation.view';
import { CLAIM_VIEW } from './objects/claim/claim.view';
import type { BusinessSectionModel } from './TaskDetailSections.types';
import { extractTaskEntityRecord, evalTaskCardChips, resolveTaskCardStyle, type BusinessChip } from './core/taskCardView';

export function resolveObjectViewDefinition(businessObject: RawODataEntity): ObjectViewDefinition {
    const docCategory = String(
        businessObject?.DocCategory ||
        businessObject?._meta?.objectType ||
        businessObject?.objectType ||
        businessObject?.type ||
        ''
    ).toUpperCase();
    const docType = String(
        businessObject?.DocumentType ||
        businessObject?.documentType ||
        businessObject?.doctyp ||
        'DEFAULT'
    ).toUpperCase();

    if (docCategory === 'BUS2105' || docCategory === 'PR') {
        return PR_VIEWS[docType] || PR_VIEWS.DEFAULT;
    }

    if (docCategory === 'BUS2012' || docCategory === 'PO') {
        return PO_VIEWS[docType] || PO_VIEWS.DEFAULT;
    }

    if (docCategory === 'ZBUS2093' || docCategory === 'BUS2093' || docCategory === 'RE' || docCategory === 'RESV') {
        return RESERVATION_VIEW;
    }

    if (docCategory === 'ZCLAIM' || docCategory === 'CLAIM') {
        return CLAIM_VIEW;
    }

    // Fallback definition for unknown categories
    return {
        docCategory: docCategory || 'UNKNOWN',
        overviewCard: {
            id: 'unknown-summary',
            title: 'Overview',
            fields: Object.keys(businessObject || {})
                .filter(k => typeof businessObject[k] !== 'object' && !k.startsWith('_'))
                .map(k => ({
                    key: k,
                    label: k.replace(/([A-Z])/g, ' $1').trim(),
                    source: k
                }))
        }
    };
}

export function resolveTaskCardConfigForTask(task: InboxTask, cachedDetail?: any): {
    viewDef: ObjectViewDefinition;
    record: RawODataEntity;
    style: TaskCardStyleConfig;
    chips: BusinessChip[];
} {
    const record = extractTaskEntityRecord(task, cachedDetail);
    const viewDef = resolveObjectViewDefinition(record);
    const style = resolveTaskCardStyle(viewDef);
    const chips = evalTaskCardChips(viewDef, record, task);
    return { viewDef, record, style, chips };
}

export function resolveBusinessSectionModel(detailInput: any): BusinessSectionModel {
    if (!detailInput) {
        return { title: 'Document Details', cards: [], tables: [] };
    }

    const businessObject: RawODataEntity = detailInput.businessObject || (detailInput.header ? { ...detailInput.header, _Item: detailInput.items } : detailInput);
    const viewDefinition = resolveObjectViewDefinition(businessObject);
    return resolveObjectView(viewDefinition, businessObject);
}

