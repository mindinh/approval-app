import { describe, it, expect } from 'vitest';
import { ConfigRegistry } from '../../../srv/lib/mapping/config-registry';
import { MappingEngine } from '../../../srv/lib/mapping/mapping-engine';
import { FieldRequirementResolver } from '../../../srv/lib/mapping/resolver';
import { CanonicalProjector } from '../../../srv/lib/mapping/canonical-projector';

describe('Config-driven API Mapping & Registry Suite', () => {
  const registry = ConfigRegistry.getInstance();
  const mapper = MappingEngine.getInstance();
  const resolver = FieldRequirementResolver.getInstance();
  const projector = CanonicalProjector.getInstance();

  describe('ConfigRegistry', () => {
    it('should successfully load all four object types (PR, PO, RE, CLAIM)', () => {
      expect(registry.has('PR')).toBe(true);
      expect(registry.has('PO')).toBe(true);
      expect(registry.has('RE')).toBe(true);
      expect(registry.has('CLAIM')).toBe(true);
    });

    it('should resolve object configurations via alias lookup', () => {
      const prConfig = registry.getByAlias('BUS2105');
      const poConfig = registry.getByAlias('BUS2012');
      const reConfig = registry.getByAlias('BUS2093');
      const claimConfig = registry.getByAlias('ZCLAIM');

      expect(prConfig?.object.objectType).toBe('PR');
      expect(poConfig?.object.objectType).toBe('PO');
      expect(reConfig?.object.objectType).toBe('RE');
      expect(claimConfig?.object.objectType).toBe('CLAIM');
    });
  });

  describe('MappingEngine - Purchase Order (PO)', () => {
    it('should map raw PO payload to canonical format', () => {
      const config = registry.get('PO')!;
      const rawPO = {
        purchaseOrder: '450012345',
        supplierName: 'Acme Corp',
        purchaseOrderNetAmount: '15000.50',
        documentCurrency: 'USD',
        items: [
          {
            purchaseOrderItem: '00010',
            purchaseOrderItemText: 'Laptop Stand',
            orderQuantity: '5',
            netPriceAmount: '100.00',
            netAmount: '500.00'
          }
        ],
        approvalTree: [
          {
            documentId: '450012345',
            level: 1,
            releaseCode: 'Z1',
            approver: 'John Smith',
            approverUserId: 'JSMITH',
            status: 'APPROVED',
            noteText: 'Looks good',
            postedOn: '2026-07-20',
            postedTime: '10:00:00'
          }
        ]
      };

      const result = mapper.map({ header: rawPO, items: rawPO.items, approvalTree: rawPO.approvalTree }, config);

      expect(result.objectType).toBe('PO');
      expect(result.header.purchaseOrder).toBe('450012345');
      expect(result.header.supplierName).toBe('Acme Corp');
      expect(result.header.purchaseOrderNetAmount).toBe(15000.50);
      expect(result.header.documentCurrency).toBe('USD');

      expect(result.items.length).toBe(1);
      expect(result.items[0].item).toBe('00010');
      expect(result.items[0].shortText).toBe('Laptop Stand');
      expect(result.items[0].quantity).toBe(5);
      expect(result.items[0].netAmount).toBe(500);

      expect(result.workflow.steps.length).toBe(1);
      expect(result.workflow.steps[0].approver).toBe('John Smith');
      expect(result.workflow.steps[0].status).toBe('APPROVED');
    });
  });

  describe('MappingEngine - Claims (CLAIM)', () => {
    it('should map raw Claim payload to canonical format', () => {
      const config = registry.get('CLAIM')!;
      const rawClaim = {
        claimNumber: 'CLM98765',
        claimant: 'John Doe',
        totalAmount: '250.00',
        currency: 'EUR',
        items: [
          {
            itemNo: '1',
            expenseType: 'Travel',
            amount: '120.00'
          }
        ]
      };

      const result = mapper.map({ header: rawClaim, items: rawClaim.items }, config);

      expect(result.objectType).toBe('CLAIM');
      expect(result.header.claimNumber).toBe('CLM98765');
      expect(result.header.claimant).toBe('John Doe');
      expect(result.header.totalAmount).toBe(250);
      
      expect(result.items.length).toBe(1);
      expect(result.items[0].itemNo).toBe('1');
      expect(result.items[0].expenseType).toBe('Travel');
      expect(result.items[0].amount).toBe(120);
    });
  });

  describe('FieldRequirementResolver & CanonicalProjector', () => {
    it('should resolve required paths and prune unmapped fields', () => {
      const config = registry.get('PO')!;
      const plan = resolver.resolve('detail', config);

      // Verify resolved paths contain header.purchaseOrder and items properties
      expect(plan.canonicalPaths).toContain('header.purchaseOrder');
      expect(plan.canonicalPaths).toContain('items.item');

      // Setup a mapped object containing extra unmapped fields
      const canonicalObject = {
        objectType: 'PO',
        objectId: '4500012345',
        header: {
          purchaseOrder: '4500012345',
          supplierName: 'Acme Corp',
          secretInternalField: 'should-be-pruned'
        },
        items: [
          {
            item: '00010',
            shortText: 'Laptop Stand',
            anotherSecretField: 'prune-me'
          }
        ]
      };

      // Project using canonical paths
      const projected = projector.project(canonicalObject, plan.canonicalPaths);

      expect(projected.header.purchaseOrder).toBe('4500012345');
      expect(projected.header.supplierName).toBe('Acme Corp');
      expect(projected.header.secretInternalField).toBeUndefined(); // Pruned!

      expect(projected.items[0].item).toBe('00010');
      expect(projected.items[0].shortText).toBe('Laptop Stand');
      expect(projected.items[0].anotherSecretField).toBeUndefined(); // Pruned!
    });
  });
});
