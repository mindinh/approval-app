import { describe, expect, it } from 'vitest';
import { normalizeDashboardStatus } from '@/pages/Dashboard/use-dashboard-data';

describe('normalizeDashboardStatus', () => {
    it.each(['APPROVED', 'COMPLETED', 'COMPLETE', 'REJECTED', 'CANCELLED', 'CANCELED'])(
        'maps terminal status %s to Completed',
        (status) => {
            expect(normalizeDashboardStatus(status)).toBe('Completed');
        }
    );

    it.each(['READY', 'IN PROCESSING', 'STARTED'])(
        'maps active status %s to In Approving',
        (status) => {
            expect(normalizeDashboardStatus(status)).toBe('In Approving');
        }
    );
});
