// Start Vite first. Usage: node tests/e2e/userIdentity.browser.mjs [playwright-package] [base-url]
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const { chromium, devices } = createRequire(import.meta.url)(process.argv[2] || 'playwright');
const origin = process.argv[3] || 'http://127.0.0.1:3011';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
    for (const scenario of ['known', 'propagated', 'non-email', 'failed', 'mobile', 'midnight', 'resume']) {
        const context = await browser.newContext(scenario === 'mobile' ? devices['iPhone 13'] : { viewport: { width: 1440, height: 900 } });
        const page = await context.newPage();
        if (scenario === 'midnight' || scenario === 'resume') {
            await page.clock.install({ time: new Date(2026, 9, 19, 23, 59, 0) });
        }
        let sapReads = 0;
        let directoryReads = 0;
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/startup.js*', route => route.fulfill({ body: '' }));
        await page.route('**/src/main.tsx*', route => route.fulfill({ contentType: 'application/javascript', body: 'import "/tests/e2e/userIdentity.fixture.tsx";' }));
        await page.route('**/api/**', route => {
            const url = route.request().url();
            if (url.includes('bus-users')) directoryReads++;
            const sapRequest = url.includes('/me/sap-user');
            if (sapRequest) sapReads++;
            return route.fulfill({ status: sapRequest && scenario === 'failed' ? 502 : 200, contentType: 'application/json', body: JSON.stringify(sapRequest
                ? (scenario === 'failed' ? { message: 'SAP endpoint unavailable' } : { sapUsername: 'CONARUM1' })
                : { id: 'login', sapUser: scenario === 'non-email' ? 'CONARUM2' : 'HIEU.LAM@EXAMPLE.COM', firstName: 'Hieu', lastName: 'Lan', displayName: 'Hieu Lan', email: scenario === 'non-email' ? undefined : 'hieu.lam@example.com', ...(scenario === 'known' ? { sapUsername: 'CONARUM1' } : {}) }) });
        });
        if (scenario !== 'mobile') {
            await page.goto(`${origin}/home?lng=en`);
            await page.getByRole('button', { name: 'Account menu' }).waitFor();
            assert.equal(sapReads, 0, 'startup does not await SAP identity');
            await page.getByRole('button', { name: 'Account menu' }).click();
            await page.getByRole('menuitem', { name: 'User Profile' }).click();
            const dialog = page.getByRole('dialog');
            if (scenario === 'failed') {
                await dialog.getByRole('button', { name: 'Refresh', exact: true }).waitFor();
                assert.equal(sapReads, 2, 'one automatic retry');
                await dialog.getByText('Not identified', { exact: true }).waitFor();
                assert.equal(await dialog.getByText('HIEU.LAM@EXAMPLE.COM', { exact: true }).count(), 0);
                assert.equal(directoryReads, 0);
                assert.deepEqual(errors, []);
                console.log('PASS failed lookup: no guessed SAP user, explicit retry');
                await context.close();
                continue;
            }
            const username = dialog.getByText('CONARUM1', { exact: true });
            await username.waitFor();
            assert.match(await username.evaluate(el => getComputedStyle(el).fontFamily), /^"?72/);
            assert.ok(await page.evaluate(async () => (await document.fonts.load('14px "72"')).length > 0));
            await dialog.getByRole('button', { name: 'Close', exact: true }).first().click();
            await page.getByRole('button', { name: 'My Tasks', exact: true }).click();
        } else {
            await page.goto(`${origin}/inbox?lng=en`);
        }
        await page.locator('.task-chat__message--own').waitFor();
        assert.equal(await page.locator('.task-chat__message--own').count(), 1);
        assert.equal(await page.locator('.task-chat__message--own .task-chat__author').textContent(), 'CONARUM1');
        assert.deepEqual(await page.locator('.task-chat__message:not(.task-chat__message--own) .task-chat__author').allTextContents(), ['CONARUM2', 'CONARUM2']);
        assert.deepEqual(await page.locator('.task-chat__day-divider').allTextContents(), ['Jan 15, 2020', 'Today']);
        assert.ok(await page.locator('.task-chat').evaluate(el => el.scrollWidth <= el.clientWidth), 'no timeline horizontal overflow');
        assert.equal(await page.locator('.task-chat__message--own').evaluate(el => getComputedStyle(el).flexDirection), 'row-reverse');
        assert.equal(sapReads, scenario === 'known' ? 0 : 1, 'one shared SAP identity read');
        assert.equal(directoryReads, 0, 'no directory needed for comment ownership or profile');
        assert.deepEqual(errors, []);
        if (scenario === 'midnight' || scenario === 'resume') {
            if (scenario === 'midnight') {
                await page.clock.fastForward(60_000);
            } else {
                await page.clock.setSystemTime(new Date(2026, 9, 20, 12));
                await page.evaluate(() => window.dispatchEvent(new Event('focus')));
            }
            await page.getByText('Oct 19, 2026', { exact: true }).waitFor();
            assert.equal(await page.getByText('Today', { exact: true }).count(), 0, 'relative day label refreshes');
        }
        if (scenario === 'mobile') {
            await page.screenshot({ path: '.pwa-test-results/chat/timeline-mobile.png' });
            await page.evaluate(() => window.i18n.changeLanguage('vi'));
            await page.getByText('Hôm nay', { exact: true }).waitFor();
            assert.equal(await page.locator('.task-chat__day-divider').count(), 2);
        } else if (scenario === 'known') {
            await page.screenshot({ path: '.pwa-test-results/chat/timeline-desktop.png' });
        }
        console.log('PASS', scenario, 'SAP IDs, own alignment, shared identity, SAP 72, day dividers');
        await context.close();
    }
} finally {
    await browser.close();
}
