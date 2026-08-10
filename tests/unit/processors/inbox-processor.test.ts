import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InboxProcessor } from '../../../srv/lib/processors/inbox-processor';

vi.mock('../../../srv/lib/integrations/taskprocessing-adapter', () => {
  return {
    TaskprocessingAdapter: class {
      getTasks = vi.fn();
      getTaskRuntime = vi.fn();
      executeDecision = vi.fn();
    }
  };
});

vi.mock('../../../srv/lib/integrations/sap-odata-adapter', () => {
  return {
    SapOdataAdapter: class {
      getInstances = vi.fn();
      getDetailBatch = vi.fn();
      getDetail = vi.fn();
      addComment = vi.fn();
      uploadAttachment = vi.fn();
      fetchAttachmentContent = vi.fn();
    }
  };
});

describe('InboxProcessor', () => {
  let processor: InboxProcessor;
  let mockTaskAdapter: any;
  let mockSapOdataAdapter: any;

  beforeEach(() => {
    vi.clearAllMocks();
    processor = new InboxProcessor();
    mockTaskAdapter = (processor as any).taskAdapter;
    mockSapOdataAdapter = (processor as any).sapOdataAdapter;
  });

  describe('getTasks', () => {
    it('should return empty list and zero total if no custom instances are found', async () => {
      mockSapOdataAdapter.getInstances.mockResolvedValue([]);
      
      const result = await processor.getTasks('MOCK_USER');
      expect(result).toEqual({ items: [], total: 0 });
      expect(mockSapOdataAdapter.getInstances).toHaveBeenCalledWith('MOCK_USER', ['IN PROCESSING', 'IN_PROCESSING'], undefined, undefined, undefined);
    });

    it('should fetch tasks, apply pagination and format cards', async () => {
      const mockInstances = [
        {
          instanceID: '000000000001',
          typeid: 'BUS2105',
          instid: '10000001',
          status: 'IN PROCESSING',
          total: 1000,
          curr_vnd: 'VND',
          taskCreationDateTime: '2026-04-05T08:13:18.43246Z',
          createdByUser: 'DIENTRAN'
        },
        { instanceID: '000000000002', typeid: 'BUS2012', instid: '45000002', status: 'IN PROCESSING', total: 2000, curr_vnd: 'VND' },
        { instanceID: '000000000003', typeid: 'BUS2105', instid: '10000003', status: 'IN PROCESSING', total: 3000, curr_vnd: 'VND' }
      ];
      mockSapOdataAdapter.getInstances.mockResolvedValue(mockInstances);

      const result = await processor.getTasks('MOCK_USER', 'my-jwt-token', { top: 2, skip: 0 });

      expect(result.total).toBe(3);
      expect(result.items.length).toBe(2);

      expect(result.items[0].instanceId).toBe('000000000001');
      expect(result.items[0].objectType).toBe('PR');
      expect(result.items[0].priority).toBe('MEDIUM');
      expect(result.items[0].createdOn).toBe(new Date('2026-04-05T08:13:18.43246Z').toISOString());
      expect(result.items[0].requestorName).toBe('DIENTRAN');
      expect(result.items[0].total).toBe(1000);
      
      expect(result.items[1].instanceId).toBe('000000000002');
      expect(result.items[1].objectType).toBe('PO');
      expect(result.items[1].priority).toBe('MEDIUM');
      expect(result.items[1].total).toBe(2000);
    });
  });

  describe('getApprovedTasks', () => {
    it('should query completed tasks from ZC_WORKFLOWTASK via getInstances', async () => {
      const mockCompletedInstances = [
        { instanceID: '101', typeid: 'BUS2105', instid: '1000101', status: 'COMPLETED' },
        { instanceID: '102', typeid: 'BUS2012', instid: '4500102', status: 'COMPLETED' }
      ];
      mockSapOdataAdapter.getInstances.mockResolvedValue(mockCompletedInstances);

      const res = await processor.getApprovedTasks('MOCK_USER', 'jwt', { top: 2 });

      expect(mockSapOdataAdapter.getInstances).toHaveBeenCalledWith('MOCK_USER', 'COMPLETED', 'jwt', undefined, { top: 2 });
      expect(res.items.length).toBe(2);
      expect(res.items[0].instanceId).toBe('101');
      expect(res.items[0].status).toBe('COMPLETED');
    });
  });

  describe('getTaskDetail', () => {
    it('should fetch raw details and raw taskprocessing', async () => {
      const mockTaskRuntime = {
        InstanceID: 'task-pr-01',
        Status: 'READY',
        TaskDefinitionID: 'BUS2105',
        TaskTitle: 'Approve PR 10001234',
        CreatedOn: '2026-07-01T08:00:00Z',
        CreatedByName: 'Nguyen Van A',
        Priority: 'MEDIUM',
        decisions: [
          { DecisionKey: '0001', DecisionText: 'Approve' },
          { DecisionKey: '0002', DecisionText: 'Reject' }
        ]
      };
      mockTaskAdapter.getTaskRuntime.mockResolvedValue(mockTaskRuntime);

      const mockRawEntity = {
        DocCategory: 'BUS2105',
        DocumentNumber: '10001234',
        DocumentType: 'ZASS',
        CompanyCode: '1000',
        CompanyCodeName: 'CNMA',
        _Item: [],
        _Comment: [],
        _Attachment: []
      };
      mockSapOdataAdapter.getDetail.mockResolvedValue(mockRawEntity);
      mockSapOdataAdapter.getInstances.mockResolvedValue([
        { instanceID: 'task-pr-01', doctyp: 'ZASS', total: 150000000, curr_vnd: 'VND' }
      ]);

      const result = await processor.getTaskDetail('task-pr-01', 'MOCK_USER', { documentId: '10001234', businessObjectType: 'PR' }, 'jwt');

      expect(result.businessObject).toEqual(mockRawEntity);
      expect(result.taskprocessing.task?.InstanceID).toBe('task-pr-01');
      expect(result.taskprocessing.decisionOptions.length).toBe(2);
      expect(result.taskprocessing.decisionOptions[0].DecisionKey).toBe('0001');
    });
  });

  describe('executeDecision', () => {
    it('should push comment to custom comment table if PR and comment exists', async () => {
      mockTaskAdapter.executeDecision.mockResolvedValue({ success: true });
      
      await processor.executeDecision(
        'task-pr-01',
        '0001',
        '0001',
        'Looks good',
        'MOCK_USER',
        'jwt',
        { documentId: '10001234', businessObjectType: 'PR' }
      );

      expect(mockSapOdataAdapter.addComment).toHaveBeenCalledWith('10001234', 'Looks good', 'MOCK_USER', 'jwt', 'APPR', 'A', 'PR');
      expect(mockTaskAdapter.executeDecision).toHaveBeenCalledWith('task-pr-01', '0001', 'Looks good', 'MOCK_USER', 'jwt');
    });
  });
});
