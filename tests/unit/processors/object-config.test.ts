import { describe, it, expect } from 'vitest';
import {
  resolveJsonPath,
  mergeObjectConfig,
  getObjectConfig,
  mapCardChips,
  PR_BASE_CONFIG,
  PR_ZASS_CONFIG,
  PO_BASE_CONFIG
} from '../../../srv/lib/processors/object-config';

describe('object-config', () => {
  describe('resolveJsonPath', () => {
    const testObj = {
      header: {
        id: '12345',
        details: {
          name: 'IT Purchase',
          tags: ['hardware', 'urgent']
        }
      },
      items: [
        { itemNo: '10', price: 100 },
        { itemNo: '20', price: 200 }
      ]
    };

    it('should return whole object when path is $', () => {
      expect(resolveJsonPath(testObj, '$')).toEqual(testObj);
    });

    it('should resolve standard path with $. prefix', () => {
      expect(resolveJsonPath(testObj, '$.header.id')).toBe('12345');
      expect(resolveJsonPath(testObj, '$.header.details.name')).toBe('IT Purchase');
    });

    it('should resolve path without $. prefix', () => {
      expect(resolveJsonPath(testObj, 'header.id')).toBe('12345');
      expect(resolveJsonPath(testObj, 'header.details.name')).toBe('IT Purchase');
    });

    it('should return undefined for missing fields or path steps', () => {
      expect(resolveJsonPath(testObj, '$.header.missing')).toBeUndefined();
      expect(resolveJsonPath(testObj, '$.header.missing.deeper')).toBeUndefined();
      expect(resolveJsonPath(testObj, '$.invalidRoot')).toBeUndefined();
    });

    it('should return undefined if input object is null or undefined', () => {
      expect(resolveJsonPath(null, '$.header.id')).toBeUndefined();
      expect(resolveJsonPath(undefined, '$.header.id')).toBeUndefined();
    });

    it('should return undefined for empty path', () => {
      expect(resolveJsonPath(testObj, '')).toBeUndefined();
    });
  });

  describe('mergeObjectConfig', () => {
    it('should merge field schemas and append ui sections', () => {
      const base = {
        objectType: 'PR' as const,
        documentType: 'BASE',
        name: 'Base Requisition',
        fieldSchema: {
          fieldA: { key: 'fieldA', label: 'Field A', dataPath: '$.a', dataType: 'TEXT' as const }
        },
        uiSchema: {
          sections: [
            { id: 'sec1', type: 'CARD' as const, title: 'Section 1', fields: ['fieldA'] }
          ]
        },
        actions: [
          { key: 'APPROVE', label: 'Approve', variant: 'PRIMARY' as const, requiresComment: false }
        ]
      };

      const override = {
        documentType: 'ZASS',
        name: 'Asset Requisition',
        fieldSchema: {
          fieldB: { key: 'fieldB', label: 'Field B', dataPath: '$.b', dataType: 'TEXT' as const }
        },
        uiSchema: {
          sections: [
            { id: 'sec2', type: 'CARD' as const, title: 'Section 2', fields: ['fieldB'] }
          ]
        }
      };

      const result = mergeObjectConfig(base, override);

      expect(result.objectType).toBe('PR');
      expect(result.documentType).toBe('ZASS');
      expect(result.name).toBe('Asset Requisition');
      expect(result.fieldSchema.fieldA).toBeDefined();
      expect(result.fieldSchema.fieldB).toBeDefined();
      expect(result.uiSchema.sections.length).toBe(2);
      expect(result.uiSchema.sections[0].id).toBe('sec1');
      expect(result.uiSchema.sections[1].id).toBe('sec2');
      expect(result.actions).toEqual(base.actions);
    });
  });

  describe('getObjectConfig', () => {
    it('should return registered config when exact match exists', () => {
      const config = getObjectConfig('PR', 'ZASS');
      expect(config.documentType).toBe('ZASS');
      expect(config.name).toBe('Asset PR');
    });

    it('should return default config of same object type if specific documentType not found', () => {
      const config = getObjectConfig('PR', 'UNKNOWN_DOC_TYPE');
      expect(config).toEqual(PR_BASE_CONFIG);
    });

    it('should fallback to PR_BASE_CONFIG if object type is completely unregistered', () => {
      const config = getObjectConfig('UNKNOWN_TYPE', 'DEFAULT');
      expect(config).toEqual(PR_BASE_CONFIG);
    });
  });

  describe('mapCardChips', () => {
    it('should map chips correctly based on configuration', () => {
      const businessObject = {
        header: {
          totalNetAmount: '15000000',
          displayCurrency: 'VND',
          purchaseRequisitionTypeDisplay: 'Asset PR',
          departmentDisplay: 'IT Dept'
        }
      };

      const chips = mapCardChips(PR_ZASS_CONFIG, businessObject);
      expect(chips.length).toBe(3);

      expect(chips[0]).toEqual({
        label: 'Total',
        value: '15000000',
        dataType: 'AMOUNT',
        isPrimary: true,
        currency: 'VND'
      });

      expect(chips[1]).toEqual({
        label: 'Type',
        value: 'Asset PR',
        dataType: 'TEXT',
        isPrimary: undefined
      });

      expect(chips[2]).toEqual({
        label: 'Dept',
        value: 'IT Dept',
        dataType: 'TEXT',
        isPrimary: undefined
      });
    });

    it('should return empty array if config has no chips or businessObject is missing', () => {
      const configWithNoChips = { ...PR_BASE_CONFIG, cardChips: undefined };
      expect(mapCardChips(configWithNoChips, {})).toEqual([]);
      expect(mapCardChips(PR_BASE_CONFIG, null)).toEqual([]);
    });

    it('should skip chips if path resolves to empty/null value', () => {
      const businessObject = {
        header: {
          totalNetAmount: '', // empty
          displayCurrency: 'VND',
          purchaseRequisitionTypeDisplay: null, // null
          departmentDisplay: 'IT Dept' // valid
        }
      };

      const chips = mapCardChips(PR_BASE_CONFIG, businessObject);
      // It should skip totalNetAmount and purchaseRequisitionTypeDisplay
      expect(chips.length).toBe(1);
      expect(chips[0].value).toBe('IT Dept');
    });
  });
});
