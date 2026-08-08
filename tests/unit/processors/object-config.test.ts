import { describe, it, expect } from 'vitest';
import {
  resolveJsonPath,
  getObjectConfig,
  mapCardChips
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

  describe('getObjectConfig', () => {
    it('should return config for valid object types PR and PO', () => {
      const prConfig = getObjectConfig('PR');
      expect(prConfig).toBeDefined();
      expect(prConfig.object.objectType).toBe('PR');

      const poConfig = getObjectConfig('PO');
      expect(poConfig).toBeDefined();
      expect(poConfig.object.objectType).toBe('PO');
    });

    it('should return subtype config if documentType matches registered documentType in config', () => {
      const zassConfig = getObjectConfig('PO', 'ZASS');
      expect(zassConfig).toBeDefined();
      expect(zassConfig.documentTypes.ZASS.name).toBe('Asset PO');
    });
  });

  describe('mapCardChips', () => {
    it('should map chips correctly based on configuration', () => {
      const prConfig = getObjectConfig('PR');
      const businessObject = {
        header: {
          totalNetAmount: '15000000',
          displayCurrency: 'VND',
          purchaseRequisitionTypeDisplay: 'Asset PR',
          departmentDisplay: 'IT Dept'
        }
      };

      const chips = mapCardChips(prConfig, businessObject);
      expect(chips.length).toBeGreaterThan(0);
      expect(chips[0].label).toBe('Total');
      expect(chips[0].value).toBe('15000000');
    });

    it('should return empty array if config has no chips or businessObject is missing', () => {
      expect(mapCardChips({ cardChips: undefined }, {})).toEqual([]);
      expect(mapCardChips(getObjectConfig('PR'), null)).toEqual([]);
    });

    it('should skip chips if path resolves to empty/null value', () => {
      const prConfig = getObjectConfig('PR');
      const businessObject = {
        header: {
          totalNetAmount: '', // empty
          displayCurrency: 'VND',
          purchaseRequisitionTypeDisplay: null, // null
          departmentDisplay: 'IT Dept' // valid
        }
      };

      const chips = mapCardChips(prConfig, businessObject);
      expect(chips.every(c => Boolean(c.value))).toBe(true);
    });

    it('should map Reservation chips with header.currency correctly', () => {
      const reConfig = getObjectConfig('RE');
      const businessObject = {
        header: {
          total: 2270982,
          currency: 'VND',
          documentTypeDisplay: 'RESV - Reservation'
        }
      };

      const chips = mapCardChips(reConfig, businessObject);
      const totalChip = chips.find(c => c.label === 'Total Amount');
      expect(totalChip).toBeDefined();
      expect(totalChip.value).toBe(2270982);
      expect(totalChip.currency).toBe('VND');
    });
  });
});
