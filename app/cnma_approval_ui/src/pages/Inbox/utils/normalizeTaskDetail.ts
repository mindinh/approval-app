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
        createdAt: c.PostedOn ? `${c.PostedOn} ${c.PostedTime || ''}` : c.createdAt || new Date().toISOString()
    })) : [];

    const rawAttachments = bo?._Attachment || detail.attachments || [];
    const attachments = Array.isArray(rawAttachments) ? rawAttachments.map((att: any, idx: number) => ({
        id: att.DocId || att.id || `attach-${idx}`,
        fileName: att.FileName || att.fileName || '',
        mimeType: att.MimeType || att.mimeType || 'application/octet-stream',
        fileSize: Number(att.Length || att.fileSize || 0),
        createdBy: att.CreatedBy || att.createdBy || '',
        createdAt: att.CreatedOnDate && att.CreatedOnTime ? `${att.CreatedOnDate}T${att.CreatedOnTime}` : att.createdAt || new Date().toISOString()
    })) : [];

    const rawDecisions = tp?.decisionOptions || detail.decisions || detail.task?.decisions || [];
    const decisions = Array.isArray(rawDecisions) ? rawDecisions.map((d: any) => ({
        key: String(d.DecisionKey || d.key || ''),
        text: String(d.DecisionText || d.text || ''),
        nature: (d.Nature || (String(d.DecisionKey || d.key) === '0001' ? 'POSITIVE' : String(d.DecisionKey || d.key) === '0002' ? 'NEGATIVE' : 'NEUTRAL')) as any,
        commentMandatory: d.CommentMandatory === true
    })) : [];

    const instanceId = tp?.task?.InstanceID || detail.instanceId || detail.taskId || detail.task?.instanceId || '';
    const title = tp?.task?.TaskTitle || detail.task?.title || `${docCategory} ${documentId}`;
    const isNormalTask = (detail.normalTask ?? detail.task?.normalTask) !== false;
    const supports = {
        forward: isNormalTask && (tp?.task?.SupportsForward ?? detail.supports?.forward ?? detail.task?.supports?.forward) !== false,
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
        decisions,
        attachments,
        comments,
        processingLogs: detail.processingLogs || [],
        workflowLogs: detail.workflowLogs || []
    };
}
