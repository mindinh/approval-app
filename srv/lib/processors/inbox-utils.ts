import { ObjectConfig } from '../mapping/config-registry';
import { MappingEngine } from '../mapping/mapping-engine';

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
            const text = (c.text ?? c.noteText ?? '').trim();
            const author = c.author || c.userComment || c.createdBy || 'Unknown';
            const postedOn = c.postedOn && c.postedTime ? `${c.postedOn}T${c.postedTime}` : undefined;
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

export function buildFieldSchema(config: any): Record<string, any> {
    const fieldSchema: Record<string, any> = {};
    if (!config?.mappings) return fieldSchema;

    if (Array.isArray(config.mappings.root)) {
        for (const m of config.mappings.root) {
            const parts = m.targetPath.split('.');
            const key = parts[parts.length - 1];
            const label = m.label || key.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase());
            fieldSchema[key] = {
                key,
                label,
                dataPath: `$.${m.targetPath}`,
                dataType: m.dataType || (m.type === 'string' ? 'TEXT' : m.transform === 'number' ? 'AMOUNT' : m.transform === 'sapDateToIso' ? 'DATE' : 'TEXT'),
                currencyPath: m.currencyPath
            };
        }
    }

    if (config.mappings.collections && typeof config.mappings.collections === 'object') {
        for (const colKey of Object.keys(config.mappings.collections)) {
            const col = config.mappings.collections[colKey];
            if (Array.isArray(col.fields)) {
                for (const f of col.fields) {
                    const parts = f.targetPath.split('.');
                    const key = parts[parts.length - 1];
                    const label = f.label || key.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase());
                    fieldSchema[key] = {
                        key,
                        label,
                        dataPath: `$.${f.targetPath}`,
                        dataType: f.dataType || (f.type === 'string' ? 'TEXT' : f.transform === 'number' ? 'QUANTITY' : f.transform === 'sapDateToIso' ? 'DATE' : 'TEXT'),
                        currencyPath: f.currencyPath
                    };
                }
            }
        }
    }

    return fieldSchema;
}

export function buildBusinessChips(config: any, projectedObject: any): any[] {
    const businessChips: any[] = [];
    const mappingEngine = MappingEngine.getInstance();
    
    if (config?.cardChips && Array.isArray(config.cardChips)) {
        for (const chip of config.cardChips) {
            const rawVal = mappingEngine['getNestedValue'](projectedObject, chip.dataPath);
            if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
                businessChips.push({
                    label: chip.label,
                    value: rawVal,
                    dataType: chip.dataType,
                    isPrimary: chip.isPrimary,
                    currency: projectedObject.header?.displayCurrency || projectedObject.header?.documentCurrency || ''
                });
            }
        }
    }
    return businessChips;
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
            link: `/api/cnma/APPROVAL_SRV/tasks/${instanceId}/attachments/${attId}/content?documentId=${instid}`
        };
    });
}

export function composeTaskMeta(args: {
    instanceId: string;
    taskRuntime: any;
    inst?: any;
    objectType: string;
    instid: string;
    hints?: any;
    projectedObject: any;
    businessChips: any[];
    normalTask: boolean;
}): TaskMetadata {
    const { instanceId, taskRuntime, inst, objectType, instid, hints, projectedObject, businessChips, normalTask } = args;

    const businessContext: Record<string, any> = {
        type: objectType,
        documentId: instid
    };

    let title = taskRuntime?.TaskTitle;
    if (!title) {
        title = formatTaskTitle(inst, taskRuntime, objectType);
    }

    return {
        instanceId,
        sapOrigin: taskRuntime?.SAP__Origin || hints?.typeid || 'LOCAL',
        title,
        status: taskRuntime?.Status || inst?.status || 'READY',
        priority: normalizePriority(taskRuntime?.Priority || 'MEDIUM'),
        createdOn: normalizeDate(taskRuntime?.CreatedOn || inst?.taskCreationDateTime),
        createdByName: taskRuntime?.CreatedByName || undefined,
        requestorName: projectedObject?.header?.userFullName || projectedObject?.header?.createdByUser || taskRuntime?.CreatedByName || undefined,
        taskDefinitionId: hints?.typeid || taskRuntime?.TaskDefinitionID || '',
        supports: {
            forward: taskRuntime?.SupportsForward ?? true,
            comments: taskRuntime?.SupportsComments ?? true
        },
        businessContext,
        total: inst?.total !== undefined && inst?.total !== null ? Number(inst.total) : undefined,
        curr_vnd: inst?.curr_vnd || undefined,
        total_doc_curr: inst?.total_doc_curr !== undefined && inst?.total_doc_curr !== null ? Number(inst.total_doc_curr) : undefined,
        doc_curr: inst?.doc_curr || undefined,
        businessChips: businessChips.length > 0 ? businessChips : undefined,
        normalTask
    };
}

export function resolveUiSchema(config: any, documentType?: string): any {
    const subtypeConfig = documentType ? config.documentTypes?.[documentType] : undefined;
    return subtypeConfig?.uiSchema || config.uiSchema;
}
