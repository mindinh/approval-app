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
      mockSapClient.get.mockResolvedValue({ value: [{ credate: '2026-07-09', cretime: '12:00:00' }] });
      const result = await adapter.getInstances('SAP_USER', 'IN PROCESSING');
      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(mockSapClient.get).toHaveBeenCalled();
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
      mockSapClient.batchGet.mockImplementation(async (path: string) => {
        if (path.includes('C_PURREQUISITION_FS_SRV')) {
          return [{ PurchaseRequisitionType: 'ZASS', PurchaseRequisition: '10000001' }];
        }
        if (path.includes('C_PURCHASEORDER_FS_SRV')) {
          return [{ PurchaseOrder: '45000002' }];
        }
        return [];
      });

      const items = [
        { objectType: 'PR', objectId: '10000001' },
        { objectType: 'PO', objectId: '45000002' }
      ];

      const result = await adapter.getDetailBatch(items, 'SAP_USER', 'jwt-token');

      expect(mockSapClient.batchGet).toHaveBeenCalledTimes(2);
      expect(result['PR:10000001'].documentType).toBe('ZASS');
      expect(result['PR:10000001'].header.purchaseRequisition).toBe('10000001');
      expect(result['PO:45000002'].header.purchaseOrder).toBe('45000002');
    });

    it('should query single PR detail with complete sections (headerOnly = false)', async () => {
      // Mock Promise.all responses
      mockSapClient.get.mockImplementation(async (servicePath: string, relativePath: string) => {
        if (relativePath.includes('ZC_PR_CUSTOM')) {
          return { value: [{ PurchaseRequisition: '10000001', PRItem: '00010', Quantity: 100, QuantityUnit: 'PC', Price: 10, DocumentCurrency: 'VND', NetValueDocCrcy: 1000 }] };
        }
        if (relativePath.includes('C_PurRequisitionFs')) {
          return { d: { PurchaseRequisition: '10000001', PurchaseRequisitionType: 'ZASS' } };
        }
        if (relativePath.includes('ZI_PR_APPROVAL_LINE')) {
          return { value: [{ Banfn: '10000001', Approver: 'Approver 1', Lvl: '1' }] };
        }
        if (relativePath.includes('ZI_PR_COMMENT_TAB')) {
          return { value: [{ NoteText: 'Ok', UserComment: 'Nguyen Van A' }] };
        }
        if (relativePath.includes('ZI_PR_INFO')) {
          return { value: [{ Description: [{ TextLine: 'Desc line 1' }] }] };
        }
        if (relativePath.includes('ZI_PR_ATTACHMENTS')) {
          return { value: [{ attach_id: 'att-123', file_name: 'test.pdf' }] };
        }
        return { value: [] };
      });

      const result = await adapter.getDetail('PR', '10000001', 'SAP_USER', 'jwt', false);

      expect(result.objectType).toBe('PR');
      expect(result.documentType).toBe('ZASS');
      expect(result.header.purchaseRequisitionText).toBe('Desc line 1');
      expect(result.items.length).toBe(1);
      expect(result.approvalTree.length).toBe(1);
      expect(result.comments.length).toBe(1);
      expect(result.attachments.length).toBe(1);
    });

    it('should query single PO detail with complete sections (headerOnly = false)', async () => {
      mockSapClient.get.mockImplementation(async (servicePath: string, relativePath: string) => {
        if (relativePath.includes('C_PurchaseOrderFs')) {
          return { d: { PurchaseOrder: '45000002' } };
        }
        if (relativePath.includes('C_PurOrdItemEnh')) {
          return { d: { results: [{ PurchaseOrderItem: '10' }] } };
        }
        if (relativePath.includes('C_POAccountAssignmentFactSheet')) {
          return { d: { results: [{ GLAccount: '610000' }] } };
        }
        if (relativePath.includes('C_POScheduleLineFactSheet')) {
          return { d: { results: [{ ScheduleLine: '1' }] } };
        }
        return { d: { results: [] } };
      });

      const result = await adapter.getDetail('PO', '45000002', 'SAP_USER', 'jwt', false);

      expect(result.objectType).toBe('PO');
      expect(result.header.purchaseOrder).toBe('45000002');
      expect(result.items.length).toBe(1);
      expect(result.accountAssignments.length).toBe(1);
      expect(result.scheduleLines.length).toBe(1);
    });

    it('should stream attachment content and correctly decode hex-encoded binary files', async () => {
      // Mock response containing hex value of "hello" (68656c6c6f)
      mockSapClient.get.mockResolvedValue({
        value: [{
          file_content: '68656c6c6f',
          mime_type: 'application/pdf',
          file_name: 'test.pdf'
        }]
      });

      const result = await adapter.fetchAttachmentContent('10000001', 'att-123', 'SAP_USER');
      expect(result).not.toBeNull();
      expect(result?.contentType).toBe('application/pdf');
      expect(result?.fileName).toBe('test.pdf');
      expect(result?.data.toString()).toBe('hello');
    });

    it('should stream attachment content and correctly decode base64 encoded files', async () => {
      // base64 of "world" is "d29ybGQ="
      mockSapClient.get.mockResolvedValue({
        value: [{
          file_content: 'd29ybGQ=',
          mime_type: 'text/plain',
          file_name: 'world.txt'
        }]
      });

      const result = await adapter.fetchAttachmentContent('10000001', 'att-123', 'SAP_USER');
      expect(result).not.toBeNull();
      expect(result?.contentType).toBe('text/plain');
      expect(result?.fileName).toBe('world.txt');
      expect(result?.data.toString()).toBe('world');
    });

    it('should upload attachment delegating CSRF to client', async () => {
      mockSapClient.post.mockResolvedValue({ success: true });

      const buf = Buffer.from('my-file');
      await adapter.uploadAttachment('10000001', 'doc.pdf', 'application/pdf', buf, 'SAP_USER', 'jwt');

      expect(mockSapClient.post).toHaveBeenCalledWith(
        '/sap/opu/odata4/sap/zsb_pr_approval_tree/srvd_a2x/sap/zsd_pr_approval_tree/0001',
        "/ZI_PR_ATTACH_TAB(doc_num='0010000001')/SAP__self.upload",
        {
          File_Name: 'doc.pdf',
          Mime_Type: 'application/pdf',
          File_Content: buf.toString('base64'),
          File_Size: buf.byteLength
        },
        {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        'SAP_USER',
        'jwt'
      );
    });
  });
});
