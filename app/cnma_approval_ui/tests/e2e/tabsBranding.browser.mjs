import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const { chromium } = createRequire(import.meta.url)(process.argv[2] || 'playwright');
const origin = process.argv[3] || 'http://127.0.0.1:3011';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
    for (const path of ['/task-desktop', '/reference-pr']) {
        const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/startup.js*', route => route.fulfill({ body: '' }));
        await page.route('**/src/main.tsx*', route => route.fulfill({ contentType: 'application/javascript', body: 'import "/tests/e2e/reviewFixes.fixture.tsx";' }));
        await page.route('**/api/**', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({
            instanceId: 'pr-1', objectType: 'PR', normalTask: false,
            businessObject: { DocCategory: 'BUS2105', DocumentNumber: '1000000001', DocumentType: 'NB', _Comment: [], _Item: [] },
            taskprocessing: { task: { InstanceID: 'pr-1', Status: 'READY' }, decisionOptions: [] },
        }) }));
        await page.goto(origin + path);
        const workflow = page.getByRole('tab', { name: /Workflow/ });
        await workflow.click();
        assert.equal(await workflow.getAttribute('data-state'), 'active');
        const surface = await page.getByRole('tablist').evaluate(el => {
            const header = el.closest('.task-detail-header');
            const tabs = header.parentElement;
            const listStyle = getComputedStyle(el);
            const headerStyle = getComputedStyle(header);
            return {
                listBackground: listStyle.backgroundColor, headerBackground: headerStyle.backgroundColor,
                headerBorder: headerStyle.borderBottomWidth, tabsBorder: getComputedStyle(tabs).borderTopWidth,
                listTopBorder: listStyle.borderTopWidth, shadow: listStyle.boxShadow,
                gap: el.getBoundingClientRect().top - el.previousElementSibling.getBoundingClientRect().bottom,
                inside: header.contains(el),
            };
        });
        assert.equal(surface.inside, true, 'tabs are inside the header');
        assert.equal(surface.headerBackground, 'rgb(255, 255, 255)', 'light-theme header uses the white card surface');
        assert.equal(surface.listBackground, 'rgba(0, 0, 0, 0)', 'tab row inherits the header surface');
        assert.equal(surface.tabsBorder, '0px', 'no frame above tabs');
        assert.equal(surface.listTopBorder, '0px');
        assert.ok(surface.shadow === 'none' || surface.shadow.split(/, (?=rgba)/).every(shadow => shadow === 'rgba(0, 0, 0, 0) 0px 0px 0px 0px'), 'tab row has no visible shadow');
        assert.equal(surface.gap, 0, 'header and tab row are contiguous');
        const styles = await workflow.evaluate(el => {
            const style = getComputedStyle(el);
            const list = getComputedStyle(el.closest('[role="tablist"]'));
            return { top: style.borderTopLeftRadius, bottom: style.borderBottomLeftRadius, border: style.borderBottomWidth, background: style.backgroundColor, padding: style.paddingTop, listPadding: list.paddingTop, height: el.closest('[role="tablist"]').getBoundingClientRect().height };
        });
        assert.ok(parseFloat(styles.top) > 0 && parseFloat(styles.bottom) === 0, 'only top tab corners are rounded');
        assert.ok(parseFloat(styles.border) > 0, 'active tab retains its underline');
        assert.equal(styles.padding, '0px', 'no vertical trigger padding');
        assert.equal(styles.listPadding, '0px', 'no vertical tab-list padding');
        assert.ok(styles.height <= 40, 'tab row remains compact');
        assert.notEqual(styles.background, 'rgba(0, 0, 0, 0)', 'selected tab has a background');
        const selectedBorder = await workflow.evaluate(el => {
            const style = getComputedStyle(el);
            return { width: style.borderTopWidth, color: style.borderTopColor, outline: style.outlineStyle };
        });
        assert.ok(parseFloat(selectedBorder.width) > 0, 'selected tab has a top border');
        assert.notEqual(selectedBorder.color, 'rgba(0, 0, 0, 0)', 'selected top border is visible');
        assert.equal(selectedBorder.outline, 'none', 'native outline does not extend outside clipped row');
        await workflow.focus();
        await page.keyboard.press('ArrowRight');
        const attachments = page.getByRole('tab', { name: /Attachments/ });
        await page.getByRole('tab', { name: /Attachments/, selected: true }).waitFor();
        assert.equal(await attachments.getAttribute('data-state'), 'active', 'keyboard navigation is preserved');
        const focus = await attachments.evaluate(el => {
            const style = getComputedStyle(el);
            return { inset: style.getPropertyValue('--tw-ring-inset').trim(), offset: style.getPropertyValue('--tw-ring-offset-width').trim() };
        });
        assert.equal(focus.inset, 'inset', 'keyboard focus ring stays inside tab');
        assert.equal(focus.offset, '0px', 'focus ring has no clipped outer offset');
        await page.screenshot({ path: `.pwa-test-results/chat/tabs-${path.slice(1)}.png`, animations: 'disabled' });
        await page.setViewportSize({ width: 640, height: 800 });
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'tab row does not widen the page');

        const manifest = await (await page.request.get(origin + '/web-manifest.json')).json();
        assert.ok(manifest.icons.filter(icon => icon.purpose === 'any').every(icon => icon.src.endsWith('-v4.png')));
        const pixels = await page.evaluate(async () => {
            const image = new Image();
            image.src = '/sap-favicon-v4.png';
            await image.decode();
            const canvas = new OffscreenCanvas(image.width, image.height);
            const context = canvas.getContext('2d');
            context.drawImage(image, 0, 0);
            const data = context.getImageData(0, 0, image.width, image.height).data;
            let white = 0;
            for (let i = 0; i < data.length; i += 4) if (data[i] > 250 && data[i + 1] > 250 && data[i + 2] > 250 && data[i + 3] === 255) white++;
            return { cornerAlpha: data[3], white };
        });
        assert.equal(pixels.cornerAlpha, 0, 'favicon canvas is transparent');
        assert.ok(pixels.white > 0, 'SAP lettering remains white');
        assert.deepEqual(errors, []);
        console.log('PASS', path, 'rounded tabs, selected background, keyboard, narrow width, transparent branding');
        await page.close();
    }
} finally {
    await browser.close();
}
