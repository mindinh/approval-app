import { describe, it, expect } from 'vitest';
import { resolveObjectTypeFromTypeId } from '../../../srv/lib/processors/odata-config';

describe('odata-config', () => {
  describe('resolveObjectTypeFromTypeId', () => {
    it('should map exact type ids directly', () => {
      expect(resolveObjectTypeFromTypeId('BUS2105')).toBe('PR');
      expect(resolveObjectTypeFromTypeId('WS90000001')).toBe('PR');
      expect(resolveObjectTypeFromTypeId('BUS2012')).toBe('PO');
      expect(resolveObjectTypeFromTypeId('BUS2093')).toBe('RE');
      expect(resolveObjectTypeFromTypeId('ZCLAIM')).toBe('CLAIM');
    });

    it('should map using regex/substring patterns for PR', () => {
      expect(resolveObjectTypeFromTypeId('TS123_pr_task')).toBe('PR');
      expect(resolveObjectTypeFromTypeId('BUS2105_custom')).toBe('PR');
      expect(resolveObjectTypeFromTypeId('TS_PR_APPROVE')).toBe('PR');
    });

    it('should map using regex/substring patterns for PO', () => {
      expect(resolveObjectTypeFromTypeId('custom_BUS2012')).toBe('PO');
      expect(resolveObjectTypeFromTypeId('approve_po_step')).toBe('PO');
    });

    it('should map using regex/substring patterns for RE', () => {
      expect(resolveObjectTypeFromTypeId('custom_BUS2093')).toBe('RE');
      expect(resolveObjectTypeFromTypeId('reservation_approval')).toBe('RE');
    });

    it('should fallback to PR default for unknown type ids', () => {
      expect(resolveObjectTypeFromTypeId('UNKNOWN_TYPE_ID')).toBe('PR');
      expect(resolveObjectTypeFromTypeId('')).toBe('PR');
    });
  });
});
