import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SapOdataAdapter } from '../../../srv/lib/integrations/sap-odata-adapter';

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
    it('should query SAP instance list', async () => {
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

    it('should filter by DocumentNumber and WorkflowTaskInternalID in targetInstanceId filter', async () => {
      mockSapClient.get.mockResolvedValue({
        value: [
          {
            WorkflowTaskInternalID: '212',
            TechnicalWrkflwObjectType: 'CLAIM',
            DocumentNumber: '0000000212',
            DocCategory: 'CLAIM',
            WorkflowTaskStatus: 'IN PROCESSING'
          }
        ],
        '@odata.count': 1
      });

      const instances = await adapter.getInstances('SAP_USER', undefined, undefined, '212');
      expect(instances).toBeDefined();
      expect(instances.length).toBe(1);
      expect(mockSapClient.get).toHaveBeenCalledWith(
        expect.any(String),
        '/CNMA_WFTASK',
        expect.objectContaining({
          $filter: "(DocumentNumber eq '0000000212' or TechnicalWrkflwObject eq '0000000212' or WorkflowTaskInternalID eq '212' or WorkflowTaskInternalID eq '0000000212' or WorkflowTaskInternalID eq '000000000212')"
        }),
        'SAP_USER',
        undefined
      );
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

    it('should stream Claim attachment binary content using CNMA_CLAIM_ATTA endpoint', async () => {
      mockSapClient.getBinary.mockResolvedValue({
        data: Buffer.from('claim-pdf-data'),
        contentType: 'application/pdf',
        fileName: 'Demo_05_Welcome_Kit.pdf'
      });

      const result = await adapter.getStrategy('CLAIM').fetchAttachmentContent('0000000212', 'd34b8d79-bab2-1fe1-a7ee-ba1a8c833069', 'SAP_USER', 'jwt');
      expect(mockSapClient.getBinary).toHaveBeenCalledWith(
        expect.any(String),
        "/CNMA_CLAIM_ATTA(DocCategory='CLAIM',DocumentNumber='0000000212',Docid=d34b8d79-bab2-1fe1-a7ee-ba1a8c833069)/Content",
        'SAP_USER',
        'jwt'
      );
      expect(result).toEqual({
        data: Buffer.from('claim-pdf-data'),
        contentType: 'application/pdf',
        fileName: 'Demo_05_Welcome_Kit.pdf'
      });
    });

    it('should correctly resolve GOS attachment for Reservation docNum starting with 9 to CNMA_ATTACH_CONTENT', async () => {
      mockSapClient.getBinary.mockResolvedValue({
        data: Buffer.from('res-pdf-data'),
        contentType: 'application/pdf',
        fileName: '02_Amenities_Cost_Raise.pdf'
      });

      const result = await adapter.fetchAttachmentContent('0000000911', 'FOL46000000000004EXT51000000000304', 'SAP_USER', 'jwt', 'RE');
      expect(mockSapClient.getBinary).toHaveBeenCalledWith(
        expect.any(String),
        "/CNMA_ATTACH_CONTENT('FOL46000000000004EXT51000000000304')/Content",
        'SAP_USER',
        'jwt'
      );
      expect(result).toEqual({
        data: Buffer.from('res-pdf-data'),
        contentType: 'application/pdf',
        fileName: '02_Amenities_Cost_Raise.pdf'
      });
    });
  });

  describe('forwardOnHeader dispatcher', () => {
    it('should build BUS2105 URL and task_id/notetext/to_user payload for PR', async () => {
      mockSapClient.post.mockResolvedValue({ ok: true });

      await adapter.forwardOnHeader(
        'PR',
        '1100000284',
        { taskId: '34413', notetext: 'Task Forwarded 2608', toUser: 'CONARUM3' },
        'SAP_USER',
        'jwt'
      );

      expect(mockSapClient.post).toHaveBeenCalledWith(
        '/sap/opu/odata4/sap/za_cnma_prorequest/srvd_a2x/sap/za_cnma_prorequest/0001',
        "/CNMA_PRHEADER(DocCategory='BUS2105',DocumentNumber='1100000284')/SAP__self.forward",
        { task_id: '34413', notetext: 'Task Forwarded 2608', to_user: 'CONARUM3' },
        {},
        'SAP_USER',
        'jwt'
      );
    });

    it('should build BUS2012 URL for PO', async () => {
      mockSapClient.post.mockResolvedValue({ ok: true });

      await adapter.forwardOnHeader(
        'PO',
        '4500000284',
        { taskId: '34413', notetext: 'Forward note', toUser: 'CONARUM3' },
        'SAP_USER',
        'jwt'
      );

      expect(mockSapClient.post).toHaveBeenCalledWith(
        '/sap/opu/odata4/sap/za_cnma_prorequest/srvd_a2x/sap/za_cnma_prorequest/0001',
        "/CNMA_POHEADER(DocCategory='BUS2012',DocumentNumber='4500000284')/SAP__self.forward",
        expect.objectContaining({ to_user: 'CONARUM3' }),
        expect.any(Object),
        'SAP_USER',
        'jwt'
      );
    });

    it('should reject entity-bound forward for Reservation (RE)', async () => {
      await expect(
        adapter.forwardOnHeader('RE', '0000000911', { taskId: '34413', notetext: 'x', toUser: 'CONARUM3' }, 'SAP_USER', 'jwt')
      ).rejects.toThrow(/only supported for PR and PO/);
      expect(mockSapClient.post).not.toHaveBeenCalled();
    });

    it('should reject entity-bound forward for Claim (CLAIM)', async () => {
      await expect(
        adapter.forwardOnHeader('CLAIM', '0000000212', { taskId: '34413', notetext: 'x', toUser: 'CONARUM3' }, 'SAP_USER', 'jwt')
      ).rejects.toThrow(/only supported for PR and PO/);
      expect(mockSapClient.post).not.toHaveBeenCalled();
    });

    it('should pad numeric objectId to 10 chars', async () => {
      mockSapClient.post.mockResolvedValue({ ok: true });

      await adapter.forwardOnHeader(
        'PR',
        '284',
        { taskId: '34413', notetext: 'n', toUser: 'CONARUM3' },
        'SAP_USER',
        'jwt'
      );

      const callArgs = mockSapClient.post.mock.calls[0];
      expect(callArgs[1]).toBe("/CNMA_PRHEADER(DocCategory='BUS2105',DocumentNumber='0000000284')/SAP__self.forward");
    });
  });

  describe('approveOnHeader dispatcher (Claim only)', () => {
    it('should build CLAIM URL and zcomment payload for Approve', async () => {
      mockSapClient.post.mockResolvedValue({ ok: true });

      await adapter.approveOnHeader(
        'CLAIM',
        '212',
        { decision: 'A', comment: 'approve claim 212 26.08' },
        'SAP_USER',
        'jwt'
      );

      expect(mockSapClient.post).toHaveBeenCalledWith(
        '/sap/opu/odata4/sap/za_cnma_prorequest/srvd_a2x/sap/za_cnma_prorequest/0001',
        "/CNMA_CLAIMHEADER(DocCategory='CLAIM',DocumentNumber='0000000212',ApproverNumber='1')/SAP__self.approve",
        { zcomment: 'approve claim 212 26.08' },
        {},
        'SAP_USER',
        'jwt'
      );
    });

    it('should pass the same `/approve` endpoint for Reject (decision="R")', async () => {
      mockSapClient.post.mockResolvedValue({ ok: true });

      await adapter.approveOnHeader(
        'CLAIM',
        '0000000212',
        { decision: 'R', comment: 'reject claim 212' },
        'SAP_USER',
        'jwt'
      );

      expect(mockSapClient.post).toHaveBeenCalledWith(
        expect.any(String),
        "/CNMA_CLAIMHEADER(DocCategory='CLAIM',DocumentNumber='0000000212',ApproverNumber='1')/SAP__self.approve",
        { zcomment: 'reject claim 212' },
        expect.any(Object),
        'SAP_USER',
        'jwt'
      );
    });

    it('should accept custom approverNumber and send it in URL', async () => {
      mockSapClient.post.mockResolvedValue({ ok: true });

      await adapter.approveOnHeader(
        'CLAIM',
        '0000000212',
        { decision: 'A', comment: 'approve claim 212', approverNumber: '2' },
        'SAP_USER',
        'jwt'
      );

      expect(mockSapClient.post).toHaveBeenCalledWith(
        expect.any(String),
        "/CNMA_CLAIMHEADER(DocCategory='CLAIM',DocumentNumber='0000000212',ApproverNumber='2')/SAP__self.approve",
        { zcomment: 'approve claim 212' },
        expect.any(Object),
        'SAP_USER',
        'jwt'
      );
    });

    it('should accept empty zcomment and send it through', async () => {
      mockSapClient.post.mockResolvedValue({ ok: true });

      await adapter.approveOnHeader(
        'CLAIM',
        '212',
        { decision: 'A', comment: '' },
        'SAP_USER',
        'jwt'
      );

      expect(mockSapClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining("/SAP__self.approve"),
        { zcomment: '' },
        expect.any(Object),
        'SAP_USER',
        'jwt'
      );
    });

    it('should pad numeric objectId to 10 chars', async () => {
      mockSapClient.post.mockResolvedValue({ ok: true });

      await adapter.approveOnHeader(
        'CLAIM',
        '212',
        { decision: 'A', comment: 'approve' },
        'SAP_USER',
        'jwt'
      );

      const callArgs = mockSapClient.post.mock.calls[0];
      expect(callArgs[1]).toBe("/CNMA_CLAIMHEADER(DocCategory='CLAIM',DocumentNumber='0000000212',ApproverNumber='1')/SAP__self.approve");
    });

    it('should reject entity-bound approve for PR', async () => {
      await expect(
        adapter.approveOnHeader(
          'PR',
          '1100000284',
          { decision: 'A', comment: 'x' },
          'SAP_USER',
          'jwt'
        )
      ).rejects.toThrow(/only supported for Claim/);
      expect(mockSapClient.post).not.toHaveBeenCalled();
    });

    it('should reject entity-bound approve for PO', async () => {
      await expect(
        adapter.approveOnHeader(
          'PO',
          '4500000284',
          { decision: 'A', comment: 'x' },
          'SAP_USER',
          'jwt'
        )
      ).rejects.toThrow(/only supported for Claim/);
      expect(mockSapClient.post).not.toHaveBeenCalled();
    });

    it('should reject entity-bound approve for Reservation (RE)', async () => {
      await expect(
        adapter.approveOnHeader(
          'RE',
          '0000000911',
          { decision: 'A', comment: 'x' },
          'SAP_USER',
          'jwt'
        )
      ).rejects.toThrow(/only supported for Claim/);
      expect(mockSapClient.post).not.toHaveBeenCalled();
    });
  });
});
