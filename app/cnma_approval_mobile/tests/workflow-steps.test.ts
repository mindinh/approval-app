import { copiedMessage } from '@/utils/copy';
import { formatPrNumber } from '@/utils/task-detail';
import type { ApprovalStep } from '@/utils/task-detail';
import { currentStepIndex, formatPosted, stepState } from '@/utils/workflow-steps';

const step = (level: number, status: string, extra: Partial<ApprovalStep> = {}): ApprovalStep => ({
    key: String(level),
    level,
    releaseCode: '',
    releaseText: '',
    approver: `Approver ${level}`,
    status,
    note: '',
    postedOn: '',
    postedTime: '',
    ...extra,
});

describe('workflow steps (web WorkflowApprovalPanel rules)', () => {
    it('marks approved, current and next like the web', () => {
        const steps = [step(1, 'APPROVED'), step(2, 'PENDING'), step(3, 'PENDING')];
        const current = currentStepIndex(steps);
        expect(current).toBe(1);
        const [first, second, third] = steps.map((item, index) => stepState(item, index, current, steps.length));
        expect(first).toMatchObject({ kind: 'approved', label: 'Approved', dateLabel: 'Approved Date:', badges: [] });
        expect(second).toMatchObject({ kind: 'current', label: 'In Approving', dateLabel: 'Date:', badges: [{ label: 'Current' }] });
        expect(third).toMatchObject({ kind: 'next', badges: [{ label: 'Next' }] });
    });

    it('treats Cancelled as rejected with its own status text', () => {
        const steps = [step(1, 'REJECTED'), step(2, 'CANCELLED')];
        const state = stepState(steps[1], 1, currentStepIndex(steps), steps.length);
        expect(state).toMatchObject({ kind: 'rejected', label: 'Cancelled', dateLabel: 'Rejected Date:', badges: [{ label: 'Rejected' }] });
    });

    it('shows a date only when SAP sent one (no lone "00:00:00")', () => {
        expect(formatPosted(step(1, 'PENDING', { postedTime: '00:00:00' }))).toBe('');
        expect(formatPosted(step(1, 'APPROVED', { postedOn: '2026-11-16', postedTime: '16:00:03' }))).toBe('2026-11-16 16:00:03');
    });
});

describe('reference PR and copy helpers', () => {
    it('formats a PR number without leading zeros, like the web', () => {
        expect(formatPrNumber('0010000123')).toBe('10000123');
        expect(formatPrNumber('0')).toBe('0');
    });

    it('says exactly what was copied', () => {
        expect(copiedMessage('4400000028', 'document number')).toBe('Copied document number: 4400000028');
        expect(copiedMessage('a\n  b')).toBe('Copied “a b”');
        expect(copiedMessage('x'.repeat(80)).length).toBeLessThan(60);
    });
});
