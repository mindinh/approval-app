import { describe, it, expect } from 'vitest';
import { resolveBusinessSectionModel } from '@/renderers';
import { PO_HEADER, PO_ITEMS } from './fixtures';

/** A large PO (200 line items) whose keys mostly miss the exact-case lookup — the worst case for field resolution. */
function largePo() {
    const items = Array.from({ length: 200 }, (_, i) => {
        const base = PO_ITEMS[i % PO_ITEMS.length];
        const padded: Record<string, unknown> = { ...base, ItemNumber: String(i + 1).padStart(5, '0') };
        for (let k = 0; k < 40; k++) padded[`extraField${k}`] = `v${k}`;
        return padded;
    });
    return { businessObject: { ...PO_HEADER, DocumentType: 'ZMAK', _Item: items } };
}

describe('renderer performance', () => {
    it('resolves a 200-item PO quickly', () => {
        const input = largePo();
        resolveBusinessSectionModel(input); // warm-up
        const runs = 20;
        const start = performance.now();
        for (let i = 0; i < runs; i++) resolveBusinessSectionModel(input);
        const avgMs = (performance.now() - start) / runs;
        console.info(`[perf] 200-item PO resolve: ${avgMs.toFixed(2)} ms/run`);
        expect(avgMs).toBeLessThan(100);
    });
});
