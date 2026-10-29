// Usage: node scripts/test-startup-browser.mjs <path-to-playwright-package>
// Uses the production artifact with local API fixtures; no PRD account is accessed.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium, webkit, devices } = require(process.argv[2] || 'playwright');
const dist = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');
const output = resolve(dist, '../.pwa-test-results/startup');
await mkdir(output, { recursive: true });
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.woff2': 'font/woff2' };
let probeRequests = 0;
const server = createServer(async (req, res) => {
    try {
        const url = new URL(req.url, 'http://localhost');
        if (url.pathname === '/assets/startup-probe.js') {
            probeRequests++;
            res.writeHead(200, { 'Content-Type': probeRequests === 1 ? 'text/html' : 'application/javascript' });
            return res.end(probeRequests === 1 ? '<html>Login redirect</html>' : 'export {};');
        }
        if (url.pathname.includes('/api/')) {
            const data = url.pathname.endsWith('/me')
                ? { id: 'TEST', displayName: 'Mobile Test', firstName: 'Mobile', lastName: 'Test', role: 'User' }
                : { items: [], total: 0, inApproval: 0, completed: 0 };
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify(data));
        }
        const relative = url.pathname.replace(/^\/cnma\//, '/').replace(/^\//, '') || 'index.html';
        const path = resolve(dist, relative);
        assert.ok(path.startsWith(dist + sep));
        const body = await readFile(path);
        res.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        res.end(body);
    } catch {
        res.writeHead(404);
        res.end('Not found');
    }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let passed = 0;
try {
    const profiles = [
        ['android-chromium', chromium, devices['Pixel 7']],
        ['iphone-chromium-emulation', chromium, devices['iPhone 13']],
    ];
    if (process.env.PWA_EXTRA_ENGINES === '1') profiles.push(['iphone-webkit', webkit, devices['iPhone 13']]);
    for (const [name, engine, profile] of profiles) {
        const browser = await engine.launch({ headless: true, ...(engine === chromium ? { channel: 'chrome' } : {}) });
        try {
            for (const prefix of ['/', '/cnma/']) {
                const context = await browser.newContext({ ...profile, locale: 'vi-VN', serviceWorkers: 'block' });
                try {
                    const page = await context.newPage();
                    let failBundle = true;
                    await page.route('**/assets/*.js', route => failBundle
                        ? route.fulfill({ status: 200, contentType: 'text/html', body: '<html>Login redirect</html>' })
                        : route.continue());
                    await page.goto(origin + prefix, { waitUntil: 'load' });
                    await page.getByRole('alertdialog').waitFor({ state: 'visible', timeout: 25000 });
                    await page.getByRole('alertdialog').evaluate(el => Promise.allSettled(el.getAnimations({ subtree: true }).map(animation => animation.finished)));
                    assert.equal(await page.locator('#startup-retry').textContent(), 'Thử lại');
                    assert.match(await page.locator('#startup-code').textContent(), /ASSET_LOAD_FAILED|STARTUP_TIMEOUT/);
                    if (prefix === '/') await page.screenshot({ path: resolve(output, `${name}-failed.png`) });
                    const target = await page.locator('#startup-reset').evaluate(el => ({ height: el.getBoundingClientRect().height, minHeight: getComputedStyle(el).minHeight, fontSize: getComputedStyle(document.documentElement).fontSize }));
                    assert.ok(target.height >= 44, JSON.stringify(target));
                    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
                    if (prefix === '/') await page.screenshot({ path: resolve(output, `${name}-failed.png`) });
                    await page.evaluate(async () => {
                        await caches.open('prorequest-v2-sap-icons');
                        await caches.open('unrelated-app');
                    });
                    failBundle = false;
                    await Promise.all([
                        page.waitForEvent('load'),
                        page.locator('#startup-reset').click(),
                    ]);
                    await page.getByRole('alertdialog').waitFor({ state: 'hidden' });
                    await page.getByText('Mobile Test', { exact: true }).first().waitFor();
                    assert.equal(await page.getByText('Application Error', { exact: true }).count(), 0);
                    const keys = await page.evaluate(() => caches.keys());
                    assert.ok(!keys.includes('prorequest-v2-sap-icons'));
                    assert.ok(keys.includes('unrelated-app'));
                    if (prefix === '/') await page.screenshot({ path: resolve(output, `${name}-recovered.png`) });
                    passed++;
                    console.log(`PASS ${name} ${prefix}: failed bundle → localized recovery → cache reset → app ready`);
                } finally { await context.close(); }
            }
            if (name === 'android-chromium') {
                const context = await browser.newContext(profile);
                try {
                    const page = await context.newPage();
                    await page.goto(origin, { waitUntil: 'load' });
                    await page.evaluate(() => navigator.serviceWorker.ready);
                    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
                    const results = await page.evaluate(async () => {
                        const first = await (await fetch('/assets/startup-probe.js')).text();
                        const second = await (await fetch('/assets/startup-probe.js')).text();
                        const third = await (await fetch('/assets/startup-probe.js')).text();
                        return [first, second, third];
                    });
                    assert.deepEqual(results, ['<html>Login redirect</html>', 'export {};', 'export {};']);
                    assert.equal(probeRequests, 2);
                    console.log('PASS real service worker: HTML rejected from cache, valid JS cached');
                    passed++;
                } finally { await context.close(); }
            }
        } finally { await browser.close(); }
    }
    console.log(`Total PASS ${passed}`);
} finally { await new Promise(resolve => server.close(resolve)); }
