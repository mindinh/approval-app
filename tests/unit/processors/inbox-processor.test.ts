import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InboxProcessor } from '../../../srv/lib/processors/inbox-processor';

vi.mock('../../../srv/lib/integrations/taskprocessing-adapter', () => {
  return {
    TaskprocessingAdapter: class {
      getTasks = vi.fn();
      getTaskRuntime = vi.fn();
      executeDecision = vi.fn();
      forwardTask = vi.fn();
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
      fetchAttachmentContent = vi.fn();
      forwardOnHeader = vi.fn();
      approveOnHeader = vi.fn();
      rejectOnHeader = vi.fn();

    }
  };
});

vi.mock('../../../srv/lib/integrations/sap-client', () => {
  return {
    SapClient: class {
      get = vi.fn().mockResolvedValue({ value: [{ NormalTask: true }] });
      post = vi.fn();
    }
  };
});

describe('InboxProcessor', () => {
  let processor: InboxProcessor;
  let mockTaskAdapter: any;
  let mockSapOdataAdapter: any;
  let mockSapClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    processor = new InboxProcessor();
    mockTaskAdapter = (processor as any).taskAdapter;
    mockSapOdataAdapter = (processor as any).sapOdataAdapter;
    mockSapClient = (processor as any).sapClient;
    if (mockSapClient && mockSapClient.get) {
      mockSapClient.get.mockResolvedValue({ value: [{ NormalTask: true }] });
    }
  });

  describe('getTasks', () => {
    it('should return empty list and zero total if no custom instances are found', async () => {
      mockSapOdataAdapter.getInstances.mockResolvedValue([]);
      
      const result = await processor.getTasks('MOCK_USER');
      expect(result).toEqual({ items: [], total: 0 });
      expect(mockSapOdataAdapter.getInstances).toHaveBeenCalledWith(
        'MOCK_USER',
        expect.arrayContaining(['IN PROCESSING', 'IN_PROCESSING', 'Pending approval', 'Partially approved']),
        undefined,
        undefined,
        undefined
      );
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

      expect(mockSapOdataAdapter.getInstances).toHaveBeenCalledWith(
        'MOCK_USER',
        expect.arrayContaining(['COMPLETED', 'Approved', 'Rejected', 'Cancelled']),
        'jwt',
        undefined,
        { top: 2 }
      );
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
        { WorkflowTaskInternalID: 'task-pr-01', DocCategory: 'BUS2105', DocumentNumber: '10001234', NormalTask: true, doctyp: 'ZASS', total: 150000000, curr_vnd: 'VND' }
      ]);

      const result = await processor.getTaskDetail('task-pr-01', 'MOCK_USER', 'jwt');

      expect(result.instanceId).toBe('task-pr-01');
      expect(result.normalTask).toBe(true);
      expect(result.supports).toEqual({ forward: true, comments: true });
      expect(result.businessObject).toEqual(mockRawEntity);
      expect(result.taskprocessing.task?.InstanceID).toBe('task-pr-01');
      expect(result.taskprocessing.decisionOptions.length).toBe(2);
      expect(result.taskprocessing.decisionOptions[0].DecisionKey).toBe('0001');
    });

    it('should return normalTask=false and supports.forward=false for CC tasks', async () => {
      (processor as any).objectTypeResolver = {
        resolve: vi.fn().mockResolvedValue({
          objectType: 'PO',
          instid: '4300000235',
          businessObject: { DocCategory: 'PO' },
          taskRuntime: null,
          inst: { normalTask: false },
          normalTask: false
        })
      };

      const result = await processor.getTaskDetail('task-cc-01', 'MOCK_USER');

      expect(result.instanceId).toBe('task-cc-01');
      expect(result.normalTask).toBe(false);
      expect(result.supports.forward).toBe(false);
      expect(result.supports.comments).toBe(true);
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

      expect(mockSapOdataAdapter.addComment).toHaveBeenCalledWith('10001234', 'Looks good', 'MOCK_USER', { userJwt: 'jwt', decision: 'A', objectType: 'PR', taskId: 'task-pr-01' });
      expect(mockTaskAdapter.executeDecision).toHaveBeenCalledWith('task-pr-01', '0001', 'Looks good', 'MOCK_USER', 'jwt');
    });

    describe('Claim approve/reject dual-API flow', () => {
      it('should call approveOnHeader + addComment in parallel for Claim approve', async () => {
        mockSapOdataAdapter.approveOnHeader.mockResolvedValue(undefined);
        mockSapOdataAdapter.addComment.mockResolvedValue(undefined);

        const result = await processor.executeDecision(
          '212',
          '0001',
          '0001',
          'approve claim 212 26.08',
          'MOCK_USER',
          'jwt',
          { documentId: '212', businessObjectType: 'CLAIM' }
        );

        expect(mockSapOdataAdapter.approveOnHeader).toHaveBeenCalledWith(
          'CLAIM',
          '212',
          { decision: 'A', comment: 'approve claim 212 26.08', approverNumber: '1' },
          'MOCK_USER',
          'jwt'
        );
        // The /comment endpoint body should have empty NOTETEXT (zcomment carries the text)
        expect(mockSapOdataAdapter.addComment).toHaveBeenCalledWith(
          '212',
          '',
          'MOCK_USER',
          { userJwt: 'jwt', decision: 'A', objectType: 'CLAIM', taskId: '212', approverNumber: '1' }
        );
        expect(mockTaskAdapter.executeDecision).not.toHaveBeenCalled();
        expect(result.status).toBe('SUCCESS');
      });

      it('should pass "R" decision code for reject on Claim', async () => {
        mockSapOdataAdapter.rejectOnHeader.mockResolvedValue(undefined);
        mockSapOdataAdapter.addComment.mockResolvedValue(undefined);

        await processor.executeDecision(
          '212',
          '0002',
          '0002',
          'reject claim 212',
          'MOCK_USER',
          'jwt',
          { documentId: '212', businessObjectType: 'CLAIM' }
        );

        expect(mockSapOdataAdapter.rejectOnHeader).toHaveBeenCalledWith(
          'CLAIM',
          '212',
          { decision: 'R', comment: 'reject claim 212', approverNumber: '1' },
          'MOCK_USER',
          'jwt'
        );
        // Critical: approveOnHeader MUST NOT be called when the user is rejecting.
        expect(mockSapOdataAdapter.approveOnHeader).not.toHaveBeenCalled();
        expect(mockSapOdataAdapter.addComment).toHaveBeenCalledWith(
          '212',
          '',
          'MOCK_USER',
          expect.objectContaining({ decision: 'R', objectType: 'CLAIM', approverNumber: '1' })
        );
      });

      it('should fall back to "Approved by <user>" zcomment when no comment provided (Approve)', async () => {
        mockSapOdataAdapter.approveOnHeader.mockResolvedValue(undefined);
        mockSapOdataAdapter.addComment.mockResolvedValue(undefined);

        await processor.executeDecision(
          '212',
          '0001',
          '0001',
          '',
          'MOCK_USER',
          'jwt',
          { documentId: '212', businessObjectType: 'CLAIM' }
        );

        expect(mockSapOdataAdapter.approveOnHeader).toHaveBeenCalledWith(
          'CLAIM',
          '212',
          { decision: 'A', comment: 'Approved by MOCK_USER', approverNumber: '1' },
          'MOCK_USER',
          'jwt'
        );
      });

      it('should fall back to "Rejected by <user>" zcomment when no comment provided (Reject)', async () => {
        mockSapOdataAdapter.rejectOnHeader.mockResolvedValue(undefined);
        mockSapOdataAdapter.addComment.mockResolvedValue(undefined);

        await processor.executeDecision(
          '212',
          '0002',
          '0002',
          '',
          'MOCK_USER',
          'jwt',
          { documentId: '212', businessObjectType: 'CLAIM' }
        );

        expect(mockSapOdataAdapter.rejectOnHeader).toHaveBeenCalledWith(
          'CLAIM',
          '212',
          { decision: 'R', comment: 'Rejected by MOCK_USER', approverNumber: '1' },
          'MOCK_USER',
          'jwt'
        );
        expect(mockSapOdataAdapter.approveOnHeader).not.toHaveBeenCalled();
      });

      it('should not throw when Claim approve fails (best-effort, warning logged)', async () => {
        mockSapOdataAdapter.approveOnHeader.mockRejectedValue(new Error('approve 500 from SAP'));
        mockSapOdataAdapter.addComment.mockResolvedValue(undefined);

        const result = await processor.executeDecision(
          '212',
          '0001',
          '0001',
          'approve claim 212',
          'MOCK_USER',
          'jwt',
          { documentId: '212', businessObjectType: 'CLAIM' }
        );

        expect(mockSapOdataAdapter.approveOnHeader).toHaveBeenCalledTimes(1);
        expect(mockSapOdataAdapter.addComment).toHaveBeenCalledTimes(1);
        expect(result.status).toBe('PARTIAL_SUCCESS');
        expect(result.partialSuccess).toBe(true);
        expect(result.approve).toBe('rejected');
        expect(result.comment).toBe('fulfilled');
      });

      it('should not throw when Claim comment fails (best-effort, warning logged)', async () => {
        mockSapOdataAdapter.approveOnHeader.mockResolvedValue(undefined);
        mockSapOdataAdapter.addComment.mockRejectedValue(new Error('comment 500 from SAP'));

        const result = await processor.executeDecision(
          '212',
          '0001',
          '0001',
          'approve claim 212',
          'MOCK_USER',
          'jwt',
          { documentId: '212', businessObjectType: 'CLAIM' }
        );

        expect(result.status).toBe('PARTIAL_SUCCESS');
        expect(result.partialSuccess).toBe(true);
        expect(result.approve).toBe('fulfilled');
        expect(result.comment).toBe('rejected');
      });

      it('should report SUCCESS when both Claim endpoints fulfil', async () => {
        mockSapOdataAdapter.approveOnHeader.mockResolvedValue(undefined);
        mockSapOdataAdapter.addComment.mockResolvedValue(undefined);

        const result = await processor.executeDecision(
          '212',
          '0001',
          '0001',
          'approve claim 212',
          'MOCK_USER',
          'jwt',
          { documentId: '212', businessObjectType: 'CLAIM' }
        );

        expect(result.status).toBe('SUCCESS');
        expect(result.partialSuccess).toBe(false);
        expect(result.approve).toBe('fulfilled');
        expect(result.comment).toBe('fulfilled');
      });

      it('should throw 400 when documentId is missing for Claim', async () => {
        await expect(
          processor.executeDecision(
            '212',
            '0001',
            '0001',
            'approve',
            'MOCK_USER',
            'jwt',
            { businessObjectType: 'CLAIM' }
          )
        ).rejects.toMatchObject({ statusCode: 400 });

        expect(mockSapOdataAdapter.approveOnHeader).not.toHaveBeenCalled();
        expect(mockSapOdataAdapter.addComment).not.toHaveBeenCalled();
        expect(mockTaskAdapter.executeDecision).not.toHaveBeenCalled();
      });

      it('should NOT call TASKPROCESSING top-level executeDecision for Claim', async () => {
        mockSapOdataAdapter.approveOnHeader.mockResolvedValue(undefined);
        mockSapOdataAdapter.addComment.mockResolvedValue(undefined);

        await processor.executeDecision(
          '212',
          '0001',
          '0001',
          'approve',
          'MOCK_USER',
          'jwt',
          { documentId: '212', businessObjectType: 'CLAIM' }
        );

        expect(mockTaskAdapter.executeDecision).not.toHaveBeenCalled();
      });

      it('should resolve DocCategory "CLAIM" via resolver and still trigger Claim dual-API path', async () => {
        mockSapOdataAdapter.approveOnHeader.mockResolvedValue(undefined);
        mockSapOdataAdapter.addComment.mockResolvedValue(undefined);

        await processor.executeDecision(
          '212',
          '0001',
          '0001',
          'approve via docCategory',
          'MOCK_USER',
          'jwt',
          { documentId: '212', businessObjectType: 'CLAIM' }
        );

        expect(mockSapOdataAdapter.approveOnHeader).toHaveBeenCalledWith(
          'CLAIM',
          '212',
          { decision: 'A', comment: 'approve via docCategory', approverNumber: '1' },
          'MOCK_USER',
          'jwt'
        );
        expect(mockSapOdataAdapter.addComment).toHaveBeenCalledWith(
          '212', '',
          'MOCK_USER',
          { userJwt: 'jwt', decision: 'A', objectType: 'CLAIM', taskId: '212', approverNumber: '1' }
        );
      });
    });
  });

  describe('forwardTask', () => {
    it('should call both TASKPROCESSING /Forward and entity-bound forwardOnHeader in parallel for PR', async () => {
      mockTaskAdapter.forwardTask.mockResolvedValue({ success: true });
      mockSapOdataAdapter.forwardOnHeader.mockResolvedValue(undefined);

      const result = await processor.forwardTask(
        '34413',
        'CONARUM3',
        'Task Forwarded 2608',
        'MOCK_USER',
        'jwt',
        { documentId: '1100000284', businessObjectType: 'PR' }
      );

      expect(mockTaskAdapter.forwardTask).toHaveBeenCalledWith('34413', 'CONARUM3', 'Task Forwarded 2608', 'MOCK_USER', 'jwt');
      expect(mockSapOdataAdapter.forwardOnHeader).toHaveBeenCalledWith(
        'PR',
        '1100000284',
        { taskId: '34413', notetext: 'Task Forwarded 2608', toUser: 'CONARUM3' },
        'MOCK_USER',
        'jwt'
      );
      expect(result).toEqual({ success: true });
      // The user's forward comment is already recorded by SAP itself via the
      // TASKPROCESSING /Forward (Comments URL param) and the entity-bound
      // /SAP__self.forward (notetext) actions. forwardTask must NOT post a
      // second _Comment row via addComment — that would create a duplicate
      // row with Forward:false and a "[Forwarded to X]" prefix.
      expect(mockSapOdataAdapter.addComment).not.toHaveBeenCalled();
    });

    it('should call both calls in parallel for PO', async () => {
      mockTaskAdapter.forwardTask.mockResolvedValue({ success: true });
      mockSapOdataAdapter.forwardOnHeader.mockResolvedValue(undefined);

      await processor.forwardTask(
        '34413',
        'CONARUM3',
        'Forward PO',
        'MOCK_USER',
        'jwt',
        { documentId: '4500000284', businessObjectType: 'PO' }
      );

      expect(mockSapOdataAdapter.forwardOnHeader).toHaveBeenCalledWith(
        'PO',
        '4500000284',
        expect.objectContaining({ toUser: 'CONARUM3' }),
        'MOCK_USER',
        'jwt'
      );
    });

    it('should resolve DocCategory "BUS2105" → PR and call entity-bound forward', async () => {
      mockTaskAdapter.forwardTask.mockResolvedValue({ success: true });
      mockSapOdataAdapter.forwardOnHeader.mockResolvedValue(undefined);

      await processor.forwardTask(
        '34413',
        'CONARUM3',
        'Forward PR (via DocCategory)',
        'MOCK_USER',
        'jwt',
        { documentId: '1100000284', businessObjectType: 'BUS2105' }
      );

      expect(mockTaskAdapter.forwardTask).toHaveBeenCalledTimes(1);
      expect(mockSapOdataAdapter.forwardOnHeader).toHaveBeenCalledWith(
        'PR',
        '1100000284',
        { taskId: '34413', notetext: 'Forward PR (via DocCategory)', toUser: 'CONARUM3' },
        'MOCK_USER',
        'jwt'
      );
    });

    it('should resolve DocCategory "BUS2012" → PO and call entity-bound forward', async () => {
      mockTaskAdapter.forwardTask.mockResolvedValue({ success: true });
      mockSapOdataAdapter.forwardOnHeader.mockResolvedValue(undefined);

      await processor.forwardTask(
        '34413',
        'CONARUM3',
        'Forward PO (via DocCategory)',
        'MOCK_USER',
        'jwt',
        { documentId: '4500000284', businessObjectType: 'BUS2012' }
      );

      expect(mockSapOdataAdapter.forwardOnHeader).toHaveBeenCalledWith(
        'PO',
        '4500000284',
        expect.objectContaining({ toUser: 'CONARUM3' }),
        'MOCK_USER',
        'jwt'
      );
    });

    it('should skip entity-bound forward for Reservation (RE) — only TASKPROCESSING /Forward runs', async () => {
      mockTaskAdapter.forwardTask.mockResolvedValue({ success: true });

      await processor.forwardTask(
        '34413',
        'CONARUM3',
        'Forward RE',
        'MOCK_USER',
        'jwt',
        { documentId: '0000000911', businessObjectType: 'RE' }
      );

      expect(mockTaskAdapter.forwardTask).toHaveBeenCalledTimes(1);
      expect(mockSapOdataAdapter.forwardOnHeader).not.toHaveBeenCalled();
    });

    it('should skip entity-bound forward for Claim (CLAIM) — only TASKPROCESSING /Forward runs', async () => {
      mockTaskAdapter.forwardTask.mockResolvedValue({ success: true });

      await processor.forwardTask(
        '34413',
        'CONARUM3',
        'Forward Claim',
        'MOCK_USER',
        'jwt',
        { documentId: '0000000212', businessObjectType: 'CLAIM' }
      );

      expect(mockTaskAdapter.forwardTask).toHaveBeenCalledTimes(1);
      expect(mockSapOdataAdapter.forwardOnHeader).not.toHaveBeenCalled();
    });

    it('should not throw when entity-bound forward fails (best-effort, warning logged)', async () => {
      mockTaskAdapter.forwardTask.mockResolvedValue({ success: true });
      mockSapOdataAdapter.forwardOnHeader.mockRejectedValue(new Error('Entity-bound forward 500 from SAP'));

      const result = await processor.forwardTask(
        '34413',
        'CONARUM3',
        'Forward PR',
        'MOCK_USER',
        'jwt',
        { documentId: '1100000284', businessObjectType: 'PR' }
      );

      expect(mockTaskAdapter.forwardTask).toHaveBeenCalledTimes(1);
      expect(mockSapOdataAdapter.forwardOnHeader).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ success: true });
    });

    it('should throw when TASKPROCESSING /Forward fails (entity-bound failure does not mask it)', async () => {
      mockTaskAdapter.forwardTask.mockRejectedValue(new Error('TASKPROC 500 from SAP'));
      mockSapOdataAdapter.forwardOnHeader.mockResolvedValue(undefined);

      await expect(
        processor.forwardTask(
          '34413',
          'CONARUM3',
          'Forward PR',
          'MOCK_USER',
          'jwt',
          { documentId: '1100000284', businessObjectType: 'PR' }
        )
      ).rejects.toThrow(/Failed to forward task/);

      expect(mockSapOdataAdapter.addComment).not.toHaveBeenCalled();
    });

    it('should throw 400 when forwardTo is missing', async () => {
      await expect(
        processor.forwardTask('34413', '', 'note', 'MOCK_USER', 'jwt', { documentId: '1100000284', businessObjectType: 'PR' })
      ).rejects.toMatchObject({ statusCode: 400 });

      expect(mockTaskAdapter.forwardTask).not.toHaveBeenCalled();
      expect(mockSapOdataAdapter.forwardOnHeader).not.toHaveBeenCalled();
    });

    it('should throw 403 Forbidden when attempting to forward a CC task (normalTask=false)', async () => {
      mockSapClient.get.mockResolvedValue({ value: [{ NormalTask: false }] });

      await expect(
        processor.forwardTask(
          'cc-task-123',
          'CONARUM3',
          'Try forward CC',
          'MOCK_USER',
          'jwt',
          { documentId: '1100000284', businessObjectType: 'PR' }
        )
      ).rejects.toMatchObject({
        statusCode: 403,
        message: 'Forward is not allowed for tagged/CC tasks'
      });

      expect(mockTaskAdapter.forwardTask).not.toHaveBeenCalled();
      expect(mockSapOdataAdapter.forwardOnHeader).not.toHaveBeenCalled();
    });

    it('should populate cache on getTaskDetail and block forward for CC task via cache', async () => {
      (processor as any).objectTypeResolver = {
        resolve: vi.fn().mockResolvedValue({
          businessObject: { DocCategory: 'PR' },
          taskRuntime: null,
          inst: { normalTask: false }
        })
      };

      await processor.getTaskDetail('cc-task-cached', 'MOCK_USER');

      await expect(
        processor.forwardTask(
          'cc-task-cached',
          'CONARUM3',
          'Forward cached CC',
          'MOCK_USER',
          'jwt'
        )
      ).rejects.toMatchObject({
        statusCode: 403,
        message: 'Forward is not allowed for tagged/CC tasks'
      });

      expect(mockTaskAdapter.forwardTask).not.toHaveBeenCalled();
    });
  });

  describe('executeMassDecision', () => {
    it('should successfully execute mass decision across multiple items with bounded concurrency', async () => {
      mockTaskAdapter.executeDecision.mockResolvedValue({ status: 'OK' });
      mockSapOdataAdapter.addComment.mockResolvedValue({});

      const items = [
        { instanceId: '000000000001', documentId: '10000001', businessObjectType: 'PR' },
        { instanceId: '000000000002', documentId: '10000002', businessObjectType: 'PO' },
        { instanceId: '000000000003', documentId: '10000003', businessObjectType: 'RE' },
      ];

      const result = await processor.executeMassDecision(
        items,
        '0001',
        '0001',
        'Approved in mass batch',
        'MOCK_USER',
        'jwt-token'
      );

      expect(result.total).toBe(3);
      expect(result.succeededCount).toBe(3);
      expect(result.failedCount).toBe(0);
      expect(result.results.length).toBe(3);
      expect(result.results[0].status).toBe('SUCCESS');
      expect(result.results[0].instanceId).toBe('000000000001');
      expect(mockTaskAdapter.executeDecision).toHaveBeenCalledTimes(3);
    });

    it('should handle partial failures and report individual errors accurately', async () => {
      mockTaskAdapter.executeDecision
        .mockResolvedValueOnce({ status: 'OK' })
        .mockRejectedValueOnce(new Error('Document locked by user'))
        .mockResolvedValueOnce({ status: 'OK' });
      mockSapOdataAdapter.addComment.mockResolvedValue({});

      const items = [
        { instanceId: '000000000001', documentId: '10000001', businessObjectType: 'PR' },
        { instanceId: '000000000002', documentId: '10000002', businessObjectType: 'PR' },
        { instanceId: '000000000003', documentId: '10000003', businessObjectType: 'PR' },
      ];

      const result = await processor.executeMassDecision(
        items,
        '0001',
        '0001',
        'Batch approve',
        'MOCK_USER'
      );

      expect(result.total).toBe(3);
      expect(result.succeededCount).toBe(2);
      expect(result.failedCount).toBe(1);
      expect(result.results[0].status).toBe('SUCCESS');
      expect(result.results[1].status).toBe('FAILED');
      expect(result.results[1].error).toContain('Document locked by user');
      expect(result.results[2].status).toBe('SUCCESS');
    });

    it('should reject decision on CC tasks (NormalTask === false)', async () => {
      mockSapClient.get.mockResolvedValueOnce({ value: [{ NormalTask: false }] });

      await expect(
        processor.executeDecision(
          '999999999999',
          '0001',
          '0001',
          'Approve CC task',
          'MOCK_USER'
        )
      ).rejects.toThrow('Decisions (Approve/Reject) are not allowed for tagged/CC tasks');
    });

    it('should report FAILED when executeMassDecision encounters a CC task', async () => {
      mockSapClient.get.mockResolvedValueOnce({ value: [{ NormalTask: false }] });

      const items = [
        { instanceId: '999999999999', documentId: 'CC_DOC', businessObjectType: 'PR' }
      ];

      const result = await processor.executeMassDecision(
        items,
        '0001',
        '0001',
        'Mass approve CC',
        'MOCK_USER'
      );

      expect(result.total).toBe(1);
      expect(result.succeededCount).toBe(0);
      expect(result.failedCount).toBe(1);
      expect(result.results[0].status).toBe('FAILED');
      expect(result.results[0].error).toContain('tagged/CC tasks');
    });
  });
});
