/**
 * Workflow steps exactly as the web WorkflowApprovalPanel shows them: which step is current / next /
 * completed, the status text, badges and date label. Pure: unit-tested.
 */
import {
    formatApprovalStatus,
    isApprovedApprovalStatus,
    isInApprovingStatus,
    isPendingApprovalStatus,
    isPendingVerifyStatus,
    isRejectedApprovalStatus,
    normalizeApprovalStatus,
} from '@approval-core/status-predicates';
import type { SymbolViewProps } from 'expo-symbols';
import type { TextTone } from '@/components/tone-text';
import type { ApprovalStep } from './task-detail';

export type StepKind = 'rejected' | 'approved' | 'pendingVerify' | 'current' | 'next' | 'pending';

export interface StepState {
    /** Look of the dot and connector. */
    kind: StepKind;
    label: string;
    tone: TextTone;
    icon: SymbolViewProps['name'];
    /** Badges beside the approver (web: Rejected, then Pending Verify / Current / Next). */
    badges: { label: string; tone: TextTone }[];
    dateLabel: string;
}

const CHECK: SymbolViewProps['name'] = { ios: 'checkmark', android: 'check' };
const CIRCLE: SymbolViewProps['name'] = { ios: 'circle', android: 'radio_button_unchecked' };

/**
 * Same rules and texts as the web WorkflowApprovalPanel: current = first in-approving step, else first
 * pending; next = the one after it; a step before the current one counts as completed.
 */
export function stepState(step: ApprovalStep, index: number, currentIndex: number, count: number): StepState {
    const raw = normalizeApprovalStatus(step.status);
    const rejected = isRejectedApprovalStatus(step.status);
    const approved = isApprovedApprovalStatus(step.status);
    const pendingVerify = isPendingVerifyStatus(step.status);
    const nextIndex = currentIndex >= 0 && currentIndex < count - 1 ? currentIndex + 1 : -1;
    const current = (index === currentIndex || pendingVerify) && !rejected && !approved;
    const next = index === nextIndex;
    const completed = approved || (currentIndex >= 0 && index < currentIndex && !rejected);

    const label = pendingVerify ? 'Pending Verify' : current && raw === 'PENDING' ? 'In Approving' : formatApprovalStatus(raw);
    const badges: StepState['badges'] = [];
    if (rejected) badges.push({ label: 'Rejected', tone: 'danger' });
    if (pendingVerify) badges.push({ label: 'Pending Verify', tone: 'warning' });
    else if (current) badges.push({ label: 'Current', tone: 'pending' });
    else if (next) badges.push({ label: 'Next', tone: 'neutral' });
    const dateLabel = rejected ? 'Rejected Date:' : completed ? 'Approved Date:' : 'Date:';

    if (rejected) return { kind: 'rejected', label, tone: 'danger', icon: { ios: 'xmark', android: 'close' }, badges, dateLabel };
    if (completed) return { kind: 'approved', label, tone: pendingVerify ? 'warning' : 'success', icon: CHECK, badges, dateLabel };
    if (pendingVerify) return { kind: 'pendingVerify', label, tone: 'warning', icon: { ios: 'hourglass', android: 'hourglass_top' }, badges, dateLabel };
    if (current) return { kind: 'current', label, tone: 'pending', icon: { ios: 'clock.fill', android: 'schedule' }, badges, dateLabel };
    return { kind: next ? 'next' : 'pending', label, tone: 'neutral', icon: CIRCLE, badges, dateLabel };
}

/** Current step: the first in approving, else the first pending (web rule); -1 when none. */
export function currentStepIndex(steps: readonly ApprovalStep[]): number {
    const inApproving = steps.findIndex((step) => isInApprovingStatus(step.status));
    return inApproving >= 0 ? inApproving : steps.findIndex((step) => isPendingApprovalStatus(step.status));
}

/** Web: the date row shows only when SAP sent a date, as "<date> <time>" (raw values). */
export function formatPosted(step: ApprovalStep): string {
    return step.postedOn ? `${step.postedOn} ${step.postedTime}`.trim() : '';
}
