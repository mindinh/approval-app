import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const { chromium, devices } = createRequire(import.meta.url)(process.argv[2] || 'playwright');
const origin = process.argv[3] || 'http://127.0.0.1:3011';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
    const context = await browser.newContext(devices['iPhone 13']);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/startup.js*', route => route.fulfill({ body: '' }));
    await page.route('**/src/main.tsx*', route => route.fulfill({ contentType: 'application/javascript', body: 'import "/tests/e2e/reviewFixes.fixture.tsx";' }));
    await page.route('**/api/**', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ value: [
        { SAPUserName: 'CONARUM1', FullName: 'Jane Doe', EmailAddress: 'jane@example.com' },
    ] }) }));
    await page.goto(`${origin}/tag-users`);
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('checkbox').waitFor();
    const apply = dialog.getByRole('button', { name: /Apply Tags/ });
    assert.equal(await apply.isDisabled(), true);
    await dialog.getByRole('checkbox').click();
    assert.equal(await apply.isEnabled(), true);
    await apply.click();
    await dialog.waitFor({ state: 'hidden' });
    assert.deepEqual(errors, [], 'tag dialog renders and applies without undefined state');

    await page.goto(`${origin}/task-detail`);
    await page.getByRole('button', { name: /Comments/ }).waitFor();
    const pill = await page.getByRole('button', { name: /Overview/ }).evaluate(el => {
        const style = getComputedStyle(el);
        return { top: parseFloat(style.borderTopLeftRadius), bottom: parseFloat(style.borderBottomLeftRadius) };
    });
    assert.ok(pill.top > 0 && pill.bottom > 0, 'mobile retains pill tabs');
    // Use the actual detail page scroll container attached to the pull-to-refresh hook.
    const scrollArea = await page.locator('.overflow-y-auto.overflow-x-hidden').first().elementHandle();
    assert.ok(scrollArea);
    await scrollArea.evaluate(el => { el.scrollTop = 120; });
    assert.ok(await scrollArea.evaluate(el => el.scrollTop > 0), 'overview can scroll before tab change');
    await page.getByRole('button', { name: /Details/ }).click();
    assert.ok(await scrollArea.evaluate(el => el.scrollHeight > el.clientHeight), 'target tab also has scrollable content');
    assert.equal(await scrollArea.evaluate(el => el.scrollTop), 0, 'tab change resets the attached DOM ref');
    assert.deepEqual(errors, [], 'mobile detail renders and changes tabs without runtime errors');
    console.log('PASS tag selection/apply and actual mobile detail tab scroll reset');
    await context.close();
} finally {
    await browser.close();
}
