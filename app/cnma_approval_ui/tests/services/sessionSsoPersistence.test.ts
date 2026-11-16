import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
    logout,
    pingSessionKeepAlive,
    reauthenticateSession,
    startSuspendDetector,
    triggerSessionExpiredGlobal,
} from '@/components/providers/SessionTimeoutProvider';
import axiosInstance from '@/services/core/axiosInstance';

function createMemoryStorage(): Storage {
    const store = new Map<string, string>();
    return {
        get length() {
            return store.size;
        },
        clear: () => store.clear(),
        getItem: (key: string) => store.get(key) ?? null,
        key: (index: number) => Array.from(store.keys())[index] ?? null,
        removeItem: (key: string) => {
            store.delete(key);
        },
        setItem: (key: string, value: string) => {
            store.set(key, value);
        },
    };
}

describe('SSO Session Persistence & Silent Re-authentication (Standalone + WorkZone)', () => {
    let mockStorage: Storage;
    let reloadMock: ReturnType<typeof vi.fn>;
    let topReloadMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockStorage = createMemoryStorage();
        reloadMock = vi.fn();
        topReloadMock = vi.fn();

        vi.stubGlobal('sessionStorage', mockStorage);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    describe('1. Approuter & XSUAA Configuration Contracts', () => {
        const repoRoot = path.resolve(__dirname, '../../../..');

        it('configures Standalone Approuter (app/router/xs-app.json) with 20-day sessionTimeout (safe from 32-bit timer overflow)', () => {
            const raw = fs.readFileSync(path.join(repoRoot, 'app/router/xs-app.json'), 'utf8');
            const config = JSON.parse(raw);
            expect(config.sessionTimeout).toBe(28800);
            expect(config.sessionTimeout * 60 * 1000).toBeLessThanOrEqual(2147483647);
        });

        it('configures WorkZone Managed Approuter (public/xs-app.json) with 20-day sessionTimeout (safe from 32-bit timer overflow)', () => {
            const raw = fs.readFileSync(path.join(repoRoot, 'app/cnma_approval_ui/public/xs-app.json'), 'utf8');
            const config = JSON.parse(raw);
            expect(config.sessionTimeout).toBe(28800);
            expect(config.sessionTimeout * 60 * 1000).toBeLessThanOrEqual(2147483647);
        });

        it('does not force an identity provider on WorkZone routes (reuses the WorkZone IAS session instead of a second login in the iframe)', () => {
            const raw = fs.readFileSync(path.join(repoRoot, 'app/cnma_approval_ui/public/xs-app.json'), 'utf8');
            const config = JSON.parse(raw);
            for (const route of config.routes) {
                expect(route.identityProvider).toBeUndefined();
            }
        });

        it('configures XSUAA (xs-security.json) with 12h access token and 30-day refresh token validity', () => {
            const raw = fs.readFileSync(path.join(repoRoot, 'xs-security.json'), 'utf8');
            const config = JSON.parse(raw);
            expect(config['oauth2-configuration']['token-validity']).toBeGreaterThanOrEqual(43200);
            expect(config['oauth2-configuration']['refresh-token-validity']).toBe(2592000);
        });
    });

    describe('2. Standalone Approuter Silent Re-authentication', () => {
        it('reloads current window to trigger OAuth2 silent SSO and never navigates to /do/logout', () => {
            const fakeWindow: Record<string, any> = {
                location: { href: 'https://standalone.example/index.html#/inbox', reload: reloadMock },
            };
            fakeWindow.parent = fakeWindow;
            fakeWindow.top = fakeWindow;
            vi.stubGlobal('window', fakeWindow);

            mockStorage.setItem('session_active', 'true');

            const triggered = reauthenticateSession(false);

            expect(triggered).toBe(true);
            expect(reloadMock).toHaveBeenCalledTimes(1);
            expect(fakeWindow.location.href).not.toContain('/do/logout');
            expect(mockStorage.getItem('session_active')).toBeNull();
            expect(Number(mockStorage.getItem('cnma_reauth_ts'))).toBeGreaterThan(0);
        });

        it('prevents infinite reload loops within the 30-second cooldown unless forced by user click', () => {
            const fakeWindow: Record<string, any> = {
                location: { href: 'https://standalone.example/index.html#/inbox', reload: reloadMock },
            };
            fakeWindow.parent = fakeWindow;
            fakeWindow.top = fakeWindow;
            vi.stubGlobal('window', fakeWindow);

            // First automatic silent re-auth succeeds
            expect(reauthenticateSession(false)).toBe(true);
            expect(reloadMock).toHaveBeenCalledTimes(1);

            // Second automatic attempt within 30s is blocked by cooldown guard
            expect(reauthenticateSession(false)).toBe(false);
            expect(reloadMock).toHaveBeenCalledTimes(1);

            // Explicit user click ("Sign In Again" -> force = true) bypasses cooldown
            expect(reauthenticateSession(true)).toBe(true);
            expect(reloadMock).toHaveBeenCalledTimes(2);
            expect(fakeWindow.location.href).not.toContain('/do/logout');
        });
    });

    describe('3. SAP Build Work Zone (Iframe) Silent Re-authentication', () => {
        it('reloads top-level WorkZone window when same-origin iframe is detected', () => {
            const topWindow = {
                location: { href: 'https://workzone.example/site#cnma-approve', reload: topReloadMock },
            };
            const iframeWindow: Record<string, any> = {
                parent: topWindow,
                top: topWindow,
                location: { href: 'https://workzone.example/cnma/index.html', reload: reloadMock },
            };
            vi.stubGlobal('window', iframeWindow);

            const triggered = reauthenticateSession(false);

            expect(triggered).toBe(true);
            expect(topReloadMock).toHaveBeenCalledTimes(1);
            expect(reloadMock).not.toHaveBeenCalled();
            expect(iframeWindow.location.href).not.toContain('/do/logout');
        });

        it('falls back to navigating top window to document.referrer when cross-origin reload is blocked', () => {
            const topWindow = {
                location: {
                    href: 'https://workzone.example/site',
                    reload: () => {
                        throw new Error('Blocked a frame from accessing a cross-origin frame');
                    },
                },
            };
            const iframeWindow: Record<string, any> = {
                parent: topWindow,
                top: topWindow,
                location: { href: 'https://html5-app.example/index.html', reload: reloadMock },
            };
            vi.stubGlobal('window', iframeWindow);
            vi.stubGlobal('document', { referrer: 'https://workzone.example/site?siteId=123#cnma-approve' });

            const triggered = reauthenticateSession(false);

            expect(triggered).toBe(true);
            expect(topWindow.location.href).toBe('https://workzone.example/site?siteId=123#cnma-approve');
            expect(iframeWindow.location.href).not.toContain('/do/logout');
        });
    });

    describe('4. Session Keep-Alive Heartbeat', () => {
        it('pings the health endpoint with credentials included and throttles duplicate calls within 5 minutes', async () => {
            const fetchMock = vi.fn().mockResolvedValue(new Response('{}', {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }));
            vi.stubGlobal('fetch', fetchMock);

            await expect(pingSessionKeepAlive(true)).resolves.toBe(true);
            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(fetchMock).toHaveBeenCalledWith(
                'api/cnma/APPROVAL_SRV/health',
                expect.objectContaining({
                    method: 'GET',
                    credentials: 'include',
                    cache: 'no-store',
                })
            );

            // Non-forced call immediately after should be throttled
            await pingSessionKeepAlive(false);
            expect(fetchMock).toHaveBeenCalledTimes(1);

            // Forced call (e.g. clicking "Continue Working") executes immediately
            await pingSessionKeepAlive(true);
            expect(fetchMock).toHaveBeenCalledTimes(2);
        });

        it('reports a dead session on 401 or login HTML, but not on network errors', async () => {
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 401 })));
            await expect(pingSessionKeepAlive(true)).resolves.toBe(false);

            vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html></html>', {
                status: 200,
                headers: { 'Content-Type': 'text/html' },
            })));
            await expect(pingSessionKeepAlive(true)).resolves.toBe(false);

            vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
            await expect(pingSessionKeepAlive(true)).resolves.toBe(true);
        });
    });

    describe('6. Background Resume Detection', () => {
        afterEach(() => {
            vi.useRealTimers();
        });

        it('fires once when timers were frozen for more than 5 minutes, not during normal ticking', () => {
            vi.useFakeTimers();
            const onResume = vi.fn();
            const detector = startSuspendDetector(onResume);

            // Normal foreground ticking for 10 minutes
            vi.advanceTimersByTime(10 * 60 * 1000);
            expect(onResume).not.toHaveBeenCalled();

            // WebView suspended: wall clock jumps 2 hours, then one late tick runs
            vi.setSystemTime(Date.now() + 2 * 60 * 60 * 1000);
            vi.advanceTimersByTime(30 * 1000);
            expect(onResume).toHaveBeenCalledTimes(1);

            vi.advanceTimersByTime(60 * 1000);
            expect(onResume).toHaveBeenCalledTimes(1);
            detector.stop();
        });

        it('skips a resume already handled by visibilitychange (reset)', () => {
            vi.useFakeTimers();
            const onResume = vi.fn();
            const detector = startSuspendDetector(onResume);

            vi.setSystemTime(Date.now() + 2 * 60 * 60 * 1000);
            detector.reset();
            vi.advanceTimersByTime(30 * 1000);
            expect(onResume).not.toHaveBeenCalled();
            detector.stop();
        });
    });

    describe('7. Explicit Logout', () => {
        it('runs /do/logout in the top WorkZone window, never inside the iframe', () => {
            const topWindow = { location: { href: 'https://workzone.example/site#cnma-approve' } };
            const iframeWindow: Record<string, any> = {
                parent: topWindow,
                top: topWindow,
                location: { href: 'https://workzone.example/cnma/index.html' },
            };
            vi.stubGlobal('window', iframeWindow);
            mockStorage.setItem('session_active', 'true');

            logout();

            expect(topWindow.location.href).toBe('/do/logout');
            expect(iframeWindow.location.href).toBe('https://workzone.example/cnma/index.html');
            expect(mockStorage.getItem('session_active')).toBeNull();
        });
    });

    describe('5. Axios Response Interceptor (HTML Login Redirect & 401)', () => {
        it('triggers silent SSO re-auth instead of /do/logout when a GET request receives login HTML', async () => {
            const fakeWindow: Record<string, any> = {
                location: { href: 'https://standalone.example/index.html#/inbox', reload: reloadMock },
            };
            fakeWindow.parent = fakeWindow;
            fakeWindow.top = fakeWindow;
            vi.stubGlobal('window', fakeWindow);

            const handlers = (axiosInstance.interceptors.response as any).handlers;
            const fulfilledHandler = handlers[0].fulfilled;

            const htmlResponse = {
                data: '<!DOCTYPE html><html><body>Redirecting to IAS...</body></html>',
                status: 200,
                headers: { 'content-type': 'text/html; charset=utf-8' },
                config: { url: 'api/cnma/APPROVAL_SRV/tasks/me', method: 'get' },
            };

            await expect(fulfilledHandler(htmlResponse)).rejects.toMatchObject({
                isUnauthorized: true,
            });

            expect(reloadMock).toHaveBeenCalledTimes(1);
            expect(fakeWindow.location.href).not.toContain('/do/logout');
        });

        it('never navigates to /do/logout when triggerSessionExpiredGlobal is called outside React tree', () => {
            const fakeWindow: Record<string, any> = {
                location: { href: 'https://standalone.example/index.html#/inbox', reload: reloadMock },
            };
            fakeWindow.parent = fakeWindow;
            fakeWindow.top = fakeWindow;
            vi.stubGlobal('window', fakeWindow);

            triggerSessionExpiredGlobal();

            expect(reloadMock).toHaveBeenCalledTimes(1);
            expect(fakeWindow.location.href).not.toContain('/do/logout');
        });

        it('does NOT reload or trigger session expired when 401 is caused by unmapped SAP user (SAP_AUTH_ERROR)', async () => {
            const fakeWindow: Record<string, any> = {
                location: { href: 'https://standalone.example/index.html#/inbox', reload: reloadMock },
            };
            fakeWindow.parent = fakeWindow;
            fakeWindow.top = fakeWindow;
            vi.stubGlobal('window', fakeWindow);

            const handlers = (axiosInstance.interceptors.response as any).handlers;
            const rejectedHandler = handlers[0].rejected;

            // Simulate backend response when SAP S/4HANA rejects Principal Propagation / unmapped SAP user
            const sapAuth401Error: any = {
                config: { url: 'api/cnma/APPROVAL_SRV/tasks/status-counts', method: 'get' },
                response: {
                    status: 401,
                    data: {
                        error: {
                            message: 'SAP authentication failure: Request failed with status code 401',
                            code: 'SAP_AUTH_ERROR',
                        },
                    },
                },
            };

            await expect(rejectedHandler(sapAuth401Error)).rejects.toMatchObject({
                isSapUserMappingMissing: true,
            });

            // Must NOT reload the screen or redirect to /do/logout!
            expect(reloadMock).not.toHaveBeenCalled();
            expect(fakeWindow.location.href).not.toContain('/do/logout');
        });
    });
});
