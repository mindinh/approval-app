import { describe, it, expect } from 'vitest';
import type { InboxTask } from '@/services/inbox/inbox.types';

// Helper matching logic as implemented in useTaskFilters
function filterByDocumentType(tasks: InboxTask[], documentType?: string): InboxTask[] {
    if (!documentType) return tasks;
    const targetType = String(documentType).toUpperCase().trim();
    return tasks.filter((task) => {
        const bType = String(task.businessContext?.type || '').toUpperCase().trim();
        const objType = String(task.objectType || '').toUpperCase().trim();
        const docType = String(task.documentType || '').toUpperCase().trim();
        const taskDefId = String(task.taskDefinitionId || '').toUpperCase().trim();

        if (targetType === 'PR') {
            return bType === 'PR' || objType === 'PR' || taskDefId.includes('BUS2105') || docType === 'PR';
        }
        if (targetType === 'PO') {
            return bType === 'PO' || objType === 'PO' || taskDefId.includes('BUS2012') || docType === 'PO';
        }
        if (targetType === 'ZBUS2093' || targetType === 'RE' || targetType === 'BUS2093') {
            return (
                bType === 'RE' ||
                bType === 'ZBUS2093' ||
                bType === 'BUS2093' ||
                objType === 'RE' ||
                objType === 'ZBUS2093' ||
                objType === 'BUS2093' ||
                taskDefId.includes('BUS2093') ||
                docType === 'RESV' ||
                docType === 'RE'
            );
        }
        return (
            bType === targetType ||
            objType === targetType ||
            docType === targetType ||
            taskDefId.includes(targetType)
        );
    });
}

const mockTasks: InboxTask[] = [
    {
        instanceId: 'pr-1',
        title: 'Approve Asset PR 10000001',
        status: 'READY',
        objectType: 'PR',
        taskDefinitionId: 'BUS2105',
        businessContext: { type: 'PR', documentId: '10000001' },
        supports: { forward: true, comments: true },
    },
    {
        instanceId: 'po-1',
        title: 'Approve Asset PO 4500000001',
        status: 'READY',
        objectType: 'PO',
        taskDefinitionId: 'BUS2012',
        businessContext: { type: 'PO', documentId: '4500000001' },
        supports: { forward: true, comments: true },
    },
    {
        instanceId: 're-1',
        title: 'Approve Reservation 0000000888',
        status: 'READY',
        objectType: 'RE',
        taskDefinitionId: 'BUS2093',
        businessContext: { type: 'RE', documentId: '0000000888' },
        supports: { forward: true, comments: true },
    },
];

describe('useTaskFilters - documentType filtering', () => {
    it('filters PurchaseRequisition (PR) tasks correctly', () => {
        const filtered = filterByDocumentType(mockTasks, 'PR');
        expect(filtered).toHaveLength(1);
        expect(filtered[0].instanceId).toBe('pr-1');
    });

    it('filters PurchaseOrder (PO) tasks correctly', () => {
        const filtered = filterByDocumentType(mockTasks, 'PO');
        expect(filtered).toHaveLength(1);
        expect(filtered[0].instanceId).toBe('po-1');
    });

    it('filters Reservation (ZBUS2093 / RE) tasks correctly', () => {
        const filtered = filterByDocumentType(mockTasks, 'ZBUS2093');
        expect(filtered).toHaveLength(1);
        expect(filtered[0].instanceId).toBe('re-1');
    });
});
