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

    it('should use parallel fetch when hints (documentId/instid and businessObjectType) are present', async () => {
        mockSapOdataAdapter.getInstances.mockResolvedValue([
            { instanceID: 'task-1', typeid: 'BUS2105', instid: '10000001', normalTask: true }
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

        const result = await resolver.resolve(
            'task-1',
            'MOCK_USER',
            { documentId: '10000001', businessObjectType: 'PR' },
            'jwt-token'
        );

        expect(result.objectType).toBe('PR');
        expect(result.instid).toBe('10000001');
        expect(result.normalTask).toBe(true);
        expect(result.taskRuntime.TaskTitle).toBe('Approve PR 10000001');
        expect(result.businessObject.header.purchaseRequisition).toBe('10000001');
        expect(mockSapOdataAdapter.getDetail).toHaveBeenCalledWith('PR', '10000001', 'MOCK_USER', 'jwt-token');
    });

    it('should fallback to sequential fetch when hints are missing', async () => {
        mockSapOdataAdapter.getInstances.mockResolvedValue([
            { instanceID: 'task-2', typeid: 'BUS2012', instid: '45000002', normalTask: true }
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

        const result = await resolver.resolve('task-2', 'MOCK_USER', undefined, 'jwt-token');

        expect(result.objectType).toBe('PO');
        expect(result.instid).toBe('45000002');
        expect(mockSapOdataAdapter.getDetail).toHaveBeenCalledWith('PO', '45000002', 'MOCK_USER', 'jwt-token');
    });
});
