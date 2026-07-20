import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SapOdataAdapter, clearDetailCache } from '../../../srv/lib/integrations/sap-odata-adapter';
import { SapClient } from '../../../srv/lib/integrations/sap-client';
import { MetadataService } from '../../../srv/lib/metadata-service';
import * as mockDataProvider from '../../../srv/lib/integrations/mock-data-provider';

// Mock SapClient and MetadataService
vi.mock('../../../srv/lib/integrations/sap-client', () => {
  return {
    SapClient: class {
      get = vi.fn();
      post = vi.fn();
      fetchCsrf = vi.fn();
      batchGet = vi.fn();
    }
  };
});

vi.mock('../../../srv/lib/metadata-service', () => {
  return {
    MetadataService: class {
      normalizeDetail = vi.fn().mockImplementation(async (data: any) => data);
    }
  };
});

describe('SapOdataAdapter', () => {
  let adapter: SapOdataAdapter;
  let mockSapClient: any;
  let originalEnv: string | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new SapOdataAdapter();
    mockSapClient = (adapter as any).sapClient;
    originalEnv = process.env.USE_MOCK_SAP;

    // Clear caches
    clearDetailCache('PR', '10000001');
    clearDetailCache('PO', '45000002');
  });

  afterEach(() => {
    process.env.USE_MOCK_SAP = originalEnv;
  });

  describe('Worklist Instances Fetching', () => {
    it('should fetch instance list in mock mode', async () => {
      process.env.USE_MOCK_SAP = 'true';
      const result = await adapter.getInstances('MOCK_USER', 'IN PROCESSING');
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should fetch instances list from SAP in direct mode', async () => {
      process.env.USE_MOCK_SAP = 'false';
      mockSapClient.get.mockResolvedValue({
        value: [{
          WorkflowTaskInternalID: '198781',
          WorkflowTaskStatus: 'IN PROCESSING',
          TechnicalWrkflwObjectType: 'BUS2105',
          TaskCreationDateTime: '2026-04-05T08:13:18.43246Z',
          CreatedByUser: 'DIENTRAN',
          CreationDate: '2026-04-05',
          CreationTime: '15:13:17'
        }]
      });
      const result = await adapter.getInstances('SAP_USER', 'IN PROCESSING');
      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].taskCreationDateTime).toBe('2026-04-05T08:13:18.43246Z');
      expect(result[0].createdByUser).toBe('DIENTRAN');
      expect(result[0].creationDate).toBe('2026-04-05');
      expect(result[0].creationTime).toBe('15:13:17');
      expect(mockSapClient.get).toHaveBeenCalledWith(
        '/sap/opu/odata4/sap/zsb_prorequest/srvd_a2x/sap/zsd_prorequest/0001',
        '/ZC_WORKFLOWTASK',
        { $format: 'json', $orderby: 'WorkflowTaskInternalID desc', $filter: "WorkflowTaskStatus eq 'IN PROCESSING'" },
        'SAP_USER',
        undefined
      );
    });
  });

  describe('Mock Mode (USE_MOCK_SAP !== "false")', () => {
    beforeEach(() => {
      process.env.USE_MOCK_SAP = 'true';
    });

    it('should return mock details from getDetailBatch with camelCase keys', async () => {
      const result = await adapter.getDetailBatch(
        [{ objectType: 'PR', objectId: '10000001' }],
        'MOCK_USER'
      );

      expect(result['PR:10000001']).toBeDefined();
      expect(result['PR:10000001'].objectId).toBe('10000001');
      // Camel-casing check: "purchaseRequisition" instead of "PurchaseRequisition"
      expect(result['PR:10000001'].header.purchaseRequisition).toBe('10000001');
      expect(mockSapClient.batchGet).not.toHaveBeenCalled();
    });

    it('should return complete mock detail on getDetail (headerOnly = false)', async () => {
      const result = await adapter.getDetail('PR', '10000001', 'MOCK_USER', undefined, false);
      expect(result.header).toBeDefined();
      expect(result.items).toBeDefined();
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should save comments and attachments in mock cache', async () => {
      const addCommentSpy = vi.spyOn(mockDataProvider, 'addMockComment');
      const addAttachmentSpy = vi.spyOn(mockDataProvider, 'addMockAttachment');

      await adapter.addComment('10000001', 'Test comment', 'MOCK_USER');
      expect(addCommentSpy).toHaveBeenCalledWith('10000001', 'Test comment', 'MOCK_USER');

      const buf = Buffer.from('hello');
      await adapter.uploadAttachment('10000001', 'test.txt', 'text/plain', buf, 'MOCK_USER');
      expect(addAttachmentSpy).toHaveBeenCalledWith('10000001', 'test.txt', 'text/plain', buf, 'MOCK_USER');
    });
  });

  describe('Direct SAP Mode (USE_MOCK_SAP === "false")', () => {
    beforeEach(() => {
      process.env.USE_MOCK_SAP = 'false';
    });

    it('should fetch PR and PO in batch and normalize headers', async () => {
      mockSapClient.get.mockImplementation(async (path: string, relativePath: string) => {
        if (relativePath.includes('ZC_PRHEADER')) {
          return { DocumentType: 'ZASS', DocumentNumber: '10000001' };
        }
        if (relativePath.includes('ZC_POHEADER')) {
          return { DocumentType: 'DEFAULT', DocumentNumber: '45000002' };
        }
        return {};
      });

      const items = [
        { objectType: 'PR', objectId: '10000001' },
        { objectType: 'PO', objectId: '45000002' }
      ];

      const result = await adapter.getDetailBatch(items, 'SAP_USER', 'jwt-token');

      expect(mockSapClient.get).toHaveBeenCalled();
      expect(result['PR:10000001'].documentType).toBe('ZASS');
      expect(result['PR:10000001'].header.purchaseRequisition).toBe('10000001');
      expect(result['PO:45000002'].header.purchaseOrder).toBe('45000002');
    });

    it('should query single PR detail with complete sections (headerOnly = false)', async () => {
      // Mock OData V4 response with expands
      mockSapClient.get.mockImplementation(async (servicePath: string, relativePath: string) => {
        if (relativePath.includes('ZC_PRHEADER')) {
          return {
            DocumentNumber: '10000001',
            DocumentType: 'ZASS',
            _Item: [{ DocumentNumber: '10000001', ItemNumber: '00010', Quantity: 100, Unit: 'PC', NetAmount: 1000, DocumentCurrency: 'VND' }],
            _ApprovalStep: [{ ObjectKey: '10000001', ApprovalLevel: 1, ReleaseCode: 'R1', ApproverName: 'Approver 1', ApproverUserId: 'USR1', ApprovalStatus: 'PENDING', CommentText: 'Ok', CommentDate: '2026-07-15', CommentTime: '10:00:00' }],
            _HeaderText: [{ DocCategory: 'BUS2105', DocNumber: '10000001', LineId: 1, LongText: 'Desc line 1' }],
            _Comment: [{ DocumentNumber: '10000001', Sequence: 1, PostedOn: '2026-07-15', PostedTime: '10:00:00', NoteText: 'Test PR comment', UserComment: 'USR1' }]
          };
        }
        return {};
      });

      const result = await adapter.getDetail('PR', '10000001', 'SAP_USER', 'jwt', false);

      expect(result.objectType).toBe('PR');
      expect(result.documentType).toBe('ZASS');
      expect(result.header.purchaseRequisitionText).toBe('Desc line 1');
      expect(result.items.length).toBe(1);
      expect(result.approvalTree.length).toBe(1);
      expect(result.comments.length).toBe(1);
      expect(result.comments[0].author).toBe('USR1');
      expect(result.comments[0].text).toBe('Test PR comment');
    });

    it('should query single PO detail with complete sections (headerOnly = false)', async () => {
      mockSapClient.get.mockImplementation(async (servicePath: string, relativePath: string) => {
        if (relativePath.includes('ZC_POHEADER')) {
          return {
            DocumentNumber: '45000002',
            DocumentType: 'DEFAULT',
            _Item: [{ DocumentNumber: '45000002', ItemNumber: '10', Quantity: 5, Unit: 'PC', NetAmount: 500, DocumentCurrency: 'VND', CostCenter: 'CC1', GLAccount: '610000' }],
            _ApprovalStep: [{ ObjectKey: '45000002', ApprovalLevel: 1, ReleaseCode: 'R1', ApproverName: 'Approver 1', ApproverUserId: 'USR1', ApprovalStatus: 'PENDING', CommentText: 'Ok', CommentDate: '2026-07-15', CommentTime: '10:00:00' }],
            _HeaderText: [{ DocCategory: 'BUS2012', DocNumber: '45000002', LineId: 1, LongText: 'Ok' }],
            _Comment: [{ DocumentNumber: '45000002', Sequence: 1, PostedOn: '2026-07-15', PostedTime: '10:00:00', NoteText: 'Test PO comment', UserComment: 'USR1' }]
          };
        }
        return {};
      });

      const result = await adapter.getDetail('PO', '45000002', 'SAP_USER', 'jwt', false);

      expect(result.objectType).toBe('PO');
      expect(result.header.purchaseOrder).toBe('45000002');
      expect(result.items.length).toBe(1);
      expect(result.accountAssignments.length).toBe(1);
      expect(result.comments.length).toBe(1);
      expect(result.comments[0].author).toBe('USR1');
      expect(result.comments[0].text).toBe('Test PO comment');
    });

    it('should fail attachment streaming in direct SAP mode', async () => {
      const result = await adapter.fetchAttachmentContent('10000001', 'att-123', 'SAP_USER');
      expect(result).toBeNull();
    });

    it('should throw an error on uploadAttachment in direct SAP mode', async () => {
      const buf = Buffer.from('my-file');
      await expect(
        adapter.uploadAttachment('10000001', 'doc.pdf', 'application/pdf', buf, 'SAP_USER', 'jwt')
      ).rejects.toThrow('Attachment upload is disabled for this service.');
    });

    it('should throw an error on addComment in direct SAP mode', async () => {
      await expect(
        adapter.addComment('10000001', 'Nice PR', 'SAP_USER', 'jwt')
      ).rejects.toThrow('Comments posting is disabled for this service.');
    });
  });
});
