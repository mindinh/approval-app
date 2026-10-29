import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

function startup() {
    const root = { childElementCount: 0 };
    const scripts: { src?: string; tagName: string; onload?: () => void }[] = [];
    const events: { type: string; detail?: { code: string; baseUrl: string } }[] = [];
    const elements = new Map<string, Record<string, unknown>>();
    const listeners: Record<string, (event: unknown) => void> = {};
    let observe: () => void = () => {};
    let workerUpdates = 0;
    const context = {
        URL, Promise, setTimeout, clearTimeout,
        CustomEvent: class { constructor(public type: string, public options?: { detail: unknown }) {} get detail() { return this.options?.detail; } },
        document: {
            documentElement: { lang: 'en' },
            currentScript: { src: 'https://approval.example/cnma/startup.js', getAttribute: (key: string) => key === 'data-service-worker' ? 'true' : 'false' },
            getElementById: (id: string) => {
                if (id === 'root') return root;
                if (!elements.has(id)) elements.set(id, {});
                return elements.get(id);
            },
            createElement: (tagName: string) => ({ tagName }),
            head: { appendChild: (element: typeof scripts[number]) => { scripts.push(element); } },
        },
        navigator: { language: 'vi', onLine: true, serviceWorker: { register: async () => { workerUpdates++; } } },
        window: {
            addEventListener: (name: string, handler: (event: unknown) => void) => { listeners[name] = handler; },
            dispatchEvent: (event: typeof events[number]) => { events.push(event); },
        },
        MutationObserver: class {
            constructor(callback: () => void) { observe = callback; }
            observe() {}
            disconnect() {}
        },
    };
    runInNewContext(readFileSync(new URL('../../public/startup.js', import.meta.url), 'utf8'), context);
    return { root, scripts, events, listeners, observe: () => observe(), workerUpdates: () => workerUpdates };
}

afterEach(() => vi.useRealTimers());

describe('startup controller independent of the app bundle', () => {
    it('loads an isolated recovery bundle when the app script fails', () => {
        vi.useFakeTimers();
        const app = startup();
        app.listeners.error({ target: { tagName: 'SCRIPT' } });
        const script = app.scripts.find(element => element.tagName === 'script');
        expect(script?.src).toBe('https://approval.example/cnma/startup-recovery.js');
        script?.onload?.();
        expect(app.events.at(-1)?.detail).toEqual({ code: 'ASSET_LOAD_FAILED', baseUrl: 'https://approval.example/cnma/' });
    });

    it('offers recovery after a stalled startup without an automatic reload', () => {
        vi.useFakeTimers();
        const app = startup();
        vi.advanceTimersByTime(20000);
        app.scripts.find(element => element.tagName === 'script')?.onload?.();
        expect(app.events.at(-1)?.detail?.code).toBe('STARTUP_TIMEOUT');
    });

    it('dismisses recovery and cancels the watchdog when the app commits', () => {
        vi.useFakeTimers();
        const app = startup();
        app.root.childElementCount = 1;
        app.observe();
        vi.advanceTimersByTime(20000);
        expect(app.events.at(-1)?.type).toBe('cnma:startup-ready');
        expect(app.scripts).toHaveLength(0);
    });

    it('updates the worker without needing React to load', () => {
        vi.useFakeTimers();
        expect(startup().workerUpdates()).toBe(1);
    });

    it('does not show a startup failure for a missing favicon', () => {
        vi.useFakeTimers();
        const app = startup();
        app.listeners.error({ target: { tagName: 'LINK', rel: 'icon' } });
        expect(app.scripts).toHaveLength(0);
    });
});
