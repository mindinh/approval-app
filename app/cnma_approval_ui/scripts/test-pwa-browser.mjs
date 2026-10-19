// Usage: node scripts/test-pwa-browser.mjs <path-to-playwright-package>
// Tests the production build locally; mobile profiles emulate viewport/UA, not OS installation.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium, firefox, webkit, devices } = require(process.argv[2] || 'playwright');
const dist = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');
const output = resolve(dirname(fileURLToPath(import.meta.url)), '../.pwa-test-results');
await mkdir(output, { recursive: true });
const prefixes = ['/', '/cnma/', '/html5-apps/cnma/'];
const mime = { '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.js': 'application/javascript', '.css': 'text/css', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
    try {
        const pathname = new URL(req.url, 'http://localhost').pathname;
        const prefix = [...prefixes].reverse().find(p => pathname.startsWith(p));
        const relative = pathname.slice(prefix.length) || 'index.html';
        const path = resolve(dist, relative);
        assert.ok(path.startsWith(dist + '/') || path.startsWith(dist + '\\'));
        const body = await readFile(path);
        const extension = path.slice(path.lastIndexOf('.'));
        res.writeHead(200, { 'Content-Type': mime[extension] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
        res.end(body);
    } catch {
        res.writeHead(404);
        res.end('Not found');
    }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;
const engines = [
    { name: 'chrome', type: chromium, launch: { channel: 'chrome' } },
    { name: 'edge', type: chromium, launch: { channel: 'msedge' } },
];
if (process.env.PWA_EXTRA_ENGINES === '1') {
    engines.push({ name: 'firefox', type: firefox }, { name: 'webkit', type: webkit });
}
const report = [];
try {
    for (const engine of engines) {
            const profiles = [
                { name: 'desktop', options: {} },
                { name: 'android-emulation', options: devices['Pixel 7'] },
                { name: 'iphone-emulation', options: devices['iPhone 13'] },
            ];
            for (const profile of profiles) {
                for (const prefix of prefixes) {
                    // A persistent profile avoids Chromium's incognito install restriction.
                    const profileDir = join(output, 'profiles', `${engine.name}-${profile.name}-${prefix.replaceAll('/', '_')}`);
                    const options = { ...profile.options };
                    // Firefox supports the viewport/UA profile but not Playwright's isMobile flag.
                    if (engine.type === firefox) delete options.isMobile;
                    const context = await engine.type.launchPersistentContext(profileDir, { headless: true, ...engine.launch, ...options });
                    try {
                        const page = await context.newPage();
                        await page.goto(`${origin}${prefix}index.html#/inbox/123`, { waitUntil: 'load' });
                        const manifestUrl = await page.locator('link[rel="manifest"]').evaluate(el => el.href);
                        assert.equal(manifestUrl, `${origin}${prefix}web-manifest.json`);
                        const response = await context.request.get(manifestUrl);
                        assert.equal(response.status(), 200);
                        const manifest = await response.json();
                        assert.equal(new URL(manifest.start_url, manifestUrl).href, origin + prefix);
                        const urls = manifest.icons.map(icon => new URL(icon.src, manifestUrl).href);
                        const touchIcon = await page.locator('link[rel="apple-touch-icon"]').evaluate(el => el.href);
                        assert.equal(touchIcon, `${origin}${prefix}sap-apple-touch-icon-v3.png`);
                        urls.push(touchIcon, await page.locator('link[rel="icon"]').evaluate(el => el.href));
                        for (const url of urls) {
                            assert.ok(url.startsWith(`${origin}${prefix}sap-`), url);
                            const imageResponse = await context.request.get(url);
                            assert.equal(imageResponse.status(), 200, url);
                            assert.match(imageResponse.headers()['content-type'], /image\/png/);
                            const bytes = await imageResponse.body();
                            assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
                            assert.ok(await page.evaluate(async src => {
                                const img = new Image(); img.src = src;
                                await img.decode(); return img.naturalWidth > 0;
                            }, url), url);
                        }
                        await page.evaluate(async () => {
                            const registration = await Promise.race([
                                navigator.serviceWorker.ready,
                                new Promise((_, reject) => setTimeout(() => reject(new Error('SW activation timed out')), 15000)),
                            ]);
                            if (!registration.active) throw new Error('No active SW');
                        });
                        const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
                        assert.equal(scope, origin + prefix);
                        let installability = 'not exposed by engine';
                        if (engine.type === chromium) {
                            const cdp = await context.newCDPSession(page);
                            const parsed = await cdp.send('Page.getAppManifest');
                            assert.deepEqual(parsed.errors, [], 'Chromium manifest errors');
                            const result = await cdp.send('Page.getInstallabilityErrors');
                            installability = result.installabilityErrors;
                            assert.deepEqual(installability, [], 'Chromium installability errors');
                        }
                        const result = { engine: engine.name, profile: profile.name, prefix, iconsDecoded: urls.length, swScope: scope, installability, status: 'PASS' };
                        report.push(result);
                        console.log(JSON.stringify(result));
                    } finally {
                        await context.close();
                    }
                }
            }
    }
} finally {
    await import('node:fs/promises').then(fs => fs.writeFile(join(output, 'report.json'), JSON.stringify({ testedAt: new Date().toISOString(), limitation: 'Local build tests; mobile UA emulation is not a real OS install; production auth and outer Work Zone page not tested.', results: report }, null, 2)));
    await new Promise(r => server.close(r));
}
