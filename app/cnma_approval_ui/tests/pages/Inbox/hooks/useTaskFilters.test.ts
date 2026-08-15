import { describe, it, expect } from 'vitest';
import type { InboxTask } from '@/services/inbox/inbox.types';
import { matchTaskDocumentType } from '@/pages/Inbox/hooks/useTaskFilters';

function filterByDocumentTypes(tasks: InboxTask[], documentType?: string | string[]): InboxTask[] {
    const selectedDocTypes = Array.isArray(documentType)
        ? documentType
        : documentType
          ? [documentType]
          : [];
    if (selectedDocTypes.length === 0) return tasks;
    return tasks.filter((task) => selectedDocTypes.some((target) => matchTaskDocumentType(task, target)));
}

const mockTasks: InboxTask[] = [
    {
        instanceId: 'pr-1',
        title: 'Approve Asset PR 10000001',
        status: 'READY',
        objectType: 'PR',
        documentType: 'ZASS',
        documentTypeDisplay: 'Asset PR (ZASS)',
        taskDefinitionId: 'BUS2105',
        businessContext: { type: 'PR', documentId: '10000001' },
        supports: { forward: true, comments: true },
    },
    {
        instanceId: 'po-1',
        title: 'Approve Expense PO 4500000001',
        status: 'READY',
        objectType: 'PO',
        documentType: 'ZEXP',
        documentTypeDisplay: 'Expense PO (ZEXP)',
        taskDefinitionId: 'BUS2012',
        businessContext: { type: 'PO', documentId: '4500000001' },
        supports: { forward: true, comments: true },
    },
    {
        instanceId: 'po-2',
        title: 'Approve Consignment PO 4500000002',
        status: 'READY',
        objectType: 'PO',
        documentType: 'ZCON',
        documentTypeDisplay: 'Consignment PO (ZCON)',
        taskDefinitionId: 'BUS2012',
        businessContext: { type: 'PO', documentId: '4500000002' },
        supports: { forward: true, comments: true },
    },
    {
        instanceId: 're-1',
        title: 'Approve Reservation 0000000888',
        status: 'READY',
        objectType: 'RE',
        documentTypeDisplay: 'Reservation (ZBUS2093)',
        taskDefinitionId: 'BUS2093',
        businessContext: { type: 'RE', documentId: '0000000888' },
        supports: { forward: true, comments: true },
    },
];

describe('useTaskFilters - documentType multiselect filtering', () => {
    it('filters single document type selection by text (e.g. Asset PR)', () => {
        const filtered = filterByDocumentTypes(mockTasks, ['Asset PR']);
        expect(filtered).toHaveLength(1);
        expect(filtered[0].instanceId).toBe('pr-1');
    });

    it('filters multiple document type selections by text (e.g. Asset PR and Expense PO)', () => {
        const filtered = filterByDocumentTypes(mockTasks, ['Asset PR', 'Expense PO']);
        expect(filtered).toHaveLength(2);
        expect(filtered.map(t => t.instanceId)).toEqual(['pr-1', 'po-1']);
    });

    it('filters Reservation tasks correctly', () => {
        const filtered = filterByDocumentTypes(mockTasks, ['Reservation']);
        expect(filtered).toHaveLength(1);
        expect(filtered[0].instanceId).toBe('re-1');
    });

    it('returns all tasks when filter selection is cleared or empty', () => {
        const filtered = filterByDocumentTypes(mockTasks, []);
        expect(filtered).toHaveLength(4);
    });

    it('supports legacy category filtering (PR / PO / ZBUS2093)', () => {
        const prTasks = filterByDocumentTypes(mockTasks, ['PR']);
        expect(prTasks).toHaveLength(1);
        expect(prTasks[0].instanceId).toBe('pr-1');

        const poTasks = filterByDocumentTypes(mockTasks, ['PO']);
        expect(poTasks).toHaveLength(2);
        expect(poTasks.map(t => t.instanceId)).toEqual(['po-1', 'po-2']);
    });
});
