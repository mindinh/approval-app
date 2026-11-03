import { describe, it, expect } from 'vitest';
import { normalizeInstanceId, resolveDetailInstanceId } from '@/pages/Inbox/utils/instanceId';
import { normalizeDetailForView } from '@/pages/Inbox/utils/normalizeTaskDetail';

/** CC / review tasks: SAP TASKPROCESSING returns an all-zero InstanceID; the BFF envelope carries the real id. */
const ccTaskDetail = {
    instanceId: '35020',
    taskId: '35020',
    normalTask: false,
    taskprocessing: { task: { InstanceID: '000000000000' }, decisionOptions: [] },
    businessObject: { DocCategory: 'BUS2105', DocumentNumber: '1300000402' },
};

describe('normalizeInstanceId', () => {
    it('strips leading zeros', () => {
        expect(normalizeInstanceId('000000035020')).toBe('35020');
        expect(normalizeInstanceId('000000000000')).toBe('');
        expect(normalizeInstanceId(undefined)).toBe('');
    });
});

describe('resolveDetailInstanceId', () => {
    it('skips an all-zero SAP InstanceID and falls back to the envelope id', () => {
        expect(resolveDetailInstanceId(ccTaskDetail)).toBe('35020');
    });

    it('keeps the SAP InstanceID when it is a real id', () => {
        expect(resolveDetailInstanceId({ instanceId: '35020', taskprocessing: { task: { InstanceID: '000000035020' } } })).toBe('000000035020');
    });

    it('falls back to the legacy task.instanceId and returns undefined when nothing is usable', () => {
        expect(resolveDetailInstanceId({ task: { instanceId: '42' } })).toBe('42');
        expect(resolveDetailInstanceId({ taskprocessing: { task: { InstanceID: '0000' } } })).toBeUndefined();
        expect(resolveDetailInstanceId(undefined)).toBeUndefined();
    });
});

describe('normalizeDetailForView for CC tasks', () => {
    it('exposes the real instance id, not the all-zero SAP id', () => {
        expect(normalizeDetailForView(ccTaskDetail)?.instanceId).toBe('35020');
    });
});
