import { join } from 'node:path';

export default async function ({ page, base, fixtures, check }) {
    await page.goto(`${base}/differ/index.html`, { waitUntil: 'networkidle' });
    await page.selectOption('#lang-select', 'de');

    await page.click('#run-btn');
    check('running without files says what is missing',
        await page.locator('#run-error').isVisible());

    await page.setInputFiles('#app-file', join(fixtures, 'differ-app.csv'));
    await page.setInputFiles('#statement-files', [join(fixtures, 'paypay-statement.csv')]);
    await page.click('#run-btn');
    await page.waitForSelector('.diff-row');

    check('the error clears on a successful run',
        !(await page.locator('#run-error').isVisible()));
    check('every booking gets a row', (await page.locator('.diff-row').count()) === 5);

    check('amount mismatches are counted',
        (await page.locator('#count-mismatch').innerText()) === '1');
    check('bookings missing from the app are counted',
        (await page.locator('#count-missing').innerText()) === '1');
    check('bookings only in the app get their own counter',
        (await page.locator('#count-extra').innerText()) === '1');

    check('part-point payments are reconciled',
        (await page.locator('#total-points-sum').innerText()) === '+100 ¥');
    check('savings are grouped by month',
        (await page.locator('#savings-list div').count()) === 1);
    check('rows paid entirely in points stay out of the cash balance',
        (await page.locator('#real-total-balance').innerText()) === '46.970 ¥',
        await page.locator('#real-total-balance').innerText());

    await page.locator('.status-mismatch').first().click();
    check('clicking a row marks it resolved',
        (await page.locator('.status-mismatch.resolved').count()) === 1);

    await page.selectOption('#lang-select', 'ja');
    check('switching language re-renders the results',
        (await page.locator('[data-i18n-key="title"]').innerText()) === 'トランザクション比較' &&
        (await page.locator('.status-extra p.text-xs').first().innerText()) === 'アプリのみ');

    const before = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    await page.click('#theme-toggle');
    const after = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    check('the theme toggles and is persisted',
        before !== after &&
        (await page.evaluate(() => localStorage.getItem('theme'))) === (after ? 'dark' : 'light'));
}
