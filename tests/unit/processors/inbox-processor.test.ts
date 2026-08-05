import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InboxProcessor } from '../../../srv/lib/processors/inbox-processor';

// Mock adapters
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

    it('should fetch tasks, query details in batch, enrich business objects and apply pagination', async () => {
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

      const mockBatchDetails = {
        'PR:10000001': {
          objectType: 'PR',
          documentType: 'DEFAULT',
          objectId: '10000001',
          header: { purchaseRequisition: '10000001', purchaseRequisitionTypeDisplay: 'Standard' }
        },
        'PO:45000002': {
          objectType: 'PO',
          documentType: 'DEFAULT',
          objectId: '45000002',
          header: { purchaseOrder: '45000002', supplierName: 'Supplier ABC', purchaseOrderTypeDisplay: 'Standard PO', purchaseOrderNetAmount: 2000 }
        }
      };
      mockSapOdataAdapter.getDetailBatch.mockResolvedValue(mockBatchDetails);

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
    it('should query completed tasks from ZC_WORKFLOWTASK via getInstances and fetch detail batch', async () => {
      const mockCompletedInstances = [
        { instanceID: '101', typeid: 'BUS2105', instid: '1000101', status: 'COMPLETED' },
        { instanceID: '102', typeid: 'BUS2012', instid: '4500102', status: 'COMPLETED' }
      ];
      mockSapOdataAdapter.getInstances.mockResolvedValue(mockCompletedInstances);
      mockSapOdataAdapter.getDetailBatch.mockResolvedValue({});

      const res = await processor.getApprovedTasks('MOCK_USER', 'jwt', { top: 2 });

      expect(mockSapOdataAdapter.getInstances).toHaveBeenCalledWith('MOCK_USER', 'COMPLETED', 'jwt', undefined, { top: 2 });
      expect(res.items.length).toBe(2);
      expect(res.items[0].instanceId).toBe('101');
      expect(res.items[0].status).toBe('COMPLETED');
    });
  });

  describe('getTaskDetail', () => {
    it('should fetch details, available decisions and map comments & attachments into flat structure', async () => {
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

      const mockDetail = {
        objectType: 'PR',
        documentType: 'ZASS',
        objectId: '10001234',
        header: {
          purchaseRequisition: '10001234',
          purchaseRequisitionText: 'IT Department Laptop Purchase',
          userFullName: 'Nguyen Van A',
          purReqCreationDate: '2026-06-25T08:00:00Z',
          totalNetAmount: 150000000,
          displayCurrency: 'VND'
        },
        items: [],
        comments: [
          { author: 'Nguyen Van A', text: 'Pls approve', postedOn: '2026-07-01', postedTime: '08:30:00' }
        ],
        attachments: [
          { id: 'att-1', fileName: 'Quote.pdf', mimeType: 'application/pdf', fileSize: 500000, createdBy: 'Nguyen Van A', createdAt: '2026-07-01T08:15:00' }
        ]
      };
      mockSapOdataAdapter.getDetail.mockResolvedValue(mockDetail);
      mockSapOdataAdapter.getInstances.mockResolvedValue([
        { instanceID: 'task-pr-01', doctyp: 'ZASS', total: 150000000, curr_vnd: 'VND' }
      ]);

      const result = await processor.getTaskDetail('task-pr-01', 'MOCK_USER', { documentId: '10001234', businessObjectType: 'PR' }, 'jwt');

      // Flat response assertions
      expect(result.task.instanceId).toBe('task-pr-01');
      expect((result as any)._meta).toBeUndefined();
      expect(result.header.purchaseRequisition).toBe('10001234');
      expect(result.comments.length).toBe(1);
      expect(result.comments[0].text).toBe('Pls approve');
      expect(result.comments[0].createdBy).toBe('Nguyen Van A');
      
      expect(result.attachments.length).toBe(1);
      expect(result.attachments[0].fileName).toBe('Quote.pdf');
      expect(result.attachments[0].link).toBe('/api/cnma/APPROVAL_SRV/tasks/task-pr-01/attachments/att-1/content/Quote.pdf?documentId=10001234');

      // Verify legacy 'object' and redundant fields are absent
      expect((result as any).object).toBeUndefined();
      expect(result.decisions.length).toBe(2);
      expect((result as any).businessContext).toBeUndefined();
      expect((result as any).processingLogs).toBeUndefined();
    });

    it('should skip decision fetching and return empty decisions if normalTask is false', async () => {
      const mockTaskRuntime = {
        InstanceID: 'task-pr-01',
        Status: 'READY',
        TaskDefinitionID: 'BUS2105',
        TaskTitle: 'Approve PR 10001234',
        CreatedOn: '2026-07-01T08:00:00Z',
        CreatedByName: 'Nguyen Van A',
        Priority: 'MEDIUM',
        decisions: []
      };
      mockTaskAdapter.getTaskRuntime.mockResolvedValue(mockTaskRuntime);

      const mockDetail = {
        objectType: 'PR',
        documentType: 'ZASS',
        objectId: '10001234',
        header: {
          purchaseRequisition: '10001234',
          userFullName: 'Nguyen Van A',
          purReqCreationDate: '2026-06-25T08:00:00Z',
          totalNetAmount: 150000000,
          displayCurrency: 'VND'
        },
        items: [],
        comments: [],
        attachments: []
      };
      mockSapOdataAdapter.getDetail.mockResolvedValue(mockDetail);
      mockSapOdataAdapter.getInstances.mockResolvedValue([
        { instanceID: 'task-pr-01', doctyp: 'ZASS', total: 150000000, curr_vnd: 'VND', normalTask: false, typeid: 'BUS2105' }
      ]);

      const result = await processor.getTaskDetail('task-pr-01', 'MOCK_USER', { documentId: '10001234', businessObjectType: 'PR' }, 'jwt');

      expect(result.task.instanceId).toBe('task-pr-01');
      expect(result.task.normalTask).toBe(false);
      expect(result.decisions).toEqual([]);
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

      expect(mockSapOdataAdapter.addComment).toHaveBeenCalledWith('10001234', 'Looks good', 'MOCK_USER', 'jwt', 'APPR', 'A');
      expect(mockTaskAdapter.executeDecision).toHaveBeenCalledWith('task-pr-01', '0001', 'Looks good', 'MOCK_USER', 'jwt');
    });
  });
});
