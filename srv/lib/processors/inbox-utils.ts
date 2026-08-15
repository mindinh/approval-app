export interface Comment {
    id: string;
    createdBy: string;
    createdByName: string;
    text: string;
    createdAt: string;
}

export interface Attachment {
    id: string;
    fileName: string;
    fileDisplayName: string;
    mimeType: string;
    fileSize: number;
    createdBy: string;
    createdByName: string;
    createdAt?: string;
    link: string;
}

export interface UiAction {
    key: string;
    text: string;
    label: string;
    nature: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    variant: string;
    requiresComment: boolean;
    confirmRequired: boolean;
    confirmMessage?: string;
    sapDecisionKey: string;
    commentMandatory: boolean;
    commentSupported: boolean;
}

export interface TaskMetadata {
    instanceId: string;
    sapOrigin: string;
    title: string;
    status: string;
    priority: string;
    createdOn?: string;
    createdByName?: string;
    requestorName?: string;
    taskDefinitionId: string;
    supports: {
        forward: boolean;
        comments: boolean;
    };
    businessContext: Record<string, any>;
    total?: number;
    curr_vnd?: string;
    total_doc_curr?: number;
    doc_curr?: string;
    businessChips?: any[];
    normalTask: boolean;
}

export function normalizePriority(priority: string | undefined | null): string {
    const p = (priority || '').toUpperCase().trim();
    if (!p || p === 'NOT_VALID' || p === 'NOT VALID') return 'MEDIUM';
    const map: Record<string, string> = {
        '1': 'VERY_HIGH',
        '2': 'HIGH',
        '3': 'MEDIUM',
        '4': 'LOW',
        VERY_HIGH: 'VERY_HIGH',
        HIGH: 'HIGH',
        MEDIUM: 'MEDIUM',
        LOW: 'LOW',
    };
    return map[p] || 'MEDIUM';
}

export function normalizeDate(dateValue: string | undefined | null): string | undefined {
    if (!dateValue) return undefined;
    const msMatch = dateValue.match(/\/Date\((\d+)\)\//);
    if (msMatch) {
        return new Date(parseInt(msMatch[1], 10)).toISOString();
    }
    try {
        const parsed = new Date(dateValue);
        if (isNaN(parsed.getTime())) return dateValue;
        return parsed.toISOString();
    } catch {
        return dateValue;
    }
}

export function cleanBusinessObjectForList(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    const cleaned: Record<string, any> = {};

    for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (Array.isArray(val)) {
            if (val.length > 0) cleaned[key] = val;
        } else if (val && typeof val === 'object') {
            const subCleaned = cleanBusinessObjectForList(val);
            if (Object.keys(subCleaned).length > 0) cleaned[key] = subCleaned;
        } else if (val !== undefined && val !== null) {
            cleaned[key] = val;
        }
    }
    return cleaned;
}

export function formatTaskTitle(inst: any, matchingTask: any, objectType: string, overrideStatus?: string): string {
    if (matchingTask?.TaskTitle) return matchingTask.TaskTitle;
    if (inst?.TaskTitle) return inst.TaskTitle;
    const isCompleted = overrideStatus === 'COMPLETED' || inst?.status === 'COMPLETED';
    const actionPrefix = inst?.normalTask === false 
        ? (isCompleted ? 'Reviewed' : 'Review') 
        : (isCompleted ? 'Approved' : 'Approve');
    const typeDisplay = inst?.doctyp_desc || inst?.doctyp || objectType;
    const docId = inst?.instid || inst?.instanceID || '';
    return `${actionPrefix} ${typeDisplay} ${docId}`.trim();
}

export function filterComments(raw: any[]): Comment[] {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((c, i) => {
            const text = String(c.text ?? c.noteText ?? c.NoteText ?? c.Notetext ?? '').trim();
            const author = c.author || c.userComment || c.UserComment || c.Usercomment || c.createdBy || c.CreatedBy || 'Unknown';
            const rawPostedOn = c.postedOn || c.PostedOn || c.Postedon || c.CommentDate;
            const rawPostedTime = c.postedTime || c.PostedTime || c.Postedtime || c.CommentTime;
            const postedOn = rawPostedOn && rawPostedTime ? `${rawPostedOn}T${rawPostedTime}` : (rawPostedOn || undefined);
            const createdAt = c.createdAt ?? normalizeDate(postedOn) ?? new Date().toISOString();
            
            return {
                id: c.id ?? `comment-${i}`,
                createdBy: author,
                createdByName: author,
                text,
                createdAt
            };
        })
        .filter((c) => c.text.length > 0);
}

export function decorateActions(sapDecisions: any[], config: any): UiAction[] {
    if (!Array.isArray(sapDecisions)) return [];
    return sapDecisions.map((sapDec: any) => {
        const configAct = config?.actions?.find((a: any) => a.sapDecisionKey === sapDec.DecisionKey);
        
        let nature: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' = 'NEUTRAL';
        if (configAct?.variant === 'PRIMARY') {
            nature = 'POSITIVE';
        } else if (configAct?.variant === 'DANGER') {
            nature = 'NEGATIVE';
        }

        return {
            key: sapDec.DecisionKey,
            text: sapDec.DecisionText,
            label: sapDec.DecisionText,
            nature,
            variant: configAct?.variant || 'SECONDARY',
            requiresComment: configAct?.requiresComment || false,
            confirmRequired: configAct?.confirmRequired || false,
            confirmMessage: configAct?.confirmMessage || undefined,
            sapDecisionKey: sapDec.DecisionKey,
            commentMandatory: configAct?.requiresComment || false,
            commentSupported: sapDec.CommentSupported !== false
        };
    });
}

export function decorateAttachments(attachments: any[], instanceId: string, instid: string): Attachment[] {
    if (!Array.isArray(attachments)) return [];
    return attachments.map((a: any, idx: number) => {
        const attId = a.id || `attach-${idx}`;
        return {
            id: attId,
            fileName: a.fileName || a.name || attId,
            fileDisplayName: a.fileName || a.name || attId,
            mimeType: a.mimeType || 'application/pdf',
            fileSize: a.fileSize || 0,
            createdBy: a.createdBy || 'SAP User',
            createdByName: a.createdBy || 'SAP User',
            createdAt: normalizeDate(a.createdAt),
            link: `/api/cnma/APPROVAL_SRV/tasks/${instanceId}/attachments/${attId}/content/${encodeURIComponent(a.fileName || a.name || 'file.pdf')}?documentId=${instid}`
        };
    });
}

/**
 * Centralized helper to resolve total amount for a task / business object.
 * Standardizes resolution order for ZUB Purchase Orders, standard Purchase Orders (BUS2012), and other objects.
 */
export function resolveTaskTotalAmount(item: any, rawBusinessObject?: any, objectType?: string): number | undefined {
    if (!item && !rawBusinessObject) return undefined;
    const rawObj = rawBusinessObject || {};
    const objTypeUpper = String(objectType || rawObj.DocCategory || item?.DocCategory || item?.typeid || item?.TechnicalWrkflwObjectType || '').toUpperCase();
    const docTypeUpper = String(rawObj.DocumentType || item?.DocumentType || item?.doctyp || item?.documentType || '').toUpperCase();

    const isPO = objTypeUpper === 'PO' || objTypeUpper === 'BUS2012';
    const isZub = isPO && (docTypeUpper === 'ZUB' || docTypeUpper.includes('ZUB'));

    if (isZub) {
        const val = item?.TotalNetAmountLocalCrcy ?? item?.totalNetAmountLocalCrcy ?? rawObj.TotalNetAmountLocalCrcy;
        if (val !== undefined && val !== null) return Number(val);
        const fallbackVal = item?.TotalOrderValue ?? item?.totalOrderValue ?? item?.total ?? rawObj.TotalOrderValue;
        if (fallbackVal !== undefined && fallbackVal !== null) return Number(fallbackVal);
        return undefined;
    }

    if (isPO) {
        const val = item?.TotalOrderValue ?? item?.totalOrderValue ?? rawObj.TotalOrderValue;
        if (val !== undefined && val !== null) return Number(val);
        const fallbackVal = item?.TotalNetAmountLocalCrcy ?? item?.totalNetAmountLocalCrcy ?? item?.total ?? rawObj.TotalNetAmountLocalCrcy;
        if (fallbackVal !== undefined && fallbackVal !== null) return Number(fallbackVal);
        return undefined;
    }

    // Standard fallback
    if (item?.total !== undefined && item?.total !== null) return Number(item.total);
    const rawVal = rawObj.TotalNetAmountLocalCrcy ?? rawObj.TotalOrderValue ?? rawObj.TotalAmount ?? rawObj.Total;
    if (rawVal !== undefined && rawVal !== null) return Number(rawVal);

    const itemRawVal = item?.TotalNetAmountLocalCrcy ?? item?.TotalOrderValue;
    if (itemRawVal !== undefined && itemRawVal !== null) return Number(itemRawVal);

    return undefined;
}

