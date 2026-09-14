import { describe, it, expect } from 'vitest';
import {
    getTaskObjectCategory,
    filterTasksByCategory,
    computeCategoryCounts,
    CATEGORY_ACCORDION_SECTIONS,
    MAIN_CATEGORIES,
} from '@/pages/Inbox/utils/categoryUtils';
import type { InboxTask } from '@/services/inbox/inbox.types';

function createMockTask(overrides: Partial<InboxTask>): InboxTask {
    return {
        instanceId: '1001',
        title: 'Approve Task',
        status: 'READY',
        supports: { forward: true, comments: true },
        ...overrides,
    };
}

describe('categoryUtils', () => {
    describe('getTaskObjectCategory', () => {
        it('identifies PR tasks correctly', () => {
            expect(getTaskObjectCategory(createMockTask({ businessContext: { type: 'PR' } as any }))).toBe('PR');
            expect(getTaskObjectCategory(createMockTask({ objectType: 'BUS2105' }))).toBe('PR');
            expect(getTaskObjectCategory(createMockTask({ taskDefinitionId: 'WS00000001_BUS2105' }))).toBe('PR');
            expect(getTaskObjectCategory(createMockTask({ title: 'PR 10000213 for Project Alpha' }))).toBe('PR');
        });

        it('identifies PO tasks correctly', () => {
            expect(getTaskObjectCategory(createMockTask({ businessContext: { type: 'PO' } as any }))).toBe('PO');
            expect(getTaskObjectCategory(createMockTask({ objectType: 'BUS2012' }))).toBe('PO');
            expect(getTaskObjectCategory(createMockTask({ taskDefinitionId: 'TS00008018_BUS2012' }))).toBe('PO');
            expect(getTaskObjectCategory(createMockTask({ title: 'PO 4500001234 from Vendor' }))).toBe('PO');
        });

        it('identifies Reservation tasks correctly', () => {
            expect(getTaskObjectCategory(createMockTask({ businessContext: { type: 'RE' } as any }))).toBe('RESERVATION');
            expect(getTaskObjectCategory(createMockTask({ objectType: 'BUS2093' }))).toBe('RESERVATION');
            expect(getTaskObjectCategory(createMockTask({ objectType: 'ZBUS2093' }))).toBe('RESERVATION');
            expect(getTaskObjectCategory(createMockTask({ title: 'Material Reservation 100098' }))).toBe('RESERVATION');
        });

        it('identifies Claim tasks correctly', () => {
            expect(getTaskObjectCategory(createMockTask({ businessContext: { type: 'CLAIM' } as any }))).toBe('CLAIM');
            expect(getTaskObjectCategory(createMockTask({ objectType: 'ZCLAIM' }))).toBe('CLAIM');
            expect(getTaskObjectCategory(createMockTask({ taskDefinitionId: 'WF_CLAIM_APPROVAL' }))).toBe('CLAIM');
        });

        it('returns OTHER for unrecognized tasks', () => {
            expect(getTaskObjectCategory(createMockTask({ title: 'Random workflow task' }))).toBe('OTHER');
        });
    });

    describe('computeCategoryCounts', () => {
        it('accurately counts pending tasks across the 4 categories', () => {
            const mockTasks: InboxTask[] = [
                createMockTask({ instanceId: '1', businessContext: { type: 'PR' } as any }),
                createMockTask({ instanceId: '2', businessContext: { type: 'PR' } as any }),
                createMockTask({ instanceId: '3', businessContext: { type: 'PO' } as any }),
                createMockTask({ instanceId: '4', objectType: 'BUS2093' }),
                createMockTask({ instanceId: '5', businessContext: { type: 'CLAIM' } as any }),
                createMockTask({ instanceId: '6', title: 'Generic other task' }),
            ];

            const counts = computeCategoryCounts(mockTasks);
            expect(counts.ALL).toBe(6);
            expect(counts.PR).toBe(2);
            expect(counts.PO).toBe(1);
            expect(counts.RESERVATION).toBe(1);
            expect(counts.CLAIM).toBe(1);
        });
    });

    describe('filterTasksByCategory', () => {
        const mockTasks: InboxTask[] = [
            createMockTask({ instanceId: '1', businessContext: { type: 'PR' } as any }),
            createMockTask({ instanceId: '2', businessContext: { type: 'PO' } as any }),
            createMockTask({ instanceId: '3', objectType: 'BUS2093' }),
            createMockTask({ instanceId: '4', businessContext: { type: 'CLAIM' } as any }),
        ];

        it('returns all tasks when category is ALL or null', () => {
            expect(filterTasksByCategory(mockTasks, 'ALL')).toHaveLength(4);
            expect(filterTasksByCategory(mockTasks, null)).toHaveLength(4);
        });

        it('filters correctly for each category', () => {
            const prTasks = filterTasksByCategory(mockTasks, 'PR');
            expect(prTasks).toHaveLength(1);
            expect(prTasks[0].instanceId).toBe('1');

            const poTasks = filterTasksByCategory(mockTasks, 'PO');
            expect(poTasks).toHaveLength(1);
            expect(poTasks[0].instanceId).toBe('2');

            const resvTasks = filterTasksByCategory(mockTasks, 'RESERVATION');
            expect(resvTasks).toHaveLength(1);
            expect(resvTasks[0].instanceId).toBe('3');

            const claimTasks = filterTasksByCategory(mockTasks, 'CLAIM');
            expect(claimTasks).toHaveLength(1);
            expect(claimTasks[0].instanceId).toBe('4');
        });
    });

    describe('Category ordering', () => {
        it('defines sections in order: PR, PO, CLAIM, RESERVATION', () => {
            expect(CATEGORY_ACCORDION_SECTIONS.map((s) => s.key)).toEqual([
                'PR',
                'PO',
                'CLAIM',
                'RESERVATION',
            ]);
            expect(MAIN_CATEGORIES).toEqual(['PR', 'PO', 'CLAIM', 'RESERVATION']);
        });
    });
});
