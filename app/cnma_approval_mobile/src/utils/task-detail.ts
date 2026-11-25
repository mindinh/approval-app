/**
 * Pure view model of GET /tasks/:id for the detail screen (no React). Follows the web
 * `normalizeDetailForView` + `makeTabDefinitions` rules for title, status, CC, attachments, comments,
 * approval steps and which tabs exist; overview cards and line items come from the shared renderers.
 */
import { knownExtension, mimeOfExtension } from './file-types';
import { resolveDetailInstanceId } from '@approval-core/instance-id';
import { resolveBusinessSectionModel, type BusinessSectionModel, type DetailInput } from '@approval-core/renderers';
import type { TaskDetailResponse } from '@/lib/api/bff-api';
import { taskStatus, type TaskStatus } from './task-status';

/** Raw OData record (the BFF forwards SAP entities untouched). */
type Raw = Record<string, unknown>;

/** Document categories that show the approval workflow tab (same list as the web). */
const WORKFLOW_DOC_CATEGORIES = new Set(['PR', 'PO', 'RE', 'CLAIM', 'BUS2105', 'BUS2012', 'ZBUS2093', 'BUS2093']);

export interface ApprovalStep {
    key: string;
    level: number;
    releaseCode: string;
    releaseText: string;
    approver: string;
    status: string;
    note: string;
    postedOn: string;
    postedTime: string;
}

export interface TaskAttachment {
    id: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    createdBy: string;
    createdAt: string;
}

export interface TaskComment {
    id: string;
    text: string;
    author: string;
    createdAt: string;
    /** Forwarded comment (web: "Forwarded to …" even without a recipient). */
    forwarded: boolean;
    forwardedTo?: string;
}

/** A decision the approver can take (SAP TASKPROCESSING decision option), as on the web. */
export interface TaskDecision {
    key: string;
    text: string;
    nature: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    /** A comment must be entered (mandatory in SAP, and always for a rejection, like the web). */
    commentRequired: boolean;
}

export type DetailTabKey = 'overview' | 'details' | 'workflow' | 'attachments' | 'comments';

export interface DetailTab {
    key: DetailTabKey;
    label: string;
    count?: number;
}

/**
 * Task context the BFF needs for writes (decision `_context`, comment `_context`), built like the web
 * InboxPage: it saves the BFF a SAP round trip and keys Claim bound actions by the approver number.
 */
export interface TaskWriteContext {
    sapOrigin: string;
    documentId: string;
    businessObjectType: string;
    approverNumber?: string;
}

export interface TaskDetailView {
    instanceId: string;
    documentId: string;
    docCategory: string;
    typeLabel: string;
    title: string;
    status: TaskStatus;
    isCc: boolean;
    createdOn?: string;
    createdByName?: string;
    releaseStrategyName: string;
    model: BusinessSectionModel;
    approvalSteps: ApprovalStep[];
    attachments: TaskAttachment[];
    comments: TaskComment[];
    /** Decisions for an open, non-CC task (Reject before Approve); empty otherwise. */
    decisions: TaskDecision[];
    tabs: DetailTab[];
    /** Sent with decisions and comments. */
    context: TaskWriteContext;
}

const text = (value: unknown): string => (value === undefined || value === null ? '' : String(value));
const list = (value: unknown): Raw[] => (Array.isArray(value) ? (value as Raw[]) : []);

function firstText(record: Raw | undefined, ...keys: string[]): string {
    for (const key of keys) {
        const value = text(record?.[key]).trim();
        if (value) return value;
    }
    return '';
}

function toStep(step: Raw, index: number): ApprovalStep {
    const level = Number(step.ApprovalLevel ?? step.level ?? 0);
    return {
        key: `${level}-${index}`,
        level,
        releaseCode: firstText(step, 'ReleaseCode', 'releaseCode'),
        releaseText: firstText(step, 'ReleaseText', 'releaseText', 'ReleaseCode'),
        approver: firstText(step, 'ApproverName', 'approver'),
        status: firstText(step, 'ApprovalStatus', 'status'),
        note: firstText(step, 'CommentText', 'noteText'),
        postedOn: firstText(step, 'CommentDate', 'postedOn'),
        postedTime: firstText(step, 'CommentTime', 'postedTime').split('.')[0],
    };
}

function toAttachment(att: Raw, index: number): TaskAttachment {
    const id = firstText(att, 'DocId', 'Docid', 'docId', 'id', 'ID', 'AttachId', 'attachId') || `attach-${index}`;
    const baseName = firstText(att, 'FileName', 'fileName', 'FileDisplayName', 'Name', 'name', 'Filename', 'Title', 'Description').replace(/\.+$/, '') || id;
    // SAP sends the name without its extension and the extension separately (FileExtension), and no MIME type.
    const extension = firstText(att, 'FileExtension', 'fileExtension', 'FileType', 'fileType').replace(/^\.+/, '').toLowerCase();
    const fileName = extension && !baseName.toLowerCase().endsWith(`.${extension}`) ? `${baseName}.${extension}` : baseName;
    const mimeFromSap = firstText(att, 'MimeType', 'mimeType', 'ContentType', 'contentType');
    const ownExtension = knownExtension(fileName);
    const createdOn = firstText(att, 'CreatedOnDate');
    return {
        id,
        fileName,
        mimeType: mimeFromSap && mimeFromSap !== 'application/octet-stream' ? mimeFromSap : ownExtension ? mimeOfExtension(ownExtension) : 'application/octet-stream',
        fileSize: Number(att.Length ?? att.fileSize ?? att.FileSize ?? 0) || 0,
        // Same order as the web attachment mapper.
        createdBy: firstText(att, 'CreatedBy', 'CreatedByName', 'createdBy'),
        createdAt: createdOn ? `${createdOn}T${firstText(att, 'CreatedOnTime') || '00:00:00'}` : firstText(att, 'createdAt'),
    };
}

function toComment(comment: Raw, index: number): TaskComment {
    const postedOn = firstText(comment, 'PostedOn');
    const forwarded = comment.Forward === true || comment.forward === true;
    return {
        id: firstText(comment, 'id', 'DocId') || `comment-${index}`,
        text: firstText(comment, 'NoteText', 'noteText', 'text'),
        // Same order as the web comments panel: the SAP user first, then the display name.
        author: firstText(comment, 'createdBy', 'UserComment', 'author', 'createdByName', 'authorName') || 'Unknown',
        createdAt: postedOn ? `${postedOn}T${firstText(comment, 'PostedTime') || '00:00:00'}` : firstText(comment, 'createdAt'),
        forwarded,
        forwardedTo: forwarded ? firstText(comment, 'ToUser', 'toUser') || undefined : undefined,
    };
}

/** SAP decision keys (web DECISION_KEYS) used when SAP sends no nature. */
const APPROVE_KEY = '0001';
const REJECT_KEY = '0002';
const NATURE_ORDER = { NEGATIVE: 0, NEUTRAL: 1, POSITIVE: 2 } as const;

function toDecision(decision: Raw): TaskDecision {
    const key = firstText(decision, 'DecisionKey', 'key');
    const rawNature = firstText(decision, 'Nature', 'nature').toUpperCase();
    const nature: TaskDecision['nature'] =
        rawNature === 'POSITIVE' || rawNature === 'NEGATIVE' || rawNature === 'NEUTRAL' ? rawNature : key === APPROVE_KEY ? 'POSITIVE' : key === REJECT_KEY ? 'NEGATIVE' : 'NEUTRAL';
    return {
        key,
        text: firstText(decision, 'DecisionText', 'text') || (nature === 'POSITIVE' ? 'Approve' : nature === 'NEGATIVE' ? 'Reject' : key),
        nature,
        commentRequired: decision.CommentMandatory === true || decision.commentMandatory === true || nature === 'NEGATIVE',
    };
}

function businessObjectOf(detail: Raw): Raw {
    if (detail.businessObject && typeof detail.businessObject === 'object') return detail.businessObject as Raw;
    if (detail.header && typeof detail.header === 'object') return { ...(detail.header as Raw), _Item: detail.items };
    return detail;
}

export function toTaskDetailView(response: TaskDetailResponse): TaskDetailView {
    const detail = response as unknown as Raw;
    const bo = businessObjectOf(detail);
    const tpTask = ((detail.taskprocessing as Raw | undefined)?.task ?? {}) as Raw;
    const legacyTask = (detail.task ?? {}) as Raw;
    const businessContext = (legacyTask.businessContext ?? {}) as Raw;

    const docCategory = (firstText(bo, 'DocCategory') || text(detail.objectType) || text(businessContext.type) || 'PR').toUpperCase();
    const documentId = firstText(bo, 'DocumentNumber', 'PurchaseRequisition', 'PurchaseOrder', 'ReservationNumber', 'ClaimNumber', 'DocumentId') || text(detail.documentId);
    const isCc = (detail.normalTask ?? legacyTask.normalTask) === false;
    const rawStatus = firstText(tpTask, 'Status') || text(legacyTask.status) || text(detail.status) || 'READY';
    const completed = rawStatus === 'COMPLETED';
    const typeLabel = firstText(bo, 'DocumentTypeText', 'DocumentTypeDisplay', 'doctyp_desc') || text(detail.documentTypeDisplay) || (docCategory === 'CLAIM' ? 'Claim' : docCategory);
    const title = isCc
        ? `${completed ? 'Reviewed' : 'Review'} ${typeLabel} ${documentId}`.trim()
        : text(detail.title) || firstText(tpTask, 'TaskTitle') || text(legacyTask.title) || `Approve ${typeLabel} ${documentId}`;

    const model = resolveBusinessSectionModel(response as unknown as DetailInput);
    const approvalSteps = list(bo._ApprovalStep ?? detail.approvalSteps ?? detail.approvalTree)
        .map(toStep)
        .sort((a, b) => a.level - b.level);
    const attachments = list(bo._Attachment ?? detail.attachments).map(toAttachment);
    const comments = list(bo._Comment ?? detail.comments)
        .map(toComment)
        .filter((comment) => comment.text.trim());
    const taskprocessing = (detail.taskprocessing ?? {}) as Raw;
    const decisions = isCc || completed
        ? []
        : list(taskprocessing.decisionOptions ?? detail.decisions ?? legacyTask.decisions)
              .map(toDecision)
              .filter((decision) => decision.key)
              .sort((a, b) => NATURE_ORDER[a.nature] - NATURE_ORDER[b.nature]);
    const lineItemCount = model.tables.reduce((sum, table) => sum + table.rows.length, 0);

    const tabs: DetailTab[] = [
        { key: 'overview', label: 'Overview' },
        { key: 'details', label: 'Details', count: lineItemCount || undefined },
        ...(WORKFLOW_DOC_CATEGORIES.has(docCategory) ? [{ key: 'workflow' as const, label: 'Workflow', count: approvalSteps.length }] : []),
        { key: 'attachments', label: 'Attachments', count: attachments.length },
        { key: 'comments', label: 'Comments', count: comments.length },
    ];

    const context: TaskWriteContext = {
        sapOrigin: firstText(tpTask, 'SAPOrigin', 'SapOrigin', 'sapOrigin') || text(legacyTask.sapOrigin) || 'LOCAL',
        documentId: text(businessContext.documentId) || documentId,
        businessObjectType: text(businessContext.type) || text(detail.docCategory) || firstText(bo, 'DocCategory') || text(detail.objectType),
        approverNumber: firstText(bo, 'ApproverNumber') || text(legacyTask.ApproverNumber ?? legacyTask.approverNumber) || undefined,
    };

    return {
        instanceId: resolveDetailInstanceId(detail) ?? '',
        documentId,
        docCategory,
        typeLabel,
        title,
        status: taskStatus(rawStatus),
        isCc,
        createdOn: firstText(tpTask, 'CreatedOn') || text(legacyTask.createdOn) || undefined,
        createdByName: firstText(tpTask, 'CreatedByName') || text(legacyTask.createdByName) || undefined,
        releaseStrategyName: firstText(bo, 'ReleaseStrategyName', 'ReleaseStrategyText') || text(detail.releaseStrategyName),
        model,
        approvalSteps,
        attachments,
        comments,
        decisions,
        tabs,
        context,
    };
}

/** A PR number as the web shows it: without SAP's leading zeros. */
export function formatPrNumber(prNumber: string): string {
    return prNumber.trim().replace(/^0+/, '') || prNumber.trim();
}

/**
 * A reference PR opened from a PO (web: ReferencePrDetailView): the same tabs as a task, read-only. The BFF
 * marks it as not a normal task, which must not turn it into a CC review; it has no decisions.
 */
export function toReferencePrView(response: TaskDetailResponse): TaskDetailView {
    const view = toTaskDetailView(response);
    return {
        ...view,
        isCc: false,
        decisions: [],
        title: `PR #${formatPrNumber(view.documentId)}`,
        status: { label: 'Reference PR', tone: 'neutral' },
    };
}
