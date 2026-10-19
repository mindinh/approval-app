import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetAppCache } from '../../src/utils/pwa';

afterEach(() => vi.unstubAllGlobals());

describe('app cache reset', () => {
    it('preserves other app caches and worker registrations', async () => {
        const baseUrl = 'https://approval.example/cnma/';
        const keys = new Set(['prorequest-v2-sap-icons', `prorequest-v3-static-${encodeURIComponent(baseUrl)}`, 'other-app']);
        const registrations = new Set([baseUrl, 'https://approval.example/other/']);
        vi.stubGlobal('navigator', {
            serviceWorker: {
                getRegistrations: async () => [...registrations].map(scope => ({
                    scope, unregister: async () => registrations.delete(scope),
                })),
            },
        });
        vi.stubGlobal('window', {
            caches: { keys: async () => [...keys], delete: async (key: string) => keys.delete(key) },
        });
        await resetAppCache(baseUrl);
        expect([...keys]).toEqual(['other-app']);
        expect([...registrations]).toEqual(['https://approval.example/other/']);
    });

    it('allows retry when mobile/private browsing denies storage', async () => {
        vi.stubGlobal('navigator', { serviceWorker: { getRegistrations: async () => { throw new Error('denied'); } } });
        vi.stubGlobal('window', { caches: { keys: async () => { throw new Error('denied'); } } });
        await expect(resetAppCache('https://approval.example/')).resolves.toBeUndefined();
    });
});
