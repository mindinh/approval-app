import type { InboxTask } from '@/services/inbox/inbox.types';

export const TEXT_TO_DOC_TYPE_MAP: Record<string, { code: string; isPR?: boolean; isPO?: boolean }> = {
    'ASSET PR': { code: 'ZASS', isPR: true },
    'EXPENSE PR': { code: 'ZEXP', isPR: true },
    'MARKETING PR': { code: 'ZMAK', isPR: true },
    'TRADING PR': { code: 'ZNB1', isPR: true },
    'NON-TRADE PR': { code: 'ZNB2', isPR: true },
    'TOOLS PR': { code: 'ZTOL', isPR: true },
    'ASSET PO': { code: 'ZASS', isPO: true },
    'CONSIGNMENT PO': { code: 'ZCON', isPO: true },
    'CONSIGNMENT RETURN PO': { code: 'ZCOR', isPO: true },
    'EXPENSE PO': { code: 'ZEXP', isPO: true },
    'MARKETING PO': { code: 'ZMAK', isPO: true },
    'TRADING PO': { code: 'ZNB1', isPO: true },
    'NON-TRADE PO': { code: 'ZNB2', isPO: true },
    'TRADING RETURN PO': { code: 'ZNBR', isPO: true },
    'TOOLS PO': { code: 'ZTOL', isPO: true },
    'STOCK TRANSPORT ORDER': { code: 'ZUB', isPO: true },
    'RESERVATION': { code: 'ZBUS2093' },
    'CLAIM': { code: 'CLAIM' },
};

export function getDocumentCreationTimestamp(task: InboxTask): number | null {
    const creationDate = task.creationDate || (task as any).CreationDate;
    const creationTime = task.creationTime || (task as any).CreationTime;
    if (!creationDate) return null;

    const datePart = String(creationDate).slice(0, 10);
    const timePart = creationTime ? String(creationTime).slice(0, 8) : '00:00:00';
    const timestamp = new Date(`${datePart}T${timePart}`).getTime();
    return Number.isNaN(timestamp) ? null : timestamp;
}

/**
 * Matches a task against a selected document type filter target.
 * Supports exact text match, clean text options without codes, PR vs PO category scoping,
 * and high-level legacy values.
 */
export function matchTaskDocumentType(task: InboxTask, target: string): boolean {
    if (!target) return false;
    const targetTrimmed = target.trim();
    const targetUpper = targetTrimmed.toUpperCase();

    const docType = String(task.documentType || '').toUpperCase().trim();
    const objType = String(task.objectType || '').toUpperCase().trim();
    const bType = String(task.businessContext?.type || '').toUpperCase().trim();
    const taskDefId = String(task.taskDefinitionId || '').toUpperCase().trim();
    const docDisplay = String(task.documentTypeDisplay || '').toUpperCase().trim();
    const docDesc = String(task.documentTypeDesc || '').toUpperCase().trim();

    const taskIsPR = bType === 'PR' || objType === 'PR' || taskDefId.includes('BUS2105');
    const taskIsPO = bType === 'PO' || objType === 'PO' || taskDefId.includes('BUS2012');

    // 1. Check known text mapping (e.g. 'ASSET PR' -> ZASS + PR)
    const mapped = TEXT_TO_DOC_TYPE_MAP[targetUpper];
    if (mapped) {
        if (mapped.isPR && !taskIsPR) return false;
        if (mapped.isPO && !taskIsPO) return false;
        if (docType === mapped.code || bType === mapped.code || objType === mapped.code || taskDefId.includes(mapped.code)) {
            return true;
        }
        if (docDisplay && (docDisplay === targetUpper || docDisplay.includes(targetUpper) || targetUpper.includes(docDisplay))) {
            return true;
        }
        if (docDesc && (docDesc === targetUpper || docDesc.includes(targetUpper) || targetUpper.includes(docDesc))) {
            return true;
        }
    }

    // 2. High-level / legacy category matching ('PR', 'PO', 'ZBUS2093', 'RE', 'CLAIM')
    if (targetUpper === 'PR') {
        return taskIsPR || docType === 'PR';
    }
    if (targetUpper === 'PO') {
        return taskIsPO || docType === 'PO';
    }
    if (targetUpper === 'ZBUS2093' || targetUpper === 'RE' || targetUpper === 'BUS2093') {
        return (
            bType === 'RE' ||
            bType === 'ZBUS2093' ||
            bType === 'BUS2093' ||
            objType === 'RE' ||
            objType === 'ZBUS2093' ||
            objType === 'BUS2093' ||
            taskDefId.includes('BUS2093') ||
            docType === 'RESV' ||
            docType === 'RE'
        );
    }
    if (targetUpper === 'CLAIM') {
        return bType === 'CLAIM' || objType === 'CLAIM' || docType === 'CLAIM';
    }

    // 3. Direct text match against task's documentTypeDisplay or documentTypeDesc
    if (docDisplay && (docDisplay === targetUpper || docDisplay.includes(targetUpper) || targetUpper.includes(docDisplay))) {
        return true;
    }
    if (docDesc && (docDesc === targetUpper || docDesc.includes(targetUpper) || targetUpper.includes(docDesc))) {
        return true;
    }

    // 4. Code in parentheses extraction fallback (e.g. "Asset PR (ZASS)")
    const codeMatch = targetUpper.match(/\(([^)]+)\)/);
    const targetCode = codeMatch ? codeMatch[1].trim() : targetUpper;

    const targetIsPR = targetUpper.includes(' PR') || targetUpper.startsWith('PR ') || targetUpper === 'PR';
    const targetIsPO = targetUpper.includes(' PO') || targetUpper.startsWith('PO ') || targetUpper === 'PO';

    if (targetIsPR && !taskIsPR) return false;
    if (targetIsPO && !taskIsPO) return false;

    if (docType && docType === targetCode) {
        return true;
    }
    if (bType && bType === targetCode) {
        return true;
    }
    if (objType && objType === targetCode) {
        return true;
    }
    if (taskDefId && taskDefId.includes(targetCode)) {
        return true;
    }

    // Fallback: task title contains target text
    const targetTextWithoutCode = targetUpper.replace(/\s*\([^)]*\)/, '').trim();
    if (targetTextWithoutCode && task.title) {
        return task.title.toUpperCase().includes(targetTextWithoutCode);
    }

    return false;
}
