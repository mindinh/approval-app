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

/**
 * Utility function to normalize raw SAP OData / CAP BFF task detail payloads
 * into structured domain objects consumable by TaskDetailView.
 */
export function normalizeDetailForView(detail: any) {
    if (!detail) return null;
    const bo = detail.businessObject || (detail.header ? { ...detail.header, _Item: detail.items } : detail);
    const tp = detail.taskprocessing;

    const docCategory = String(bo?.DocCategory || detail.objectType || detail.task?.businessContext?.type || 'PR').toUpperCase();
    const documentId = String(bo?.DocumentNumber || bo?.PurchaseRequisition || bo?.PurchaseOrder || bo?.ReservationNumber || bo?.ClaimNumber || bo?.DocumentId || detail.documentId || '');

    const rawSteps = bo?._ApprovalStep || detail.approvalSteps || detail.approvalTree || [];
    const steps = Array.isArray(rawSteps) ? rawSteps.map((s: any) => ({
        documentId: s.ObjectKey || s.DocumentNumber || documentId,
        level: Number(s.ApprovalLevel ?? s.level ?? 0),
        releaseCode: s.ReleaseCode || s.releaseCode || '',
        releaseText: s.ReleaseText || s.releaseText || s.ReleaseCode || '',
        approver: s.ApproverName || s.approver || '',
        approverUserId: s.ApproverUserId || s.approverUserId || '',
        status: s.ApprovalStatus || s.status || '',
        noteText: s.CommentText || s.noteText || '',
        postedOn: s.CommentDate || s.postedOn || '',
        postedTime: s.CommentTime || s.postedTime || ''
    })) : [];

    const rawComments = bo?._Comment || detail.comments || [];
    const comments = Array.isArray(rawComments) ? rawComments.map((c: any, idx: number) => ({
        id: c.id || c.DocId || `comment-${idx}`,
        text: c.NoteText || c.noteText || c.text || '',
        createdBy: c.UserComment || c.author || c.createdBy || 'User',
        createdAt: c.PostedOn ? `${c.PostedOn} ${c.PostedTime || ''}` : c.createdAt || new Date().toISOString(),
        forward: c.Forward === true || c.forward === true,
        toUser: c.ToUser || c.toUser || ''
    })) : [];

    const rawAttachments = bo?._Attachment || detail.attachments || [];
    const attachments = Array.isArray(rawAttachments) ? rawAttachments.map((att: any, idx: number) => {
        const id = att.DocId || att.Docid || att.docId || att.id || att.ID || att.AttachId || att.attachId || `attach-${idx}`;
        let rawFileName = String(
            att.FileName || att.fileName || att.FileDisplayName || att.fileDisplayName || att.Name || att.name || att.Filename || att.filename || att.Title || att.title || att.Description || att.description || ''
        ).trim();

        // Remove trailing dots
        rawFileName = rawFileName.replace(/\.+$/, '').trim();

        let mimeType = String(att.MimeType || att.mimeType || att.ContentType || att.contentType || att.Mimetype || att.mimetype || '').trim();
        const rawType = String(
            att.FileType || att.fileType || att.FileExtension || att.fileExtension || att.DocType || att.docType || att.Ext || att.ext || att.Format || att.format || att.Type || att.type || att.DocClass || att.docClass || att.Component || att.component || ''
        ).toLowerCase().trim();

        // Infer MIME if generic/missing and rawType is present
        if ((!mimeType || mimeType === 'application/octet-stream' || mimeType === 'application/x-forcedownload') && rawType) {
            if (MIME_TYPE_MAP[rawType]) {
                mimeType = MIME_TYPE_MAP[rawType];
            }
        }

        // Determine extension from filename or rawType
        let hasExtension = rawFileName.includes('.') && rawFileName.split('.').pop()!.length >= 2;
        let fileName = rawFileName || id;

        if (!hasExtension && rawType && /^[a-z0-9]+$/.test(rawType)) {
            fileName = `${fileName}.${rawType}`;
            hasExtension = true;
        } else if (!hasExtension && mimeType && mimeType !== 'application/octet-stream') {
            const cleanM = mimeType.split(';')[0].toLowerCase();
            if (EXT_FROM_MIME_MAP[cleanM]) {
                fileName = `${fileName}.${EXT_FROM_MIME_MAP[cleanM]}`;
            }
        }


        const fileDisplayName = att.FileDisplayName || att.fileDisplayName || fileName;

        return {
            id,
            fileName,
            fileDisplayName,
            mimeType: mimeType || 'application/octet-stream',
            fileSize: Number(att.Length || att.fileSize || att.FileSize || att.length || 0),
            createdBy: att.CreatedBy || att.createdBy || att.CreatedByName || att.createdByName || '',
            createdAt: att.CreatedOnDate && att.CreatedOnTime ? `${att.CreatedOnDate}T${att.CreatedOnTime}` : att.createdAt || new Date().toISOString()
        };
    }) : [];



    const instanceId = tp?.task?.InstanceID || detail.instanceId || detail.taskId || detail.task?.instanceId || '';
    const isNormalTask = (detail.normalTask ?? detail.task?.normalTask) !== false;
    const rawDecisions = !isNormalTask ? [] : (tp?.decisionOptions || detail.decisions || detail.task?.decisions || []);
    const decisions = Array.isArray(rawDecisions) ? rawDecisions.map((d: any) => ({
        key: String(d.DecisionKey || d.key || ''),
        text: String(d.DecisionText || d.text || ''),
        nature: (d.Nature || (String(d.DecisionKey || d.key) === '0001' ? 'POSITIVE' : String(d.DecisionKey || d.key) === '0002' ? 'NEGATIVE' : 'NEUTRAL')) as any,
        commentMandatory: d.CommentMandatory === true
    })) : [];
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


    return {
        rawDetail: detail,
        businessObject: bo,
        docCategory,
        documentId,
        instanceId,
        title,
        status: tp?.task?.Status || detail.task?.status || 'READY',
        priority: tp?.task?.Priority || detail.task?.priority || 'MEDIUM',
        createdOn: tp?.task?.CreatedOn || detail.task?.createdOn,
        createdByName: tp?.task?.CreatedByName || detail.task?.createdByName,
        normalTask: detail.normalTask ?? detail.task?.normalTask ?? true,
        supports,
        task: {
            instanceId,
            title,
            status: tp?.task?.Status || detail.task?.status || 'READY',
            priority: tp?.task?.Priority || detail.task?.priority || 'MEDIUM',
            normalTask: detail.normalTask ?? detail.task?.normalTask ?? true,
            sapOrigin: tp?.task?.SAP__Origin || detail.task?.sapOrigin || 'LOCAL',
            supports,
            businessContext: {
                type: docCategory as any,
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
