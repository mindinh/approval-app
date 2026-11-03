import type { RawODataEntity } from '@/services/inbox/inbox.contracts';
import type { BusinessContextType, DecisionNature } from '@/services/inbox/inbox.types';
import { DECISION_KEYS } from './constants';
import { resolveDetailInstanceId } from './instanceId';

const MIME_TYPE_MAP: Record<string, string> = {
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

const EXT_FROM_MIME_MAP: Record<string, string> = {
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

const DEFAULT_MIME_TYPE = 'application/octet-stream';
/** MIME types that carry no information about the real file format. */
const GENERIC_MIME_TYPES = new Set([DEFAULT_MIME_TYPE, 'application/x-forcedownload']);

function mapArray<T>(value: unknown, mapper: (item: RawODataEntity, index: number) => T): T[] {
    return Array.isArray(value) ? value.map(mapper) : [];
}

function mapApprovalStep(step: RawODataEntity, documentId: string) {
    return {
        documentId: step.ObjectKey || step.DocumentNumber || documentId,
        level: Number(step.ApprovalLevel ?? step.level ?? 0),
        releaseCode: step.ReleaseCode || step.releaseCode || '',
        releaseText: step.ReleaseText || step.releaseText || step.ReleaseCode || '',
        approver: step.ApproverName || step.approver || '',
        approverUserId: step.ApproverUserId || step.approverUserId || '',
        status: step.ApprovalStatus || step.status || '',
        noteText: step.CommentText || step.noteText || '',
        postedOn: step.CommentDate || step.postedOn || '',
        postedTime: step.CommentTime || step.postedTime || ''
    };
}

function mapComment(comment: RawODataEntity, index: number) {
    return {
        id: comment.id || comment.DocId || `comment-${index}`,
        text: comment.NoteText || comment.noteText || comment.text || '',
        createdBy: comment.createdBy || comment.UserComment || comment.author || '',
        createdByName: comment.createdByName || comment.authorName || '',
        createdAt: comment.PostedOn ? `${comment.PostedOn}T${comment.PostedTime || '00:00:00'}` : comment.createdAt || '',
        forward: comment.Forward === true || comment.forward === true,
        toUser: comment.ToUser || comment.toUser || ''
    };
}

/** Appends an extension inferred from the SAP file type or the MIME type when the name has none. */
function withInferredExtension(rawFileName: string, fallbackName: string, rawType: string, mimeType: string): string {
    const fileName = rawFileName || fallbackName;
    const hasExtension = rawFileName.includes('.') && rawFileName.split('.').pop()!.length >= 2;
    if (hasExtension) return fileName;

    if (rawType && /^[a-z0-9]+$/.test(rawType)) {
        return `${fileName}.${rawType}`;
    }
    if (mimeType && mimeType !== DEFAULT_MIME_TYPE) {
        const extension = EXT_FROM_MIME_MAP[mimeType.split(';')[0].toLowerCase()];
        if (extension) return `${fileName}.${extension}`;
    }
    return fileName;
}

function mapAttachment(att: RawODataEntity, index: number) {
    const id = att.DocId || att.Docid || att.docId || att.id || att.ID || att.AttachId || att.attachId || `attach-${index}`;
    const rawFileName = String(
        att.FileName || att.fileName || att.FileDisplayName || att.fileDisplayName || att.Name || att.name || att.Filename || att.filename || att.Title || att.title || att.Description || att.description || ''
    ).trim()
        // Remove trailing dots
        .replace(/\.+$/, '').trim();

    let mimeType = String(att.MimeType || att.mimeType || att.ContentType || att.contentType || att.Mimetype || att.mimetype || '').trim();
    const rawType = String(
        att.FileType || att.fileType || att.FileExtension || att.fileExtension || att.DocType || att.docType || att.Ext || att.ext || att.Format || att.format || att.Type || att.type || att.DocClass || att.docClass || att.Component || att.component || ''
    ).toLowerCase().trim();

    // Infer MIME if generic/missing and rawType is known
    if ((!mimeType || GENERIC_MIME_TYPES.has(mimeType)) && rawType && MIME_TYPE_MAP[rawType]) {
        mimeType = MIME_TYPE_MAP[rawType];
    }

    const fileName = withInferredExtension(rawFileName, id, rawType, mimeType);

    return {
        id,
        fileName,
        fileDisplayName: att.FileDisplayName || att.fileDisplayName || fileName,
        mimeType: mimeType || DEFAULT_MIME_TYPE,
        fileSize: Number(att.Length || att.fileSize || att.FileSize || att.length || 0),
        createdBy: att.CreatedBy || att.createdBy || att.CreatedByName || att.createdByName || '',
        createdAt: att.CreatedOnDate && att.CreatedOnTime ? `${att.CreatedOnDate}T${att.CreatedOnTime}` : att.createdAt || new Date().toISOString()
    };
}

function decisionNature(decision: RawODataEntity): DecisionNature {
    if (decision.Nature) return decision.Nature;
    const key = String(decision.DecisionKey || decision.key);
    if (key === DECISION_KEYS.APPROVE) return 'POSITIVE';
    if (key === DECISION_KEYS.REJECT) return 'NEGATIVE';
    return 'NEUTRAL';
}

function mapDecision(decision: RawODataEntity) {
    return {
        key: String(decision.DecisionKey || decision.key || ''),
        text: String(decision.DecisionText || decision.text || ''),
        nature: decisionNature(decision),
        commentMandatory: decision.CommentMandatory === true
    };
}

/**
 * Utility function to normalize raw SAP OData / CAP BFF task detail payloads
 * into structured domain objects consumable by TaskDetailView.
 */
export function normalizeDetailForView(detail: RawODataEntity | null | undefined) {
    if (!detail) return null;
    const bo = detail.businessObject || (detail.header ? { ...detail.header, _Item: detail.items } : detail);
    const tp = detail.taskprocessing;

    const docCategory = String(bo?.DocCategory || detail.objectType || detail.task?.businessContext?.type || 'PR').toUpperCase();
    const documentId = String(bo?.DocumentNumber || bo?.PurchaseRequisition || bo?.PurchaseOrder || bo?.ReservationNumber || bo?.ClaimNumber || bo?.DocumentId || detail.documentId || '');

    const steps = mapArray(bo?._ApprovalStep || detail.approvalSteps || detail.approvalTree || [], (step) => mapApprovalStep(step, documentId));
    const comments = mapArray(bo?._Comment || detail.comments || [], mapComment);
    const attachments = mapArray(bo?._Attachment || detail.attachments || [], mapAttachment);

    const instanceId = resolveDetailInstanceId(detail) || '';
    const isNormalTask = (detail.normalTask ?? detail.task?.normalTask) !== false;
    const rawDecisions = !isNormalTask ? [] : (tp?.decisionOptions || detail.decisions || detail.task?.decisions || []);
    const decisions = mapArray(rawDecisions, mapDecision);
    const isCompleted = (tp?.task?.Status || detail.task?.status || detail.status) === 'COMPLETED';
    const typeDisplay = bo?.DocumentTypeText || bo?.DocumentTypeDisplay || bo?.doctyp_desc || detail.documentTypeDisplay || detail.documentTypeText || (docCategory === 'CLAIM' ? 'Claim' : docCategory);

    const title = !isNormalTask
        ? `${isCompleted ? 'Reviewed' : 'Review'} ${typeDisplay} ${documentId}`.trim()
        : (detail.title || tp?.task?.TaskTitle || detail.task?.title || `Approve ${typeDisplay} ${documentId}`);

    const isClaim = docCategory === 'CLAIM';
    const supports = {
        forward: !isClaim && isNormalTask && (tp?.task?.SupportsForward ?? detail.supports?.forward ?? detail.task?.supports?.forward) !== false,
        comments: (tp?.task?.SupportsComments ?? detail.supports?.comments ?? detail.task?.supports?.comments) !== false
    };
    const status = tp?.task?.Status || detail.task?.status || 'READY';
    const priority = tp?.task?.Priority || detail.task?.priority || 'MEDIUM';
    const createdByName = tp?.task?.CreatedByName || detail.task?.createdByName;
    const normalTask = detail.normalTask ?? detail.task?.normalTask ?? true;

    return {
        rawDetail: detail,
        businessObject: bo,
        docCategory,
        documentId,
        instanceId,
        title,
        status,
        priority,
        createdOn: tp?.task?.CreatedOn || detail.task?.createdOn,
        createdByName,
        normalTask,
        supports,
        task: {
            instanceId,
            createdByName,
            title,
            status,
            priority,
            normalTask,
            sapOrigin: tp?.task?.SAP__Origin || detail.task?.sapOrigin || 'LOCAL',
            supports,
            businessContext: {
                type: docCategory as BusinessContextType,
                documentId
            }
        },
        workflowData: {
            documentId,
            releaseStrategyName: bo.ReleaseStrategyName || bo.ReleaseStrategyText || detail.releaseStrategyName || '',
            steps,
            comments: []
        },
        decisions: isNormalTask ? decisions : [],
        attachments,
        comments,
        processingLogs: detail.processingLogs || [],
        workflowLogs: detail.workflowLogs || []
    };
}
