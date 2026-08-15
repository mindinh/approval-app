import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SapOdataAdapter } from '../../../srv/lib/integrations/sap-odata-adapter';
import * as mockDataProvider from '../../../srv/lib/integrations/mock-data-provider';

vi.mock('../../../srv/lib/integrations/sap-client', () => {
  return {
    SapClient: class {
      get = vi.fn();
      getBinary = vi.fn();
      post = vi.fn();
      fetchCsrf = vi.fn().mockResolvedValue({ token: 'mock-csrf-token', cookie: 'mock-cookie' });
    }
  };
});

describe('SapOdataAdapter', () => {
  let adapter: SapOdataAdapter;
  let mockSapClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new SapOdataAdapter();
    mockSapClient = (adapter as any).sapClient;
  });

  describe('getInstances Worklist', () => {
    it('should return mock instances in mock mode', async () => {
      process.env.USE_MOCK_SAP = 'true';
      const instances = await adapter.getInstances('MOCK_USER', 'IN PROCESSING');
      expect(instances).toBeDefined();
      expect(Array.isArray(instances)).toBe(true);
    });

    it('should query SAP instance list in live mode', async () => {
      process.env.USE_MOCK_SAP = 'false';
      mockSapClient.get.mockResolvedValue({
        value: [
          {
            WorkflowTaskInternalID: '000000000001',
            TechnicalWrkflwObjectType: 'BUS2105',
            DocumentNumber: '10000001',
            WorkflowTaskStatus: 'IN PROCESSING'
          }
        ],
        '@odata.count': 1
      });

      const instances = await adapter.getInstances('SAP_USER', 'IN PROCESSING');
      expect(instances).toBeDefined();
      expect(instances.length).toBe(1);
      expect(mockSapClient.get).toHaveBeenCalledWith(
        '/sap/opu/odata4/sap/za_cnma_prorequest/srvd_a2x/sap/za_cnma_prorequest/0001',
        '/CNMA_WFTASK',
        expect.objectContaining({ $format: 'json' }),
        'SAP_USER',
        undefined
      );
    });
  });

  describe('Mock Mode (USE_MOCK_SAP !== "false")', () => {
    beforeEach(() => {
      process.env.USE_MOCK_SAP = 'true';
    });

    it('should return mock raw details from getDetailBatch', async () => {
      const result = await adapter.getDetailBatch(
        [{ objectType: 'PR', objectId: '10000001' }],
        'MOCK_USER'
      );

      expect(result['10000001']).toBeDefined();
      expect(result['10000001'].DocumentNumber).toBe('0010000001');
      expect(result['10000001'].DocCategory).toBe('BUS2105');
      expect(mockSapClient.get).not.toHaveBeenCalled();
    });

    it('should return complete raw mock detail on getDetail (headerOnly = false)', async () => {
      const result = await adapter.getDetail('PR', '10000001', 'MOCK_USER', undefined, false);
      expect(result.DocCategory).toBe('BUS2105');
      expect(result._Item).toBeDefined();
      expect(result._Item.length).toBeGreaterThan(0);
    });

    it('should save comments and attachments in mock cache', async () => {
      const addCommentSpy = vi.spyOn(mockDataProvider, 'addMockComment');
      const addAttachmentSpy = vi.spyOn(mockDataProvider, 'addMockAttachment');

      await adapter.getStrategy('PR').addComment('10000001', 'Test comment', 'MOCK_USER');
      expect(addCommentSpy).toHaveBeenCalledWith('10000001', 'Test comment', 'MOCK_USER');

      const buf = Buffer.from('hello');
      await adapter.getStrategy('PR').uploadAttachment('10000001', 'test.txt', 'text/plain', buf, 'MOCK_USER');
      expect(addAttachmentSpy).toHaveBeenCalledWith('10000001', 'test.txt', 'text/plain', buf, 'MOCK_USER');
    });
  });

  describe('Direct SAP Mode (USE_MOCK_SAP === "false")', () => {
    beforeEach(() => {
      process.env.USE_MOCK_SAP = 'false';
    });

    it('should fetch PR and PO in batch and return raw entities', async () => {
      mockSapClient.get.mockImplementation(async (path: string, relativePath: string) => {
        if (relativePath.includes("DocCategory='BUS2105'")) {
          return { DocCategory: 'BUS2105', DocumentType: 'ZASS', DocumentNumber: '10000001' };
        }
        if (relativePath.includes("DocCategory='BUS2012'")) {
          return { DocCategory: 'BUS2012', DocumentType: 'DEFAULT', DocumentNumber: '45000002' };
        }
        return {};
      });

      const items = [
        { objectType: 'PR', objectId: '10000001' },
        { objectType: 'PO', objectId: '45000002' }
      ];

      const result = await adapter.getDetailBatch(items, 'SAP_USER', 'jwt-token');

      expect(mockSapClient.get).toHaveBeenCalled();
      expect(result['10000001'].DocumentType).toBe('ZASS');
      expect(result['10000001'].DocumentNumber).toBe('10000001');
      expect(result['45000002'].DocumentNumber).toBe('45000002');
    });

    it('should query single PR raw detail with complete sections (headerOnly = false)', async () => {
      mockSapClient.get.mockImplementation(async (servicePath: string, relativePath: string) => {
        if (relativePath.includes('CNMA_PRHEADER')) {
          return {
            DocCategory: 'BUS2105',
            DocumentNumber: '10000001',
            DocumentType: 'ZASS',
            _Item: [{ DocumentNumber: '10000001', PurchaseRequisitionItem: '00010', RequestedQuantity: '10', BaseUnit: 'PC' }],
            _ApprovalStep: [{ ObjectKey: '10000001', ApprovalLevel: '1', ReleaseCode: 'R1', ApproverName: 'Approver 1', ApprovalStatus: 'APPROVED' }],
            _HeaderText: [{ DocCategory: 'BUS2105', DocNumber: '10000001', LineId: 1, LongText: 'Desc line 1' }],
            _Comment: [{ DocumentNumber: '10000001', Sequence: 1, PostedOn: '2026-07-15', PostedTime: '10:00:00', NoteText: 'Test PR comment', UserComment: 'USR1' }],
            _Attachment: [{
              DocumentCategory: 'BUS2105',
              DocumentNumber: '10000001',
              DocId: 'FOL42000000000004EXT51000000000208',
              FileName: 'PR_01_Toiletries_Bath_Amenities',
              FileExtension: 'pdf'
            }]
          };
        }
        return {};
      });

      const result = await adapter.getDetail('PR', '10000001', 'SAP_USER', 'jwt', false);

      expect(mockSapClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('CNMA_PRHEADER'),
        expect.objectContaining({ $expand: expect.stringContaining('_Item($orderby=ItemNumber asc)') }),
        'SAP_USER',
        'jwt'
      );
      expect(result.DocCategory).toBe('BUS2105');
      expect(result.DocumentType).toBe('ZASS');
      expect(result._Item.length).toBe(1);
      expect(result._ApprovalStep.length).toBe(1);
      expect(result._Comment.length).toBe(1);
      expect(result._Comment[0].UserComment).toBe('USR1');
      expect(result._Attachment.length).toBe(1);
      expect(result._Attachment[0].DocId).toBe('FOL42000000000004EXT51000000000208');
    });

    it('should query single PO raw detail with complete sections (headerOnly = false)', async () => {
      mockSapClient.get.mockImplementation(async (servicePath: string, relativePath: string) => {
        if (relativePath.includes('CNMA_POHEADER')) {
          return {
            DocCategory: 'BUS2012',
            DocumentNumber: '45000002',
            DocumentType: 'DEFAULT',
            _Item: [{ DocumentNumber: '45000002', PurchaseOrderItem: '10', OrderQuantity: '5', PurchaseOrderQuantityUnit: 'PC' }],
            _ApprovalStep: [{ ObjectKey: '45000002', ApprovalLevel: '1', ReleaseCode: 'R1', ApproverName: 'Approver 1', ApprovalStatus: 'APPROVED' }],
            _Comment: [{ DocumentNumber: '45000002', Sequence: 1, PostedOn: '2026-07-15', PostedTime: '10:00:00', NoteText: 'Test PO comment', UserComment: 'USR1' }]
          };
        }
        return {};
      });

      const result = await adapter.getDetail('PO', '45000002', 'SAP_USER', 'jwt', false);

      expect(mockSapClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('CNMA_POHEADER'),
        expect.objectContaining({ $expand: expect.stringContaining('_Item($orderby=ItemNumber asc)') }),
        'SAP_USER',
        'jwt'
      );
      expect(result.DocCategory).toBe('BUS2012');
      expect(result.DocumentNumber).toBe('45000002');
      expect(result._Item.length).toBe(1);
      expect(result._Comment.length).toBe(1);
      expect(result._Comment[0].UserComment).toBe('USR1');
    });

    it('should stream attachment binary content in direct SAP mode', async () => {
      mockSapClient.getBinary.mockResolvedValue({
        data: Buffer.from('my-sap-file'),
        contentType: 'application/pdf',
        fileName: 'Invoice.pdf'
      });

      const result = await adapter.getStrategy('PR').fetchAttachmentContent('10000001', 'FOL42000000000004EXT51000000000208', 'SAP_USER', 'jwt');
      expect(result).toEqual({
        data: Buffer.from('my-sap-file'),
        contentType: 'application/pdf',
        fileName: 'Invoice.pdf'
      });
    });

    it('should throw an error on uploadAttachment in direct SAP mode', async () => {
      const buf = Buffer.from('my-file');
      await expect(
        adapter.getStrategy('PR').uploadAttachment('10000001', 'doc.pdf', 'application/pdf', buf, 'SAP_USER', 'jwt')
      ).rejects.toThrow('Attachment upload is disabled for this service.');
    });
  });
});
