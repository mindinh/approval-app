/**
 * Comments Mapper — merges and deduplicates comments from multiple sources.
 *
 * Extracts the mergeAndDeduplicateComments logic from TaskDetailPanels.tsx
 * so the panel component receives a clean, sorted comment list without
 * performing merge logic inline.
 */
import type { TaskComment, WorkflowApprovalComment } from '@/services/inbox/inbox.types';
import { parseDate } from '@/pages/Inbox/utils/formatters';

// ─── Types ─────────────────────────────────────────────────

export interface UnifiedComment {
    id: string;
    text: string;
    createdBy: string;
    createdAt: string;
    dateObj: Date;
}

// ─── Mapper ────────────────────────────────────────────────

/**
 * Merge workflow approval comments and task-level comments into a single
 * deduplicated, chronologically sorted list.
 *
 * Pure function — no hooks, no side effects.
 */
export function mergeAndDeduplicateComments(
    taskComments?: TaskComment[],
    workflowComments?: WorkflowApprovalComment[]
): UnifiedComment[] {
    const unified: UnifiedComment[] = [];

    // 1. Process workflow comments first (they are the "primary" source)
    for (const c of workflowComments || []) {
        const text = (c.noteText || (c as any).text || '').trim();
        if (!text) continue;

        let dateStr = c.postedOn || '';
        if (c.postedOn && c.postedTime) {
            let t = c.postedTime;
            if (t.startsWith('PT')) {
                t = t.replace('PT', '').replace('H', ':').replace('M', ':').replace('S', '');
            }
            dateStr += `T${t.split('.')[0]}`;
        }
        const dateObj = parseDate(dateStr);
        unified.push({
            id: `wc-${c.docNum}-${dateStr}-${unified.length}`,
            text,
            createdBy: c.userComment || (c as any).author || 'System',
            createdAt: dateStr,
            dateObj: Number.isNaN(dateObj.getTime()) ? new Date(0) : dateObj,
        });
    }

    // 2. Process task comments
    for (const c of taskComments || []) {
        const textNorm = (c.text || '').trim();
        if (!textNorm) continue;

        const dateObj = parseDate(c.createdAt || '');

        const isDuplicate = unified.some(
            (u) =>
                u.id === c.id ||
                (u.text.trim().toLowerCase() === textNorm.toLowerCase() &&
                 Math.abs(u.dateObj.getTime() - dateObj.getTime()) <= 1000 * 60 * 60 * 24)
        );

        if (!isDuplicate) {
            unified.push({
                id: c.id || `tc-${unified.length}`,
                text: c.text,
                createdBy: c.createdByName || c.createdBy || 'Unknown',
                createdAt: c.createdAt || '',
                dateObj: Number.isNaN(dateObj.getTime()) ? new Date() : dateObj,
            });
        }
    }

    // 3. Sort chronologically
    unified.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
    return unified;
}
