import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InboxProcessor } from '../../../srv/lib/processors/inbox-processor';
import { TaskprocessingAdapter } from '../../../srv/lib/integrations/taskprocessing-adapter';
import { SapOdataAdapter } from '../../../srv/lib/integrations/sap-odata-adapter';

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
      expect(mockSapOdataAdapter.getInstances).toHaveBeenCalledWith('MOCK_USER', ['IN PROCESSING', 'IN_PROCESSING'], undefined);
    });

    it('should fetch tasks, query details in batch, enrich business objects and apply pagination', async () => {
      // Mock 3 custom instances
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

      // Mock raw tasks from TaskCollection
      const mockRawTasks = [
        { InstanceID: '000000000001', TaskTitle: 'Approve PR 1', Priority: '1' },
        { InstanceID: '000000000002', TaskTitle: 'Approve PO 2', Priority: '2', CreatedOn: '2026-07-02T00:00:00Z', CreatedByName: 'User B' }
      ];
      mockTaskAdapter.getTasks.mockResolvedValue(mockRawTasks);

      // Mock batch details (only for paginated items, let's say page size = 2)
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
          header: { purchaseOrder: '45000002', supplierName: 'Supplier ABC', purchaseOrderTypeDisplay: 'Standard PO' }
        }
      };
      mockSapOdataAdapter.getDetailBatch.mockResolvedValue(mockBatchDetails);

      // Request page 1 with top = 2
      const result = await processor.getTasks('MOCK_USER', 'my-jwt-token', { top: 2, skip: 0 });

      expect(result.total).toBe(3);
      expect(result.items.length).toBe(2);

      // Verify pagination sliced the list correctly
      expect(result.items[0].instanceId).toBe('000000000001');
      expect(result.items[0].objectType).toBe('PR');
      expect(result.items[0].priority).toBe('VERY_HIGH'); // mapped from '1'
      expect(result.items[0].createdOn).toBe(new Date('2026-04-05T08:13:18.43246Z').toISOString()); // fallback to taskCreationDateTime
      expect(result.items[0].requestorName).toBe('DIENTRAN'); // fallback to inst.createdByUser
      expect(result.items[0].businessContext.pr.header.totalNetAmount).toBe(1000); // enriched from custom instances
      
      expect(result.items[1].instanceId).toBe('000000000002');
      expect(result.items[1].objectType).toBe('PO');
      expect(result.items[1].priority).toBe('HIGH'); // mapped from '2'
      expect(result.items[1].businessContext.po.header.purchaseOrderNetAmount).toBe(2000); // enriched

      expect(mockSapOdataAdapter.getDetailBatch).toHaveBeenCalledWith(
        [
          { objectType: 'PR', objectId: '10000001' },
          { objectType: 'PO', objectId: '45000002' }
        ],
        'MOCK_USER',
        'my-jwt-token'
      );
    });
  });

  describe('getApprovedTasks', () => {
    it('should build specific ID filters to query completed tasks', async () => {
      const mockCompletedInstances = [
        { instanceID: '101', typeid: 'BUS2105', instid: '1000101', status: 'COMPLETED' },
        { instanceID: '102', typeid: 'BUS2012', instid: '4500102', status: 'COMPLETED' }
      ];
      mockSapOdataAdapter.getInstances.mockResolvedValue(mockCompletedInstances);
      mockTaskAdapter.getTasks.mockResolvedValue([]);
      mockSapOdataAdapter.getDetailBatch.mockResolvedValue({});

      await processor.getApprovedTasks('MOCK_USER', 'jwt', { top: 2 });

      // Verify completing task filter string
      expect(mockTaskAdapter.getTasks).toHaveBeenCalledWith(
        'MOCK_USER',
        'jwt',
        "InstanceID eq '000000000101' or InstanceID eq '000000000102'"
      );
    });
  });

  describe('getTaskDetail', () => {
    it('should fetch details, available decisions and map comments & attachments', async () => {
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

      const result = await processor.getTaskDetail('task-pr-01', 'MOCK_USER', { documentId: '10001234' }, 'jwt');

      // Assertions
      expect(result.task.instanceId).toBe('task-pr-01');
      expect(result.task.businessContext.pr.header.purchaseRequisitionType).toBe('ZASS');
      expect(result.comments.length).toBe(1);
      expect(result.comments[0].text).toBe('Pls approve');
      expect(result.comments[0].createdBy).toBe('Nguyen Van A');
      
      expect(result.attachments.length).toBe(1);
      expect(result.attachments[0].fileName).toBe('Quote.pdf');
      expect(result.attachments[0].link).toContain('tasks/task-pr-01/attachments/att-1/content?documentId=10001234');

      // Decisions mapped from config
      expect(result.decisions.length).toBe(2);
      expect(result.decisions[0].key).toBe('0001');
      expect(result.decisions[0].nature).toBe('POSITIVE'); // variant primary -> POSITIVE
      expect(result.decisions[1].key).toBe('0002');
      expect(result.decisions[1].nature).toBe('NEGATIVE'); // variant danger -> NEGATIVE
      expect(result.decisions[1].requiresComment).toBe(true);
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

      const result = await processor.getTaskDetail('task-pr-01', 'MOCK_USER', { documentId: '10001234' }, 'jwt');

      expect(result.task.instanceId).toBe('task-pr-01');
      expect(result.task.normalTask).toBe(false);
      expect(mockTaskAdapter.getTaskRuntime).toHaveBeenCalledWith('task-pr-01', 'MOCK_USER', 'jwt', false);
      expect(result.decisions.length).toBe(0);
    });

    it('should completely skip getTaskRuntime call for non-normal tasks in real mode', async () => {
      const originalEnv = process.env.USE_MOCK_SAP;
      process.env.USE_MOCK_SAP = 'false';
      try {
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

        const result = await processor.getTaskDetail('task-pr-01', 'MOCK_USER', { documentId: '10001234' }, 'jwt');

        expect(result.task.instanceId).toBe('task-pr-01');
        expect(result.task.normalTask).toBe(false);
        expect(mockTaskAdapter.getTaskRuntime).not.toHaveBeenCalled();
        expect(result.decisions.length).toBe(0);
      } finally {
        process.env.USE_MOCK_SAP = originalEnv;
      }
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

      // Verified it pushes approval comment to adapter
      expect(mockSapOdataAdapter.addComment).toHaveBeenCalledWith('10001234', 'Looks good', 'MOCK_USER', 'jwt', 'APPR');
      expect(mockTaskAdapter.executeDecision).toHaveBeenCalledWith('task-pr-01', '0001', 'Looks good', 'MOCK_USER', 'jwt');
    });

    it('should not push comment to custom comment table if PO', async () => {
      mockTaskAdapter.executeDecision.mockResolvedValue({ success: true });
      
      await processor.executeDecision(
        'task-po-01',
        '0001',
        '0001',
        'Looks good',
        'MOCK_USER',
        'jwt',
        { documentId: '45000002', businessObjectType: 'PO' }
      );

      expect(mockSapOdataAdapter.addComment).not.toHaveBeenCalled();
      expect(mockTaskAdapter.executeDecision).toHaveBeenCalledWith('task-po-01', '0001', 'Looks good', 'MOCK_USER', 'jwt');
    });
  });
});
