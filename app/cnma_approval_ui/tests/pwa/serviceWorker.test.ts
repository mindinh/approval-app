import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

// Execute the shipped worker; only the browser Cache/Fetch boundary is simulated.
function worker(networkResponse = new Response('export {}', { headers: { 'Content-Type': 'application/javascript' } })) {
    const entries = new Map<string, Response>();
    const handlers: Record<string, (event: any) => void> = {};
    const cache = {
        match: async (request: Request) => entries.get(request.url)?.clone(),
        put: async (request: Request, response: Response) => { entries.set(request.url, response); },
        delete: async (request: Request) => entries.delete(request.url),
    };
    runInNewContext(readFileSync(new URL('../../public/sw.js', import.meta.url), 'utf8'), {
        URL, Response, Promise,
        self: {
            location: { origin: 'https://approval.example' },
            registration: { scope: 'https://approval.example/' },
            navigator: { onLine: true },
            addEventListener: (name: string, handler: any) => { handlers[name] = handler; },
        },
        caches: { open: async () => cache, match: cache.match },
        fetch: async () => networkResponse.clone(),
    });
    return {
        entries,
        async request(path: string, mode = 'cors') {
            let response: Promise<Response> | undefined;
            const tasks: Promise<unknown>[] = [];
            handlers.fetch({
                request: { method: 'GET', url: new URL(path, 'https://approval.example').href, mode },
                respondWith: (promise: Promise<Response>) => { response = promise; },
                waitUntil: (promise: Promise<unknown>) => { tasks.push(promise); },
            });
            const result = await response;
            await Promise.all(tasks);
            return result;
        },
    };
}

describe('service worker authentication boundaries', () => {
    it('does not persist login HTML returned with status 200 for a JS asset', async () => {
        const app = worker(new Response('<html>Login</html>', { headers: { 'Content-Type': 'text/html' } }));
        await app.request('/assets/index.js');
        expect(app.entries.size).toBe(0);
    });

    it('replaces previously poisoned JavaScript cache with a real script', async () => {
        const app = worker();
        app.entries.set('https://approval.example/assets/index.js', new Response('<html>Login</html>', { headers: { 'Content-Type': 'text/html' } }));
        const response = await app.request('/assets/index.js');
        expect(await response!.text()).toBe('export {}');
    });

    it('keeps valid JavaScript available from cache', async () => {
        const app = worker();
        await app.request('/assets/index.js');
        expect(await app.entries.get('https://approval.example/assets/index.js')!.text()).toBe('export {}');
    });

    it.each(['/api/cnma/APPROVAL_SRV/tasks/me', '/user-api/currentUser', '/login/callback', '/index.html', '/startup.js', '/web-manifest.json', '/sap-pwa-icon-192-v4.png', '/sap-apple-touch-icon-v3.png'])('does not intercept session, bootstrap, or mutable install metadata %s', async (path) => {
        expect(await worker().request(path)).toBeUndefined();
    });

    it('lets the browser handle navigation and cross-origin login redirects', async () => {
        expect(await worker().request('/index.html', 'navigate')).toBeUndefined();
    });

    it('does not store a redirected response even when it has a JavaScript MIME type', async () => {
        const response = new Response('login', { headers: { 'Content-Type': 'application/javascript' } });
        Object.defineProperty(response, 'redirected', { value: true });
        response.clone = () => response;
        const app = worker(response);
        await app.request('/assets/index.js');
        expect(app.entries.size).toBe(0);
    });
});
