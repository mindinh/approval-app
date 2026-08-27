export interface Comment {
    id: string;
    createdBy: string;
    createdByName: string;
    text: string;
    createdAt: string;
}

/**
 * OData V2 and V4 return the same conceptual fields under different casings.
 * This helper tries each alias in order and returns the first non-nullish value.
 *
 * NOTE: We use `== null` (not `=== undefined`) so explicit `null` is also skipped —
 * OData sometimes returns `null` for missing fields, which should fall through to
 * the next alias.
 */
export function pickField<T = any>(source: any, ...aliases: string[]): T | undefined {
    if (!source || typeof source !== 'object') return undefined;
    for (const alias of aliases) {
        const val = source[alias];
        if (val !== undefined && val !== null) return val as T;
    }
    return undefined;
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

export function formatTaskTitle(inst: any, matchingTask?: any, objectType?: string, overrideStatus?: string): string {
    const isCompleted = overrideStatus === 'COMPLETED' || inst?.status === 'COMPLETED';
    const actionPrefix = inst?.normalTask === false 
        ? (isCompleted ? 'Reviewed' : 'Review') 
        : (isCompleted ? 'Approved' : 'Approve');

    if (inst?.normalTask === false) {
        let typeDisplay = inst?.doctyp_desc || inst?.DocumentTypeText || inst?.DocumentTypeDisplay || inst?.doctyp || objectType || 'Task';
        if (String(typeDisplay).toUpperCase() === 'CLAIM') {
            typeDisplay = 'Claim';
        }
        const docId = inst?.DocumentNumber || inst?.TechnicalWrkflwObject || inst?.instid || inst?.instanceID || '';
        return `${actionPrefix} ${typeDisplay} ${docId}`.trim();
    }

    if (matchingTask?.TaskTitle) return matchingTask.TaskTitle;
    if (inst?.TaskTitle) return inst.TaskTitle;
    if (inst?.taskTitle) return inst.taskTitle;

    let typeDisplay = inst?.doctyp_desc || inst?.DocumentTypeText || inst?.DocumentTypeDisplay || inst?.doctyp || objectType || 'Task';
    if (String(typeDisplay).toUpperCase() === 'CLAIM') {
        typeDisplay = 'Claim';
    }
    const docId = inst?.DocumentNumber || inst?.TechnicalWrkflwObject || inst?.instid || inst?.instanceID || '';
    return `${actionPrefix} ${typeDisplay} ${docId}`.trim();
}

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

    if (objTypeUpper === 'CLAIM') {
        const val = item?.PaymentAmountLocalCrcy ?? item?.paymentAmountLocalCrcy ?? rawObj.PaymentAmountLocalCrcy ?? item?.PaymentAmount ?? item?.paymentAmount ?? rawObj.PaymentAmount;
        if (val !== undefined && val !== null) return Number(val);
    }

    // Standard fallback
    if (item?.total !== undefined && item?.total !== null) return Number(item.total);
    const rawVal = rawObj.TotalNetAmountLocalCrcy ?? rawObj.PaymentAmount ?? rawObj.TotalOrderValue ?? rawObj.TotalAmount ?? rawObj.Total;
    if (rawVal !== undefined && rawVal !== null) return Number(rawVal);

    const itemRawVal = item?.TotalNetAmountLocalCrcy ?? item?.TotalOrderValue ?? item?.PaymentAmountLocalCrcy ?? item?.PaymentAmount;
    if (itemRawVal !== undefined && itemRawVal !== null) return Number(itemRawVal);

    return undefined;
}






export function filterComments(raw: any[]): Comment[] {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((c, i) => {
            const text = String(pickField(c, 'text', 'noteText', 'NoteText', 'Notetext') ?? '').trim();
            const author = pickField(c, 'author', 'userComment', 'UserComment', 'Usercomment', 'createdBy', 'CreatedBy') || 'Unknown';
            const rawPostedOn = pickField(c, 'postedOn', 'PostedOn', 'Postedon', 'CommentDate');
            const rawPostedTime = pickField(c, 'postedTime', 'PostedTime', 'Postedtime', 'CommentTime');
            const postedOn = rawPostedOn && rawPostedTime ? `${rawPostedOn}T${rawPostedTime}` : rawPostedOn;
            const createdAt = pickField(c, 'createdAt') ?? normalizeDate(postedOn) ?? new Date().toISOString();

            return {
                id: pickField(c, 'id') ?? `comment-${i}`,
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
        const attId = a.id || a.DocId || a.Docid || a.docId || a.ID || a.AttachId || a.attachId || `attach-${idx}`;
        let rawFileName = String(
            a.fileName || a.FileName || a.FileDisplayName || a.fileDisplayName || a.name || a.Name || a.Filename || a.filename || a.Title || a.title || a.Description || a.description || attId
        ).trim();

        // Remove trailing dots (e.g. "04_Amenities_Cost_Raise_Request_Cleaning_Supplies." -> "04_Amenities_Cost_Raise_Request_Cleaning_Supplies")
        rawFileName = rawFileName.replace(/\.+$/, '').trim();

        let mimeType = String(a.mimeType || a.MimeType || a.ContentType || a.contentType || a['Content@odata.mediaContentType'] || a.Mimetype || a.mimetype || '').trim();
        const rawType = String(
            a.FileType || a.fileType || a.FileExtension || a.fileExtension || a.DocType || a.docType || a.Ext || a.ext || a.Format || a.format || a.Type || a.type || a.DocClass || a.docClass || a.Component || a.component || ''
        ).toLowerCase().trim();

        // Infer MIME if generic/missing and rawType is present
        if ((!mimeType || mimeType === 'application/octet-stream' || mimeType === 'application/x-forcedownload') && rawType) {
            const typeMap: Record<string, string> = {
                pdf: 'application/pdf',
                png: 'image/png',
                jpg: 'image/jpeg',
                jpeg: 'image/jpeg',
                gif: 'image/gif',
                webp: 'image/webp',
                svg: 'image/svg+xml',
                bmp: 'image/bmp',
                ico: 'image/x-icon',
                txt: 'text/plain',
                log: 'text/plain',
                csv: 'text/csv',
                json: 'application/json',
                xml: 'application/xml',
                html: 'text/html',
                htm: 'text/html',
                md: 'text/markdown',
                docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                doc: 'application/msword',
                xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                xls: 'application/vnd.ms-excel',
                pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                ppt: 'application/vnd.ms-powerpoint',
                zip: 'application/zip',
                rar: 'application/x-rar-compressed',
                '7z': 'application/x-7z-compressed',
                msg: 'application/vnd.ms-outlook',
            };
            if (typeMap[rawType]) {
                mimeType = typeMap[rawType];
            }
        }

        // Determine extension from filename or rawType
        let hasExtension = rawFileName.includes('.') && rawFileName.split('.').pop()!.length >= 2;
        let fileName = rawFileName || attId;

        if (!hasExtension && rawType && /^[a-z0-9]+$/.test(rawType)) {
            fileName = `${fileName}.${rawType}`;
            hasExtension = true;
        } else if (!hasExtension && mimeType && mimeType !== 'application/octet-stream') {
            const extFromMime: Record<string, string> = {
                'application/pdf': 'pdf',
                'image/png': 'png',
                'image/jpeg': 'jpg',
                'image/gif': 'gif',
                'image/webp': 'webp',
                'image/svg+xml': 'svg',
                'text/plain': 'txt',
                'text/csv': 'csv',
                'application/json': 'json',
                'application/xml': 'xml',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
                'application/msword': 'doc',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
                'application/vnd.ms-excel': 'xls',
                'application/zip': 'zip',
            };
            const cleanM = mimeType.split(';')[0].toLowerCase();
            if (extFromMime[cleanM]) {
                fileName = `${fileName}.${extFromMime[cleanM]}`;
            }
        }

        const fileDisplayName = a.fileDisplayName || a.FileDisplayName || fileName;
        const fileSize = Number(a.fileSize || a.Length || a.FileSize || a.length || 0);

        const docCat = a.DocCategory || a.docCategory || a.objectType || a.ObjectType;
        const queryParams = [`documentId=${instid}`];
        if (docCat) {
            queryParams.push(`objectType=${encodeURIComponent(docCat)}`);
        }

        return {
            id: attId,
            fileName,
            fileDisplayName,
            mimeType: mimeType || 'application/octet-stream',
            fileSize,
            createdBy: a.createdBy || a.CreatedBy || a.CreatedByName || a.createdByName || 'SAP User',
            createdByName: a.createdByName || a.CreatedByName || a.createdBy || a.CreatedBy || 'SAP User',
            createdAt: normalizeDate(a.createdAt || a.CreatedOnDate),
            link: `/api/cnma/APPROVAL_SRV/tasks/${instanceId}/attachments/${attId}/content/${encodeURIComponent(fileName)}?${queryParams.join('&')}`
        };
    });
}





