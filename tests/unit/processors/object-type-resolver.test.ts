import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectTypeResolver } from '../../../srv/lib/processors/object-type-resolver';

describe('ObjectTypeResolver', () => {
    let resolver: ObjectTypeResolver;
    let mockSapOdataAdapter: any;
    let mockTaskAdapter: any;

    beforeEach(() => {
        mockSapOdataAdapter = {
            getInstances: vi.fn(),
            getDetail: vi.fn()
        };
        mockTaskAdapter = {
            getTaskRuntime: vi.fn()
        };
        resolver = new ObjectTypeResolver(mockSapOdataAdapter, mockTaskAdapter);
    });

    it('should resolve PR task from worklist', async () => {
        mockSapOdataAdapter.getInstances.mockResolvedValue([
            { WorkflowTaskInternalID: 'task-1', DocCategory: 'BUS2105', DocumentNumber: '10000001', NormalTask: true }
        ]);
        mockTaskAdapter.getTaskRuntime.mockResolvedValue({
            InstanceID: 'task-1',
            TaskTitle: 'Approve PR 10000001',
            Status: 'READY',
            decisions: [{ DecisionKey: '0001' }]
        });
        mockSapOdataAdapter.getDetail.mockResolvedValue({
            objectType: 'PR',
            header: { purchaseRequisition: '10000001' }
        });

        const result = await resolver.resolve('task-1', 'MOCK_USER', 'jwt-token');

        expect(result.objectType).toBe('PR');
        expect(result.instid).toBe('10000001');
        expect(result.normalTask).toBe(true);
        expect(result.taskRuntime.TaskTitle).toBe('Approve PR 10000001');
        expect(result.businessObject.header.purchaseRequisition).toBe('10000001');
        expect(mockSapOdataAdapter.getDetail).toHaveBeenCalledWith('PR', '10000001', 'MOCK_USER', 'jwt-token', false, { approverNumber: '1' });
    });

    it('should resolve PO task from worklist', async () => {
        mockSapOdataAdapter.getInstances.mockResolvedValue([
            { WorkflowTaskInternalID: 'task-2', DocCategory: 'BUS2012', DocumentNumber: '45000002', NormalTask: true }
        ]);
        mockTaskAdapter.getTaskRuntime.mockResolvedValue({
            InstanceID: 'task-2',
            TaskTitle: 'Approve PO 45000002',
            Status: 'READY',
            TaskDefinitionID: 'BUS2012'
        });
        mockSapOdataAdapter.getDetail.mockResolvedValue({
            objectType: 'PO',
            header: { purchaseOrder: '45000002' }
        });

        const result = await resolver.resolve('task-2', 'MOCK_USER', 'jwt-token');

        expect(result.objectType).toBe('PO');
        expect(result.instid).toBe('45000002');
        expect(mockSapOdataAdapter.getDetail).toHaveBeenCalledWith('PO', '45000002', 'MOCK_USER', 'jwt-token', false, { approverNumber: '1' });
    });

    it('should populate Approve and Reject decisions for CLAIM when ActionButton is X', async () => {
        mockSapOdataAdapter.getInstances.mockResolvedValue([
            { WorkflowTaskInternalID: 'task-claim-1', DocCategory: 'CLAIM', DocumentNumber: '9000000001', ApproverNumber: '1', NormalTask: true }
        ]);
        mockSapOdataAdapter.getDetail.mockResolvedValue({
            DocCategory: 'CLAIM',
            DocumentNumber: '9000000001',
            ActionButton: 'X'
        });

        const result = await resolver.resolve('task-claim-1', 'MOCK_USER', 'jwt-token');

        expect(result.objectType).toBe('CLAIM');
        expect(result.taskRuntime.decisions).toEqual([
            { DecisionKey: '0001', DecisionText: 'Approve' },
            { DecisionKey: '0002', DecisionText: 'Reject' }
        ]);
    });

    it('should NOT populate decisions for CLAIM when ActionButton is not X', async () => {
        mockSapOdataAdapter.getInstances.mockResolvedValue([
            { WorkflowTaskInternalID: 'task-claim-2', DocCategory: 'CLAIM', DocumentNumber: '9000000001', ApproverNumber: '1', NormalTask: true }
        ]);
        mockSapOdataAdapter.getDetail.mockResolvedValue({
            DocCategory: 'CLAIM',
            DocumentNumber: '9000000001',
            ActionButton: ''
        });

        const result = await resolver.resolve('task-claim-2', 'MOCK_USER', 'jwt-token');

        expect(result.objectType).toBe('CLAIM');
        expect(result.taskRuntime.decisions).toEqual([]);
    });

    it('should resolve CLAIM task with WorkflowTaskInternalID 2201 and ApproverNumber 1', async () => {
        mockSapOdataAdapter.getInstances.mockResolvedValue([
            {
                WorkflowTaskInternalID: '2201',
                TechnicalWrkflwObjectType: 'CLAIM',
                TechnicalWrkflwObject: '0000000220',
                DocumentNumber: '0000000220',
                DocCategory: 'CLAIM',
                ApproverNumber: '1',
                NormalTask: true
            }
        ]);
        mockSapOdataAdapter.getDetail.mockResolvedValue({
            DocCategory: 'CLAIM',
            DocumentNumber: '0000000220',
            ApproverNumber: '1',
            ActionButton: 'X'
        });

        const result = await resolver.resolve('2201', 'MOCK_USER', 'jwt-token');

        expect(result.objectType).toBe('CLAIM');
        expect(result.instid).toBe('0000000220');
        expect(mockSapOdataAdapter.getDetail).toHaveBeenCalledWith(
            'CLAIM',
            '0000000220',
            'MOCK_USER',
            'jwt-token',
            false,
            { approverNumber: '1' }
        );
    });

    it('should fallback to full worklist and find CLAIM task 2221 with TechnicalWrkflwObject 0000000220', async () => {
        // First call with targetInstanceId returns empty array
        // Second call without filter returns the full list
        mockSapOdataAdapter.getInstances
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([
                {
                    WorkflowTaskInternalID: '2221',
                    TechnicalWrkflwObjectType: 'CLAIM',
                    TechnicalWrkflwObject: '0000000220',
                    DocumentNumber: '0000000220',
                    DocCategory: 'CLAIM',
                    ApproverNumber: '1',
                    NormalTask: true
                }
            ]);

        mockSapOdataAdapter.getDetail.mockResolvedValue({
            DocCategory: 'CLAIM',
            DocumentNumber: '0000000220',
            ApproverNumber: '1',
            ActionButton: 'X'
        });

        const result = await resolver.resolve('2221', 'MOCK_USER', 'jwt-token');

        expect(result.objectType).toBe('CLAIM');
        expect(result.instid).toBe('0000000220');
        expect(mockSapOdataAdapter.getDetail).toHaveBeenCalledWith(
            'CLAIM',
            '0000000220',
            'MOCK_USER',
            'jwt-token',
            false,
            { approverNumber: '1' }
        );
        expect(result.taskRuntime.decisions).toEqual([
            { DecisionKey: '0001', DecisionText: 'Approve' },
            { DecisionKey: '0002', DecisionText: 'Reject' }
        ]);
    });

    it('should NOT add decisions for CLAIM task when NormalTask is false (CC task)', async () => {
        mockSapOdataAdapter.getInstances.mockResolvedValue([
            {
                WorkflowTaskInternalID: '2211',
                TechnicalWrkflwObjectType: 'CLAIM',
                TechnicalWrkflwObject: '0000000221',
                DocumentNumber: '0000000221',
                DocCategory: 'CLAIM',
                ApproverNumber: '1',
                NormalTask: false
            }
        ]);

        mockSapOdataAdapter.getDetail.mockResolvedValue({
            DocCategory: 'CLAIM',
            DocumentNumber: '0000000221',
            ApproverNumber: '1',
            ActionButton: 'X'
        });

        const result = await resolver.resolve('2211', 'MOCK_USER', 'jwt-token');

        expect(result.normalTask).toBe(false);
        expect(result.taskRuntime.decisions).toEqual([]);
        expect(result.taskRuntime.SupportsForward).toBe(false);
    });
});

