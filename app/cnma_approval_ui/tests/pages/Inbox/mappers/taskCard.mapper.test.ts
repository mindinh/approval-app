import { describe, it, expect } from 'vitest';
import { resolveTaskCardConfigForTask } from '@/renderers/ObjectView.registry';
import type { InboxTask } from '@/services/inbox/inbox.types';

function mapBusinessChips(task: InboxTask, cachedDetail?: any) {
    return resolveTaskCardConfigForTask(task, cachedDetail).chips;
}


const baseTask: InboxTask = {
    instanceId: 'inst-1',
    taskDefinitionId: 'def-1',
    title: 'Approve PO 4500001234',
    status: 'READY',
    priority: 'MEDIUM',
    createdOn: '2024-04-09T10:00:00Z',
    createdByName: 'Test User',
    sapOrigin: 'origin1',
    supports: {
        forward: true,
        comments: true
    }
};

describe('mapBusinessChips', () => {
    it('returns empty array when no businessContext', () => {
        expect(mapBusinessChips(baseTask)).toEqual([]);
    });

    it('returns empty array for unknown context type', () => {
        const task = {
            ...baseTask,
            businessContext: { type: 'UNKNOWN' },
        };
        expect(mapBusinessChips(task as any)).toEqual([]);
    });

    it('extracts PO total with currency', () => {
        const task = {
            ...baseTask,
            businessContext: {
                type: 'PO',
                po: {
                    header: {
                        purchaseOrderNetAmount: '1234.56',
                        documentCurrency: 'USD',
                    },
                },
            },
        };
        const chips = mapBusinessChips(task as any);
        const total = chips.find((c) => c.label === 'Total');
        expect(total).toBeDefined();
        expect(total!.value).toContain('1,234.56');
        expect(total!.value).toContain('USD');
        expect(total!.isPrimary).toBe(true);
    });

    it('extracts PO type text', () => {
        const task = {
            ...baseTask,
            businessContext: {
                type: 'PO',
                po: { header: { purchaseOrderTypeText: 'Standard PO' } },
            },
        };
        const chips = mapBusinessChips(task as any);
        expect(chips.find((c) => c.label === 'Type')?.value).toBe('Standard PO');
    });

    it('extracts PR total with currency', () => {
        const task = {
            ...baseTask,
            businessContext: {
                type: 'PR',
                pr: { header: { totalNetAmount: '9876.50', displayCurrency: 'EUR' } },
            },
        };
        const chips = mapBusinessChips(task as any);
        const total = chips.find((c) => c.label === 'Total');
        expect(total).toBeDefined();
        expect(total!.value).toContain('9,876.5');
        expect(total!.value).toContain('EUR');
        expect(total!.isPrimary).toBe(true);
    });

    it('extracts PR type', () => {
        const task = {
            ...baseTask,
            businessContext: {
                type: 'PR',
                pr: { header: { purchaseRequisitionType: 'NB' } },
            },
        };
        const chips = mapBusinessChips(task as any);
        expect(chips.find((c) => c.label === 'Type')?.value).toBe('NB');
    });


    it('returns empty list when PO context has no header', () => {
        const task = {
            ...baseTask,
            businessContext: { type: 'PO', po: {} },
        };
        expect(mapBusinessChips(task as any)).toEqual([]);
    });

    it('formats AMOUNT businessChips correctly using chip.currency or task.curr_vnd fallback', () => {
        const taskWithChipCurrency = {
            ...baseTask,
            businessChips: [
                { label: 'Total Amount', value: 2270982, dataType: 'AMOUNT', currency: 'VND', isPrimary: true },
            ],
        };
        const chips1 = mapBusinessChips(taskWithChipCurrency as any);
        expect(chips1.find((c) => c.label === 'Total Amount')?.value).toBe('2,270,982 VND');

        const taskWithFallbackCurrency = {
            ...baseTask,
            curr_vnd: 'VND',
            businessChips: [
                { label: 'Total Amount', value: 2270982, dataType: 'AMOUNT', isPrimary: true },
            ],
        };
        const chips2 = mapBusinessChips(taskWithFallbackCurrency as any);
        expect(chips2.find((c) => c.label === 'Total Amount')?.value).toBe('2,270,982 VND');
    });
});
