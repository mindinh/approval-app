import { describe, it, expect } from 'vitest';
import { INBOX_FILTER_CONFIG } from '@/pages/Inbox/components/inboxFilterConfig';

describe('INBOX_FILTER_CONFIG', () => {
    it('defines standard search filters', () => {
        const keys = INBOX_FILTER_CONFIG.map(f => f.key);
        expect(keys).toContain('search');
        expect(keys).not.toContain('status');
        expect(keys).toContain('priority');
        expect(keys).toContain('documentType');
        expect(keys).toContain('createdBy');
        expect(keys).toContain('documentId');
        expect(keys).toContain('createdDate');
    });

    it('contains correct default visibility flags', () => {
        const search = INBOX_FILTER_CONFIG.find(f => f.key === 'search');
        expect(search?.visible).toBe(true);

        const createdBy = INBOX_FILTER_CONFIG.find(f => f.key === 'createdBy');
        expect(createdBy?.visible).toBe(false);

        const createdDate = INBOX_FILTER_CONFIG.find(f => f.key === 'createdDate');
        expect(createdDate?.visible).toBe(false);
    });

    it('defines correct priority options', () => {
        const statusField = INBOX_FILTER_CONFIG.find(f => f.key === 'status');
        expect(statusField).toBeUndefined();

        const priorityField = INBOX_FILTER_CONFIG.find(f => f.key === 'priority');
        expect(priorityField?.type).toBe('multiselect');
        expect(priorityField?.options).toContainEqual({ value: 'HIGH', label: 'High' });
    });

    it('defines documentType selection option options', () => {
        const docTypeField = INBOX_FILTER_CONFIG.find(f => f.key === 'documentType');
        expect(docTypeField?.type).toBe('select');
        expect(docTypeField?.options).toEqual([
            { value: 'PR', label: 'Purchase Requisition' },
            { value: 'PO', label: 'Purchase Order' },
            { value: 'ZBUS2093', label: 'Reservation' },
        ]);
    });

    it('defines normalTask selection option options', () => {
        const normalTaskField = INBOX_FILTER_CONFIG.find(f => f.key === 'normalTask');
        expect(normalTaskField?.type).toBe('select');
        expect(normalTaskField?.options).toEqual([
            { value: 'NORMAL', label: 'Standard Approval' },
            { value: 'TAGGED', label: 'CC' },
        ]);
    });
});
