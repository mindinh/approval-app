import { describe, it, expect } from 'vitest';
import { normalizeDetailForView } from '@/pages/Inbox/utils/normalizeTaskDetail';

describe('normalizeDetailForView', () => {
    it('returns null for empty detail', () => {
        expect(normalizeDetailForView(null)).toBeNull();
        expect(normalizeDetailForView(undefined)).toBeNull();
    });

    it('populates decisions and supports forward for normal tasks', () => {
        const detail = {
            instanceId: 'inst-1',
            objectType: 'PR',
            documentId: '10001234',
            normalTask: true,
            taskprocessing: {
                task: {
                    InstanceID: 'inst-1',
                    Status: 'READY',
                    SupportsForward: true
                },
                decisionOptions: [
                    { DecisionKey: '0001', DecisionText: 'Approve', Nature: 'POSITIVE' },
                    { DecisionKey: '0002', DecisionText: 'Reject', Nature: 'NEGATIVE' }
                ]
            }
        };

        const result = normalizeDetailForView(detail);
        expect(result).not.toBeNull();
        expect(result!.normalTask).toBe(true);
        expect(result!.supports.forward).toBe(true);
        expect(result!.decisions).toHaveLength(2);
        expect(result!.decisions[0].text).toBe('Approve');
    });

    it('clears decisions and disables forward when normalTask is false (CC task)', () => {
        const ccDetail = {
            instanceId: 'inst-cc-1',
            objectType: 'CLAIM',
            documentId: '0000000221',
            normalTask: false,
            taskprocessing: {
                task: {
                    InstanceID: 'inst-cc-1',
                    Status: 'READY',
                    SupportsForward: true
                },
                decisionOptions: [
                    { DecisionKey: '0001', DecisionText: 'Approve' },
                    { DecisionKey: '0002', DecisionText: 'Reject' }
                ]
            }
        };

        const result = normalizeDetailForView(ccDetail);
        expect(result).not.toBeNull();
        expect(result!.normalTask).toBe(false);
        expect(result!.supports.forward).toBe(false);
        expect(result!.decisions).toEqual([]);
        expect(result!.title).toContain('Review');
    });
});
