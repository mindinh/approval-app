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

    it('normalizes reference PR detail with navigations', () => {
        const refPrDetail = {
            instanceId: '1000000284',
            taskId: '1000000284',
            normalTask: false,
            objectType: 'PR',
            documentId: '1000000284',
            supports: { forward: false, comments: false },
            businessObject: {
                DocCategory: 'BUS2105',
                DocumentNumber: '001000000284',
                DocumentType: 'NB',
                _Item: [{ ItemNumber: '00010', Material: 'M-100' }],
                _ApprovalStep: [{ ObjectKey: '001000000284', ApprovalLevel: 1, ApproverName: 'Approver 1', ApprovalStatus: 'A' }],
                _Attachment: [{ DocId: 'att-1', FileName: 'spec.pdf' }],
                _Comment: [{ DocId: 'comm-1', NoteText: 'Approved reference note' }]
            },
            taskprocessing: {
                task: null,
                decisionOptions: []
            }
        };

        const result = normalizeDetailForView(refPrDetail);
        expect(result).not.toBeNull();
        expect(result!.documentId).toBe('001000000284');
        expect(result!.docCategory).toBe('BUS2105');
        expect(result!.workflowData.steps).toHaveLength(1);
        expect(result!.workflowData.steps[0].approver).toBe('Approver 1');
        expect(result!.attachments).toHaveLength(1);
        expect(result!.attachments[0].fileName).toBe('spec.pdf');
        expect(result!.comments).toHaveLength(1);
        expect(result!.comments[0].text).toBe('Approved reference note');
        expect(result!.decisions).toEqual([]);
    });
});

