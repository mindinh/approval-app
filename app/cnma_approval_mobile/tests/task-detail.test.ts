import type { TaskDetailResponse } from '@/lib/api/bff-api';
import { toTaskDetailView } from '@/utils/task-detail';
import { PR_HEADER, PR_ITEMS, RESERVATION_RECORD } from '../../cnma_approval_ui/tests/renderers/golden/fixtures';

function response(businessObject: Record<string, unknown>, task: Record<string, unknown> = {}, decisionOptions: unknown[] = []): TaskDetailResponse {
    return { businessObject, taskprocessing: { task: { InstanceID: 'INST-1', Status: 'READY', ...task }, decisionOptions } } as unknown as TaskDetailResponse;
}

const DECISIONS = [
    { DecisionKey: '0001', DecisionText: 'Approve' },
    { DecisionKey: '0002', DecisionText: 'Reject' },
];

describe('toTaskDetailView', () => {
    it('builds the header, tabs and write context of a purchase requisition', () => {
        const view = toTaskDetailView(response({ ...PR_HEADER, _Item: PR_ITEMS, ApproverNumber: '07' }, { SAPOrigin: 'S4H' }, DECISIONS));
        expect(view.documentId).toBe('0010001234');
        expect(view.typeLabel).toBe('Asset Purchase Requisition');
        expect(view.tabs.map((tab) => tab.key)).toEqual(['overview', 'details', 'workflow', 'attachments', 'comments']);
        expect(view.context).toEqual({ sapOrigin: 'S4H', documentId: '0010001234', businessObjectType: 'BUS2105', approverNumber: '07' });
    });

    it('orders decisions Reject before Approve and requires a reason to reject', () => {
        const view = toTaskDetailView(response({ ...PR_HEADER }, {}, DECISIONS));
        expect(view.decisions.map((decision) => decision.nature)).toEqual(['NEGATIVE', 'POSITIVE']);
        expect(view.decisions[0].commentRequired).toBe(true);
        expect(view.decisions[1].commentRequired).toBe(false);
    });

    it('offers no decisions on completed or CC tasks', () => {
        expect(toTaskDetailView(response({ ...PR_HEADER }, { Status: 'COMPLETED' }, DECISIONS)).decisions).toEqual([]);
        const cc = toTaskDetailView({ ...response({ ...PR_HEADER }, {}, DECISIONS), normalTask: false } as unknown as TaskDetailResponse);
        expect(cc.isCc).toBe(true);
        expect(cc.decisions).toEqual([]);
    });

    it('defaults the SAP origin and survives a sparse record', () => {
        const view = toTaskDetailView(response({ ...RESERVATION_RECORD }));
        expect(view.context.sapOrigin).toBe('LOCAL');
        expect(view.decisions).toEqual([]);
        expect(view.comments).toEqual([]);
    });

    it('joins the SAP file name with its separate FileExtension and derives the type', () => {
        const view = toTaskDetailView(response({ ...PR_HEADER, _Attachment: [{ DocId: 'A1', FileName: 'PR_01_Quote', FileExtension: 'PDF', Length: 1024 }, { DocId: 'A2', FileName: 'photo.jpg', FileExtension: 'jpg' }, { DocId: 'A3', FileName: 'notes' }] }));
        expect(view.attachments.map((item) => [item.fileName, item.mimeType])).toEqual([
            ['PR_01_Quote.pdf', 'application/pdf'],
            ['photo.jpg', 'image/jpeg'],
            ['notes', 'application/octet-stream'],
        ]);
    });
});
